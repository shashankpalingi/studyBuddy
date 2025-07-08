import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Development flag
const isDevelopment = import.meta.env.DEV;

// Default development config - override with environment variables if available
const firebaseConfig = {
  // For development, we're using a test project configuration that allows OAuth providers
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBj9YjlGzmJDH85DjNvmaoUXDjenTB5nR4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "studybuddy-dev-1f49d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "studybuddy-dev-1f49d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "studybuddy-dev-1f49d.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "48058809440",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:48058809440:web:7be7c08f92be33ab376c8d"
};

console.log("Firebase initialized with config:", {
  apiKey: firebaseConfig.apiKey.substring(0, 8) + "...",
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// For development without authentication
const bypassAuth = isDevelopment && false; // Set to true to bypass auth completely

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
export const auth = getAuth(app);
auth.useDeviceLanguage(); // Set language to device preference

// Configure Google provider for proper redirection
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // This helps ensure the OAuth process completes properly
  login_hint: 'user@example.com'
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Connect to emulators if in development mode and specified
if (isDevelopment && (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true')) {
  console.log("Connecting to Firebase emulators...");
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export default app; 