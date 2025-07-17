import React, { useState, useEffect, useRef } from 'react';
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
import { db } from '../lib/firebase';
import { doc, getDoc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';

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

// Timer mode type
type TimerMode = 'work' | 'shortBreak' | 'longBreak';

// Timer state interface
interface TimerState {
  isRunning: boolean;
  endTime: number | null; // Timestamp in milliseconds
  duration: number; // Duration in minutes
  mode: TimerMode;
  completedSessions: number;
}

// Pomodoro settings
const POMODORO_SETTINGS = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsUntilLongBreak: 4
};

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
  const [youtubeInPipMode, setYoutubeInPipMode] = useState(false);
  const [lastActiveYoutubeState, setLastActiveYoutubeState] = useState<boolean>(false);
  const [youtubeVideoActive, setYoutubeVideoActive] = useState<boolean>(false);
  const [creator, setCreator] = useState<StudyRoomParticipant | null>(null);
  
  // Timer state from Firebase
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    endTime: null,
    duration: POMODORO_SETTINGS.work,
    mode: 'work',
    completedSessions: 0
  });
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number }>({ 
    minutes: POMODORO_SETTINGS.work, 
    seconds: 0 
  });
  const [timerExpanded, setTimerExpanded] = useState<boolean>(false);

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
        
        // Find creator
        const creatorData = participantsData.find(p => p.uid === roomData.createdBy);
        if (creatorData) {
          setCreator(creatorData);
        }
      } catch (error) {
        console.error('Error fetching room data:', error);
        setError('Failed to load study room. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoomData();
  }, [roomId, currentUser]);

  // Check if YouTube has an active video
  useEffect(() => {
    if (!roomId) return;

    const checkYoutubeStatus = async () => {
      try {
        const videoStateRef = doc(db, 'studyRooms', roomId, 'tools', 'youtubePlayer');
        const videoStateDoc = await getDoc(videoStateRef);
        
        if (videoStateDoc.exists()) {
          const data = videoStateDoc.data();
          setYoutubeVideoActive(!!data.videoId);
        }
      } catch (err) {
        console.error('Error checking YouTube status:', err);
      }
    };

    checkYoutubeStatus();

    // Subscribe to YouTube state changes
    const videoStateRef = doc(db, 'studyRooms', roomId, 'tools', 'youtubePlayer');
    const unsubscribe = onSnapshot(videoStateRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setYoutubeVideoActive(!!data.videoId);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Initialize and subscribe to timer updates
  useEffect(() => {
    if (!roomId) return;

    const timerRef = doc(db, 'studyRooms', roomId, 'tools', 'timer');
    
    const initTimer = async () => {
      try {
        const docSnap = await getDoc(timerRef);
        
        if (!docSnap.exists()) {
          await setDoc(timerRef, {
            isRunning: false,
            endTime: null,
            duration: POMODORO_SETTINGS.work,
            mode: 'work',
            completedSessions: 0
          });
        }
      } catch (err) {
        console.error('Error initializing timer:', err);
      }
    };
    
    initTimer();
    
    const unsubscribe = onSnapshot(timerRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.data() as TimerState;
          setTimerState(data);
          
          if (data.isRunning && data.endTime) {
            const now = Date.now();
            const endTime = data.endTime;
            
            if (now < endTime) {
              const timeLeftMs = endTime - now;
              const minutes = Math.floor(timeLeftMs / 60000);
              const seconds = Math.floor((timeLeftMs % 60000) / 1000);
              setTimeLeft({ minutes, seconds });
            } else {
              setTimeLeft({ minutes: 0, seconds: 0 });
            }
          } else {
            setTimeLeft({ minutes: data.duration, seconds: 0 });
          }
        }
      } catch (err) {
        console.error('Error processing timer state:', err);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Calculate time left and handle timer completion
  useEffect(() => {
    if (!timerState.isRunning || !timerState.endTime) {
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const endTime = timerState.endTime as number;
      
      if (now >= endTime) {
        // Timer finished
        setTimeLeft({ minutes: 0, seconds: 0 });
        clearInterval(intervalId);
        
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(err => console.error('Error playing sound:', err));
        
        // Handle session completion and transition to next mode
        if (currentUser) {
          handleTimerCompletion();
        }
      } else {
        // Update time left
        const timeLeftMs = endTime - now;
        const minutes = Math.floor(timeLeftMs / 60000);
        const seconds = Math.floor((timeLeftMs % 60000) / 1000);
        setTimeLeft({ minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerState, currentUser, roomId]);

  // Format time for display (mm:ss)
  const formatTime = (minutes: number, seconds: number): string => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle timer completion
  const handleTimerCompletion = async () => {
    if (!roomId) return;
    
    const timerRef = doc(db, 'studyRooms', roomId, 'tools', 'timer');
    let nextMode: TimerMode;
    let nextDuration: number;
    let completedSessions = timerState.completedSessions;

    if (timerState.mode === 'work') {
      completedSessions += 1;
      if (completedSessions % POMODORO_SETTINGS.sessionsUntilLongBreak === 0) {
        nextMode = 'longBreak';
        nextDuration = POMODORO_SETTINGS.longBreak;
      } else {
        nextMode = 'shortBreak';
        nextDuration = POMODORO_SETTINGS.shortBreak;
      }
    } else {
      nextMode = 'work';
      nextDuration = POMODORO_SETTINGS.work;
    }

    await updateDoc(timerRef, {
      isRunning: false,
      endTime: null,
      mode: nextMode,
      duration: nextDuration,
      completedSessions
    });
  };

  // Timer controls
  const startTimer = async () => {
    if (!currentUser || !roomId) return;
    
    try {
      const durationMs = timerState.duration * 60 * 1000;
      const endTime = Date.now() + durationMs;
      
      const timerRef = doc(db, 'studyRooms', roomId, 'tools', 'timer');
      await updateDoc(timerRef, {
        isRunning: true,
        endTime
      });
    } catch (err) {
      console.error('Error starting timer:', err);
    }
  };

  const stopTimer = async () => {
    if (!currentUser || !roomId) return;
    
    try {
      const timerRef = doc(db, 'studyRooms', roomId, 'tools', 'timer');
      await updateDoc(timerRef, {
        isRunning: false,
        endTime: null
      });
    } catch (err) {
      console.error('Error stopping timer:', err);
    }
  };

  const resetTimer = async () => {
    if (!currentUser || !roomId) return;
    
    try {
      const timerRef = doc(db, 'studyRooms', roomId, 'tools', 'timer');
      await updateDoc(timerRef, {
        isRunning: false,
        endTime: null,
        mode: 'work',
        duration: POMODORO_SETTINGS.work,
        completedSessions: 0
      });
    } catch (err) {
      console.error('Error resetting timer:', err);
    }
  };

  const setTimerType = async (type: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    if (!currentUser || !roomId) return;
    
    try {
      let mode: TimerMode;
      let duration: number;
      
      switch (type) {
        case 'pomodoro':
          mode = 'work';
          duration = POMODORO_SETTINGS.work;
          break;
        case 'shortBreak':
          mode = 'shortBreak';
          duration = POMODORO_SETTINGS.shortBreak;
          break;
        case 'longBreak':
          mode = 'longBreak';
          duration = POMODORO_SETTINGS.longBreak;
          break;
        default:
          mode = 'work';
          duration = POMODORO_SETTINGS.work;
      }
      
      const timerRef = doc(db, 'studyRooms', roomId, 'tools', 'timer');
      await updateDoc(timerRef, {
        isRunning: false,
        endTime: null,
        mode,
        duration
      });
    } catch (err) {
      console.error('Error setting timer type:', err);
    }
  };

  const toggleTimer = () => {
    if (timerState.isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  };

  const toggleTimerExpanded = () => {
    setTimerExpanded(prev => !prev);
  };
  
  // Close timer when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside the timer area
      if (timerExpanded && 
          !target.closest('.compact-timer') && 
          !target.closest('.timer-expanded-controls')) {
        setTimerExpanded(false);
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [timerExpanded]);

  const handleLeaveRoom = async () => {
    if (!roomId || !currentUser || !room) return;
    
    // Cannot leave if you're the creator
    if (room.createdBy === currentUser.uid) {
      setError('As the room creator, you cannot leave. You must close the room instead.');
      return;
    }
    
    // Add confirmation dialog
    if (!window.confirm('Are you sure you want to leave this study room?')) {
      return; // User cancelled
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

  // Toggle YouTube PiP mode directly
  const toggleYoutubePip = () => {
    const newPipMode = !youtubeInPipMode;
    handleYoutubePipToggle(newPipMode);
  };

  // Handle YouTube PiP mode toggle
  const handleYoutubePipToggle = (isPipEnabled: boolean) => {
    setYoutubeInPipMode(isPipEnabled);
    
    // If enabling PiP mode and YouTube is the active feature,
    // remember that YouTube was active and switch to notes
    if (isPipEnabled && activeFeature === 'youtube') {
      setLastActiveYoutubeState(true);
      setActiveFeature('notes');
    }
    
    // If disabling PiP mode and YouTube was previously active,
    // switch back to YouTube
    if (!isPipEnabled && lastActiveYoutubeState) {
      setActiveFeature('youtube');
      setLastActiveYoutubeState(false);
    }
  };

  // Use localStorage to persist active feature across reloads
  useEffect(() => {
    if (roomId) {
      // Get active feature from localStorage on component mount
      const savedFeature = localStorage.getItem(`studyroom-${roomId}-activeFeature`);
      const validFeatures: Feature[] = ['notes', 'files', 'timer', 'tasks', 'polls', 'whiteboard', 'youtube', 'chat'];
      
      if (savedFeature && validFeatures.includes(savedFeature as Feature)) {
        setActiveFeature(savedFeature as Feature);
      } else {
        // If no valid feature is found, default to 'notes'
        setActiveFeature('notes');
        localStorage.setItem(`studyroom-${roomId}-activeFeature`, 'notes');
      }
    }
  }, [roomId]);

  // Handle feature change
  const changeActiveFeature = (feature: Feature) => {
    // Validate feature
    const validFeatures: Feature[] = ['notes', 'files', 'timer', 'tasks', 'polls', 'whiteboard', 'youtube', 'chat'];
    if (!validFeatures.includes(feature)) {
      console.warn(`Invalid feature: ${feature}. Defaulting to 'notes'.`);
      feature = 'notes';
    }
    
    // If YouTube is in PiP mode and user clicks on YouTube,
    // disable PiP mode and show YouTube as main feature
    if (feature === 'youtube' && youtubeInPipMode) {
      setYoutubeInPipMode(false);
      setLastActiveYoutubeState(false);
    }
    
    // Save active feature to localStorage
    if (roomId) {
      localStorage.setItem(`studyroom-${roomId}-activeFeature`, feature);
    }
    
    setActiveFeature(feature);
  };
  
  const renderFeatureContent = () => {
    // Add type guard to ensure activeFeature is a valid Feature
    const validFeatures: Feature[] = ['notes', 'files', 'timer', 'tasks', 'polls', 'whiteboard', 'youtube', 'chat'];
    const feature = validFeatures.includes(activeFeature) ? activeFeature : 'notes';

    switch (feature) {
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
        return (
          <YoutubeWatchTogether 
            roomId={roomId || ''} 
            isPipMode={youtubeInPipMode}
            onPipToggle={handleYoutubePipToggle}
          />
        );
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

  // Get mode label for display
  const getModeLabel = (mode: TimerMode): string => {
    switch (mode) {
      case 'work':
        return 'Focus';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
    }
  };
  
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Navigation Bar - Now full width */}
      <div className="studyroom-nav">
        <div className="nav-left">
          {/* Back button */}
          <button 
            className="back-button"
            onClick={() => navigate('/study-rooms')}
            title="Back to Study Rooms"
          >
            <span className="back-icon">←</span>
            <span className="back-text">Back</span>
          </button>
          
          <div className="room-title-area">
            <h2>{room.name}</h2>
            <span className="room-status">
              {participants.length} {participants.length === 1 ? 'member' : 'members'}
            </span>
          </div>
          {creator && (
            <div className="room-creator">
              Created by <span className="creator-name">{creator.displayName || 'Anonymous'}</span>
            </div>
          )}
        </div>
        <div className="nav-center">
          <span className="active-feature-title">{activeFeature.charAt(0).toUpperCase() + activeFeature.slice(1)}</span>
        </div>
        <div className="nav-right">
          {/* Quick Access Tools */}
          <div className="quick-access-tools">
            {/* Show Video Button - Only when video is active */}
            {youtubeVideoActive && (
              <button 
                className={`nav-tool-btn video-btn ${youtubeInPipMode ? 'active' : ''}`}
                onClick={toggleYoutubePip}
                title={youtubeInPipMode ? "Hide floating video" : "Show video in floating window"}
              >
                <span className="icon">📺</span>
                <span className="label">Video</span>
              </button>
            )}

            {/* Compact Timer with expandable controls - now synced with Firebase */}
            <div className={`compact-timer ${timerExpanded ? 'expanded' : ''} ${timerState.isRunning ? 'running' : ''} mode-${timerState.mode}`}>
              <div className="timer-display" onClick={toggleTimerExpanded}>
                {formatTime(timeLeft.minutes, timeLeft.seconds)}
              </div>
              
              {timerExpanded && (
                <div className={`timer-expanded-controls mode-${timerState.mode}`}>
                  <div className="timer-header">
                    <span>{getModeLabel(timerState.mode)} Timer</span>
                    <button className="close-timer-btn" onClick={toggleTimerExpanded} aria-label="Close timer">×</button>
                  </div>
                  
                  <div className="timer-info">
                    <div className="session-counter">
                      Completed Pomodoros: {timerState.completedSessions}
                    </div>
                  </div>
                  
                  <div className="timer-controls">
                    <button 
                      className="timer-btn start-btn" 
                      onClick={toggleTimer}
                      title={timerState.isRunning ? "Pause timer" : "Start timer"}
                      disabled={!currentUser}
                    >
                      {timerState.isRunning ? "⏸" : "▶"}
                    </button>
                    <button 
                      className="timer-btn reset-btn" 
                      onClick={resetTimer}
                      title="Reset timer"
                      disabled={!currentUser}
                    >
                      ⟳
                    </button>
                  </div>
                  
                  <div className="timer-presets">
                    <button 
                      className={`preset-btn ${timerState.mode === 'work' ? 'active' : ''}`}
                      onClick={() => setTimerType('pomodoro')}
                      title="Pomodoro (25 min)"
                      disabled={!currentUser}
                    >
                      25m
                    </button>
                    <button 
                      className={`preset-btn ${timerState.mode === 'shortBreak' ? 'active' : ''}`}
                      onClick={() => setTimerType('shortBreak')}
                      title="Short break (5 min)"
                      disabled={!currentUser}
                    >
                      5m
                    </button>
                    <button 
                      className={`preset-btn ${timerState.mode === 'longBreak' ? 'active' : ''}`}
                      onClick={() => setTimerType('longBreak')}
                      title="Long break (15 min)"
                      disabled={!currentUser}
                    >
                      15m
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-70px)] study-view-container">
        {/* Sidebar with minimize button - now starts below navbar */}
        <div className={`sidebar ${sidebarMinimized ? 'minimized' : ''}`}>
          <div className="sidebar-toggle">
            <button className="minimize-btn" onClick={toggleSidebar}>
              {sidebarMinimized ? '→' : '←'}
            </button>
          </div>

          <div className="sidebar-nav">
            {/* All sidebar buttons remain the same */}
            <button
              onClick={() => changeActiveFeature('notes')}
              className={`sidebar-btn ${activeFeature === 'notes' ? 'active' : ''}`}
              title="Collaborative Notes"
            >
              <span className="icon">📝</span>
              {!sidebarMinimized && <span className="label">Collaborative Notes</span>}
            </button>
            
            <button
              onClick={() => changeActiveFeature('chat')}
              className={`sidebar-btn ${activeFeature === 'chat' ? 'active' : ''}`}
              title="Chat Room"
            >
              <span className="icon">💬</span>
              {!sidebarMinimized && <span className="label">Chat Room</span>}
            </button>
            
            <button
              onClick={() => changeActiveFeature('files')}
              className={`sidebar-btn ${activeFeature === 'files' ? 'active' : ''}`}
              title="File Sharing"
            >
              <span className="icon">📂</span>
              {!sidebarMinimized && <span className="label">File Sharing</span>}
            </button>
            
            <button
              onClick={() => changeActiveFeature('timer')}
              className={`sidebar-btn ${activeFeature === 'timer' ? 'active' : ''}`}
              title="Study Timer"
            >
              <span className="icon">⏱️</span>
              {!sidebarMinimized && <span className="label">Study Timer</span>}
            </button>
            
            <button
              onClick={() => changeActiveFeature('tasks')}
              className={`sidebar-btn ${activeFeature === 'tasks' ? 'active' : ''}`}
              title="Task Manager"
            >
              <span className="icon">✅</span>
              {!sidebarMinimized && <span className="label">Task Manager</span>}
            </button>
            
            <button
              onClick={() => changeActiveFeature('polls')}
              className={`sidebar-btn ${activeFeature === 'polls' ? 'active' : ''}`}
              title="Poll System"
            >
              <span className="icon">📊</span>
              {!sidebarMinimized && <span className="label">Poll System</span>}
            </button>
            
            <button
              onClick={() => changeActiveFeature('whiteboard')}
              className={`sidebar-btn ${activeFeature === 'whiteboard' ? 'active' : ''}`}
              title="Whiteboard"
            >
              <span className="icon">🎨</span>
              {!sidebarMinimized && <span className="label">Whiteboard</span>}
            </button>
            
            <button
              onClick={() => changeActiveFeature('youtube')}
              className={`sidebar-btn ${activeFeature === 'youtube' ? 'active' : ''} ${youtubeInPipMode ? 'pip-active' : ''}`}
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
          <div className="feature-content">
            {renderFeatureContent()}
          
            {/* YouTube PiP Mode - Only rendered when enabled and not on YouTube feature */}
            {youtubeInPipMode && activeFeature !== 'youtube' && (
              <YoutubeWatchTogether
                roomId={roomId || ''}
                isPipMode={true}
                onPipToggle={handleYoutubePipToggle}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyRoomView; 