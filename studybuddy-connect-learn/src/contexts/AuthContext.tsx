import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  getRedirectResult,
  sendPasswordResetEmail,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getUserProfile, UserProfile } from '../services/userService';

// Define the shape of our auth context
interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  authInitialized: boolean;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  login: async () => { throw new Error('Not implemented'); },
  register: async () => { throw new Error('Not implemented'); },
  loginWithGoogle: async () => { throw new Error('Not implemented'); },
  loginWithGithub: async () => { throw new Error('Not implemented'); },
  logout: async () => { throw new Error('Not implemented'); },
  resetPassword: async () => { throw new Error('Not implemented'); },
  refreshUserProfile: async () => { throw new Error('Not implemented'); },
  loading: true,
  error: null,
  clearError: () => {},
  authInitialized: false
});

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Clear error function
  const clearError = () => setError(null);

  // Set persistence to local
  useEffect(() => {
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error("Error setting auth persistence:", error);
      }
    };
    
    initAuth();
  }, []);

  // Handle email/password login
  const login = async (email: string, password: string) => {
    try {
      clearError();
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Handle email/password registration
  const register = async (email: string, password: string, displayName: string) => {
    try {
      clearError();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Create a user profile document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: null,
        createdAt: new Date(),
      });
    } catch (error: any) {
      console.error('Error registering user:', error);
      setError(error.message);
      throw error;
    }
  };

  // Google sign-in using popup (more reliable than redirect)
  const loginWithGoogle = async () => {
    try {
      clearError();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Use signInWithPopup instead of redirect for better reliability
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create or update user profile
      if (user) {
        await createUserProfileIfNeeded(user);
      }
      
      return result;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError(error.message || 'Failed to sign in with Google');
      throw error;
    }
  };

  // GitHub sign-in using popup (more reliable than redirect)
  const loginWithGithub = async () => {
    try {
      clearError();
      const provider = new GithubAuthProvider();
      
      // Use signInWithPopup instead of redirect for better reliability
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create or update user profile
      if (user) {
        await createUserProfileIfNeeded(user);
      }
      
      return result;
    } catch (error: any) {
      console.error('Github sign-in error:', error);
      setError(error.message || 'Failed to sign in with GitHub');
      throw error;
    }
  };

  // Handle logout
  const logout = async () => {
    try {
      clearError();
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Handle password reset
  const resetPassword = async (email: string) => {
    try {
      clearError();
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Load user profile data
  const loadUserProfile = async (user: User) => {
    try {
      const userProfile = await getUserProfile(user.uid);
      setUserProfile(userProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Refresh user profile data
  const refreshUserProfile = async () => {
    try {
      if (currentUser) {
        await loadUserProfile(currentUser);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      throw error;
    }
  };

  // Create or update user profile after OAuth sign-in
  const createUserProfileIfNeeded = async (user: User) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log("Creating new user profile for:", user.uid);
        // Create new user profile
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || `User${user.uid.substring(0, 5)}`,
          photoURL: user.photoURL,
          createdAt: new Date(),
        });
      } else {
        console.log("Updating existing user profile for:", user.uid);
        // Update existing user profile with latest OAuth data
        if (user.displayName || user.photoURL) {
          const updateData: Record<string, any> = {};
          if (user.displayName) updateData.displayName = user.displayName;
          if (user.photoURL) updateData.photoURL = user.photoURL;
          
          await updateDoc(userDocRef, updateData);
        }
      }
      
      // Load the user profile
      await loadUserProfile(user);
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? `User logged in: ${user.uid}` : "No user");
      setCurrentUser(user);
      
      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
      setAuthInitialized(true);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
    logout,
    resetPassword,
    refreshUserProfile,
    loading,
    error,
    clearError,
    authInitialized
  };

  return (
    <AuthContext.Provider value={value}>
      {!authInitialized ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Initializing authentication...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Create a protected route component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

import { Navigate } from 'react-router-dom';
export default ProtectedRoute; 