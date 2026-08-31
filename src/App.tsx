/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './lib/firebase';
import { UserRole, UserDoc, MotherProfileDoc, Provenance } from './types';
import { WelcomeScreen } from './components/auth/WelcomeScreen';
import { SignInScreen } from './components/auth/SignInScreen';
import { CreateAccountScreen } from './components/auth/CreateAccountScreen';
import { ForgotPasswordScreen } from './components/auth/ForgotPasswordScreen';
import { InitialProfileSetup } from './components/auth/InitialProfileSetup';
import { PregnancySetup } from './components/auth/PregnancySetup';
import { AddPregnancyHistory } from './components/auth/AddPregnancyHistory';
import { MotherLayout } from './components/MotherLayout';
import { PartnerLayout } from './components/PartnerLayout';
import { ClinicianLayout } from './components/ClinicianLayout';
import { AdminLayout } from './components/AdminLayout';
import { EmergencyModal } from './components/EmergencyModal';
import { LogOut, Loader2 } from 'lucide-react';

type AuthView = 'welcome' | 'signin' | 'create_account' | 'forgot_password';
type OnboardingStage = 'profile_setup' | 'pregnancy_setup' | 'pregnancy_history';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserDoc | null>(null);
  const [motherProfile, setMotherProfile] = useState<MotherProfileDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Unauthenticated sub-view
  const [authView, setAuthView] = useState<AuthView>('welcome');

  // Authenticated onboarding state (M-AUTH-006, 007, 008)
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStage, setOnboardingStage] = useState<OnboardingStage>('profile_setup');
  const [activePregnancyId, setActivePregnancyId] = useState<string | null>(null);

  // Emergency Modal trigger
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        try {
          // 1. Fetch or create users/{uid}
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          let userDocData: UserDoc;
          if (userSnap.exists()) {
            userDocData = userSnap.data() as UserDoc;
            setUserProfile(userDocData);
          } else {
            const newDoc: UserDoc = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Mama',
              role: 'MOTHER' as UserRole,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, { ...newDoc, serverTimestamp: serverTimestamp() });
            userDocData = newDoc;
            setUserProfile(newDoc);
          }

          // 2. Check motherProfiles/{uid}
          if (userDocData.role === 'MOTHER') {
            const motherRef = doc(db, 'motherProfiles', firebaseUser.uid);
            const motherSnap = await getDoc(motherRef);
            if (motherSnap.exists()) {
              setMotherProfile(motherSnap.data() as MotherProfileDoc);
              setIsOnboarding(false);
            } else {
              // Brand new mother profile -> start onboarding at M-AUTH-006
              setIsOnboarding(true);
              setOnboardingStage('profile_setup');
            }
          } else {
            setIsOnboarding(false);
          }
        } catch (err: any) {
          console.error('Error fetching user data:', err);
          const fallbackDoc: UserDoc = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Mama',
            role: 'MOTHER' as UserRole,
            createdAt: new Date().toISOString(),
          };
          setUserProfile(fallbackDoc);
          setIsOnboarding(false);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setMotherProfile(null);
        setIsOnboarding(false);
        setAuthView('welcome');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google Sign In handler
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;

      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const newDoc: UserDoc = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Mama',
          role: 'MOTHER' as UserRole,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, { ...newDoc, serverTimestamp: serverTimestamp() });
        setUserProfile(newDoc);
        setIsOnboarding(true);
        setOnboardingStage('profile_setup');
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      throw err;
    } finally {
      setGoogleLoading(false);
    }
  };

  // Email Sign In handler
  const handleEmailSignIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  // Email Sign Up handler
  const handleEmailSignUp = async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const user = res.user;

    const userRef = doc(db, 'users', user.uid);
    const newDoc: UserDoc = {
      uid: user.uid,
      email: user.email || email,
      displayName: name || 'Mama',
      role: 'MOTHER' as UserRole,
      createdAt: new Date().toISOString(),
    };
    await setDoc(userRef, { ...newDoc, serverTimestamp: serverTimestamp() });
    setUserProfile(newDoc);
    setIsOnboarding(true);
    setOnboardingStage('profile_setup');
  };

  // Password Reset Email handler
  const handleSendResetEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAuthView('welcome');
      setIsOnboarding(false);
      setOnboardingStage('profile_setup');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Pregnancy Setup complete handler (Creates real pregnancy record in Firestore)
  const handlePregnancySetupComplete = async (data: {
    method: 'LMP' | 'EDD';
    date: string;
    calculatedEDD: string;
    calculatedWeeks: number;
  }) => {
    if (!currentUser) return;
    try {
      const provenance: Provenance = {
        status: 'REPORTED',
        enteredBy: currentUser.uid,
        enteredAt: new Date().toISOString(),
        verifiedBy: null,
        verifiedAt: null,
      };

      const pregCollectionRef = collection(db, 'pregnancies');
      const docRef = await addDoc(pregCollectionRef, {
        motherId: currentUser.uid,
        edd: data.calculatedEDD,
        lmp: data.method === 'LMP' ? data.date : null,
        calculationMethod: data.method,
        currentWeek: data.calculatedWeeks,
        status: 'active',
        provenance,
        createdAt: new Date().toISOString(),
      });
      setActivePregnancyId(docRef.id);
      setOnboardingStage('pregnancy_history');
    } catch (err) {
      console.error('Error creating pregnancy document:', err);
      setOnboardingStage('pregnancy_history');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F3FC] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#33178A] animate-spin mb-3" />
        <p className="font-display font-semibold text-sm text-[#241451]">Loading MomHaven...</p>
      </div>
    );
  }

  // 1. Unauthenticated Flow (Real Welcome, Sign In, Create Account, Forgot Password screens)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F7F3FC] flex flex-col items-center justify-center p-3 sm:p-6 selection:bg-[#9167C2]/20 selection:text-[#33178A]">
        {authView === 'welcome' && (
          <WelcomeScreen
            onCreateAccount={() => setAuthView('create_account')}
            onSignIn={() => setAuthView('signin')}
            onGoogleSignIn={handleGoogleSignIn}
            googleLoading={googleLoading}
          />
        )}

        {authView === 'signin' && (
          <SignInScreen
            onBack={() => setAuthView('welcome')}
            onSuccess={() => {}}
            onCreateAccount={() => setAuthView('create_account')}
            onForgotPassword={() => setAuthView('forgot_password')}
            onGoogleSignIn={handleGoogleSignIn}
            onEmailSignIn={handleEmailSignIn}
            googleLoading={googleLoading}
          />
        )}

        {authView === 'create_account' && (
          <CreateAccountScreen
            onBack={() => setAuthView('welcome')}
            onSignIn={() => setAuthView('signin')}
            onSuccess={() => {}}
            onGoogleSignIn={handleGoogleSignIn}
            onEmailSignUp={handleEmailSignUp}
            googleLoading={googleLoading}
          />
        )}

        {authView === 'forgot_password' && (
          <ForgotPasswordScreen
            onBack={() => setAuthView('signin')}
            onSendResetEmail={handleSendResetEmail}
          />
        )}
      </div>
    );
  }

  // 2. Authenticated Onboarding Flow (M-AUTH-006, 007, 008)
  if (isOnboarding && userProfile) {
    return (
      <div className="min-h-screen bg-[#F7F3FC] flex flex-col items-center justify-center p-3 sm:p-6 selection:bg-[#9167C2]/20 selection:text-[#33178A]">
        {onboardingStage === 'profile_setup' && (
          <InitialProfileSetup
            user={userProfile}
            onBack={() => handleSignOut()}
            onContinue={(profile) => {
              setMotherProfile((prev) => ({ ...prev, ...profile } as MotherProfileDoc));
              setOnboardingStage('pregnancy_setup');
            }}
          />
        )}

        {onboardingStage === 'pregnancy_setup' && (
          <PregnancySetup
            onBack={() => setOnboardingStage('profile_setup')}
            onContinue={handlePregnancySetupComplete}
            onSkip={() => setOnboardingStage('pregnancy_history')}
          />
        )}

        {onboardingStage === 'pregnancy_history' && (
          <AddPregnancyHistory
            userId={currentUser.uid}
            pregnancyId={activePregnancyId || undefined}
            onBack={() => setOnboardingStage('pregnancy_setup')}
            onComplete={() => setIsOnboarding(false)}
            onSkip={() => setIsOnboarding(false)}
          />
        )}
      </div>
    );
  }

  // 3. Authenticated Role-based Flow (Mother, Partner, Clinician, Admin)
  const role = userProfile?.role || 'MOTHER';

  return (
    <div className="min-h-screen bg-[#F7F3FC] text-[#241451] flex flex-col font-body selection:bg-[#9167C2]/20 selection:text-[#33178A]">
      {/* Authenticated Top Status Bar */}
      <header className="w-full bg-white border-b border-[#E5DFF0] px-4 py-2.5 text-xs flex items-center justify-between shadow-card-1">
        <div className="flex items-center gap-2 text-[#6D6380]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          <span className="font-display font-bold text-[#241451] text-sm">
            {userProfile?.displayName || currentUser.email}
          </span>
          <span className="bg-[#EAE3F7] text-[#33178A] px-2 py-0.5 rounded-pill font-display text-[11px] font-bold">
            {role}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-[#6D6380] hover:text-[#E11D3C] font-display font-semibold text-xs transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </header>

      {/* Main Role Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col items-center justify-start">
        {role === 'MOTHER' && (
          <MotherLayout
            user={
              userProfile || {
                uid: currentUser.uid,
                email: currentUser.email || '',
                displayName: currentUser.displayName || 'Mama',
                role: 'MOTHER',
                createdAt: new Date().toISOString(),
              }
            }
            motherProfile={motherProfile}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
          />
        )}

        {role === 'PARTNER' && (
          <PartnerLayout
            onOpenEmergency={() => setIsEmergencyOpen(true)}
          />
        )}

        {role === 'CLINICIAN' && <ClinicianLayout />}

        {role === 'ADMIN' && <AdminLayout />}
      </main>

      {/* Emergency Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </div>
  );
}
