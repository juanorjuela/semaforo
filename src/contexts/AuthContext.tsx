import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { AppUser } from '../types';
import { getOrCreateUser } from '../services/userService';

interface AuthContextType {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  profileError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  retryProfile: () => Promise<void>;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async (user: User) => {
    try {
      const profile = await getOrCreateUser(
        user.uid,
        user.email || '',
        user.displayName || user.email || 'Usuario'
      );
      setAppUser(profile);
      setProfileError(null);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setAppUser(null);
      setProfileError('No se pudo cargar tu perfil de administrador. Intenta de nuevo.');
    }
  }, []);

  useEffect(() => {
    if (!auth) return;

    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          setFirebaseUser(result.user);
          await loadProfile(result.user);
        }
      } catch (err) {
        console.error('Error en redirect de Google:', err);
        setProfileError(
          'Error al completar el inicio de sesión. Usa Safari o Chrome sin modo privado e intenta de nuevo.'
        );
      }

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setFirebaseUser(user);
        if (user) {
          await loadProfile(user);
        } else {
          setAppUser(null);
          setProfileError(null);
        }
        setLoading(false);
      });
    };

    init();

    return () => unsubscribe?.();
  }, [loadProfile]);

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase no configurado');
    setProfileError(null);
    await signInWithRedirect(auth, googleProvider);
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
  };

  const retryProfile = async () => {
    if (!firebaseUser) return;
    setLoading(true);
    await loadProfile(firebaseUser);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        loading,
        profileError,
        signInWithGoogle,
        signOut,
        retryProfile,
        isSuperAdmin: appUser?.role === 'super-admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
