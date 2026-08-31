/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
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
  const [authView, setAuthView] = useState<AuthView>('welcome');
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStage, setOnboardingStage] = useState<OnboardingStage>('profile_setup');
  const [activePregnancyId, setActivePregnancyId] = useState<string | null>(null);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null); setUserProfile(null); setMotherProfile(null); setIsOnboarding(false); setAuthView('welcome'); setLoading(false); return;
      }
      setCurrentUser(firebaseUser);
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        let userDocData: UserDoc;
        if (userSnap.exists()) userDocData = userSnap.data() as UserDoc;
        else {
          userDocData = { uid: firebaseUser.uid, email: firebaseUser.email || '', displayName: firebaseUser.displayName || 'Mama', role: 'MOTHER' as UserRole, createdAt: new Date().toISOString() };
          await setDoc(userRef, { ...userDocData, serverTimestamp: serverTimestamp() });
        }
        setUserProfile(userDocData);
        if (userDocData.role === 'MOTHER') {
          const motherSnap = await getDoc(doc(db, 'motherProfiles', firebaseUser.uid));
          if (motherSnap.exists()) { setMotherProfile(motherSnap.data() as MotherProfileDoc); setIsOnboarding(false); }
          else { setIsOnboarding(true); setOnboardingStage('profile_setup'); }
        } else setIsOnboarding(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setUserProfile({ uid: firebaseUser.uid, email: firebaseUser.email || '', displayName: firebaseUser.displayName || 'Mama', role: 'MOTHER' as UserRole, createdAt: new Date().toISOString() });
        setIsOnboarding(false);
      } finally { setLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try { await signInWithPopup(auth, googleProvider); }
    catch (err) { console.error('Google Sign In Error:', err); throw err; }
    finally { setGoogleLoading(false); }
  };

  const handleEmailSignIn = async (email: string, pass: string) => { await signInWithEmailAndPassword(auth, email, pass); };

  const handleEmailSignUp = async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const user = res.user;
    const newDoc: UserDoc = { uid: user.uid, email: user.email || email, displayName: name || 'Mama', role: 'MOTHER' as UserRole, createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'users', user.uid), { ...newDoc, serverTimestamp: serverTimestamp() });
    setUserProfile(newDoc); setIsOnboarding(true); setOnboardingStage('profile_setup');
  };

  const handleSendResetEmail = async (email: string) => { await sendPasswordResetEmail(auth, email); };
  const handleSignOut = async () => { try { await signOut(auth); } catch (err) { console.error('Sign out error:', err); } };

  const handlePregnancySetupComplete = async (data: { method: 'LMP' | 'EDD'; date: string; calculatedEDD: string; calculatedWeeks: number }) => {
    if (!currentUser) return;
    try {
      const input = new Date(`${data.date}T00:00:00`);
      const lmpDate = data.method === 'LMP' ? input : new Date(input);
      if (data.method === 'EDD') lmpDate.setDate(lmpDate.getDate() - 280);
      const lmp = lmpDate.toISOString().slice(0, 10);
      const provenance: Provenance = { status: 'REPORTED', enteredBy: currentUser.uid, enteredAt: new Date().toISOString(), verifiedBy: null, verifiedAt: null };
      const docRef = await addDoc(collection(db, 'pregnancies'), { motherId: currentUser.uid, lmp, edd: data.calculatedEDD, status: 'active', calculationMethod: data.method, currentWeek: data.calculatedWeeks, provenance, createdAt: serverTimestamp() });
      setActivePregnancyId(docRef.id); setOnboardingStage('pregnancy_history');
    } catch (err) { console.error('Error creating pregnancy document:', err); }
  };

  if (loading) return <div className="min-h-screen bg-[#F7F3FC] flex flex-col items-center justify-center text-[#241451]"><Loader2 className="h-8 w-8 animate-spin text-[#33178A]" /><p className="mt-3 font-display font-bold">Loading MomHaven…</p></div>;

  if (!currentUser) return (
    <div className="min-h-screen bg-[#F7F3FC] flex items-center justify-center p-3 sm:p-6 selection:bg-[#9167C2]/20 selection:text-[#33178A]">
      {authView === 'welcome' && <WelcomeScreen onCreateAccount={() => setAuthView('create_account')} onSignIn={() => setAuthView('signin')} onGoogleSignIn={handleGoogleSignIn} googleLoading={googleLoading} />}
      {authView === 'signin' && <SignInScreen onBack={() => setAuthView('welcome')} onSuccess={() => {}} onCreateAccount={() => setAuthView('create_account')} onForgotPassword={() => setAuthView('forgot_password')} onGoogleSignIn={handleGoogleSignIn} onEmailSignIn={handleEmailSignIn} googleLoading={googleLoading} />}
      {authView === 'create_account' && <CreateAccountScreen onBack={() => setAuthView('welcome')} onSignIn={() => setAuthView('signin')} onSuccess={() => {}} onGoogleSignIn={handleGoogleSignIn} onEmailSignUp={handleEmailSignUp} googleLoading={googleLoading} />}
      {authView === 'forgot_password' && <ForgotPasswordScreen onBack={() => setAuthView('signin')} onSendResetEmail={handleSendResetEmail} />}
    </div>
  );

  if (isOnboarding && userProfile) return (
    <div className="min-h-screen bg-[#F7F3FC] flex items-center justify-center p-3 sm:p-6 selection:bg-[#9167C2]/20 selection:text-[#33178A]">
      {onboardingStage === 'profile_setup' && <InitialProfileSetup user={userProfile} onBack={handleSignOut} onContinue={(profile) => { setMotherProfile(prev => ({ ...prev, ...profile } as MotherProfileDoc)); setOnboardingStage('pregnancy_setup'); }} />}
      {onboardingStage === 'pregnancy_setup' && <PregnancySetup onBack={() => setOnboardingStage('profile_setup')} onContinue={handlePregnancySetupComplete} onSkip={() => setOnboardingStage('pregnancy_history')} />}
      {onboardingStage === 'pregnancy_history' && <AddPregnancyHistory userId={currentUser.uid} pregnancyId={activePregnancyId || undefined} onBack={() => setOnboardingStage('pregnancy_setup')} onComplete={() => setIsOnboarding(false)} onSkip={() => setIsOnboarding(false)} />}
    </div>
  );

  const role = userProfile?.role || 'MOTHER';
  return <div className="min-h-screen bg-[#F7F3FC] text-[#241451] flex flex-col font-body"><header className="w-full bg-white border-b border-[#E5DFF0] px-4 py-2.5 text-xs flex items-center justify-between"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#1E8F5F]" /><span className="font-display font-bold">{userProfile?.displayName || currentUser.email}</span><span className="rounded-full bg-[#EEE7F8] px-2 py-0.5 font-display text-[11px] font-bold text-[#33178A]">{role}</span></div><button onClick={handleSignOut} className="flex items-center gap-1.5 font-display font-semibold text-[#6D6380] hover:text-[#E11D3C]"><LogOut className="h-3.5 w-3.5" />Sign out</button></header><main className="flex-1 w-full mx-auto p-3 sm:p-6">{role === 'MOTHER' && <MotherLayout user={userProfile || { uid: currentUser.uid, email: currentUser.email || '', displayName: currentUser.displayName || 'Mama', role: 'MOTHER', createdAt: new Date().toISOString() }} motherProfile={motherProfile} onOpenEmergency={() => setIsEmergencyOpen(true)} />}{role === 'PARTNER' && <PartnerLayout onOpenEmergency={() => setIsEmergencyOpen(true)} />}{role === 'CLINICIAN' && <ClinicianLayout />}{role === 'ADMIN' && <AdminLayout />}</main><EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} /></div>;
}
