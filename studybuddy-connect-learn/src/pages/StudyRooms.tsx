import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import AppHeader from '../components/AppHeader';
import { 
  getPublicStudyRooms, 
  getJoinedRooms,
  searchStudyRooms,
  joinStudyRoom,
  joinStudyRoomByCode,
  getRoomsCreatedByUser,
  deleteAllStudyRooms
} from '../services/studyRoomService';
import { StudyRoom } from '../types/studyRoom';
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, Variants } from 'framer-motion';
import { Search, Plus, Users, Book, Clock, Filter, Copy, BookOpen, User, Loader2 } from 'lucide-react';
import { gsap } from 'gsap';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';
import { toast } from '../components/ui/use-toast';

// Removed Spline import as it's causing errors
// import Spline from '@splinetool/react-spline';

// Removed lazy loaded Spline component
// const LazySpline = React.lazy(() => import('@splinetool/react-spline'));

const StudyRooms: React.FC = () => {
  const { currentUser, userProfile, authInitialized } = useAuth();
  const { isCollapsed } = useSidebar();
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  // Remove showSpline state as we're not using Spline anymore
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Animation for page entrance
  const pageVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { duration: 0.3 } 
    }
  };
  
  // Staggered children animation
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };

  // Floating animation effect for cards using GSAP
  useEffect(() => {
    const cards = document.querySelectorAll('.room-card');
    cards.forEach(card => {
      gsap.to(card, {
        y: '-10px',
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        delay: Math.random() * 2
      });
    });
    
    return () => {
      gsap.killTweensOf('.room-card');
    };
  }, [publicRooms, joinedRooms, createdRooms, activeTab]);
  
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
      
      console.log('Fetched rooms:', {
        public: publicRoomsData.length,
        joined: joinedRoomsData.length,
        created: createdRoomsData.length
      });
      
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
      
      console.log('Attempting to join room:', roomId);
      await joinStudyRoom(roomId, currentUser.uid);
      console.log('Successfully joined room');
      
      toast({
        title: 'Success',
        description: 'Successfully joined room',
        variant: 'default',
      });
      
      // Refresh rooms lists
      await fetchRooms();
      
      // Navigate to the room
      navigate(`/study-room/${roomId}`);
    } catch (error: any) {
      console.error('Error joining room:', error);
      // Show the error message from the service
      setError(error.message || 'Failed to join study room. Please try again.');
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to join study room',
        variant: 'destructive',
      });
      
      // If the error indicates we need to refresh the room list, do so
      if (error.message?.includes('full') || error.message?.includes('already in')) {
        await fetchRooms();
      }
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
      await fetchRooms();
      
      // Navigate to the room
      navigate(`/study-room/${room.id}`);
    } catch (error: any) {
      console.error('Error joining room by code:', error);
      setError(error.message || 'Failed to join study room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };
  
  // Copy room code to clipboard
  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // Could add a toast notification here
  };
  
  // Effect to fetch rooms when auth state changes
  useEffect(() => {
    console.log('Auth state effect triggered:', { authInitialized, currentUser: currentUser?.uid });
    if (authInitialized && currentUser) {
      fetchRooms();
    }
  }, [currentUser, authInitialized]);
  
  const handleCreateRoom = () => {
    navigate('/create-room');
  };
  
  // Temporary admin function to delete all rooms
  const handleDeleteAllRooms = async () => {
    if (!currentUser) {
      setError('Please log in to delete rooms');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await deleteAllStudyRooms(currentUser.uid);
      console.log('Rooms deleted successfully');
      await fetchRooms(); // Refresh the room list
      toast({
        title: 'Success',
        description: 'Your rooms have been deleted',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Error deleting rooms:', error);
      setError(error.message || 'Failed to delete rooms');
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete rooms',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 3D tilt effect for room cards
  const RoomCard = ({ room }: { room: StudyRoom }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(cardRef, { once: false, amount: 0.3 });
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      
      x.set(mouseX);
      y.set(mouseY);
    };
    
    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };
    
    const isUserInRoom = currentUser && room.participants.includes(currentUser.uid);
    const isFull = room.participants.length >= room.maxParticipants;
    const isCreator = currentUser && room.createdBy === currentUser.uid;
    
    return (
      <motion.div 
        ref={cardRef}
        className="room-card perspective-1000"
        style={{ 
          opacity: isInView ? 1 : 0,
          transform: isInView ? "none" : "translateY(50px)",
          transition: "all 0.9s cubic-bezier(0.17, 0.55, 0.55, 1) 0.2s"
        }}
        whileHover={{ scale: 1.03 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div 
          style={{ 
            rotateX, 
            rotateY,
            transformStyle: "preserve-3d"
          }}
          transition={{ type: "spring", damping: 15 }}
        >
          <Card className="bg-white border border-gray-200 shadow-lg overflow-hidden h-full w-full">
            <CardHeader className="relative pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-gray-900">{room.name}</CardTitle>
                {room.isPrivate && (
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                    Private
                  </span>
                )}
              </div>
              <CardDescription className="text-gray-600">
                <span className="flex items-center">
                  <Book className="w-4 h-4 mr-1" /> {room.subject}
                </span>
              </CardDescription>
              
              {/* 3D floating badge */}
              {isCreator && (
                <motion.div 
                  className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full transform-gpu"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotateZ: [0, 10, 0], y: [0, -5, 0] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatType: "reverse"
                  }}
                >
                  Creator
                </motion.div>
              )}
            </CardHeader>
            
            <CardContent className="pb-2">
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{room.description}</p>
              
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    {room.participants.length}/{room.maxParticipants}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600 truncate max-w-24">
                    {room.creatorName}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {room.tags?.slice(0, 3).map((tag, index) => (
                  <motion.span 
                    key={index} 
                    className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                    whileHover={{ scale: 1.1, backgroundColor: "#E5E7EB" }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
              
              {isCreator && room.joinCode && (
                <div className="flex items-center justify-between bg-gray-50 rounded p-2 mb-3">
                  <span className="text-sm text-gray-600 font-mono">Code: {room.joinCode}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => copyRoomCode(room.joinCode)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <Copy className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              {isUserInRoom ? (
                <motion.button 
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
                  onClick={() => navigate(`/study-room/${room.id}`)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Enter Room
                </motion.button>
              ) : (
                <motion.button 
                  className={`w-full py-2 rounded-lg transition-all duration-300 ${
                    isFull 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                  onClick={() => handleJoinRoom(room.id, room.isPrivate)}
                  disabled={isJoining || isFull}
                  whileHover={!isFull ? { scale: 1.05 } : {}}
                  whileTap={!isFull ? { scale: 0.95 } : {}}
                >
                  {isFull ? 'Room Full' : (isJoining ? 'Joining...' : 'Join')}
                </motion.button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    );
  };
  
  // Loading skeleton for room cards
  const RoomLoadingState = () => {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div key={index} className="bg-white rounded-xl overflow-hidden h-64 animate-pulse border border-gray-200">
            <div className="p-6">
              <div className="h-6 bg-gray-100 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-6"></div>
              <div className="h-12 bg-gray-100 rounded w-full mb-6"></div>
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-100 rounded w-1/4"></div>
                <div className="h-6 bg-gray-100 rounded w-1/4"></div>
              </div>
              <div className="h-10 bg-gray-100 rounded w-full mt-auto"></div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Grid for displaying rooms with animations
  const RoomsGrid = ({ rooms, emptyMessage }: { rooms: StudyRoom[], emptyMessage: string }) => {
    const localNavigate = useNavigate();
    
    return (
      <>
        {rooms.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {rooms.map(room => (
              <motion.div key={room.id} variants={itemVariants}>
                <RoomCard room={room} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 bg-white backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 100 }}
            >
              <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
            </motion.div>
            <p className="text-gray-600 mb-6 text-center">{emptyMessage}</p>
            <motion.button 
              onClick={() => localNavigate('/create-room')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-600 transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create Room
              </div>
            </motion.button>
          </motion.div>
        )}
      </>
    );
  };
  
  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`min-h-screen bg-gray-50 ${isCollapsed ? 'pl-20' : 'pl-64'} transition-all duration-300`}
    >
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        
        {/* Show any errors at the top of the page */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Hero Banner - replaced Spline component which was causing errors */}
        <div className="relative h-64 md:h-80 mb-10 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 shadow-xl">
          <div className="absolute inset-0 flex flex-col justify-center p-8 z-10">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-4 text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Find Your Perfect <br className="hidden md:block" />
              <span className="text-blue-50">Study Space</span>
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-100 max-w-md mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Join a room or create your own to study with peers
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <motion.button
                onClick={handleCreateRoom}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-all shadow-lg"
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(255, 255, 255, 0.5)" }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  Create a Room
                </div>
              </motion.button>
            </motion.div>
          </div>
          
          {/* Animated particles background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute rounded-full bg-white/20"
                style={{
                  width: Math.random() * 60 + 20,
                  height: Math.random() * 60 + 20,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  x: [
                    Math.random() * 100 - 50,
                    Math.random() * 100 - 50,
                    Math.random() * 100 - 50
                  ],
                  y: [
                    Math.random() * 100 - 50,
                    Math.random() * 100 - 50,
                    Math.random() * 100 - 50
                  ],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{
                  duration: Math.random() * 20 + 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Search and join section with glass effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-4 mb-8"
        >
          <motion.div 
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-lg"
            whileHover={{ translateY: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Enter room code" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-grow bg-gray-50 text-gray-900 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
              />
              <motion.button 
                onClick={handleJoinByCode}
                disabled={!joinCode.trim() || isJoining}
                className="bg-green-500 text-white px-5 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors duration-300 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isJoining ? 'Joining...' : 'Join'}
              </motion.button>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-lg"
            whileHover={{ translateY: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="flex space-x-2">
              <div className="relative flex-grow">
                <input 
                  type="text" 
                  placeholder="Search rooms by subject, name, or tag" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-gray-50 text-gray-900 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <motion.button 
                onClick={handleSearch}
                className="bg-blue-500 text-white px-5 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-300 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Search
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Tabs for different room types */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Tabs 
            defaultValue="explore" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'explore' | 'joined' | 'created')}
            className="w-full"
          >
            <TabsList className="bg-white p-1 rounded-lg border border-gray-200 w-full grid grid-cols-3 mb-6">
              <TabsTrigger 
                value="explore" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <BookOpen className="w-4 h-4 mr-2" /> Explore
              </TabsTrigger>
              <TabsTrigger 
                value="joined" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <Users className="w-4 h-4 mr-2" /> Joined
              </TabsTrigger>
              <TabsTrigger 
                value="created" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <User className="w-4 h-4 mr-2" /> Created
              </TabsTrigger>
            </TabsList>
            
            {/* Fix AnimatePresence mode issue by giving each TabsContent a unique key */}
            <TabsContent key="explore-content" value="explore" className="m-0">
              {isLoading ? (
                <RoomLoadingState />
              ) : (
                <RoomsGrid rooms={publicRooms} emptyMessage="No public study rooms available. Be the first to create one!" />
              )}
            </TabsContent>
            
            <TabsContent key="joined-content" value="joined" className="m-0">
              {isLoading ? (
                <RoomLoadingState />
              ) : (
                <RoomsGrid rooms={joinedRooms} emptyMessage="You haven't joined any study rooms yet." />
              )}
            </TabsContent>
            
            <TabsContent key="created-content" value="created" className="m-0">
              {isLoading ? (
                <RoomLoadingState />
              ) : (
                <RoomsGrid rooms={createdRooms} emptyMessage="You haven't created any study rooms yet." />
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </motion.div>
  );
};

export default StudyRooms; 