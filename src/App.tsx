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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('MOTHER');
  const [clinicianData, setClinicianData] = useState<Clinician | null>(null);
  const [adminMfaVerified, setAdminMfaVerified] = useState<boolean>(() => sessionStorage.getItem('admin_mfa_verified') === 'true');
  const [loading, setLoading] = useState(true);
  const fetchRequestRef = useRef(0);

  const fetchUserData = useCallback(async (user: User) => {
    const requestId = ++fetchRequestRef.current;

    // Clinician identity is server-authoritative. Send the Firebase ID token in
    // both the standard Authorization header and a dedicated fallback header so
    // Firebase Hosting/proxies that strip Authorization cannot turn an approved
    // clinician into a normal mother session.
    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/v1/clinician/me', {
        headers: {
          authorization: `Bearer ${idToken}`,
          'x-firebase-id-token': idToken,
        },
        cache: 'no-store',
      });
      if (response.ok) {
        const payload = await response.json();
        if (requestId !== fetchRequestRef.current) return;
        setUserRole('CLINICIAN');
        setClinicianData(payload?.clinician ? { ...payload.clinician, uid: user.uid } as Clinician : null);
        return;
      }
    } catch (err) {
      console.warn('Clinician identity check unavailable; falling back to user profile.', err);
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (requestId !== fetchRequestRef.current) return;
      if (userDoc.exists()) {
        const data = userDoc.data();
        const role = (data?.role as UserRole) || 'MOTHER';
        setUserRole(role);
        setClinicianData(null);
      } else {
        setUserRole('MOTHER');
        setClinicianData(null);
      }
    } catch (err) {
      if (requestId !== fetchRequestRef.current) return;
      console.warn('Could not read user role from Firestore, defaulting to MOTHER', err);
      setUserRole('MOTHER');
      setClinicianData(null);
    }
  }, []);

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Do not let generic profile initialization decide clinician identity.
        // The server-authoritative clinician check runs first and repairs an
        // approved account even when users/{uid} still says MOTHER.
        await fetchUserData(user);
        try { await ensureUserProfile(user); } catch (err) { console.warn('Could not initialize MomHaven user profile', err); }
      } else {
        setClinicianData(null);
        setAdminMfaVerified(false);
        sessionStorage.removeItem('admin_mfa_verified');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserData]);

  const handleSignOut = async () => {
    sessionStorage.removeItem('admin_mfa_verified');
    setAdminMfaVerified(false);
    await logoutUser();
  };

  const handleAdminMfaSuccess = () => {
    sessionStorage.setItem('admin_mfa_verified', 'true');
    setAdminMfaVerified(true);
  };

  if (loading) return <div className="min-h-screen bg-[var(--lavender-50)] flex flex-col items-center justify-center p-4 font-body"><div className="w-16 h-16 rounded-2xl bg-white shadow-card-1 p-3 mb-4 flex items-center justify-center animate-pulse"><img src="/assets/logo.png" alt="MomHaven" className="w-full h-full object-contain" referrerPolicy="no-referrer" /></div><p className="font-display font-bold text-[16px] text-[var(--haven-deep)]">Loading MomHaven...</p></div>;

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
