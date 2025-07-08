import { db, auth } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { uploadToCloudinary } from '../lib/cloudinary';
import { User, updateProfile } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  bio?: string;
  major?: string;
  interests?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Create a new user profile in Firestore when user signs up
export const createUserProfile = async (user: User): Promise<UserProfile> => {
  const userProfileRef = doc(db, 'users', user.uid);
  
  const userProfile: UserProfile = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await setDoc(userProfileRef, {
    ...userProfile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return userProfile;
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userProfileRef = doc(db, 'users', uid);
  const userProfileSnap = await getDoc(userProfileRef);
  
  if (userProfileSnap.exists()) {
    return userProfileSnap.data() as UserProfile;
  }
  
  return null;
};

// Update user profile in Firestore
export const updateUserProfile = async (uid: string, profileData: Partial<UserProfile>): Promise<void> => {
  const userProfileRef = doc(db, 'users', uid);
  
  await updateDoc(userProfileRef, {
    ...profileData,
    updatedAt: serverTimestamp()
  });
  
  // Update displayName and photoURL in Firebase Auth if provided
  const currentUser = auth.currentUser;
  if (currentUser) {
    const updateData: { displayName?: string, photoURL?: string } = {};
    
    if (profileData.displayName) {
      updateData.displayName = profileData.displayName;
    }
    
    if (profileData.photoURL) {
      updateData.photoURL = profileData.photoURL;
    }
    
    if (Object.keys(updateData).length > 0) {
      await updateProfile(currentUser, updateData);
    }
  }
};

// Upload profile picture to Cloudinary and update user profile
export const uploadProfilePicture = async (uid: string, file: File): Promise<string> => {
  // Upload to Cloudinary
  const uploadResult = await uploadToCloudinary(file);
  
  // Update the user profile with just the URL
  await updateUserProfile(uid, { photoURL: uploadResult.url });
  
  return uploadResult.url;
}; 