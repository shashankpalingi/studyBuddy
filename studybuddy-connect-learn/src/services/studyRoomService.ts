import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  query, 
  where, 
  serverTimestamp,
  orderBy,
  limit,
  Timestamp,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { UserProfile } from './userService';
import { StudyRoom } from '../types/studyRoom';

export interface StudyRoomParticipant {
  userId: string;
  displayName: string;
  photoURL: string | null;
  joinedAt: Timestamp | Date;
  role: 'host' | 'participant';
}

// Create a new study room
const createStudyRoom = async (roomData: Omit<StudyRoom, 'id' | 'createdAt' | 'updatedAt' | 'participants'>, userId: string, userName: string): Promise<StudyRoom> => {
  try {
    const studyRoomsRef = collection(db, 'studyRooms');
    const newRoom = {
      ...roomData,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      participants: [userId]
    };

    const docRef = await addDoc(studyRoomsRef, newRoom);
    return {
      id: docRef.id,
      ...newRoom,
      createdBy: userId,
      creatorName: userName
    } as StudyRoom;
  } catch (error) {
    console.error('Error creating study room:', error);
    throw error;
  }
};

// Get all public study rooms
const getPublicStudyRooms = async (): Promise<StudyRoom[]> => {
  try {
    // console.log('Fetching study rooms...');
    const studyRoomsRef = collection(db, 'studyRooms');
    const q = query(
      studyRoomsRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    // console.log('Executing query...');
    const querySnapshot = await getDocs(q);
    const rooms: StudyRoom[] = [];
    
    // console.log(`Query results: ${querySnapshot.size} rooms found`);
    
    querySnapshot.forEach((doc) => {
      const roomData = doc.data();
      // Filter out "Test Study Room" entries
      if (!roomData.name.includes("Test Study Room")) {
        // console.log('Room data:', { id: doc.id, ...roomData });
        rooms.push({
          id: doc.id,
          ...roomData
        } as StudyRoom);
      }
    });
    
    // console.log('Processed rooms:', rooms);
    return rooms;
  } catch (error) {
    console.error('Error fetching public study rooms:', error);
    throw error;
  }
};

// Get a specific study room by ID
const getStudyRoomById = async (roomId: string): Promise<StudyRoom | null> => {
  try {
    const roomRef = doc(db, 'studyRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      return null;
    }
    
    return {
      id: roomDoc.id,
      ...roomDoc.data()
    } as StudyRoom;
  } catch (error) {
    console.error('Error fetching study room:', error);
    throw error;
  }
};

// Join a study room
const joinStudyRoom = async (roomId: string, userId: string): Promise<void> => {
  try {
    const roomRef = doc(db, 'studyRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Study room not found');
    }
    
    const roomData = roomDoc.data();
    if (roomData.participants.includes(userId)) {
      throw new Error('User is already in this room');
    }
    
    if (roomData.participants.length >= roomData.maxParticipants) {
      throw new Error('Room is full');
    }

    // Check if room is private and requires a join code
    if (roomData.isPrivate && !roomData.participants.includes(userId)) {
      throw new Error('This is a private room. Please use the join code to enter.');
    }
    
    await updateDoc(roomRef, {
      participants: [...roomData.participants, userId],
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error joining study room:', error);
    throw error;
  }
};

// Leave a study room
const leaveStudyRoom = async (roomId: string, userId: string): Promise<void> => {
  try {
    const roomRef = doc(db, 'studyRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Study room not found');
    }
    
    const roomData = roomDoc.data();
    const updatedParticipants = roomData.participants.filter((id: string) => id !== userId);
    
    await updateDoc(roomRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error leaving study room:', error);
    throw error;
  }
};

// Join a room using a join code
const joinStudyRoomByCode = async (joinCode: string, userId: string): Promise<StudyRoom> => {
  try {
    // Normalize the join code (trim whitespace and convert to uppercase)
    const normalizedJoinCode = joinCode.trim().toUpperCase();
    
    if (!normalizedJoinCode) {
      throw new Error('Join code is required');
    }

    const studyRoomsRef = collection(db, 'studyRooms');
    const q = query(
      studyRoomsRef, 
      where('joinCode', '==', normalizedJoinCode),
      where('status', '==', 'active')  // Only allow joining active rooms
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Invalid join code');
    }
    
    const roomDoc = querySnapshot.docs[0];
    const roomData = roomDoc.data();
    
    if (roomData.participants.includes(userId)) {
      throw new Error('You are already in this room');
    }
    
    if (roomData.participants.length >= roomData.maxParticipants) {
      throw new Error('Room is full');
    }
    
    await updateDoc(roomDoc.ref, {
      participants: [...roomData.participants, userId],
      updatedAt: Timestamp.now()
    });
    
    return {
      id: roomDoc.id,
      ...roomData
    } as StudyRoom;
  } catch (error) {
    console.error('Error joining room by code:', error);
    throw error;
  }
};

// Update a study room
const updateStudyRoom = async (roomId: string, updates: Partial<StudyRoom>): Promise<void> => {
  try {
    const roomRef = doc(db, 'studyRooms', roomId);
    await updateDoc(roomRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating study room:', error);
    throw error;
  }
};

// Delete a study room
const deleteStudyRoom = async (roomId: string): Promise<void> => {
  try {
    const roomRef = doc(db, 'studyRooms', roomId);
    await deleteDoc(roomRef);
  } catch (error) {
    console.error('Error deleting study room:', error);
    throw error;
  }
};

// Get rooms that a user has joined
const getJoinedRooms = async (userId: string): Promise<StudyRoom[]> => {
  try {
    const studyRoomsRef = collection(db, 'studyRooms');
    const q = query(
      studyRoomsRef,
      where('participants', 'array-contains', userId),
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as StudyRoom)).filter(room => !room.name.includes("Test Study Room"));
  } catch (error) {
    console.error('Error fetching joined rooms:', error);
    throw error;
  }
};

// Search for study rooms
const searchStudyRooms = async (searchTerm: string): Promise<StudyRoom[]> => {
  try {
    const studyRoomsRef = collection(db, 'studyRooms');
    const q = query(
      studyRoomsRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const rooms = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as StudyRoom));
    
    // Client-side filtering since Firestore doesn't support text search out of the box
    return rooms.filter(room => {
      const searchTermLower = searchTerm.toLowerCase();
      // Also filter out "Test Study Room" entries
      return (
        !room.name.includes("Test Study Room") &&
        (
          room.name.toLowerCase().includes(searchTermLower) ||
          room.subject.toLowerCase().includes(searchTermLower) ||
          room.description.toLowerCase().includes(searchTermLower) ||
          room.tags.some(tag => tag.toLowerCase().includes(searchTermLower))
        )
      );
    });
  } catch (error) {
    console.error('Error searching study rooms:', error);
    throw error;
  }
};

// Get room participants
const getRoomParticipants = async (roomId: string): Promise<StudyRoomParticipant[]> => {
  try {
    const roomRef = doc(db, 'studyRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Study room not found');
    }
    
    const roomData = roomDoc.data();
    const participants = roomData.participants || [];
    
    // For now, return basic participant info
    // In the future, we can fetch more details from user profiles
    return participants.map((userId: string) => ({
      userId,
      displayName: userId === roomData.createdBy ? roomData.creatorName : 'Participant',
      photoURL: null,
      joinedAt: roomData.createdAt,
      role: userId === roomData.createdBy ? 'host' : 'participant' as 'host' | 'participant'
    }));
  } catch (error) {
    console.error('Error getting room participants:', error);
    throw error;
  }
};

// Get rooms that a user has created
const getRoomsCreatedByUser = async (userId: string): Promise<StudyRoom[]> => {
  try {
    const studyRoomsRef = collection(db, 'studyRooms');
    const q = query(
      studyRoomsRef,
      where('createdBy', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as StudyRoom)).filter(room => !room.name.includes("Test Study Room"));
  } catch (error) {
    console.error('Error fetching rooms created by user:', error);
    throw error;
  }
};

// Delete all study rooms (Admin function)
const deleteAllStudyRooms = async (): Promise<void> => {
  try {
    const studyRoomsRef = collection(db, 'studyRooms');
    const querySnapshot = await getDocs(studyRoomsRef);
    
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log('All study rooms have been deleted');
  } catch (error) {
    console.error('Error deleting all study rooms:', error);
    throw error;
  }
};

// Export all functions
export {
  createStudyRoom,
  getPublicStudyRooms,
  getStudyRoomById,
  joinStudyRoom,
  leaveStudyRoom,
  joinStudyRoomByCode,
  updateStudyRoom,
  deleteStudyRoom,
  getJoinedRooms,
  searchStudyRooms,
  getRoomParticipants,
  getRoomsCreatedByUser,
  deleteAllStudyRooms
}; 