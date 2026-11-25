import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  githubProvider,
  microsoftProvider,
  isFirebaseConfigured,
} from '../firebase/config';
import {
  UserProfileData,
  syncUserProfileToFirestore,
  getUserProfileFromFirestore,
  updateUserProfileInFirestore,
  resolveEmailFromUsername,
} from '../firebase/firestore';

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  isConfigured: boolean;
  loginWithEmail: (
    emailOrUsername: string,
    password: string,
    rememberMe: boolean
  ) => Promise<void>;
  registerWithEmail: (
    fullName: string,
    email: string,
    password: string,
    username?: string
  ) => Promise<void>;
  loginWithGoogle: (rememberMe?: boolean) => Promise<void>;
  loginWithGithub: (rememberMe?: boolean) => Promise<void>;
  loginWithMicrosoft: (rememberMe?: boolean) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshAuthUser: () => Promise<void>;
  updateUserProfileInfo: (fullName: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Translate Firebase Auth error codes into clear, user-friendly messages.
 */
export function mapFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email/username or password. Please check your credentials and try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes or reset your password.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing authentication.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in request was cancelled.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in provider.';
    case 'auth/network-request-failed':
      return 'Network error occurred. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in your Firebase project settings.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const existing = await getUserProfileFromFirestore(currentUser.uid);
          if (existing) {
            setUserProfile(existing);
          } else {
            const synced = await syncUserProfileToFirestore(currentUser);
            setUserProfile(synced);
          }
        } catch (err) {
          console.error('Failed to sync Firestore profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const ensureConfigured = () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase is not configured yet. Please add your Firebase Web App keys to frontend/.env and restart the dev server.'
      );
    }
    return auth;
  };

  const applyPersistence = async (rememberMe: boolean) => {
    const firebaseAuth = ensureConfigured();
    await setPersistence(
      firebaseAuth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
  };

  const loginWithEmail = useCallback(
    async (
      emailOrUsername: string,
      password: string,
      rememberMe: boolean
    ) => {
      const firebaseAuth = ensureConfigured();
      await applyPersistence(rememberMe);

      const resolvedEmail = await resolveEmailFromUsername(emailOrUsername);
      if (!resolvedEmail.includes('@')) {
        throw new Error(
          'Username not found. Please sign in with your registered email address.'
        );
      }

      const cred = await signInWithEmailAndPassword(
        firebaseAuth,
        resolvedEmail,
        password
      );
      const profile = await syncUserProfileToFirestore(cred.user);
      setUserProfile(profile);
    },
    []
  );

  const registerWithEmail = useCallback(
    async (
      fullName: string,
      email: string,
      password: string,
      username?: string
    ) => {
      const firebaseAuth = ensureConfigured();
      await applyPersistence(true);

      const cred = await createUserWithEmailAndPassword(
        firebaseAuth,
        email.trim(),
        password
      );

      if (fullName.trim()) {
        await updateProfile(cred.user, { displayName: fullName.trim() });
      }

      try {
        await sendEmailVerification(cred.user);
      } catch (verErr) {
        console.warn('Verification email could not be dispatched:', verErr);
      }

      const profile = await syncUserProfileToFirestore(cred.user, {
        fullName: fullName.trim(),
        username,
        authProvider: 'password',
      });
      setUserProfile(profile);
    },
    []
  );

  const loginWithGoogle = useCallback(async (rememberMe = true) => {
    const firebaseAuth = ensureConfigured();
    await applyPersistence(rememberMe);
    const cred = await signInWithPopup(firebaseAuth, googleProvider);
    const profile = await syncUserProfileToFirestore(cred.user, {
      authProvider: 'google.com',
    });
    setUserProfile(profile);
  }, []);

  const loginWithGithub = useCallback(async (rememberMe = true) => {
    const firebaseAuth = ensureConfigured();
    await applyPersistence(rememberMe);
    const cred = await signInWithPopup(firebaseAuth, githubProvider);
    const profile = await syncUserProfileToFirestore(cred.user, {
      authProvider: 'github.com',
    });
    setUserProfile(profile);
  }, []);

  const loginWithMicrosoft = useCallback(async (rememberMe = true) => {
    const firebaseAuth = ensureConfigured();
    await applyPersistence(rememberMe);
    const cred = await signInWithPopup(firebaseAuth, microsoftProvider);
    const profile = await syncUserProfileToFirestore(cred.user, {
      authProvider: 'microsoft.com',
    });
    setUserProfile(profile);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const firebaseAuth = ensureConfigured();
    const resolvedEmail = await resolveEmailFromUsername(email);
    await sendPasswordResetEmail(firebaseAuth, resolvedEmail.trim());
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    const firebaseAuth = ensureConfigured();
    if (!firebaseAuth.currentUser) {
      throw new Error('No active user session found.');
    }
    await sendEmailVerification(firebaseAuth.currentUser);
  }, []);

  const refreshAuthUser = useCallback(async () => {
    const firebaseAuth = ensureConfigured();
    if (firebaseAuth.currentUser) {
      await firebaseAuth.currentUser.reload();
      const updated = await syncUserProfileToFirestore(firebaseAuth.currentUser);
      if (updated) setUserProfile({ ...updated });
    }
  }, []);

  const updateUserProfileInfo = useCallback(
    async (fullName: string, role?: string) => {
      const firebaseAuth = ensureConfigured();
      if (!firebaseAuth.currentUser) {
        throw new Error('No active user session found.');
      }
      if (fullName.trim()) {
        await updateProfile(firebaseAuth.currentUser, {
          displayName: fullName.trim(),
        });
      }
      await updateUserProfileInFirestore(firebaseAuth.currentUser.uid, {
        fullName,
        role,
      });
      const updated = await getUserProfileFromFirestore(
        firebaseAuth.currentUser.uid
      );
      if (updated) {
        setUserProfile(updated);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isConfigured: isFirebaseConfigured,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithGithub,
        loginWithMicrosoft,
        sendPasswordReset,
        resendVerificationEmail,
        refreshAuthUser,
        updateUserProfileInfo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
