import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, logoutUser } from './lib/firebase';
import App from './App';
import RouteAuthPage, { type AuthRouteMode } from './components/RouteAuthPage';

export type AppRoute = '/' | '/home' | '/login' | '/signup' | '/forgot-password' | '/dashboard' | '/mother' | '/partner' | '/clinician' | '/admin';

export function normalizePath(pathname: string): AppRoute {
  const path = pathname.replace(/\/+$/, '') || '/';
  const aliases: Record<string, AppRoute> = {
    '/': '/',
    '/home': '/home',
    '/login': '/login',
    '/auth': '/login',
    '/signin': '/login',
    '/signup': '/signup',
    '/register': '/signup',
    '/forgot-password': '/forgot-password',
    '/reset-password': '/forgot-password',
    '/dashboard': '/dashboard',
    '/mother': '/mother',
    '/partner': '/partner',
    '/clinician': '/clinician',
    '/admin': '/admin',
  };
  return aliases[path] || '/';
}

export function navigateTo(path: string, replace = false) {
  const target = normalizePath(path);
  if (window.location.pathname === target) {
    window.dispatchEvent(new PopStateEvent('popstate'));
    return;
  }
  if (replace) window.history.replaceState({}, '', target);
  else window.history.pushState({}, '', target);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useNavigate() {
  return (path: string, replace = false) => navigateTo(path, replace);
}

function authModeFor(route: AppRoute): AuthRouteMode | null {
  if (route === '/login') return 'login';
  if (route === '/signup') return 'signup';
  if (route === '/forgot-password') return 'forgot';
  return null;
}

function wasBrowserRefresh() {
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return navigation?.type === 'reload';
  } catch {
    return false;
  }
}

export default function RouteEntry() {
  const [route, setRoute] = useState<AppRoute>(() => normalizePath(window.location.pathname));
  const [authReady, setAuthReady] = useState(false);
  const authMode = authModeFor(route);

  useEffect(() => {
    const onPopState = () => setRoute(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    const initializeAuth = async () => {
      // MomHaven intentionally treats a browser refresh as a new session.
      // Firebase normally restores its persisted auth session automatically,
      // so clear it before subscribing to auth state on a reload.
      if (wasBrowserRefresh() && auth.currentUser) {
        try {
          await logoutUser();
        } catch (error) {
          console.warn('Could not clear the previous auth session after refresh', error);
        }
      }

      if (cancelled) return;

      unsubscribe = onAuthStateChanged(auth, user => {
        setAuthReady(true);
        if (user && authMode) navigateTo('/home', true);
      });
    };

    void initializeAuth();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [authMode]);

  if (!authReady && authMode) {
    return <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center text-sm text-[var(--text-secondary)]">Loading MomHaven…</div>;
  }

  if (authMode) return <RouteAuthPage mode={authMode} />;

  // Keep the established App shell as the source of truth for authenticated role
  // routing, onboarding, consent, MFA, guest mode, and existing feature navigation.
  // These aliases provide stable deep links without duplicating those flows.
  return <App />;
}
