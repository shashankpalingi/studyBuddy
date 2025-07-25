import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppSidebar from './AppHeader';
import { 
  getPublicStudyRooms, 
  getJoinedRooms,
  searchStudyRooms,
  joinStudyRoom,
  joinStudyRoomByCode,
  getRoomsCreatedByUser
} from '../services/studyRoomService';
import { StudyRoom } from '../types/studyRoom';
import { motion, AnimatePresence } from 'framer-motion';

const StudyRooms: React.FC = () => {
  const { currentUser, userProfile, authInitialized } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'explore'>('explore');
  const [publicRooms, setPublicRooms] = useState<StudyRoom[]>([]);
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
      await fetchPublicRooms();
      
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
    
    fetchPublicRooms();
  }, [currentUser, authInitialized]);
  
  const handleCreateRoom = () => {
    navigate('/create-room');
  };
  
  // Updated renderRoomCard with modern styling and animations
  const renderRoomCard = (room: StudyRoom) => {
    const isUserInRoom = currentUser && room.participants.includes(currentUser.uid);
    const isFull = room.participants.length >= room.maxParticipants;
    
    return (
      <motion.div 
        key={room.id} 
        className="bg-gray-800 rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">{room.name}</h3>
            {room.isPrivate && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                Private
              </span>
            )}
          </div>
          
          <p className="text-gray-300 mb-2">{room.subject}</p>
          <p className="text-gray-400 text-sm mb-4">{room.description}</p>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.5 17c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2S8.62 15 10 15s2.5.895 2.5 2z"/>
                </svg>
                {room.participants.length}/{room.maxParticipants}
              </span>
              <span className="text-sm text-gray-400">
                Created by {room.creatorName}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mb-4 pb-4">
            {room.tags?.slice(0, 3).map((tag, index) => (
              <span 
                key={index} 
                className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="mt-4">
            {isUserInRoom ? (
              <button 
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300"
                onClick={() => navigate(`/study-room/${room.id}`)}
              >
                Enter Room
              </button>
            ) : (
              <button 
                className={`w-full py-2 rounded-lg transition-all duration-300 ${
                  isFull 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                onClick={() => handleJoinRoom(room.id, room.isPrivate)}
                disabled={isJoining || isFull}
              >
                {isFull ? 'Room Full' : (isJoining ? 'Joining...' : 'Join')}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <AppSidebar />
      
      <main className="flex-grow ml-64 p-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl font-bold">Study Rooms</h1>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300"
            onClick={handleCreateRoom}
          >
            Create Room
          </button>
        </motion.div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500 text-white p-4 rounded-lg mb-4"
          >
            {error}
          </motion.div>
        )}
        
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 p-4 rounded-lg"
          >
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Enter room code" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-grow bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={handleJoinByCode}
                disabled={!joinCode.trim() || isJoining}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors duration-300"
              >
                {isJoining ? 'Joining...' : 'Join by Code'}
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 p-4 rounded-lg"
          >
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Search rooms by subject, name, or tag" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-grow bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Search
              </button>
            </div>
          </motion.div>
        </div>

        <div className="rooms-content">
          <AnimatePresence>
            {isLoading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center h-64"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
              </motion.div>
            ) : error ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <p className="text-red-500 mb-4">{error}</p>
                <button 
                  onClick={fetchPublicRooms}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </motion.div>
            ) : activeTab === 'explore' ? (
              publicRooms.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {publicRooms.map(room => renderRoomCard(room))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 bg-gray-800 rounded-lg"
                >
                  <p className="text-gray-400 mb-4">No public study rooms available. Be the first to create one!</p>
                  <button 
                    onClick={handleCreateRoom}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Room
                  </button>
                </motion.div>
              )
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-gray-800 rounded-lg"
              >
                <p className="text-gray-400 mb-4">You haven't created any study rooms yet.</p>
                <button 
                  onClick={handleCreateRoom}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Room
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default StudyRooms; 