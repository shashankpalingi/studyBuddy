import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import { 
  getPublicStudyRooms, 
  getJoinedRooms,
  searchStudyRooms,
  joinStudyRoom,
  joinStudyRoomByCode,
  getRoomsCreatedByUser
} from '../services/studyRoomService';
import { StudyRoom } from '../types/studyRoom';
import './StudyRooms.css';

const StudyRooms: React.FC = () => {
  const { currentUser, userProfile, authInitialized } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'explore' | 'joined'>('explore');
  const [publicRooms, setPublicRooms] = useState<StudyRoom[]>([]);
  const [joinedRooms, setJoinedRooms] = useState<StudyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // Fetch public study rooms
  const fetchPublicRooms = async () => {
    if (!authInitialized || !currentUser) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      const rooms = await getPublicStudyRooms();
      setPublicRooms(rooms);
    } catch (error: any) {
      console.error('Error fetching public rooms:', error);
      setError(error.message || 'Failed to load study rooms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch rooms created by the current user (for "My Rooms" tab)
  const fetchMyCreatedRooms = async () => {
    if (!authInitialized || !currentUser) return;
    
    try {
      setIsLoading(true);
      setError('');
      const rooms = await getRoomsCreatedByUser(currentUser.uid);
      setJoinedRooms(rooms);
    } catch (error) {
      console.error('Error fetching user-created rooms:', error);
      setError('Failed to load your created study rooms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Search rooms
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchPublicRooms();
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      const results = await searchStudyRooms(searchTerm);
      setPublicRooms(results);
    } catch (error) {
      console.error('Error searching rooms:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Join room
  const handleJoinRoom = async (roomId: string, isPrivate: boolean) => {
    if (!currentUser) return;
    
    try {
      setIsJoining(true);
      setError('');

      if (isPrivate) {
        setError('This is a private room. Please use the join code to enter.');
        return;
      }
      
      await joinStudyRoom(roomId, currentUser.uid);
      
      // Refresh rooms lists
      await fetchPublicRooms();
      if (activeTab === 'joined') {
        await fetchMyCreatedRooms();
      }
      
      // Navigate to the room
      navigate(`/study-room/${roomId}`);
    } catch (error: any) {
      console.error('Error joining room:', error);
      setError(error.message || 'Failed to join study room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };
  
  // Join room by code
  const handleJoinByCode = async () => {
    if (!currentUser || !joinCode.trim()) return;
    
    try {
      setIsJoining(true);
      setError('');
      
      const room = await joinStudyRoomByCode(joinCode, currentUser.uid);
      
      // Clear join code field
      setJoinCode('');
      
      // Refresh room lists
      await fetchMyCreatedRooms();
      
      // Navigate to the room
      navigate(`/study-room/${room.id}`);
    } catch (error: any) {
      console.error('Error joining room by code:', error);
      setError(error.message || 'Failed to join study room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };
  
  useEffect(() => {
    if (!authInitialized || !currentUser) return;
    
    if (activeTab === 'explore') {
      fetchPublicRooms();
    } else {
      fetchMyCreatedRooms();
    }
  }, [activeTab, currentUser, authInitialized]);
  
  const handleCreateRoom = () => {
    navigate('/create-room');
  };
  
  // Render a study room card
  const renderRoomCard = (room: StudyRoom) => {
    const isUserInRoom = currentUser && room.participants.includes(currentUser.uid);
    const isFull = room.participants.length >= room.maxParticipants;
    
    return (
      <div key={room.id} className="study-room-card">
        <div className="room-header">
          <h3>{room.name}</h3>
          {room.isPrivate && <span className="private-badge">Private</span>}
        </div>
        
        <p className="room-subject">{room.subject}</p>
        <p className="room-description">{room.description}</p>
        
        <div className="room-details">
          <div className="room-info">
            <span className="detail">
              <i className="fas fa-users"></i> {room.participants.length}/{room.maxParticipants}
            </span>
            <span className="detail">
              <i className="fas fa-user"></i> {room.creatorName}
            </span>
          </div>
          
          <div className="room-tags">
            {room.tags?.slice(0, 3).map((tag, index) => (
              <span key={index} className="room-tag">{tag}</span>
            ))}
          </div>
        </div>
        
        <div className="room-actions">
          {isUserInRoom ? (
            <button 
              className="action-btn enter-btn"
              onClick={() => navigate(`/study-room/${room.id}`)}
            >
              Enter Room
            </button>
          ) : (
            <button 
              className="action-btn join-btn"
              onClick={() => handleJoinRoom(room.id, room.isPrivate)}
              disabled={isJoining || isFull}
            >
              {isFull ? 'Room Full' : (isJoining ? 'Joining...' : 'Join')}
            </button>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="study-rooms-container">
      <AppHeader />
      
      <div className="study-rooms-content">
        <div className="study-rooms-header">
          <h1>Study Rooms</h1>
          <div className="header-actions">
            <button 
              className="create-room-btn"
              onClick={handleCreateRoom}
            >
              Create Room
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="join-options">
          <div className="join-by-code">
            <input 
              type="text" 
              placeholder="Enter room code" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button 
              onClick={handleJoinByCode}
              disabled={!joinCode.trim() || isJoining}
            >
              {isJoining ? 'Joining...' : 'Join by Code'}
            </button>
          </div>
          
          <div className="search-rooms">
            <input 
              type="text" 
              placeholder="Search rooms by subject, name, or tag" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
        </div>
        
        <div className="rooms-tabs">
          <button 
            className={`tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            Explore Rooms
          </button>
          <button 
            className={`tab-btn ${activeTab === 'joined' ? 'active' : ''}`}
            onClick={() => setActiveTab('joined')}
          >
            My Rooms
          </button>
        </div>

        <div className="rooms-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading study rooms...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={activeTab === 'explore' ? fetchPublicRooms : fetchMyCreatedRooms}>Try Again</button>
            </div>
          ) : activeTab === 'explore' ? (
            publicRooms.length > 0 ? (
              <div className="rooms-grid">
                {publicRooms.map(room => renderRoomCard(room))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No public study rooms available. Be the first to create one!</p>
                <button onClick={handleCreateRoom}>Create Room</button>
              </div>
            )
          ) : (
            joinedRooms.length > 0 ? (
              <div className="rooms-grid">
                {joinedRooms.map(room => renderRoomCard(room))}
              </div>
            ) : (
              <div className="empty-state">
                <p>You haven't created any study rooms yet.</p>
                <button onClick={handleCreateRoom}>Create Room</button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyRooms; 