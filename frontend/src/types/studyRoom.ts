import { Timestamp } from 'firebase/firestore';

export interface StudyRoom {
  id: string;
  name: string;
  description: string;
  subject: string;
  createdBy: string; // User ID of creator
  creatorName: string; // Display name of creator
  hostId: string; // User ID of host (same as createdBy for now)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  maxParticipants: number;
  participants: string[]; // Array of user IDs
  tags: string[];
  isPrivate: boolean;
  joinCode: string | null; // For private rooms, null for public rooms
  status: 'active' | 'closed' | 'scheduled';
  scheduledFor?: Timestamp; // For scheduled sessions
}

export interface StudyRoomParticipant {
  userId: string;
  displayName: string;
  photoURL: string | null;
  joinedAt: Timestamp;
  role: 'host' | 'participant';
} 