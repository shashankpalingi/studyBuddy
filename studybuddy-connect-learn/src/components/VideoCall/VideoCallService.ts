import { 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ActiveCaller {
  userId: string;
  userName: string;
  peerId: string;
  joinedAt: Date;
}

export class VideoCallService {
  // Register a user as active in a video call for a room
  static async registerCaller(roomId: string, userId: string, userName: string, peerId: string): Promise<void> {
    try {
      const callerRef = doc(db, 'studyRooms', roomId, 'activeCallers', userId);
      await setDoc(callerRef, {
        userId,
        userName,
        peerId,
        joinedAt: serverTimestamp()
      });
      console.log('Registered as active caller');
    } catch (error) {
      console.error('Error registering as active caller:', error);
      throw error;
    }
  }
  
  // Unregister a user from active callers when they leave the call
  static async unregisterCaller(roomId: string, userId: string): Promise<void> {
    try {
      const callerRef = doc(db, 'studyRooms', roomId, 'activeCallers', userId);
      await deleteDoc(callerRef);
      console.log('Unregistered from active callers');
    } catch (error) {
      console.error('Error unregistering from active callers:', error);
      throw error;
    }
  }
  
  // Get active callers in a room
  static async getActiveCallers(roomId: string): Promise<ActiveCaller[]> {
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
      console.error('Error getting active callers:', error);
      throw error;
    }
  }
  
  // Subscribe to active callers changes
  static subscribeToActiveCallers(
    roomId: string, 
    callback: (activeCallers: ActiveCaller[]) => void
  ): () => void {
    const callersRef = collection(db, 'studyRooms', roomId, 'activeCallers');
    
    const unsubscribe = onSnapshot(callersRef, (snapshot) => {
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
      console.error('Error subscribing to active callers:', error);
    });
    
    return unsubscribe;
  }
  
  // Check if a room has an active video call
  static async hasActiveCall(roomId: string): Promise<boolean> {
    try {
      const callersRef = collection(db, 'studyRooms', roomId, 'activeCallers');
      const snapshot = await getDocs(callersRef);
      
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking for active call:', error);
      throw error;
    }
  }
} 