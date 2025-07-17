import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import './StudyTimer.css';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface TimerState {
  isRunning: boolean;
  endTime: number | null; // Timestamp in milliseconds
  duration: number; // Duration in minutes
  mode: TimerMode;
  completedSessions: number;
}

interface StudyTimerProps {
  roomId: string;
}

const POMODORO_SETTINGS = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsUntilLongBreak: 4
};

const StudyTimer: React.FC<StudyTimerProps> = ({ roomId }) => {
  const { currentUser } = useAuth();
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
        setIsLoading(false);
      } catch (err) {
        console.error('Error processing timer state:', err);
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

  // Calculate time left and handle timer completion
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

  const handleTimerCompletion = async () => {
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
      setError('Failed to reset timer');
    }
  };

  const formatTime = (minutes: number, seconds: number): string => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getModeLabel = (mode: TimerMode): string => {
    switch (mode) {
      case 'work':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
    }
  };

  if (isLoading) {
    return <div className="timer-loading">Loading timer...</div>;
  }

  if (error) {
    return <div className="timer-error">{error}</div>;
  }

  return (
    <div className={`study-timer mode-${timerState.mode}`}>
      <div className="timer-display">
        <div className="timer-mode">{getModeLabel(timerState.mode)}</div>
        <div className="time">{formatTime(timeLeft.minutes, timeLeft.seconds)}</div>
        <div className="timer-status">
          {timerState.isRunning ? 'In Progress' : 'Timer stopped'}
        </div>
        <div className="session-counter" style={{ color: '#333', fontWeight: 'bold' }}>
          Completed Pomodoros: {timerState.completedSessions}
        </div>
      </div>
      
      <div className="timer-controls">
        {!timerState.isRunning ? (
          <>
            <button 
              className="start-btn"
              onClick={startTimer}
              disabled={!currentUser}
            >
              Start {getModeLabel(timerState.mode)}
            </button>
            <button 
              className="reset-btn"
              onClick={resetTimer}
              disabled={!currentUser}
            >
              Reset Pomodoro
            </button>
          </>
        ) : (
          <button 
            className="stop-btn"
            onClick={stopTimer}
            disabled={!currentUser}
          >
            Stop Timer
          </button>
        )}
      </div>
    </div>
  );
};

export default StudyTimer; 