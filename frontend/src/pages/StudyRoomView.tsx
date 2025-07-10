import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChatRoom from '../components/ChatRoom';
import StudyTimer from '../components/StudyTimer';
import CollaborativeNotes from '../components/CollaborativeNotes';
import FileSharing from '../components/FileSharing';
import TaskManager from '../components/TaskManager';
import PollSystem from '../components/PollSystem';
import Whiteboard from '../components/Whiteboard';
import YoutubeWatchTogether from '../components/YoutubeWatchTogether/YoutubeWatchTogether';

import { 
  getStudyRoomById as getStudyRoom, 
  getRoomParticipants,
  leaveStudyRoom, 
  updateStudyRoom,
  deleteStudyRoom,
  StudyRoomParticipant 
} from '../services/studyRoomService';
import { StudyRoom } from '../types/studyRoom';
import './StudyRoomView.css';


type Feature = 'notes' | 'files' | 'timer' | 'tasks' | 'polls' | 'whiteboard' | 'youtube' | 'chat';

const StudyRoomView: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [participants, setParticipants] = useState<StudyRoomParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeFeature, setActiveFeature] = useState<Feature>('notes');
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [messages, setMessages] = useState<Array<{
    content: string;
    sender: string;
    timestamp: Date;
  }>>([]);
  const [studyMaterials, setStudyMaterials] = useState<Array<{
    name: string;
    content: string;
    type: string;
  }>>([]);

  
  useEffect(() => {
    const fetchRoomData = async () => {
      if (!roomId || !currentUser) return;
      
      try {
        setIsLoading(true);
        setError('');
        
        // Fetch room details
        const roomData = await getStudyRoom(roomId);
        if (!roomData) {
          setError('Study room not found');
          return;
        }
        
        // Check if user is a participant and add them if not
        if (!roomData.participants.includes(currentUser.uid)) {
          console.log(`User ${currentUser.uid} not in participants for room ${roomId}. Adding...`);
          
          // If the room is private, check if they came with correct join code before adding
          if (roomData.isPrivate) {
            // For now, we'll allow them to see the "You don't have access" error
            // In a real app, you might want to redirect them to a page where they can enter a join code
            setError('This is a private room. Please join using the correct join code from the Study Rooms page.');
            setIsLoading(false);
            return;
          }
          
          await updateStudyRoom(roomId, {
            participants: [...roomData.participants, currentUser.uid]
          });
          
          // Re-fetch room data to get updated participant list
          const updatedRoomData = await getStudyRoom(roomId);
          if (updatedRoomData) {
            setRoom(updatedRoomData);
          }
        } else {
          setRoom(roomData);
        }
        
        // Fetch room participants
        const participantsData = await getRoomParticipants(roomId);
        setParticipants(participantsData);
      } catch (error) {
        console.error('Error fetching room data:', error);
        setError('Failed to load study room. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoomData();
  }, [roomId, currentUser]);
  
  const handleLeaveRoom = async () => {
    if (!roomId || !currentUser || !room) return;
    
    // Cannot leave if you're the creator
    if (room.createdBy === currentUser.uid) {
      setError('As the room creator, you cannot leave. You must close the room instead.');
      return;
    }
    
    try {
      setIsLeaving(true);
      setError('');
      
      await leaveStudyRoom(roomId, currentUser.uid);
      
      // Navigate back to study rooms
      navigate('/study-rooms');
    } catch (error: any) {
      console.error('Error leaving room:', error);
      setError(error.message || 'Failed to leave study room. Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };
  
  const handleCloseRoom = async () => {
    if (!roomId || !currentUser || !room) return;
    
    // Only creator can close room
    if (room.createdBy !== currentUser.uid) {
      setError('Only the room creator can close the room.');
      return;
    }
    
    try {
      setIsClosing(true);
      setError('');
      
      await updateStudyRoom(roomId, { status: 'closed' });
      
      // Navigate back to study rooms
      navigate('/study-rooms');
    } catch (error: any) {
      console.error('Error closing room:', error);
      setError(error.message || 'Failed to close study room. Please try again.');
    } finally {
      setIsClosing(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomId || !currentUser || !room) return;
    
    // Only creator can delete room
    if (room.createdBy !== currentUser.uid) {
      setError('Only the room creator can delete the room.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      try {
        setIsDeleting(true);
        setError('');
        
        await deleteStudyRoom(roomId);
        
        // Navigate back to study rooms
        navigate('/study-rooms');
      } catch (error: any) {
        console.error('Error deleting room:', error);
        setError(error.message || 'Failed to delete study room. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const isCreator = currentUser && room && room.createdBy === currentUser.uid;
  
  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };
  
  const renderFeatureContent = () => {
    
    switch (activeFeature) {
      case 'notes':
        return <CollaborativeNotes roomId={roomId || ''} />;
      case 'chat':
        return <ChatRoom roomId={roomId || ''} />;
      case 'files':
        return <FileSharing roomId={roomId || ''} />;
      case 'timer':
        return <StudyTimer roomId={roomId || ''} />;
      case 'tasks':
        return <TaskManager roomId={roomId || ''} />;
      case 'polls':
        return <PollSystem roomId={roomId || ''} />;
      case 'whiteboard':
        return <Whiteboard roomId={roomId || ''} />;
      case 'youtube':
        return <YoutubeWatchTogether roomId={roomId || ''} />;
      default:
        return <CollaborativeNotes roomId={roomId || ''} />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="study-room-view-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading study room...</p>
        </div>
      </div>
    );
  }
  
  if (error || !room) {
    return (
      <div className="study-room-view-container">
        <div className="error-state">
          <h2>Oops!</h2>
          <p>{error || 'Something went wrong'}</p>
          <button 
            className="back-btn"
            onClick={() => navigate('/study-rooms')}
          >
            Back to Study Rooms
          </button>
        </div>
      </div>
    );
  }
  
  // Simplified inline video call handling
  // No separate fullscreen mode needed, all handled through renderFeatureContent
  
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="flex h-screen study-view-container">
        {/* Sidebar with minimize button */}
        <div className={`sidebar ${sidebarMinimized ? 'minimized' : ''}`}>
          <div className="sidebar-header">
            <h2 className={sidebarMinimized ? 'hidden' : 'text-xl font-bold mb-4'}>Study Tools</h2>
            <button className="minimize-btn" onClick={toggleSidebar}>
              {sidebarMinimized ? '→' : '←'}
            </button>
          </div>

          <div className="sidebar-nav">
            {/* All sidebar buttons remain the same */}
            <button
              onClick={() => setActiveFeature('notes')}
              className={`sidebar-btn ${activeFeature === 'notes' ? 'active' : ''}`}
              title="Collaborative Notes"
            >
              <span className="icon">📝</span>
              {!sidebarMinimized && <span className="label">Collaborative Notes</span>}
            </button>
            
            <button
              onClick={() => setActiveFeature('chat')}
              className={`sidebar-btn ${activeFeature === 'chat' ? 'active' : ''}`}
              title="Chat Room"
            >
              <span className="icon">💬</span>
              {!sidebarMinimized && <span className="label">Chat Room</span>}
            </button>
            
            <button
              onClick={() => setActiveFeature('files')}
              className={`sidebar-btn ${activeFeature === 'files' ? 'active' : ''}`}
              title="File Sharing"
            >
              <span className="icon">📂</span>
              {!sidebarMinimized && <span className="label">File Sharing</span>}
            </button>
            
            <button
              onClick={() => setActiveFeature('timer')}
              className={`sidebar-btn ${activeFeature === 'timer' ? 'active' : ''}`}
              title="Study Timer"
            >
              <span className="icon">⏱️</span>
              {!sidebarMinimized && <span className="label">Study Timer</span>}
            </button>
            
            <button
              onClick={() => setActiveFeature('tasks')}
              className={`sidebar-btn ${activeFeature === 'tasks' ? 'active' : ''}`}
              title="Task Manager"
            >
              <span className="icon">✅</span>
              {!sidebarMinimized && <span className="label">Task Manager</span>}
            </button>
            
            <button
              onClick={() => setActiveFeature('polls')}
              className={`sidebar-btn ${activeFeature === 'polls' ? 'active' : ''}`}
              title="Poll System"
            >
              <span className="icon">📊</span>
              {!sidebarMinimized && <span className="label">Poll System</span>}
            </button>
            
            <button
              onClick={() => setActiveFeature('whiteboard')}
              className={`sidebar-btn ${activeFeature === 'whiteboard' ? 'active' : ''}`}
              title="Whiteboard"
            >
              <span className="icon">🎨</span>
              {!sidebarMinimized && <span className="label">Whiteboard</span>}
            </button>
            
            <button
              onClick={() => setActiveFeature('youtube')}
              className={`sidebar-btn ${activeFeature === 'youtube' ? 'active' : ''}`}
              title="YouTube Watch Together"
            >
              <span className="icon">📺</span>
              {!sidebarMinimized && <span className="label">Watch Together</span>}
            </button>
          </div>

          <div className={`sidebar-footer ${sidebarMinimized ? 'minimized' : ''}`}>
            {isCreator ? (
              <button
                onClick={handleDeleteRoom}
                className="sidebar-action-btn delete-btn"
                disabled={isDeleting}
                title="Delete Room"
              >
                <span className="icon">🗑️</span>
                {!sidebarMinimized && <span>{isDeleting ? 'Deleting...' : 'Delete Room'}</span>}
              </button>
            ) : (
              <button
                onClick={handleLeaveRoom}
                className="sidebar-action-btn leave-btn"
                disabled={isLeaving}
                title="Leave Room"
              >
                <span className="icon">👋</span>
                {!sidebarMinimized && <span>{isLeaving ? 'Leaving...' : 'Leave Room'}</span>}
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content-area">
          {renderFeatureContent()}
        </div>
      </div>
    </div>
  );
};

export default StudyRoomView; 