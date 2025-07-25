import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import { 
  getPublicStudyRooms, 
  getJoinedRooms,
  searchStudyRooms,
  joinStudyRoom,
  joinStudyRoomByCode,
  getRoomsCreatedByUser,
} from '../services/studyRoomService';
import { StudyRoom } from '../types/studyRoom';
import { motion } from 'framer-motion';
import { Search, Plus, Users, Book, User } from 'lucide-react';
import { toast } from '../components/ui/use-toast';
import './StudyRooms.css';

const StudyRooms: React.FC = () => {
  const { currentUser, userProfile, authInitialized } = useAuth();
  const navigate = useNavigate();
  
  // States for different room types and UI
  const [activeTab, setActiveTab] = useState<'explore' | 'joined' | 'created'>('explore');
  const [publicRooms, setPublicRooms] = useState<StudyRoom[]>([]);
  const [joinedRooms, setJoinedRooms] = useState<StudyRoom[]>([]);
  const [createdRooms, setCreatedRooms] = useState<StudyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // Fetch all room types
  const fetchRooms = async () => {
    if (!authInitialized) {
      console.log('Auth not initialized yet, waiting...');
      return;
    }
    
    if (!currentUser) {
      console.log('No current user, cannot fetch rooms');
      return;
    }
    
    try {
      console.log('Starting to fetch rooms...');
      setIsLoading(true);
      setError('');
      
      // Fetch all room types in parallel
      const [publicRoomsData, joinedRoomsData, createdRoomsData] = await Promise.all([
        getPublicStudyRooms(),
        getJoinedRooms(currentUser.uid),
        getRoomsCreatedByUser(currentUser.uid)
      ]);
      
      setPublicRooms(publicRoomsData);
      setJoinedRooms(joinedRoomsData);
      setCreatedRooms(createdRoomsData);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      setError(error.message || 'Failed to load study rooms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Search rooms
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchRooms();
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      const results = await searchStudyRooms(searchTerm);
      
      // Update only the active tab's data
      if (activeTab === 'explore') {
        setPublicRooms(results);
      } else if (activeTab === 'joined' && currentUser) {
        setJoinedRooms(results.filter(room => room.participants.includes(currentUser.uid)));
      } else if (activeTab === 'created' && currentUser) {
        setCreatedRooms(results.filter(room => room.createdBy === currentUser.uid));
      }
    } catch (error) {
      console.error('Error searching rooms:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Join room
  const handleJoinRoom = async (roomId: string, isPrivate: boolean) => {
    if (!currentUser) {
      setError('Please log in to join a room');
      toast({
        title: 'Error',
        description: 'Please log in to join a room',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsJoining(true);
      setError('');

      if (isPrivate) {
        setError('This is a private room. Please use the join code to enter.');
        toast({
          title: 'Private Room',
          description: 'This is a private room. Please use the join code to enter.',
          variant: 'destructive',
        });
        return;
      }
      
      await joinStudyRoom(roomId, currentUser.uid);
      
      // Redirect to the room
      navigate(`/study-room/${roomId}`);
    } catch (error: any) {
      console.error('Error joining room:', error);
      setError(error.message || 'Failed to join room. Please try again.');
      toast({
        title: 'Error',
        description: error.message || 'Failed to join room. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };
  
  // Join room by code
  const handleJoinByCode = async () => {
    if (!currentUser) {
      setError('Please log in to join a room');
      toast({
        title: 'Error',
        description: 'Please log in to join a room',
        variant: 'destructive',
      });
      return;
    }
    
    if (!joinCode.trim()) {
      setError('Please enter a join code');
      toast({
        title: 'Error',
        description: 'Please enter a join code',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsJoining(true);
      setError('');
      
      const roomId = await joinStudyRoomByCode(joinCode, currentUser.uid);
      
      // Navigate to the room
      navigate(`/study-room/${roomId}`);
    } catch (error: any) {
      console.error('Error joining by code:', error);
      setError(error.message || 'Failed to join room. Invalid code or room is closed.');
      toast({
        title: 'Error',
        description: error.message || 'Invalid code or room is closed.',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Create room
  const handleCreateRoom = () => {
    navigate('/create-room');
  };
  
  // Initial fetch on mount and when auth changes
  useEffect(() => {
    if (currentUser && authInitialized) {
      fetchRooms();
    } else if (authInitialized && !currentUser) {
      // If auth initialized but no user, redirect to login
      navigate('/auth');
    }
  }, [currentUser, authInitialized]);

  const handleSpotlight = useCallback((event: MouseEvent, element: HTMLElement) => {
    const { clientX, clientY } = event;
    const { left, top, width, height } = element.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    
    element.style.setProperty('--x', x.toString());
    element.style.setProperty('--y', y.toString());
    element.style.setProperty('--xp', (x / width).toString());
    element.style.setProperty('--yp', (y / height).toString());
    element.style.setProperty('--bg-spot-opacity', '0.1');
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll('.study-room-card, .study-hero, .option-card');
    
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      handleSpotlight(e, target);
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.style.setProperty('--bg-spot-opacity', '0');
    };

    cards.forEach(card => {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      cards.forEach(card => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [handleSpotlight, publicRooms, joinedRooms, createdRooms]);
  
  // Room card component
  const RoomCard = ({ room }: { room: StudyRoom }) => {
    const isUserParticipant = currentUser && room.participants.includes(currentUser.uid);
    const isRoomFull = room.participants.length >= room.maxParticipants;

    return (
      <div className="study-room-card" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="room-header">
          <h3 style={{ fontWeight: 700, color: '#1F2937' }}>{room.name}</h3>
          {room.isPrivate && <span className="private-badge" style={{ fontWeight: 600 }}>Private</span>}
        </div>
        <p className="room-subject" style={{ fontWeight: 600, color: '#4B5563' }}>{room.subject}</p>
        <p className="room-description" style={{ fontWeight: 500, color: '#4B5563' }}>{room.description}</p>
        <div className="room-details">
          <div className="room-info">
            <span className="detail" style={{ fontWeight: 500 }}>
              <Users size={14} /> {room.participants?.length || 1}/{room.maxParticipants}
            </span>
            <span className="detail" style={{ fontWeight: 500 }}>
              <User size={14} /> {room.creatorName}
            </span>
          </div>
          
          {room.tags && room.tags.length > 0 && (
            <div className="room-tags flex justify-center gap-2 pb-4">
              {room.tags.map((tag, index) => (
                <span key={index} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="room-actions">
          {isUserParticipant ? (
            <button
              className="action-btn enter-btn"
              onClick={() => navigate(`/study-room/${room.id}`)}
              style={{ fontWeight: 600 }}
            >
              Enter
            </button>
          ) : isRoomFull ? (
            <button
              className="action-btn disabled-btn"
              disabled
              style={{ fontWeight: 600 }}
            >
              Room Full
            </button>
          ) : (
            <button
              className="action-btn join-btn"
              onClick={() => handleJoinRoom(room.id, room.isPrivate)}
              disabled={isJoining}
              style={{ fontWeight: 600 }}
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          )}
        </div>
      </div>
    );
  };
  
  // Loading state component
  const RoomLoadingState = () => {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading study rooms...</p>
      </div>
    );
  };
  
  // Rooms grid component
  const RoomsGrid = ({ rooms, emptyMessage }: { rooms: StudyRoom[], emptyMessage: string }) => {
    if (rooms.length === 0) {
      return (
        <div className="loading-state">
          <p>{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="rooms-grid">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    );
  };

  return (
    <div className="study-rooms-container">
      <AppHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        handleJoinByCode={handleJoinByCode}
        isJoining={isJoining}
      />
      
      <div className="study-rooms-content">
        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="error-message"
          >
            {error}
          </motion.div>
        )}

        {/* Hero Section */}
        <motion.div 
          className="study-hero"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Add floating 3D icons */}
          <div className="study-hero-icons">
            <div className="study-hero-icon">
              <Book size={20} color="#5D3FD3" />
            </div>
            <div className="study-hero-icon">
              <Users size={20} color="#00A9FF" />
            </div>
            <div className="study-hero-icon">
              <Search size={20} color="#00C07F" />
            </div>
            <div className="study-hero-icon">
              <Plus size={20} color="#FF6B6B" />
            </div>
          </div>
          
          {/* Particle effect container */}
          <div className="particles"></div>
          
          <h1>Find Your Perfect Study Space</h1>
          <p>Join a room or create your own to study with peers</p>
          <button
            onClick={handleCreateRoom}
            className="create-room-btn"
          >
            <Plus size={18} /> Create a Room
          </button>
        </motion.div>
        
        {/* Room Tabs */}
        <div className="rooms-tabs">
          <button
            className={`tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            <Book className="w-4 h-4 mr-2 inline" />
            Explore
          </button>
          <button
            className={`tab-btn ${activeTab === 'joined' ? 'active' : ''}`}
            onClick={() => setActiveTab('joined')}
          >
            <Users className="w-4 h-4 mr-2 inline" />
            Joined
          </button>
          <button
            className={`tab-btn ${activeTab === 'created' ? 'active' : ''}`}
            onClick={() => setActiveTab('created')}
          >
            <User className="w-4 h-4 mr-2 inline" />
            Created
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <RoomLoadingState />
        ) : (
          <>
            {/* Active tab content */}
            {activeTab === 'explore' && (
              <RoomsGrid rooms={publicRooms} emptyMessage="No public rooms found" />
            )}
            
            {activeTab === 'joined' && (
              <RoomsGrid rooms={joinedRooms} emptyMessage="You haven't joined any rooms yet" />
            )}
            
            {activeTab === 'created' && (
              <RoomsGrid rooms={createdRooms} emptyMessage="You haven't created any rooms yet" />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudyRooms; 