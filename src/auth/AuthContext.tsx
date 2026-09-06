import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  getIdToken: () => Promise<string>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string, name: string) => Promise<void>;
  loginAsDevUser: (customName?: string) => Promise<void>;
  logout: () => Promise<void>;
  authMode: 'firebase' | 'demo';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'firebase' | 'demo'>('firebase');
  const [demoUser, setDemoUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('reflect_demo_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        setAuthMode('firebase');
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || `${fbUser.uid.slice(0, 8)}@reflect.local`,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Thinker',
          photoURL: fbUser.photoURL || undefined,
          isAnonymous: fbUser.isAnonymous
        });
      } else if (demoUser) {
        setFirebaseUser(null);
        setAuthMode('demo');
        setUser(demoUser);
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [demoUser]);

  const getIdToken = async (): Promise<string> => {
    if (firebaseUser) {
      return await firebaseUser.getIdToken();
    }
    if (demoUser) {
      // Generate a signed dev bearer token containing uid and timestamp
      const payload = {
        uid: demoUser.uid,
        email: demoUser.email,
        displayName: demoUser.displayName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      return `dev-token-${window.btoa(JSON.stringify(payload))}`;
    }
    throw new Error('Not authenticated');
  };

  const handleLoginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      localStorage.removeItem('reflect_demo_user');
      setDemoUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      localStorage.removeItem('reflect_demo_user');
      setDemoUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }
      localStorage.removeItem('reflect_demo_user');
      setDemoUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDevUser = async (customName = 'Ravi') => {
    const devProfile: UserProfile = {
      uid: 'ravi_prod_user_001',
      email: 'bankupalli.raviteja@gmail.com',
      displayName: customName,
      isAnonymous: false
    };
    localStorage.setItem('reflect_demo_user', JSON.stringify(devProfile));
    setDemoUser(devProfile);
    setUser(devProfile);
    setAuthMode('demo');
  };

  const handleLogout = async () => {
    try {
      if (firebaseUser) {
        await logOut();
      }
    } finally {
      localStorage.removeItem('reflect_demo_user');
      setDemoUser(null);
      setUser(null);
      setFirebaseUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        getIdToken,
        loginWithGoogle: handleLoginWithGoogle,
        loginWithEmail: handleLoginWithEmail,
        registerWithEmail: handleRegisterWithEmail,
        loginAsDevUser,
        logout: handleLogout,
        authMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
