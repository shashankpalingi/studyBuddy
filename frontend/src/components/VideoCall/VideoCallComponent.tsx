import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Peer, { MediaConnection } from 'peerjs';
import { VideoCallService, DEFAULT_PEER_CONFIG } from './VideoCallService';
import './VideoCall.css';
import { 
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneIcon,
  ArrowsPointingOutIcon, 
  ComputerDesktopIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';
import { 
  MicrophoneIcon as MicrophoneIconOff,
  VideoCameraIcon as VideoCameraIconOff
} from '@heroicons/react/24/outline';

interface ActiveCaller {
  userId: string;
  userName: string;
  peerId: string;
  joinedAt: Date;
}

interface VideoCallProps {
  roomId: string;
  onEndCall: () => void;
}

const VideoCallComponent: React.FC<VideoCallProps> = ({ roomId, onEndCall }) => {
  const { currentUser, userProfile } = useAuth();
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [activeCallers, setActiveCallers] = useState<ActiveCaller[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [focusedPeerId, setFocusedPeerId] = useState<string | null>(null);
  const [remoteMuted, setRemoteMuted] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, string>>({});
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Record<string, MediaConnection>>({});
  const peerVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const reconnectionTimeoutRef = useRef<number | null>(null);
  
  // Function to completely reinitialize the peer connection
  const reinitializeConnection = useCallback(async () => {
    if (!currentUser || !roomId) return;
    
    console.log("Reinitializing peer connection");
    
    // Clean up existing connections
    streamRef.current?.getTracks().forEach(track => track.stop());
    screenStreamRef.current?.getTracks().forEach(track => track.stop());
    
    Object.values(peerConnections.current).forEach(conn => {
      try {
        conn.close();
      } catch (err) {
        console.warn("Error closing peer connection:", err);
      }
    });
    
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (err) {
        console.warn("Error destroying peer:", err);
      }
    }
    
    // Clear our state
    peerConnections.current = {};
    peerVideoRefs.current = {};
    setConnectedPeers([]);
    
    // Recreate connection
    try {
      setIsConnecting(true);
      
      // Get new media stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      // Create peer connection with unique ID based on user and room
      const peerId = `${roomId}-${currentUser.uid}-${Date.now()}`;
      const peer = new Peer(peerId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        },
        // Use shorter timeout for faster detection of issues
        pingInterval: 5000,
      });
      
      // Set up peer event handlers
      peer.on('open', async (id) => {
        console.log('Reinitialized peer, new ID is:', id);
        setMyPeerId(id);
        peerRef.current = peer;
        
        // Register as active caller in Firestore
        try {
          await VideoCallService.registerCaller(
            roomId, 
            currentUser.uid, 
            userProfile?.displayName || 'Anonymous User',
            id
          );
          
          setIsConnecting(false);
          setIsReconnecting(false);
        } catch (err) {
          console.error('Failed to register as caller after reconnection:', err);
          setIsConnecting(false);
          setError("Connection issues. Please try rejoining the call.");
        }
      });
      
      // Set up other event handlers...
      peer.on('error', (err) => {
        console.error('PeerJS error after reconnection:', err);
        setError(`Connection error: ${err.message}`);
      });
      
    } catch (err) {
      console.error('Error reinitializing peer:', err);
      setError('Failed to reconnect. Please try rejoining the call.');
      setIsConnecting(false);
    }
  }, [currentUser, roomId, userProfile]);

  // New useEffect to handle local video stream assignment
  useEffect(() => {
    if (streamRef.current && myVideoRef.current) {
      myVideoRef.current.srcObject = streamRef.current;
      
      // Use retry approach with max attempts and backoff
      const attemptPlay = (attempts = 0, delay = 200) => {
        if (attempts >= 5) {
          console.warn("Max retry attempts reached for local video");
          return;
        }
        
        myVideoRef.current?.play().catch(err => {
          if (err.name === 'AbortError' && attempts < 5) {
            console.warn(`Local video play was aborted (attempt ${attempts+1}/5), retrying in ${delay}ms`);
            setTimeout(() => attemptPlay(attempts + 1, delay * 1.5), delay);
          } else {
            console.error("Error playing local video from useEffect:", err);
          }
        });
      };
      
      attemptPlay();
    }
  }, [streamRef.current, myVideoRef.current]);
  
  // Create peer connection with enhanced configuration
  const createPeerConnection = () => {
    const configuration: RTCConfiguration = {
      iceServers: DEFAULT_PEER_CONFIG.iceServers,
      iceTransportPolicy: 'relay', // Force relay for more consistent connections
      bundlePolicy: 'max-bundle', // Optimize bandwidth usage
      rtcpMuxPolicy: 'require', // Require multiplexing for efficiency
    };

    try {
      const peerConnection = new RTCPeerConnection(configuration);
      
      // Add ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE candidate:', event.candidate.type, event.candidate.protocol);
        }
      };

      // Log ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
        
        switch (peerConnection.iceConnectionState) {
          case 'checking':
            console.log('Attempting to establish connection...');
            break;
          case 'connected':
            console.log('Peer connection established successfully');
            break;
          case 'disconnected':
            console.warn('Peer connection disconnected');
            break;
          case 'failed':
            console.error('Peer connection failed');
            break;
        }
      };

      return peerConnection;
    } catch (err) {
      console.error('Error creating peer connection:', err);
      return null;
    }
  };

  // Create peer connection
  useEffect(() => {
    if (!currentUser || !roomId) return;
    
    const initializePeer = async () => {
      try {
        setIsConnecting(true);
        
        // Get media stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        streamRef.current = stream;
        
        // Create peer connection with unique ID based on user and room
        const peerId = `${roomId}-${currentUser.uid}-${Date.now()}`;
        const peer = new Peer(peerId, {
          config: {
            iceServers: DEFAULT_PEER_CONFIG.iceServers
          },
          debug: 1, // Set debug level to help with troubleshooting
          pingInterval: 15000 // Send ping more frequently to detect connection issues faster
        });
        
        // Set up peer event handlers
        peer.on('open', async (id) => {
          console.log('My peer ID is:', id);
          setMyPeerId(id);
          peerRef.current = peer;
          
          // Register as active caller in Firestore
          try {
            await VideoCallService.registerCaller(
              roomId, 
              currentUser.uid, 
              userProfile?.displayName || 'Anonymous User',
              id
            );
            
            setIsConnecting(false);
          } catch (err) {
            console.error('Error registering as active caller:', err);
            setIsConnecting(false);
            setError("Failed to join call. Please try again.");
          }
        });
        
        peer.on('call', (call) => {
          console.log(`Receiving call from peer ${call.peer}`);
          
          // Store the connection
          peerConnections.current[call.peer] = call;
          
          // Answer the call with our stream
          call.answer(streamRef.current);
          
          // Handle when we receive the remote stream
          call.on('stream', (remoteStream) => {
            console.log(`Received stream from peer: ${call.peer}`);
            
            // Create or use existing video ref
            if (!peerVideoRefs.current[call.peer]) {
              console.log(`Creating video element for peer ${call.peer}`);
            }
            
            // Add to connected peers if not already there
            setConnectedPeers(prev => {
              if (!prev.includes(call.peer)) {
                return [...prev, call.peer];
              }
              return prev;
            });
            
            setConnectionStatus(prev => ({
              ...prev,
              [call.peer]: 'connected'
            }));
            
            // Attempt to play the video with retry
            playVideo(call.peer, remoteStream);
          });
          
          // Handle call close
          call.on('close', () => {
            console.log(`Call closed with peer ${call.peer}`);
            handlePeerDisconnect(call.peer);
          });
          
          call.on('error', (err) => {
            console.error(`Error in call with peer ${call.peer}:`, err);
            setConnectionStatus(prev => ({
              ...prev,
              [call.peer]: 'error'
            }));
          });
        });
        
        peer.on('error', (err) => {
          console.error('PeerJS error:', err);
          
          // Handle specific error types
          if (err.type === 'network' || err.type === 'disconnected') {
            setIsReconnecting(true);
          }
          
          // Don't show errors for user rejected permissions
          if (err.type !== 'browser-incompatible' && err.type !== 'invalid-id') {
            setError(`Connection error: ${err.message || 'Unknown error'}`);
          }
        });
        
        // Setup keepalive to maintain Firestore registration
        const keepaliveInterval = setInterval(() => {
          if (currentUser && roomId) {
            VideoCallService.updateCallerActivity(roomId, currentUser.uid)
              .catch(err => console.warn('Failed to update activity:', err));
          }
        }, 30000); // Update every 30 seconds
        
        return () => {
          clearInterval(keepaliveInterval);
        };
        
      } catch (err: any) {
        console.error('Error initializing peer:', err);
        
        // Handle permission denied specifically
        if (err.name === 'NotAllowedError') {
          setError('Camera or microphone access denied. Please enable permissions and try again.');
        } else {
          setError(`Failed to join call: ${err.message || 'Unknown error'}`);
        }
        
        setIsConnecting(false);
      }
    };
    
    initializePeer();
    
    // Cleanup function
    return () => {
      console.log('Cleaning up peer connection');
      
      // Stop all tracks on our stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Stop screen sharing if active
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      Object.values(peerConnections.current).forEach(connection => {
        try {
          connection.close();
        } catch (err) {
          console.warn('Error closing connection:', err);
        }
      });
      
      // Close and destroy the peer
      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch (err) {
          console.warn('Error destroying peer:', err);
        }
      }
      
      // Unregister from active callers
      if (currentUser && roomId) {
        VideoCallService.unregisterCaller(roomId, currentUser.uid)
          .catch(err => console.warn('Error unregistering caller:', err));
      }
    };
  }, [currentUser, roomId, userProfile]);
  
  // Subscribe to active callers
  useEffect(() => {
    if (!roomId) return;
    
    try {
      // Create a reconnection strategy for Firestore
      let retryCount = 0;
      let unsubscribe: (() => void) | null = null;
      
      const setupSubscription = () => {
        try {
          console.log("Setting up active callers subscription");
          unsubscribe = VideoCallService.subscribeToActiveCallers(roomId, (callers) => {
            setActiveCallers(callers);
            // Reset retry count on successful data fetch
            retryCount = 0;
          });
          
          return unsubscribe;
        } catch (err) {
          console.error("Error in active callers subscription:", err);
          retryCount++;
          
          // Exponential backoff for retries up to 1 minute
          const delay = Math.min(Math.pow(2, retryCount) * 1000, 60000);
          console.log(`Retrying subscription in ${delay}ms (attempt ${retryCount})`);
          
          setTimeout(setupSubscription, delay);
          return () => {};
        }
      };
      
      const cleanup = setupSubscription();
      
      return () => {
        if (unsubscribe) {
          try {
            unsubscribe();
          } catch (err) {
            console.error("Error unsubscribing from active callers:", err);
          }
        }
      };
    } catch (err) {
      console.error('Error subscribing to active callers:', err);
      return () => {};
    }
  }, [roomId]);
  
  // Connect to active callers when they join (simplified)
  useEffect(() => {
    const connectToNewCallers = async () => {
      if (!peerRef.current || !streamRef.current || !myPeerId || !currentUser) return;
      
      // Unique set of callers to connect to
      const uniqueCallers = new Set(
        activeCallers
          .filter(caller => 
            caller.userId !== currentUser.uid && // Not ourselves
            !connectedPeers.includes(caller.peerId) // Not already connected
          )
          .map(caller => caller.peerId)
      );
      
      // Connect to each unique caller
      uniqueCallers.forEach(peerId => {
        console.log(`Initiating call to unique peer: ${peerId}`);
        
        // Prevent duplicate calls
        if (!peerConnections.current[peerId]) {
          setConnectionStatus(prev => ({
            ...prev,
            [peerId]: 'calling'
          }));
          callPeer(peerId);
        }
      });
    };
    
    connectToNewCallers();
  }, [activeCallers, connectedPeers, myPeerId, currentUser]);
  
  // Add effect to handle unmuting after connection is established
  useEffect(() => {
    if (connectedPeers.length > 0 && !isConnecting) {
      // Wait a bit after peers are connected to unmute
      const timer = setTimeout(() => {
        setRemoteMuted(false);
        safelyUnmuteVideos();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [connectedPeers.length, isConnecting]);
  
  // Function to safely unmute videos once they're playing
  const safelyUnmuteVideos = () => {
    setTimeout(() => {
      if (!remoteMuted) {
        Object.entries(peerVideoRefs.current).forEach(([peerId, el]) => {
          if (el) {
            if (el.paused) {
              el.play().catch(err => console.warn(`Cannot play remote video for ${peerId} before unmuting:`, err));
            }
            el.muted = false;
          }
        });
      }
    }, 1000);
  };
  
  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };
  
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };
  
  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
        
        // Switch back to camera
        if (streamRef.current && peerRef.current) {
          // Update our video
          const videoTracks = streamRef.current.getVideoTracks();
          if (videoTracks.length > 0 && myVideoRef.current) {
            myVideoRef.current.srcObject = streamRef.current;
          }
          
          // Update all peer connections
          Object.values(peerConnections.current).forEach(conn => {
            // Replace the track in the sender
            if (!conn.peerConnection) return;
            
            conn.peerConnection.getSenders().forEach(sender => {
              if (sender.track && sender.track.kind === 'video' && streamRef.current) {
                const videoTrack = streamRef.current.getVideoTracks()[0];
                if (videoTrack) {
                  sender.replaceTrack(videoTrack)
                    .catch(err => console.warn(`Error replacing track: ${err.message}`));
                }
              }
            });
          });
        }
        
        setIsScreenSharing(false);
      } else {
        // Start screen sharing with improved error handling
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: true,
            audio: true
          });
          
          // Save reference to screen stream
          screenStreamRef.current = screenStream;
          
          // Handle when user stops sharing via browser UI
          screenStream.getVideoTracks()[0].onended = () => {
            console.log("Screen sharing stopped via browser UI");
            if (isScreenSharing) {
              toggleScreenShare().catch(err => {
                console.error("Error handling screen share end event:", err);
              });
            }
          };
          
          // Update our video
          if (myVideoRef.current) {
            myVideoRef.current.srcObject = screenStream;
          }
          
          // Update all peer connections
          if (peerRef.current) {
            const promises = Object.values(peerConnections.current).map(conn => {
              if (!conn.peerConnection) return Promise.resolve();
              
              // Replace the track in the sender
              const replacePromises = Array.from(conn.peerConnection.getSenders())
                .filter(sender => sender.track && sender.track.kind === 'video')
                .map(sender => {
                  const videoTrack = screenStream.getVideoTracks()[0];
                  if (videoTrack) {
                    return sender.replaceTrack(videoTrack)
                      .catch(err => {
                        console.warn(`Failed to replace track: ${err.message}`);
                        // Don't throw so we continue with other senders
                      });
                  }
                  return Promise.resolve();
                });
                
              return Promise.all(replacePromises);
            });
            
            await Promise.all(promises);
          }
          
          setIsScreenSharing(true);
        } catch (err) {
          // Handle specific permission errors
          if (err.name === 'NotAllowedError') {
            console.warn("Screen sharing permission denied by user");
            // Don't show error to user for permission denial as it's expected
          } else {
            console.error('Error starting screen share:', err);
            setError('Unable to start screen sharing. Please try again.');
          }
          setIsScreenSharing(false);
        }
      }
    } catch (err) {
      console.error('Error in screen sharing toggle flow:', err);
      // Don't set error state for user cancellation
      if (err.name !== 'NotAllowedError' || !isScreenSharing) {
        setError('Failed to toggle screen sharing. Please try again.');
      }
      // If error occurs during start, make sure state is correct
      if (!isScreenSharing) {
        setIsScreenSharing(false);
      }
    }
  };
  
  // Improved video stream handling function
  const safelyLoadVideoStream = (peerId: string, remoteStream: MediaStream) => {
    const videoElement = peerVideoRefs.current[peerId];
    if (!videoElement) {
      console.warn(`No video element found for peer ${peerId}`);
      return;
    }

    // Comprehensive stream and video element reset
    const resetVideoElement = () => {
      try {
        // Stop and clear any existing tracks
        if (videoElement.srcObject) {
          const currentStream = videoElement.srcObject as MediaStream;
          currentStream.getTracks().forEach(track => track.stop());
        }

        // Reset video element state
        videoElement.pause();
        videoElement.removeAttribute('src');
        videoElement.removeAttribute('srcObject');
        videoElement.load();
      } catch (resetErr) {
        console.warn(`Error resetting video element for peer ${peerId}:`, resetErr);
      }
    };

    // Reset video element before loading new stream
    resetVideoElement();

    // Delayed, careful stream loading
    requestAnimationFrame(() => {
      try {
        // Carefully set the new stream
        videoElement.srcObject = remoteStream;
        videoElement.muted = true;

        // Advanced play strategy with comprehensive error handling
        const playWithAdvancedFallback = (attempts = 0) => {
          if (attempts >= 3) {
            console.error(`Persistent video play failure for peer ${peerId}`);
            setConnectionStatus(prev => ({
              ...prev,
              [peerId]: 'error'
            }));
            return;
          }

          // Wrap play in a promise to handle both promise-based and callback-based browsers
          const playPromise = videoElement.play();

          if (playPromise instanceof Promise) {
            playPromise
              .then(() => {
                console.log(`Successfully played video for peer ${peerId}`);
                setConnectionStatus(prev => ({
                  ...prev,
                  [peerId]: 'connected'
                }));
              })
              .catch((err) => {
                console.warn(`Play attempt ${attempts + 1} failed for peer ${peerId}:`, err);

                // Sophisticated error handling
                switch (err.name) {
                  case 'AbortError':
                  case 'NotAllowedError':
                    // Retry with exponential backoff
                    setTimeout(
                      () => playWithAdvancedFallback(attempts + 1), 
                      500 * Math.pow(2, attempts)
                    );
                    break;
                  case 'NotSupportedError':
                    console.error(`Codec or stream not supported for peer ${peerId}`);
                    setConnectionStatus(prev => ({
                      ...prev,
                      [peerId]: 'error'
                    }));
                    break;
                  default:
                    // Generic error handling
                    setConnectionStatus(prev => ({
                      ...prev,
                      [peerId]: 'error'
                    }));
                }
              });
          } else {
            // Fallback for older browsers or unexpected play() behavior
            try {
              videoElement.play();
              setConnectionStatus(prev => ({
                ...prev,
                [peerId]: 'connected'
              }));
            } catch (directPlayErr) {
              console.warn(`Direct play failed for peer ${peerId}:`, directPlayErr);
              setConnectionStatus(prev => ({
                ...prev,
                [peerId]: 'error'
              }));
            }
          }
        };

        // Initiate play with fallback
        playWithAdvancedFallback();
      } catch (setupErr) {
        console.error(`Comprehensive error setting up video stream for peer ${peerId}:`, setupErr);
        setConnectionStatus(prev => ({
          ...prev,
          [peerId]: 'error'
        }));
      }
    });
  };

  // Modify callPeer to use new video loading method
  const callPeer = (peerId: string) => {
    if (!peerRef.current || !streamRef.current) return;
    
    // Prevent duplicate calls
    if (peerConnections.current[peerId]) {
      console.warn(`Already have a connection to peer ${peerId}`);
      return;
    }
    
    const call = peerRef.current.call(peerId, streamRef.current);
    
    // Store the connection immediately
    peerConnections.current[peerId] = call;
    
    call.on('stream', (remoteStream) => {
      console.log(`Received stream from called peer: ${peerId}`);
      
      // Ensure we don't add duplicate peers
      setConnectedPeers(prev => 
        prev.includes(peerId) ? prev : [...prev, peerId]
      );
      
      // Update connection status
      setConnectionStatus(prev => ({
        ...prev,
        [peerId]: 'connecting'
      }));
      
      // Use improved stream loading
      setTimeout(() => {
        safelyLoadVideoStream(peerId, remoteStream);
      }, 500);
    });
    
    call.on('close', () => {
      console.log(`Call closed with peer: ${peerId}`);
      handlePeerDisconnect(peerId);
    });
    
    call.on('error', (err) => {
      console.error(`Call error with peer ${peerId}:`, err);
      handlePeerDisconnect(peerId);
    });
  };
  
  const handleEndCall = () => {
    // Stop all media tracks
    streamRef.current?.getTracks().forEach(track => track.stop());
    screenStreamRef.current?.getTracks().forEach(track => track.stop());
    
    // Close all peer connections
    Object.values(peerConnections.current).forEach(connection => {
      connection.close();
    });
    
    // Destroy the peer
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    
    // Call the parent's callback
    onEndCall();
  };
  
  // Find username for connected peer
  const getPeerName = (peerId: string): string => {
    const caller = activeCallers.find(c => c.peerId === peerId);
    return caller ? caller.userName : `User ${peerId.split('-')[1]}`;
  };
  
  // Focus on a specific peer video (or set to null for grid view)
  const handleFocusVideo = (peerId: string | null) => {
    setFocusedPeerId(peerId === focusedPeerId ? null : peerId);
  };
  
  // Determine appropriate layout based on participant count
  const getParticipantCount = () => {
    // Count all participants (local user + remote peers)
    return 1 + connectedPeers.length;
  };
  
  // Get connection status icon/text
  const getConnectionStatusIndicator = (peerId: string) => {
    const status = connectionStatus[peerId] || 'unknown';
    
    switch (status) {
      case 'connecting':
        return <div className="connection-status connecting">Connecting...</div>;
      case 'calling':
        return <div className="connection-status calling">Calling...</div>;
      case 'error':
        return <div className="connection-status error">Connection error</div>;
      case 'disconnected':
        return <div className="connection-status disconnected">Disconnected</div>;
      default:
        return null;
    }
  };
  
  // Monitor online/offline status and handle reconnection
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network is back online");
      setIsOnline(true);
      
      // Only attempt reconnection if we were previously connected
      if (isReconnecting && peerRef.current) {
        console.log("Attempting to reconnect peer after network recovery");
        
        // Add a small delay to let the network stabilize
        if (reconnectionTimeoutRef.current) {
          window.clearTimeout(reconnectionTimeoutRef.current);
        }
        
        reconnectionTimeoutRef.current = window.setTimeout(() => {
          try {
            // Try to reconnect the peer
            peerRef.current?.reconnect();
            setIsReconnecting(false);
          } catch (err) {
            console.error("Failed to reconnect after network recovery:", err);
            // If reconnection fails, we may need to reinitialize the connection
            reinitializeConnection();
          }
          reconnectionTimeoutRef.current = null;
        }, 2000);
      }
    };
    
    const handleOffline = () => {
      console.log("Network is offline");
      setIsOnline(false);
      
      // Mark as reconnecting if we were already connected
      if (peerRef.current) {
        setIsReconnecting(true);
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (reconnectionTimeoutRef.current) {
        window.clearTimeout(reconnectionTimeoutRef.current);
        reconnectionTimeoutRef.current = null;
      }
    };
  }, [isReconnecting, reinitializeConnection]);
  
  // Function to play video with retry logic
  const playVideo = (peerId: string, stream: MediaStream) => {
    const videoElement = peerVideoRefs.current[peerId];
    if (!videoElement) {
      console.warn(`No video element found for peer ${peerId}`);
      return;
    }

    // Set the stream
    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream;
    }

    // Initially muted to help with autoplay
    videoElement.muted = true;

    // Use play() with catch, retry logic and max attempts
    const attemptPlay = (attempts = 0, delay = 200) => {
      if (attempts >= 5) {
        console.warn(`Max retry attempts reached for peer ${peerId}`);
        setConnectionStatus(prev => ({
          ...prev,
          [peerId]: 'error'
        }));
        return;
      }

      videoElement.play()
        .catch(err => {
          if (err.name === 'AbortError' && attempts < 5) {
            console.warn(`Play was aborted for peer ${peerId} (attempt ${attempts+1}/5), retrying in ${delay}ms`);
            setTimeout(() => attemptPlay(attempts + 1, delay * 1.5), delay);
          } else {
            console.error("Error playing remote video:", err);
            setConnectionStatus(prev => ({
              ...prev,
              [peerId]: 'error'
            }));
          }
        });
    };

    attemptPlay();
  };

  // Handle peer disconnection
  const handlePeerDisconnect = (peerId: string) => {
    console.log(`Handling disconnect for peer: ${peerId}`);
    
    // Prevent multiple disconnection attempts
    if (!peerConnections.current[peerId]) {
      console.warn(`Peer ${peerId} already disconnected`);
      return;
    }
    
    // Close the specific peer connection
    try {
      const peerConnection = peerConnections.current[peerId];
      peerConnection.close();
    } catch (err) {
      console.warn(`Error closing connection for peer ${peerId}:`, err);
    }
    
    // Remove from connected peers
    setConnectedPeers(prev => prev.filter(id => id !== peerId));
    
    // Remove from peer connections
    delete peerConnections.current[peerId];
    
    // Remove video ref
    if (peerVideoRefs.current[peerId]) {
      const videoElement = peerVideoRefs.current[peerId];
      if (videoElement) {
        videoElement.srcObject = null;
      }
      delete peerVideoRefs.current[peerId];
    }
    
    // Update connection status
    setConnectionStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[peerId];
      return newStatus;
    });
    
    // If this was the focused peer, reset focus
    if (focusedPeerId === peerId) {
      setFocusedPeerId(null);
    }
    
    // Attempt to unregister caller from Firestore
    if (currentUser && roomId) {
      VideoCallService.unregisterCaller(roomId, peerId)
        .catch(err => console.warn('Error unregistering disconnected caller:', err));
    }
  };
  
  return (
    <div className="video-call-container">
      {error ? (
        <div className="connecting-overlay error">
          <p>Error: {error}</p>
          <button className="control-button end-call" onClick={handleEndCall}>
            Close
          </button>
        </div>
      ) : isConnecting ? (
        <div className="connecting-overlay">
          <div className="connecting-spinner"></div>
          <p>{isReconnecting ? "Reconnecting to video call..." : "Connecting to video call..."}</p>
          <p className="connecting-tip">{isReconnecting ? "Recovering connection after network change" : "Please allow camera and microphone access"}</p>
        </div>
      ) : !isOnline ? (
        <div className="connecting-overlay">
          <div className="connecting-spinner"></div>
          <p>Network connection lost</p>
          <p className="connecting-tip">Waiting for network to reconnect...</p>
        </div>
      ) : (
        <div className="video-call-interface">
          <div className="video-call-header">
            <h3>Video Call</h3>
            <div className="active-users">
              <UserGroupIcon className="h-4 w-4" />
              <span>{activeCallers.length} active</span>
            </div>
          </div>
          
          <div className="videos-container">
            {/* My video - always first */}
            <div className={`local-video-container ${!isVideoEnabled ? 'video-disabled' : ''}`}>
              <video 
                ref={myVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className={!isVideoEnabled ? 'disabled' : ''}
              />
              {!isVideoEnabled && (
                <div className="video-disabled-overlay">
                  <VideoCameraIconOff className="h-12 w-12 text-white opacity-50" />
                </div>
              )}
              <div className="video-label">
                You {isAudioEnabled ? '' : '(Muted)'}
              </div>
            </div>
            
            {/* Remote videos */}
            {connectedPeers.map(peerId => {
              const activeCaller = activeCallers.find(caller => caller.peerId === peerId);
              const connectionState = connectionStatus[peerId] || 'connecting';
              
              return (
                <div 
                  key={peerId} 
                  className={`remote-video-container ${connectionState}`}
                  onClick={() => handleFocusVideo(peerId)}
                >
                  <video
                    ref={el => peerVideoRefs.current[peerId] = el}
                    autoPlay
                    playsInline
                    muted={remoteMuted}
                  />
                  <div className="video-label">
                    {activeCaller?.userName || `Participant ${peerId.split('-')[1]}`}
                    {connectionState !== 'connected' && ` (${
                      connectionState === 'connecting' ? 'Connecting...' :
                      connectionState === 'error' ? 'Connection Issue' :
                      'Disconnected'
                    })`}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="video-controls">
            <button 
              className={`control-button ${isAudioEnabled ? 'active' : 'inactive'}`}
              onClick={toggleAudio}
              title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {isAudioEnabled ? 
                <MicrophoneIcon className="h-5 w-5" /> : 
                <MicrophoneIconOff className="h-5 w-5" />
              }
            </button>
            
            <button 
              className={`control-button ${isVideoEnabled ? 'active' : 'inactive'}`}
              onClick={toggleVideo}
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? 
                <VideoCameraIcon className="h-5 w-5" /> : 
                <VideoCameraIconOff className="h-5 w-5" />
              }
            </button>
            
            <button 
              className={`control-button ${isScreenSharing ? 'active' : 'inactive'}`}
              onClick={toggleScreenShare}
              title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
            >
              {isScreenSharing ? 
                <ArrowsPointingOutIcon className="h-5 w-5" /> : 
                <ComputerDesktopIcon className="h-5 w-5" />
              }
            </button>
            
            <button 
              className="control-button end-call"
              onClick={handleEndCall}
              title="End call"
            >
              <PhoneIcon className="h-5 w-5 rotate-135" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallComponent; 