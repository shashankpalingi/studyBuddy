import { 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  Unsubscribe,
  DocumentReference
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ActiveCaller {
  userId: string;
  userName: string;
  peerId: string;
  joinedAt: Date;
}

export interface PeerConfig {
  iceServers: Array<{ urls: string | string[] }>;
}

// Default peer configuration with multiple STUN/TURN servers
export const DEFAULT_PEER_CONFIG: PeerConfig = {
  iceServers: [
    // Google's public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },

    // Twilio STUN servers
    { urls: 'stun:global.stun.twilio.com:3478' },

    // Fallback TURN servers (replace with your own TURN server details)
    {
      urls: [
        'turn:turn.studybuddy.com:3478?transport=udp',
        'turn:turn.studybuddy.com:3478?transport=tcp',
        'turn:turn.studybuddy.com:443?transport=tcp'
      ],
      username: import.meta.env.VITE_TURN_USERNAME || '',
      credential: import.meta.env.VITE_TURN_PASSWORD || ''
    }
  ]
};

export class VideoCallService {
  // Register a user as active in a video call for a room with retry
  static async registerCaller(
    roomId: string, 
    userId: string, 
    userName: string, 
    peerId: string, 
    maxRetries = 3
  ): Promise<void> {
    let attempt = 0;
    let lastError: any = null;
    
    while (attempt < maxRetries) {
      try {
        const callerRef = doc(db, 'studyRooms', roomId, 'activeCallers', userId);
        await setDoc(callerRef, {
          userId,
          userName,
          peerId,
          joinedAt: serverTimestamp(),
          lastUpdated: serverTimestamp() // Track when the user was last active
        });
        console.log(`Registered as active caller (attempt ${attempt + 1})`);
        return; // Success, exit the function
      } catch (error) {
        lastError = error;
        attempt++;
        console.error(`Error registering caller (attempt ${attempt}):`, error);
        
        // Only wait before retrying if we're not on the last attempt
        if (attempt < maxRetries) {
          const delay = Math.min(Math.pow(2, attempt) * 1000, 10000); // Exponential backoff with max 10s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we get here, all attempts failed
    console.error(`Failed to register caller after ${maxRetries} attempts`);
    throw lastError;
  }
  
  // Update caller's last active timestamp (for keeping connection alive)
  static async updateCallerActivity(roomId: string, userId: string): Promise<void> {
    try {
      const callerRef = doc(db, 'studyRooms', roomId, 'activeCallers', userId);
      
      // Use setDoc with merge and catch specific errors
      await setDoc(callerRef, {
        lastUpdated: serverTimestamp()
      }, { 
        merge: true 
      }).catch(err => {
        // Log permission errors without throwing
        if (err.code === 'permission-denied') {
          console.warn(`Permission denied updating caller activity for ${userId}. Skipping update.`);
          return;
        }
        
        throw err;
      });
    } catch (error) {
      // Only log errors that aren't permission-related
      if (error.code !== 'permission-denied') {
        console.warn('Error updating caller activity:', error);
      }
      // Silently fail to prevent breaking the call flow
    }
  }
  
  // Update unregister caller method to be more resilient
  static async unregisterCaller(roomId: string, userId: string, maxRetries = 1): Promise<void> {
    let attempt = 0;
    let lastError: any = null;
    
    while (attempt < maxRetries) {
      try {
        const callerRef = doc(db, 'studyRooms', roomId, 'activeCallers', userId);
        
        // Use deleteDoc with additional error handling
        await deleteDoc(callerRef).catch(err => {
          // Log the error but don't immediately throw
          console.warn(`Soft delete failed for caller ${userId}:`, err);
          
          // If it's a permission error, we'll just log and continue
          if (err.code === 'permission-denied') {
            console.warn(`Permission denied when unregistering caller ${userId}. Skipping unregister.`);
            return;
          }
          
          throw err;
        });
        
        console.log(`Unregistered from active callers (attempt ${attempt + 1})`);
        return; // Success, exit the function
      } catch (error) {
        lastError = error;
        attempt++;
        console.error(`Error unregistering caller (attempt ${attempt}):`, error);
        
        // Reduce retry delay and limit retries
        if (attempt < maxRetries) {
          const delay = Math.min(attempt * 500, 2000); // Max 2 second delay
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we get here, all attempts failed
    console.warn(`Failed to unregister caller after ${maxRetries} attempts`);
    // Silently fail to prevent breaking the call flow
  }
  
  // Get active callers in a room with retry
  static async getActiveCallers(roomId: string, maxRetries = 2): Promise<ActiveCaller[]> {
    let attempt = 0;
    let lastError: any = null;
    
    while (attempt < maxRetries) {
      try {
        const callersRef = collection(db, 'studyRooms', roomId, 'activeCallers');
        const snapshot = await getDocs(callersRef);
        
        const activeCallers: ActiveCaller[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          activeCallers.push({
            userId: data.userId,
            userName: data.userName,
            peerId: data.peerId,
            joinedAt: data.joinedAt?.toDate() || new Date()
          });
        });
        
        return activeCallers;
      } catch (error) {
        lastError = error;
        attempt++;
        console.error(`Error getting active callers (attempt ${attempt}):`, error);
        
        if (attempt < maxRetries) {
          const delay = 1000 * attempt;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we get here, all attempts failed
    console.error(`Failed to get active callers after ${maxRetries} attempts`);
    throw lastError;
  }
  
  // Subscribe to active callers changes with error handling and reconnection
  static subscribeToActiveCallers(
    roomId: string, 
    callback: (activeCallers: ActiveCaller[]) => void
  ): () => void {
    let unsubscribe: Unsubscribe | null = null;
    let isActive = true;
    let retryCount = 0;
    const maxRetryDelay = 30000; // Max 30 seconds between retries
    
    const callersRef = collection(db, 'studyRooms', roomId, 'activeCallers');
    
    const setupSubscription = () => {
      if (!isActive) return; // Don't set up if we've been unsubscribed
      
      try {
        console.log(`Setting up active callers subscription (attempt ${retryCount + 1})`);
        
        unsubscribe = onSnapshot(callersRef, (snapshot) => {
          // Reset retry count on successful snapshot
          retryCount = 0;
          
          const activeCallers: ActiveCaller[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            activeCallers.push({
              userId: data.userId,
              userName: data.userName,
              peerId: data.peerId,
              joinedAt: data.joinedAt?.toDate() || new Date()
            });
          });
          
          callback(activeCallers);
        }, (error) => {
          console.error('Error in active callers subscription:', error);
          
          // Only retry if we're still active
          if (isActive) {
            retryCount++;
            const delay = Math.min(Math.pow(2, retryCount) * 1000, maxRetryDelay);
            console.log(`Retrying subscription in ${delay}ms (attempt ${retryCount})`);
            setTimeout(setupSubscription, delay);
          }
        });
      } catch (err) {
        console.error("Error setting up subscription:", err);
        
        // Only retry if we're still active
        if (isActive) {
          retryCount++;
          const delay = Math.min(Math.pow(2, retryCount) * 1000, maxRetryDelay);
          console.log(`Retrying subscription in ${delay}ms (attempt ${retryCount})`);
          setTimeout(setupSubscription, delay);
        }
      }
    };
    
    // Initial setup
    setupSubscription();
    
    // Return unsubscribe function
    return () => {
      isActive = false; // Mark as inactive to prevent retries
      
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (err) {
          console.warn("Error unsubscribing:", err);
        }
      }
    };
  }
  
  // Check if a room has an active video call with retry
  static async hasActiveCall(roomId: string, maxRetries = 2): Promise<boolean> {
    let attempt = 0;
    let lastError: any = null;
    
    while (attempt < maxRetries) {
      try {
        const callersRef = collection(db, 'studyRooms', roomId, 'activeCallers');
        const snapshot = await getDocs(callersRef);
        
        return !snapshot.empty;
      } catch (error) {
        lastError = error;
        attempt++;
        console.error(`Error checking for active call (attempt ${attempt}):`, error);
        
        if (attempt < maxRetries) {
          const delay = 1000 * attempt;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we get here, all attempts failed
    console.error(`Failed to check for active call after ${maxRetries} attempts`);
    throw lastError;
  }
} 