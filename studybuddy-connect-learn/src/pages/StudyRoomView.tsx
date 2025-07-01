import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import ChatRoom from '../components/ChatRoom';
import StudyTimer from '../components/StudyTimer';
import CollaborativeNotes from '../components/CollaborativeNotes';
import FileSharing from '../components/FileSharing';
import TaskManager from '../components/TaskManager';
import PollSystem from '../components/PollSystem';
import Whiteboard from '../components/Whiteboard';
import { 
  getStudyRoomById as getStudyRoom, 
  getRoomParticipants,
  leaveStudyRoom, 
  updateStudyRoom,
  StudyRoomParticipant 
} from '../services/studyRoomService';
import { StudyRoom } from '../types/studyRoom';
import './StudyRoomView.css';

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
  const [activeToolTab, setActiveToolTab] = useState<'chat' | 'whiteboard' | 'notes' | 'files' | 'tasks' | 'polls'>('chat');
  
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
        
        // If the room is private and the user is not a participant, deny access
        if (roomData.isPrivate && !roomData.participants.includes(currentUser.uid)) {
          setError('This is a private room. Please join using the correct join code from the Study Rooms page.');
          navigate('/study-rooms', { state: { error: 'This is a private room. Please join using the correct join code.' } });
          return;
        }
        
        // Check if user is a participant and add them if not
        if (!roomData.participants.includes(currentUser.uid)) {
          console.log(`User ${currentUser.uid} not in participants for room ${roomId}. Adding...`);
          await updateStudyRoom(roomId, {
            participants: [...roomData.participants, currentUser.uid]
          });
          // Re-fetch room data to get updated participant list
          const updatedRoomData = await getStudyRoom(roomId);
          if (updatedRoomData) {
            setRoom(updatedRoomData);
          }
        }
        
        setRoom(roomData);
        
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
  
  const isCreator = currentUser && room && room.createdBy === currentUser.uid;
  
  if (isLoading) {
    return (
      <div className="study-room-view-container">
        <AppHeader />
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
        <AppHeader />
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
  
  return (
    <div className="study-room-view-container">
      <AppHeader />
      
      <div className="study-room-content">
        <div className="room-header">
          <div>
            <h1>{room.name}</h1>
            <p className="room-subject">{room.subject}</p>
          </div>
          
          <div className="room-actions">
            {isCreator ? (
              <button 
                className="close-btn"
                onClick={handleCloseRoom}
                disabled={isClosing}
              >
                {isClosing ? 'Closing...' : 'Close Room'}
              </button>
            ) : (
              <button 
                className="leave-btn"
                onClick={handleLeaveRoom}
                disabled={isLeaving}
              >
                {isLeaving ? 'Leaving...' : 'Leave Room'}
              </button>
            )}
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="room-body">
          <div className="room-main">
            <div className="room-info-card">
              <h2>About this Study Room</h2>
              <p className="room-description">{room.description || 'No description provided.'}</p>
              
              <div className="room-meta">
                <div className="meta-item">
                  <h3>Status</h3>
                  <p>{room.status === 'active' ? 'Active' : 'Closed'}</p>
                </div>
                
                <div className="meta-item">
                  <h3>Visibility</h3>
                  <p>{room.isPrivate ? 'Private' : 'Public'}</p>
                </div>
                
                {room.isPrivate && room.joinCode && (
                  <div className="meta-item">
                    <h3>Join Code</h3>
                    <p className="join-code">{room.joinCode}</p>
                  </div>
                )}
                
                <div className="meta-item">
                  <h3>Created By</h3>
                  <p>{room.creatorName}</p>
                </div>
              </div>
              
              {room.tags && room.tags.length > 0 && (
                <div className="room-tags">
                  <h3>Tags</h3>
                  <div className="tags-list">
                    {room.tags.map((tag, index) => (
                      <span key={index} className="room-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="study-tools">
              <h2>Study Tools</h2>
              
              <div className="tools-container">
                <div className="tools-tabs">
                  <button 
                    className={`tool-tab ${activeToolTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveToolTab('chat')}
                  >
                    Chat
                  </button>
                  <button 
                    className={`tool-tab ${activeToolTab === 'notes' ? 'active' : ''}`}
                    onClick={() => setActiveToolTab('notes')}
                  >
                    Notes
                  </button>
                  <button 
                    className={`tool-tab ${activeToolTab === 'whiteboard' ? 'active' : ''}`}
                    onClick={() => setActiveToolTab('whiteboard')}
                  >
                    Whiteboard
                  </button>
                  <button 
                    className={`tool-tab ${activeToolTab === 'files' ? 'active' : ''}`}
                    onClick={() => setActiveToolTab('files')}
                  >
                    Files
                  </button>
                  <button 
                    className={`tool-tab ${activeToolTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveToolTab('tasks')}
                  >
                    Tasks
                  </button>
                  <button 
                    className={`tool-tab ${activeToolTab === 'polls' ? 'active' : ''}`}
                    onClick={() => setActiveToolTab('polls')}
                  >
                    Polls
                  </button>
                </div>
                
                <div className="tool-content">
                  {activeToolTab === 'chat' && <ChatRoom roomId={roomId!} />}
                  {activeToolTab === 'notes' && <CollaborativeNotes roomId={roomId!} />}
                  {activeToolTab === 'whiteboard' && <Whiteboard roomId={roomId!} />}
                  {activeToolTab === 'files' && <FileSharing roomId={roomId!} />}
                  {activeToolTab === 'tasks' && <TaskManager roomId={roomId!} />}
                  {activeToolTab === 'polls' && <PollSystem roomId={roomId!} />}
                </div>
              </div>
            </div>
          </div>
          
          <div className="room-sidebar">
            <div className="participants-panel">
              <h2>Participants ({participants.length}/{room.maxParticipants})</h2>
              <div className="participants-list">
                {participants.map((participant) => (
                  <div key={participant.userId} className="participant-item">
                    <div className="participant-avatar">
                      {participant.photoURL ? (
                        <img src={participant.photoURL} alt={participant.displayName} />
                      ) : (
                        <div className="default-avatar">
                          {participant.displayName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="participant-info">
                      <p className="participant-name">
                        {participant.displayName}
                        {participant.role === 'host' && (
                          <span className="host-badge">Host</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Study Timer */}
            <StudyTimer roomId={roomId!} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyRoomView; 