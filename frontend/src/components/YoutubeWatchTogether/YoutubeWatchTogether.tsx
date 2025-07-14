import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import {
  doc,
  collection,
  onSnapshot,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import YoutubePlayer from './YoutubePlayer';
import DraggableYoutubePlayer from './DraggableYoutubePlayer';
import VideoSearch from './VideoSearch';
import VideoControls from './VideoControls';
import VideoQueue from './VideoQueue';
import './YoutubeWatchTogether.css';

// Define types for video state and events
interface VideoState {
  videoId: string;
  status: 'playing' | 'paused' | 'buffering' | 'ended';
  timestamp: number; // Current position in seconds
  lastUpdated: Timestamp;
  updatedBy: string;
  updatedByName: string;
  queue: QueueItem[];
}

interface QueueItem {
  videoId: string;
  title: string;
  thumbnail: string;
  addedBy: string;
  addedByName: string;
}

interface YoutubeWatchTogetherProps {
  roomId: string;
  isPipMode?: boolean;
  onPipToggle?: (isPipEnabled: boolean) => void;
}

const YoutubeWatchTogether: React.FC<YoutubeWatchTogetherProps> = ({ 
  roomId, 
  isPipMode = false,
  onPipToggle
}) => {
  const { currentUser, userProfile } = useAuth();
  const [videoState, setVideoState] = useState<VideoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [syncState, setSyncState] = useState<'synced' | 'syncing' | 'out-of-sync'>('syncing');
  const [localPipMode, setLocalPipMode] = useState(isPipMode);
  
  // Track if the local player is being controlled by us or remote update
  const isLocalUpdate = useRef(false);
  const playerRef = useRef<any>(null);

  // Handle changes to isPipMode prop
  useEffect(() => {
    setLocalPipMode(isPipMode);
  }, [isPipMode]);
  
  // Initialize and subscribe to video state in Firestore
  useEffect(() => {
    if (!roomId || !currentUser) return;
    
    const initVideoState = async () => {
      try {
        console.log("Initializing YouTube Watch Together");
        setLoading(true);
        
        // Check if this room has a video state document already
        const videoStateRef = doc(db, 'studyRooms', roomId, 'tools', 'youtubePlayer');
        const videoStateDoc = await getDoc(videoStateRef);
        
        if (!videoStateDoc.exists()) {
          console.log("Creating new YouTube player state");
          // Initialize with default state
          const initialState: VideoState = {
            videoId: '',
            status: 'paused',
            timestamp: 0,
            lastUpdated: serverTimestamp() as Timestamp,
            updatedBy: currentUser.uid,
            updatedByName: userProfile?.displayName || 'Anonymous',
            queue: []
          };
          
          await setDoc(videoStateRef, initialState);
        }
        
        // Check if user is room host (to set permissions)
        const roomRef = doc(db, 'studyRooms', roomId);
        const roomDoc = await getDoc(roomRef);
        if (roomDoc.exists()) {
          const roomData = roomDoc.data();
          if (roomData.createdBy === currentUser.uid || roomData.hostId === currentUser.uid) {
            console.log("User is host");
            setIsHost(true);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error initializing YouTube player state:', err);
        setError('Failed to initialize video player. Please try refreshing the page.');
        setLoading(false);
      }
    };
    
    initVideoState();
    
    // Subscribe to video state changes
    const videoStateRef = doc(db, 'studyRooms', roomId, 'tools', 'youtubePlayer');
    const unsubscribe = onSnapshot(videoStateRef, (doc) => {
      try {
        if (doc.exists()) {
          const data = doc.data() as VideoState;
          console.log("Received video state update:", data.status, data.videoId, data.timestamp);
          
          // If this update was triggered by another user, update our local state
          if (data.updatedBy !== currentUser.uid) {
            setVideoState(data);
            
            // If we have a player reference, sync it with remote state
            if (playerRef.current && !isLocalUpdate.current) {
              syncPlayerWithRemoteState(data);
            }
          } else if (isLocalUpdate.current) {
            // If this was our update, just update the state
            isLocalUpdate.current = false;
            setVideoState(data);
          } else {
            setVideoState(data);
          }
        }
      } catch (err) {
        console.error('Error processing video state update:', err);
        setError('Error syncing video. Try refreshing the page.');
      }
    }, (err) => {
      console.error('Error subscribing to video state:', err);
      setError('Failed to sync video player. Please check your connection.');
    });
    
    return () => unsubscribe();
  }, [roomId, currentUser, userProfile]);
  
  // Sync player with remote state
  const syncPlayerWithRemoteState = (state: VideoState) => {
    if (!playerRef.current) {
      console.log("Player reference not available for sync");
      return;
    }
    
    try {
      // Handle video ID change
      const currentVideoId = playerRef.current.getVideoData()?.video_id;
      if (currentVideoId !== state.videoId && state.videoId) {
        console.log(`Loading new video: ${state.videoId} at ${state.timestamp}s`);
        playerRef.current.loadVideoById(state.videoId, state.timestamp);
        setSyncState('synced');
        return;
      }
      
      // Handle playback state change
      const currentTime = playerRef.current.getCurrentTime();
      const timeDiff = Math.abs(currentTime - state.timestamp);
      
      // If out of sync by more than 2 seconds, seek to correct position
      if (timeDiff > 2) {
        console.log(`Seeking to ${state.timestamp}s (diff: ${timeDiff}s)`);
        playerRef.current.seekTo(state.timestamp);
        setSyncState('synced');
      }
      
      // Handle play/pause state
      if (state.status === 'playing' && playerRef.current.getPlayerState() !== 1) {
        console.log("Remote state is playing, playing video");
        playerRef.current.playVideo();
        setSyncState('synced');
      } else if (state.status === 'paused' && playerRef.current.getPlayerState() === 1) {
        console.log("Remote state is paused, pausing video");
        playerRef.current.pauseVideo();
        setSyncState('synced');
      }
    } catch (err) {
      console.error("Error syncing player with remote state:", err);
      setSyncState('out-of-sync');
    }
  };
  
  // Update remote state when local player changes
  const updateRemoteState = async (update: Partial<VideoState>) => {
    if (!roomId || !currentUser || !videoState) return;
    
    try {
      isLocalUpdate.current = true;
      const videoStateRef = doc(db, 'studyRooms', roomId, 'tools', 'youtubePlayer');
      
      console.log("Updating remote state:", update);
      await updateDoc(videoStateRef, {
        ...update,
        lastUpdated: serverTimestamp(),
        updatedBy: currentUser.uid,
        updatedByName: userProfile?.displayName || 'Anonymous'
      });
      
      setSyncState('synced');
    } catch (err) {
      console.error('Error updating video state:', err);
      setSyncState('out-of-sync');
      
      // Try setting doc if it doesn't exist
      if (err.toString().includes("No document to update")) {
        try {
          const videoStateRef = doc(db, 'studyRooms', roomId, 'tools', 'youtubePlayer');
          await setDoc(videoStateRef, {
            ...videoState,
            ...update,
            lastUpdated: serverTimestamp(),
            updatedBy: currentUser.uid,
            updatedByName: userProfile?.displayName || 'Anonymous'
          });
          setSyncState('synced');
        } catch (innerErr) {
          console.error('Error creating video state document:', innerErr);
        }
      }
    }
  };
  
  // Handle player events
  const onPlayerReady = (event: any) => {
    console.log("YouTube player ready");
    playerRef.current = event.target;
    setSyncState('synced');
    
    // If there's already a video in the state, sync with it
    if (videoState && videoState.videoId) {
      syncPlayerWithRemoteState(videoState);
    }
  };
  
  const onPlayerStateChange = (event: any) => {
    if (!videoState || !currentUser) return;
    
    // Don't update remote if we're syncing with remote already
    if (isLocalUpdate.current) return;
    
    // Map YouTube player states to our states
    // 1=playing, 2=paused, 3=buffering, 0=ended
    const playerState = event.data;
    
    let status: 'playing' | 'paused' | 'buffering' | 'ended';
    
    switch (playerState) {
      case 1:
        status = 'playing';
        break;
      case 2:
        status = 'paused';
        break;
      case 3:
        status = 'buffering';
        return; // Don't sync buffering state
      case 0:
        status = 'ended';
        // Handle video ended - play next in queue if available
        if (videoState.queue.length > 0) {
          setTimeout(() => playNextVideo(), 1000);
        }
        break;
      default:
        return;
    }
    
    // Update the remote state with current player info
    updateRemoteState({
      status,
      timestamp: playerRef.current.getCurrentTime(),
      videoId: playerRef.current.getVideoData().video_id
    });
  };
  
  // Handle search and video selection
  const handleVideoSelect = (videoId: string, videoDetails: { title: string, thumbnail: string }) => {
    if (!videoState || !currentUser) return;
    
    const newQueueItem: QueueItem = {
      videoId,
      title: videoDetails.title,
      thumbnail: videoDetails.thumbnail,
      addedBy: currentUser.uid,
      addedByName: userProfile?.displayName || 'Anonymous'
    };
    
    // If nothing is currently playing, play this video
    if (!videoState.videoId) {
      updateRemoteState({
        videoId,
        status: 'playing',
        timestamp: 0,
        queue: [newQueueItem, ...videoState.queue]
      });
    } else {
      // Otherwise add to queue
      updateRemoteState({
        queue: [...videoState.queue, newQueueItem]
      });
    }
  };
  
  // Play next video in queue
  const playNextVideo = () => {
    if (!videoState || videoState.queue.length === 0) return;
    
    const [nextVideo, ...remainingQueue] = videoState.queue;
    
    updateRemoteState({
      videoId: nextVideo.videoId,
      status: 'playing',
      timestamp: 0,
      queue: remainingQueue
    });
  };
  
  // Remove video from queue
  const removeFromQueue = (index: number) => {
    if (!videoState) return;
    
    const newQueue = [...videoState.queue];
    newQueue.splice(index, 1);
    
    updateRemoteState({
      queue: newQueue
    });
  };

  // Handle PiP mode toggle
  const togglePipMode = () => {
    const newPipMode = !localPipMode;
    setLocalPipMode(newPipMode);
    if (onPipToggle) {
      onPipToggle(newPipMode);
    }
  };

  // Handle closing the player in PiP mode
  const handleClosePlayer = () => {
    if (onPipToggle) {
      onPipToggle(false);
    }
  };
  
  if (loading) {
    return <div className="youtube-loading">Loading video player...</div>;
  }
  
  if (error) {
    return <div className="youtube-error">{error}</div>;
  }

  // If in PiP mode, render just the player component in draggable container
  if (localPipMode) {
    return (
      <DraggableYoutubePlayer
        videoId={videoState?.videoId || ''}
        onReady={onPlayerReady}
        onStateChange={onPlayerStateChange}
        isPipMode={true}
        onClose={handleClosePlayer}
        onMinimize={togglePipMode}
      />
    );
  }
  
  return (
    <div className="youtube-watch-together">
      <div className="youtube-container">
        <div className="video-area">
          {videoState && (
            <>
              <YoutubePlayer 
                videoId={videoState.videoId || ''} 
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
              />
              
              <div className="sync-status">
                Status: {syncState === 'synced' ? '✓ Synced' : syncState === 'syncing' ? '⟳ Syncing...' : '⚠ Out of sync'}
              </div>
              
              {!videoState.videoId && (
                <div className="no-video">
                  <p>No video selected</p>
                  <p>Search for a YouTube video to begin</p>
                </div>
              )}

              {/* Add PiP mode button */}
              {videoState.videoId && (
                <button 
                  className="pip-mode-button"
                  onClick={togglePipMode}
                  title="Picture-in-picture mode"
                >
                  <span className="pip-icon">⎘</span>
                  <span>Float Player</span>
                </button>
              )}
            </>
          )}
        </div>
        
        <VideoControls 
          videoState={videoState} 
          isHost={isHost}
          onPlayNext={playNextVideo} 
        />
      </div>
      
      <div className="video-sidebar">
        <VideoSearch onVideoSelect={handleVideoSelect} />
        
        <VideoQueue 
          queue={videoState?.queue || []} 
          onRemove={removeFromQueue}
          isHost={isHost}
        />
      </div>
    </div>
  );
};

export default YoutubeWatchTogether; 