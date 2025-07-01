import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import './StudyTimer.css';

interface TimerState {
  isRunning: boolean;
  endTime: number | null; // Timestamp in milliseconds
  duration: number; // Duration in minutes
}

interface StudyTimerProps {
  roomId: string;
}

const StudyTimer: React.FC<StudyTimerProps> = ({ roomId }) => {
  const { currentUser } = useAuth();
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    endTime: null,
    duration: 25 // Default 25 minutes (Pomodoro)
  });
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number }>({ minutes: 0, seconds: 0 });
  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Subscribe to timer updates
  useEffect(() => {
    if (!roomId) return;

    const timerRef = doc(db, 'studyRooms', roomId, 'tools', 'timer');
    
         const unsubscribe = onSnapshot(timerRef, (snapshot) => {
       try {
         if (snapshot.exists()) {
           const data = snapshot.data() as TimerState;
           setTimerState(data);
         } else {
           // Initialize timer document if it doesn't exist
           setDoc(timerRef, {
             isRunning: false,
             endTime: null,
             duration: 25
           }).catch(err => {
             console.error('Error initializing timer:', err);
           });
         }
         setIsLoading(false);
       } catch (err) {
         console.error('Error loading timer state:', err);
         setError('Failed to load timer');
         setIsLoading(false);
       }
     }, (err) => {
       console.error('Error subscribing to timer updates:', err);
       setError('Failed to subscribe to timer updates');
       setIsLoading(false);
     });

    return () => unsubscribe();
  }, [roomId]);

  // Calculate time left
  useEffect(() => {
    if (!timerState.isRunning || !timerState.endTime) {
      setTimeLeft({ minutes: timerState.duration, seconds: 0 });
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const endTime = timerState.endTime as number;
      
      if (now >= endTime) {
        // Timer finished
        setTimeLeft({ minutes: 0, seconds: 0 });
        clearInterval(intervalId);
        
        // Play sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(err => console.error('Error playing sound:', err));
        
        // Reset timer in database
        if (currentUser) {
          const timerRef = doc(db, 'studyRooms', roomId, 'tools', 'timer');
          updateDoc(timerRef, {
            isRunning: false,
            endTime: null
          }).catch(err => {
            console.error('Error resetting timer:', err);
          });
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

  const startTimer = async () => {
    if (!currentUser || !roomId) return;
    
    try {
      const durationMs = selectedDuration * 60 * 1000;
      const endTime = Date.now() + durationMs;
      
      const timerRef = doc(db, 'studyRooms', roomId, 'tools', 'timer');
      await updateDoc(timerRef, {
        isRunning: true,
        endTime,
        duration: selectedDuration
      });
    } catch (err) {
      console.error('Error starting timer:', err);
      setError('Failed to start timer');
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
      setError('Failed to stop timer');
    }
  };

  const formatTime = (minutes: number, seconds: number): string => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <div className="timer-loading">Loading timer...</div>;
  }

  if (error) {
    return <div className="timer-error">{error}</div>;
  }

  return (
    <div className="study-timer">
      <div className="timer-display">
        <div className="time">{formatTime(timeLeft.minutes, timeLeft.seconds)}</div>
        <div className="timer-status">
          {timerState.isRunning ? 'Focus time!' : 'Timer stopped'}
        </div>
      </div>
      
      <div className="timer-controls">
        {!timerState.isRunning ? (
          <>
            <div className="duration-selector">
              <button 
                className={selectedDuration === 15 ? 'active' : ''}
                onClick={() => setSelectedDuration(15)}
              >
                15m
              </button>
              <button 
                className={selectedDuration === 25 ? 'active' : ''}
                onClick={() => setSelectedDuration(25)}
              >
                25m
              </button>
              <button 
                className={selectedDuration === 45 ? 'active' : ''}
                onClick={() => setSelectedDuration(45)}
              >
                45m
              </button>
            </div>
            <button 
              className="start-btn"
              onClick={startTimer}
            >
              Start Timer
            </button>
          </>
        ) : (
          <button 
            className="stop-btn"
            onClick={stopTimer}
          >
            Stop Timer
          </button>
        )}
      </div>
    </div>
  );
};

export default StudyTimer; 