// src/App.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
  const [adminMfaVerified, setAdminMfaVerified] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_mfa_verified') === 'true';
  });
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const role = (data?.role as UserRole) || 'MOTHER';
        setUserRole(role);

        if (role === 'CLINICIAN') {
          const clinDoc = await getDoc(doc(db, 'clinicians', user.uid));
          if (clinDoc.exists()) {
            setClinicianData({ ...clinDoc.data(), uid: user.uid } as Clinician);
          } else {
            // Default pending profile if clinician record doesn't exist yet
            setClinicianData({
              uid: user.uid,
              name: data.displayName || 'Healthcare Professional',
              email: data.email || '',
              licenseNumber: 'KMPDC A-14920',
              cadre: 'Medical Officer (ObsGyn)',
              facilityId: '13000',
              facilityName: 'Kenyatta National Hospital (Level 6)',
              verificationStatus: 'pending',
            });
          }
        }
      } else {
        setUserRole('MOTHER');
      }
    } catch (err) {
      console.warn('Could not read user role from Firestore, defaulting to MOTHER', err);
      setUserRole('MOTHER');
    }
  }, []);

  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await ensureUserProfile(user);
        } catch (err) {
          console.warn('Could not initialize MomHaven user profile', err);
        }
        await fetchUserData(user);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--lavender-50)] flex flex-col items-center justify-center p-4 font-body">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-card-1 p-3 mb-4 flex items-center justify-center animate-pulse">
          <img src="/assets/logo.png" alt="MomHaven" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
        <p className="font-display font-bold text-[16px] text-[var(--haven-deep)]">Loading MomHaven...</p>
      </div>
    );
  }

  const renderCurrentShell = () => {
    switch (userRole) {
      case 'PARTNER':
        return (
          <PartnerShell
            partnerId={currentUser?.uid || 'partner-user'}
            partnerName={currentUser?.displayName || 'Partner Support'}
            onSignOut={handleSignOut}
          />
        );

      case 'CLINICIAN':
        // Check verification status: if pending or not approved, enforce boundary
        if (!clinicianData || clinicianData.verificationStatus !== 'approved') {
          return (
            <ClinicianPendingScreen
              clinicianId={currentUser?.uid || 'clinician-user'}
              clinicianName={currentUser?.displayName || clinicianData?.name || 'Healthcare Professional'}
              clinicianData={clinicianData}
              onRefresh={() => currentUser && fetchUserData(currentUser)}
              onInstantApprove={() => {
                if (clinicianData) {
                  setClinicianData({ ...clinicianData, verificationStatus: 'approved' });
                }
              }}
              onSignOut={handleSignOut}
            />
          );
        }

        return (
          <ClinicianShell
            clinicianId={currentUser?.uid || 'clinician-dr-sarah'}
            clinicianName={currentUser?.displayName || clinicianData?.name || 'Dr. Sarah Kimani (MO ObsGyn)'}
            facilityName={clinicianData?.facilityName || 'Kenyatta National Hospital (Level 6)'}
            onSignOut={handleSignOut}
          />
        );

      case 'ADMIN':
        // Check MFA Step-up for administrative clearance
        if (!adminMfaVerified) {
          return (
            <div className="min-h-screen bg-[var(--lavender-50)] flex items-center justify-center p-4">
              <AdminMfaModal
                adminEmail={currentUser?.email || 'admin@health.go.ke'}
                onSuccess={handleAdminMfaSuccess}
                onCancel={handleSignOut}
              />
            </div>
          );
        }

        return <AdminShell onRoleSwitch={(r) => setUserRole(r)} />;

      case 'MOTHER':
      default:
        return (
          <MotherShell
            userId={currentUser?.uid || 'guest-user'}
            userEmail={currentUser?.email || 'mama@example.com'}
            userName={currentUser?.displayName || 'Mama Jemimah'}
            onSignOut={handleSignOut}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] text-[var(--ink-900)]">
      {!currentUser ? (
        <LandingPage
          onSignedIn={() => {
            if (auth.currentUser) {
              fetchUserData(auth.currentUser);
            }
          }}
          onPartnerConnected={(partnerId, partnerName, motherInfo) => {
            setUserRole('PARTNER');
            localStorage.setItem('momhaven_partner_link', JSON.stringify(motherInfo));
          }}
        />
      ) : (
        renderCurrentShell()
      )}
    </div>
  );
}
