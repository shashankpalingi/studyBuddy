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
    console.log('Creating new study room:', { ...roomData, userId, userName });
    const studyRoomsRef = collection(db, 'studyRooms');
    
    // Ensure all required fields are set
    const newRoom = {
      ...roomData,
      hostId: userId, // Add hostId to match Firestore rules
      createdBy: userId,
      creatorName: userName,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      participants: [userId], // Creator is automatically a participant
      isPrivate: roomData.isPrivate || false,
      joinCode: roomData.isPrivate ? roomData.joinCode : null,
      maxParticipants: Math.max(2, Math.min(50, roomData.maxParticipants || 10)), // Ensure valid range
      description: roomData.description || '',
      tags: roomData.tags || []
    };

    console.log('Saving room with data:', newRoom);
    const docRef = await addDoc(studyRoomsRef, newRoom);
    
    // Get the created document to ensure it has all fields
    const createdDoc = await getDoc(docRef);
    if (!createdDoc.exists()) {
      throw new Error('Failed to create study room');
    }
    
    const createdRoom = {
      id: docRef.id,
      ...createdDoc.data()
    } as StudyRoom;
    
    console.log('Successfully created room:', createdRoom);
    return createdRoom;
  } catch (error) {
    console.error('Error creating study room:', error);
    throw error;
  }
};

// Get all public study rooms
const getPublicStudyRooms = async (): Promise<StudyRoom[]> => {
  try {
    console.log('Starting to fetch public study rooms...');
    const studyRoomsRef = collection(db, 'studyRooms');
    const q = query(
      studyRoomsRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    console.log('Executing query for public rooms...');
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} total rooms before filtering`);
    
    const rooms: StudyRoom[] = [];
    
    querySnapshot.forEach((doc) => {
      const roomData = doc.data();
      console.log('Processing room:', { id: doc.id, name: roomData.name, status: roomData.status });
      
      // Only exclude exact "Test Study Room" matches
      if (roomData.name !== "Test Study Room") {
        rooms.push({
          id: doc.id,
          ...roomData
        } as StudyRoom);
      } else {
        console.log('Excluding test room:', roomData.name);
      }
    });
    
    console.log(`Returning ${rooms.length} public rooms after filtering`);
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
    console.log('Attempting to join room:', roomId, 'for user:', userId);
    const roomRef = doc(db, 'studyRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      console.error('Room not found:', roomId);
      throw new Error('Study room not found');
    }
    
    const roomData = roomDoc.data();
    console.log('Room data:', roomData);
    
    // Check if user is already in the room
    if (roomData.participants && roomData.participants.includes(userId)) {
      console.log('User already in room');
      throw new Error('You are already in this room');
    }
    
    // Check if room is full
    if (roomData.participants && roomData.participants.length >= roomData.maxParticipants) {
      console.log('Room is full');
      throw new Error('Room is full');
    }

    // Check if room is private and not using join code
    if (roomData.isPrivate === true) {
      console.log('Attempted to join private room without code');
      throw new Error('This is a private room. Please use the join code to enter.');
    }
    
    // Check if room is active
    if (roomData.status !== 'active') {
      console.log('Room is not active');
      throw new Error('This room is not currently active');
    }
    
    console.log('Adding user to room participants');
    // Update the room document with the new participant and timestamp
    await updateDoc(roomRef, {
      participants: arrayUnion(userId),
      updatedAt: serverTimestamp()
    });
    
    console.log('Successfully joined room');
  } catch (error) {
    console.error('Error joining study room:', error);
    throw error;
  }
};

// Leave a study room
const leaveStudyRoom = async (roomId: string, userId: string): Promise<void> => {
  try {
    console.log('Attempting to leave room:', roomId, 'for user:', userId);
    const roomRef = doc(db, 'studyRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      console.error('Room not found:', roomId);
      throw new Error('Study room not found');
    }
    
    const roomData = roomDoc.data();
    
    // Check if user is actually in the room
    if (!roomData.participants.includes(userId)) {
      console.error('User not in room:', userId);
      throw new Error('You are not a participant in this room');
    }
    
    // Check if user is the creator (should be handled in UI but double-check)
    if (roomData.createdBy === userId) {
      console.error('Creator attempting to leave room:', userId);
      throw new Error('As the room creator, you cannot leave. You must close or delete the room instead.');
    }
    
    console.log('Removing user from room participants');
    // Update the room document to remove the participant
    await updateDoc(roomRef, {
      participants: arrayRemove(userId),
      updatedAt: serverTimestamp()
    });
    
    console.log('Successfully left room');
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
const deleteAllStudyRooms = async (userId: string): Promise<void> => {
  try {
    console.log('Starting to delete all rooms for user:', userId);
    const studyRoomsRef = collection(db, 'studyRooms');
    
    // First, get all rooms where user is creator or host
    const q = query(
      studyRoomsRef,
      where('createdBy', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} rooms to delete`);
    
    const deletePromises = querySnapshot.docs.map(async (doc) => {
      console.log('Deleting room:', doc.id);
      await deleteDoc(doc.ref);
    });
    
    await Promise.all(deletePromises);
    console.log('Finished deleting rooms');
  } catch (error) {
    console.error('Error deleting study rooms:', error);
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

export const studyRoomService = {
  async getRoomContent(roomId: string) {
    try {
      console.log('Getting room content for roomId:', roomId);
      
      // Get chat messages
      const messagesRef = collection(db, 'studyRooms', roomId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          sender: data.userName || 'User',
          content: data.text || '',
          timestamp: data.createdAt
        };
      });
      console.log(`Retrieved ${messages.length} messages`);

      // Get collaborative notes
      const notesRef = collection(db, 'studyRooms', roomId, 'notes');
      const notesQuery = query(notesRef, orderBy('createdAt', 'desc'));
      const notesSnapshot = await getDocs(notesQuery);
      let notes = [];
      
      if (!notesSnapshot.empty) {
        notes = notesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            content: data.content || '',
            lastUpdatedBy: data.lastUpdatedBy || data.createdBy,
            lastUpdatedAt: data.updatedAt || data.createdAt
          };
        });
        console.log(`Retrieved ${notes.length} notes`);
      } else {
        console.log('No notes found');
        
        // Try the old path as fallback (tools/notes)
        const oldNotesRef = doc(db, 'studyRooms', roomId, 'tools', 'notes');
        const oldNotesSnapshot = await getDoc(oldNotesRef);
        
        if (oldNotesSnapshot.exists()) {
          const noteData = oldNotesSnapshot.data();
          notes = [{
            id: 'notes',
            content: noteData.content || '',
            lastUpdatedBy: noteData.lastUpdatedBy,
            lastUpdatedAt: noteData.lastUpdatedAt
          }];
          console.log('Retrieved notes from old path');
        } else {
          console.log('No notes document found in old path either');
        }
      }

      // Get room details for context
      const roomRef = doc(db, 'studyRooms', roomId);
      const roomSnapshot = await getDoc(roomRef);
      let topic = '';
      let subject = '';
      
      if (roomSnapshot.exists()) {
        const roomData = roomSnapshot.data();
        topic = roomData.name || '';
        subject = roomData.subject || roomData.category || '';
        console.log('Retrieved room details:', { topic, subject });
      } else {
        console.log('Room document not found');
      }

      return {
        messages,
        notes,
        topic,
        subject
      };
    } catch (error) {
      console.error('Error fetching room content:', error);
      throw error;
    }
  }
}; 