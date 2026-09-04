// src/App.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
import {
  clearAnonymousContextDraft,
  syncAnonymousContext,
  hasAnonymousContextDraft,
} from './services/anonymousContextService';

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
    if (!hasAnonymousContextDraft()) return false;
    try {
      const syncResult = await syncAnonymousContext(user);
      return syncResult.success;
    } catch (error) {
      console.warn('Anonymous context synchronization failed; continuing with normal onboarding', error);
      return false;
    }
  }, []);

  const fetchUserData = useCallback(async (user: User) => {
    const requestId = ++fetchRequestRef.current;
    setIdentityError(null);
    setNeedsOnboarding(false);

    try {
      // Resolve the application's role first. The clinician endpoint is deliberately
      // restricted, so it must never be used as the gate for admins, partners, or mothers.
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (requestId !== fetchRequestRef.current) return;
      const data = userDoc.exists() ? userDoc.data() : {};
      const role = (data?.role as UserRole) || 'MOTHER';

      if (role === 'ADMIN') {
        setUserRole('ADMIN');
        setClinicianData(null);
        setNeedsOnboarding(false);
        return;
      }

      if (role === 'PARTNER') {
        setUserRole('PARTNER');
        setClinicianData(null);
        setNeedsOnboarding(false);
        return;
      }

      if (role === 'CLINICIAN') {
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

          // A signed-in clinician may legitimately receive 403 while awaiting
          // verification. The pending screen handles that state safely.
          if (response.status === 403) {
            if (requestId !== fetchRequestRef.current) return;
            setUserRole('CLINICIAN');
            setClinicianData(null);
            setNeedsOnboarding(false);
            return;
          }

          if (requestId !== fetchRequestRef.current) return;
          setClinicianData(null);
          setIdentityError(response.status === 401
            ? 'Your authentication session could not be verified. Please sign in again.'
            : 'We could not verify your clinician portal. Please try again.');
          return;
        } catch (err) {
          if (requestId !== fetchRequestRef.current) return;
          console.error('Clinician identity check failed', err);
          setClinicianData(null);
          setIdentityError('We could not verify your clinician portal. Please try again.');
          return;
        }
      }

      // Mothers use the ordinary Firestore-owned profile flow. A missing profile
      // is initialized here, while role resolution above prevents admin/clinician
      // accounts from accidentally entering the mother experience.
      if (role === 'MOTHER' && !userDoc.exists()) {
        try { await ensureUserProfile(user); } catch (err) { console.warn('Could not initialize MomHaven user profile', err); }
      }

      const hydrated = await hydrateAnonymousContext(user);
      if (requestId !== fetchRequestRef.current) return;
      setUserRole('MOTHER');
      setClinicianData(null);
      const isDismissed = sessionStorage.getItem(`onboarding_dismissed_${user.uid}`) === 'true';
      setNeedsOnboarding(!isDismissed && !hydrated && data?.onboardingVersion !== 1);
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
    return (
      <PremiumOnboardingWizard
        userId={currentUser.uid}
        initialDisplayName={currentUser.displayName || ''}
        onCompleted={() => {
          sessionStorage.removeItem(`onboarding_dismissed_${currentUser.uid}`);
          setNeedsOnboarding(false);
          void fetchUserData(currentUser);
        }}
        onCancel={() => {
          sessionStorage.setItem(`onboarding_dismissed_${currentUser.uid}`, 'true');
          setNeedsOnboarding(false);
        }}
      />
    );
  }

  const renderCurrentShell = () => {
    switch (userRole) {
      case 'PARTNER': return <PartnerShell partnerId={currentUser?.uid} partnerName={currentUser?.displayName || undefined} onSignOut={handleSignOut} />;
      case 'CLINICIAN':
        if (!clinicianData || clinicianData.verificationStatus !== 'approved') {
          return (
            <ClinicianPendingScreen
              clinicianId={currentUser?.uid || 'pending-clinician'}
              clinicianName={currentUser?.displayName || clinicianData?.name}
              clinicianData={clinicianData}
              onRefresh={() => { if (currentUser) void fetchUserData(currentUser); }}
              onSignOut={() => { void handleSignOut(); }}
            />
          );
        }
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
