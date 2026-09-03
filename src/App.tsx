// src/App.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, ensureUserProfile, logoutUser, testConnection } from './lib/firebase';
import { UserRole, Clinician } from './types';
import LandingPage from './components/LandingPage';
import MotherShell from './components/MotherShell';
import PartnerShell from './components/PartnerShell';
import ClinicianShell from './components/ClinicianShell';
import AdminShell from './components/AdminShell';
import ClinicianPendingScreen from './components/auth/ClinicianPendingScreen';
import AdminMfaModal from './components/auth/AdminMfaModal';
import PremiumOnboardingWizard from './components/auth/PremiumOnboardingWizard';
import { getAnonymousContextDraft, clearAnonymousContextDraft } from './services/anonymousContextService';
import { getHealthContext, saveHealthContext } from './services/healthContextService';
import type { HealthContext } from './types/healthContext';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('MOTHER');
  const [clinicianData, setClinicianData] = useState<Clinician | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [adminMfaVerified, setAdminMfaVerified] = useState<boolean>(() => sessionStorage.getItem('admin_mfa_verified') === 'true');
  const [loading, setLoading] = useState(true);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const fetchRequestRef = useRef(0);

  const hydrateAnonymousContext = useCallback(async (user: User) => {
    const draft = getAnonymousContextDraft();
    if (!draft) return false;
    try {
      const existing = await getHealthContext(user.uid);
      if (existing) {
        // Never overwrite an established account context with anonymous-device data.
        clearAnonymousContextDraft();
        return false;
      }

      const context: Omit<HealthContext, 'version' | 'updatedAt'> = {
        lifecycleStage: draft.lifecycleStage,
        userMode: 'authenticated',
        preferredName: user.displayName || 'Mama',
        language: draft.language,
        pregnancy: draft.lifecycleStage === 'pregnancy' ? {
          pregnancyWeek: draft.pregnancyWeek,
          dueDate: draft.dueDate,
          dueDateSource: draft.dueDate ? 'LMP' : 'UNKNOWN',
        } : undefined,
        interests: draft.interests,
        dietaryPreferences: [],
        havenResponseStyle: draft.havenResponseStyle,
        onboardingCompletedAt: new Date().toISOString(),
      };
      await saveHealthContext(user.uid, context, 'context_sync');
      await setDoc(doc(db, 'users', user.uid), {
        onboarded: true,
        onboardingVersion: 1,
        onboardingSource: 'anonymous_context_sync',
        onboardingCompletedAt: serverTimestamp(),
      }, { merge: true });
      clearAnonymousContextDraft();
      return true;
    } catch (error) {
      console.warn('Anonymous context hydration failed; continuing with normal onboarding', error);
      return false;
    }
  }, []);

  const fetchUserData = useCallback(async (user: User) => {
    const requestId = ++fetchRequestRef.current;
    setIdentityError(null);
    setNeedsOnboarding(false);

    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/v1/clinician/me', {
        headers: { authorization: `Bearer ${idToken}`, 'x-firebase-id-token': idToken },
        cache: 'no-store',
      });
      if (response.ok) {
        const payload = await response.json();
        if (requestId !== fetchRequestRef.current) return;
        setUserRole('CLINICIAN');
        setClinicianData(payload?.clinician ? { ...payload.clinician, uid: user.uid } as Clinician : null);
        return;
      }
      if (response.status !== 404) {
        if (requestId !== fetchRequestRef.current) return;
        setClinicianData(null);
        setIdentityError(response.status === 401 ? 'Your authentication session could not be verified. Please sign in again.' : 'We could not verify your portal role. For your security, no portal data will be shown.');
        return;
      }
    } catch (err) {
      if (requestId !== fetchRequestRef.current) return;
      console.error('Clinician identity check failed', err);
      setClinicianData(null);
      setIdentityError('We could not verify your portal role. For your security, no portal data will be shown.');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (requestId !== fetchRequestRef.current) return;
      const data = userDoc.exists() ? userDoc.data() : {};
      const role = (data?.role as UserRole) || 'MOTHER';

      if (role === 'MOTHER' && !userDoc.exists()) {
        try { await ensureUserProfile(user); } catch (err) { console.warn('Could not initialize MomHaven user profile', err); }
      }

      if (role === 'MOTHER') {
        const hydrated = await hydrateAnonymousContext(user);
        if (requestId !== fetchRequestRef.current) return;
        setUserRole('MOTHER');
        setClinicianData(null);
        setNeedsOnboarding(!hydrated && data?.onboardingVersion !== 1);
      } else {
        setUserRole(role);
        setClinicianData(null);
        setNeedsOnboarding(false);
      }
    } catch (err) {
      if (requestId !== fetchRequestRef.current) return;
      console.warn('Could not read user role from Firestore', err);
      setClinicianData(null);
      setIdentityError('We could not verify your portal role. For your security, no portal data will be shown.');
    }
  }, [hydrateAnonymousContext]);

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user);
        try { await ensureUserProfile(user); } catch (err) { console.warn('Could not initialize MomHaven user profile', err); }
      } else {
        setClinicianData(null);
        setNeedsOnboarding(false);
        setIdentityError(null);
        setAdminMfaVerified(false);
        sessionStorage.removeItem('admin_mfa_verified');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserData]);

  const handleSignOut = async () => { sessionStorage.removeItem('admin_mfa_verified'); setAdminMfaVerified(false); await logoutUser(); };
  const handleAdminMfaSuccess = () => { sessionStorage.setItem('admin_mfa_verified', 'true'); setAdminMfaVerified(true); };

  if (loading) return <div className="min-h-screen bg-[var(--lavender-50)] flex flex-col items-center justify-center p-4 font-body"><div className="w-16 h-16 rounded-2xl bg-white shadow-card-1 p-3 mb-4 flex items-center justify-center animate-pulse"><img src="/assets/logo.png" alt="MomHaven" className="w-full h-full object-contain" referrerPolicy="no-referrer" /></div><p className="font-display font-bold text-[16px] text-[var(--haven-deep)]">Loading MomHaven...</p></div>;

  if (currentUser && identityError) return <div className="min-h-screen bg-[var(--lavender-50)] flex items-center justify-center p-6"><div className="max-w-lg w-full bg-white rounded-3xl border border-[var(--border-hairline)] shadow-card-1 p-8 text-center"><div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--lavender-50)] flex items-center justify-center"><span aria-hidden="true">🔒</span></div><h1 className="font-display font-extrabold text-xl text-[var(--haven-deep)]">Portal access could not be verified</h1><p className="mt-3 text-sm text-[var(--ink-500)]">{identityError}</p><button type="button" onClick={handleSignOut} className="mt-6 px-5 py-3 rounded-xl bg-[var(--haven-deep)] text-white font-display font-bold">Sign out</button></div></div>;

  if (currentUser && userRole === 'MOTHER' && needsOnboarding) {
    return <PremiumOnboardingWizard userId={currentUser.uid} initialDisplayName={currentUser.displayName || ''} onCompleted={() => { setNeedsOnboarding(false); void fetchUserData(currentUser); }} />;
  }

  const renderCurrentShell = () => {
    switch (userRole) {
      case 'PARTNER': return <PartnerShell partnerId={currentUser?.uid} partnerName={currentUser?.displayName || undefined} onSignOut={handleSignOut} />;
      case 'CLINICIAN':
        if (!clinicianData || clinicianData.verificationStatus !== 'approved') return <ClinicianPendingScreen clinicianName={currentUser?.displayName || clinicianData?.name} clinicianData={clinicianData} onRefresh={() => currentUser ? fetchUserData(currentUser) : Promise.resolve()} onSignOut={handleSignOut} />;
        return <ClinicianShell clinicianId={currentUser?.uid} clinicianName={currentUser?.displayName || clinicianData?.name} facilityName={clinicianData?.facilityName} onSignOut={handleSignOut} />;
      case 'ADMIN':
        if (!adminMfaVerified) return <div className="min-h-screen bg-[var(--lavender-50)] flex items-center justify-center p-4"><AdminMfaModal adminEmail={currentUser?.email || ''} onSuccess={handleAdminMfaSuccess} onCancel={handleSignOut} /></div>;
        return <AdminShell onRoleSwitch={(r) => setUserRole(r)} />;
      case 'MOTHER':
      default: return <MotherShell userId={currentUser?.uid} userEmail={currentUser?.email || undefined} userName={currentUser?.displayName || undefined} onSignOut={handleSignOut} />;
    }
  };

  return <div className="min-h-screen bg-[var(--lavender-50)] text-[var(--ink-900)]">{!currentUser ? <LandingPage onSignedIn={() => { if (auth.currentUser) void fetchUserData(auth.currentUser); }} onPartnerConnected={(partnerId, partnerName, motherInfo) => { setUserRole('PARTNER'); localStorage.setItem('momhaven_partner_link', JSON.stringify(motherInfo)); }} /> : renderCurrentShell()}</div>;
}
