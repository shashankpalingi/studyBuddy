import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Peer, { MediaConnection } from 'peerjs';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Phone, Users, Monitor, MonitorOff } from 'lucide-react';
import './VideoCall.css';
import { VideoCallService } from './VideoCallService';

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
  
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Record<string, MediaConnection>>({});
  const peerVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  
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
  
  // Initialize peer connection
  useEffect(() => {
    if (!currentUser || !roomId) return;
    
    let peerInstance: Peer | null = null;
    
    const initializePeer = async () => {
      try {
        setIsConnecting(true);
        setConnectionStatus({});
        
        // Get user media stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        streamRef.current = stream;
        
        // Create peer connection with unique ID based on user and room
        const peerId = `${roomId}-${currentUser.uid}`;
        
        // Clean up any existing peer connection
        if (peerRef.current) {
          peerRef.current.destroy();
        }
        
        const peer = new Peer(peerId, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
            ]
          }
        });
        
        peerInstance = peer;
        
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
          } catch (err) {
            console.error('Failed to register as caller:', err);
          }
          
          // Listen for incoming calls
          peer.on('call', (call) => {
            // Update connection status
            setConnectionStatus(prev => ({
              ...prev, 
              [call.peer]: 'connecting'
            }));
            
            // Answer the call with our stream
            call.answer(streamRef.current!);
            
            // Handle stream from the caller
            call.on('stream', (remoteStream) => {
              // Extract the caller's ID from their peer ID
              const callerId = call.peer;
              
              // Only add peer if not already connected
              if (!connectedPeers.includes(callerId)) {
                console.log(`Received stream from peer: ${callerId}`);
                setConnectedPeers(prev => [...prev, callerId]);
                
                // If this is the first peer and we don't have a focused peer yet, focus on them
                if (connectedPeers.length === 0 && !focusedPeerId) {
                  setFocusedPeerId(callerId);
                }
              }
              
              // Store the connection
              peerConnections.current[callerId] = call;
              
              // Update connection status
              setConnectionStatus(prev => ({
                ...prev, 
                [callerId]: 'connected'
              }));
              
              // More reliable approach to attach the stream to the video element
              setTimeout(() => {
                const videoElement = peerVideoRefs.current[callerId];
                if (videoElement) {
                  // Only set srcObject if it's not already set to avoid unnecessary reload
                  if (videoElement.srcObject !== remoteStream) {
                    videoElement.srcObject = remoteStream;
                    // Initially muted to help with autoplay
                    videoElement.muted = true;
                    
                    // Use play() with catch, retry logic and max attempts
                    const attemptPlay = (attempts = 0, delay = 200) => {
                      if (attempts >= 5) {
                        console.warn(`Max retry attempts reached for peer ${callerId}`);
                        setConnectionStatus(prev => ({
                          ...prev, 
                          [callerId]: 'error'
                        }));
                        return;
                      }
                      
                      videoElement.play()
                        .catch(err => {
                          if (err.name === 'AbortError' && attempts < 5) {
                            console.warn(`Play was aborted for peer ${callerId} (attempt ${attempts+1}/5), retrying in ${delay}ms`);
                            setTimeout(() => attemptPlay(attempts + 1, delay * 1.5), delay);
                          } else {
                            console.error("Error playing remote video:", err);
                            setConnectionStatus(prev => ({
                              ...prev, 
                              [callerId]: 'error'
                            }));
                          }
                        });
                    };
                    
                    attemptPlay();
                  }
                }
              }, 500); // Increased timeout for better DOM stability
            });
            
            // Handle call close/error
            call.on('close', () => {
              const callerId = call.peer;
              console.log(`Call closed with peer: ${callerId}`);
              setConnectedPeers(prev => prev.filter(id => id !== callerId));
              
              // If this was the focused peer, reset focused peer
              if (focusedPeerId === callerId) {
                setFocusedPeerId(null);
              }
              
              delete peerConnections.current[callerId];
              setConnectionStatus(prev => ({
                ...prev,
                [callerId]: 'disconnected'
              }));
            });
            
            call.on('error', (err) => {
              const callerId = call.peer;
              console.error(`Call error with peer ${callerId}:`, err);
              setConnectionStatus(prev => ({
                ...prev,
                [callerId]: 'error'
              }));
            });
          });
          
          // Handle peer errors
          peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            setError(`Connection error: ${err.message}`);
            setIsConnecting(false);
          });
          
          // Handle peer disconnection
          peer.on('disconnected', () => {
            console.log('Peer disconnected. Attempting to reconnect...');
            try {
              peer.reconnect();
            } catch (err) {
              console.error('Failed to reconnect peer:', err);
              setError('Connection lost. Please try rejoining the call.');
            }
          });
          
          setIsConnecting(false);
        });
      } catch (err) {
        console.error('Error setting up video call:', err);
        
        // Show a user-friendly error message
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setError('Camera/microphone access denied. Please allow access in your browser settings.');
        } else if (err instanceof DOMException && err.name === 'NotFoundError') {
          setError('No camera or microphone found. Please connect a device.');
        } else {
          setError(`Failed to set up video call: ${err.message}`);
        }
        
        setIsConnecting(false);
      }
    };
    
    initializePeer();
    
    return () => {
      // Clean up
      streamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      
      // Close all peer connections
      Object.values(peerConnections.current).forEach(connection => {
        connection.close();
      });
      
      if (peerInstance) {
        peerInstance.destroy();
      }
      
      // Unregister from active callers
      if (currentUser && roomId) {
        VideoCallService.unregisterCaller(roomId, currentUser.uid).catch(err => {
          console.error('Failed to unregister caller:', err);
        });
      }
    };
  }, [currentUser, roomId, userProfile]);
  
  // Subscribe to active callers
  useEffect(() => {
    if (!roomId) return;
    
    try {
      const unsubscribe = VideoCallService.subscribeToActiveCallers(roomId, (callers) => {
        setActiveCallers(callers);
      });
      
      return unsubscribe;
    } catch (err) {
      console.error('Error subscribing to active callers:', err);
      return () => {};
    }
  }, [roomId]);
  
  // Connect to active callers when they join
  useEffect(() => {
    const connectToNewCallers = async () => {
      if (!peerRef.current || !streamRef.current || !myPeerId || !currentUser) return;
      
      // Find callers that we haven't connected to yet
      const newCallers = activeCallers.filter(caller => 
        caller.userId !== currentUser.uid && // Not ourselves
        !connectedPeers.includes(caller.peerId) && // Not already connected
        !Object.keys(peerConnections.current).includes(caller.peerId) // Not in our connections
      );
      
      // Connect to each new caller
      newCallers.forEach(caller => {
        console.log(`Initiating call to peer: ${caller.peerId}`);
        setConnectionStatus(prev => ({
          ...prev,
          [caller.peerId]: 'calling'
        }));
        callPeer(caller.peerId);
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
            conn.peerConnection.getSenders().forEach(sender => {
              if (sender.track && sender.track.kind === 'video' && streamRef.current) {
                const videoTrack = streamRef.current.getVideoTracks()[0];
                if (videoTrack) {
                  sender.replaceTrack(videoTrack);
                }
              }
            });
          });
        }
        
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: true
        });
        
        // Save reference to screen stream
        screenStreamRef.current = screenStream;
        
        // Handle when user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
        
        // Update our video
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = screenStream;
        }
        
        // Update all peer connections
        if (peerRef.current) {
          Object.values(peerConnections.current).forEach(conn => {
            // Replace the track in the sender
            conn.peerConnection.getSenders().forEach(sender => {
              if (sender.track && sender.track.kind === 'video') {
                const videoTrack = screenStream.getVideoTracks()[0];
                if (videoTrack) {
                  sender.replaceTrack(videoTrack);
                }
              }
            });
          });
        }
        
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error('Error toggling screen share:', err);
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
  
  const callPeer = (peerId: string) => {
    if (!peerRef.current || !streamRef.current) return;
    
    const call = peerRef.current.call(peerId, streamRef.current);
    
    call.on('stream', (remoteStream) => {
      console.log(`Received stream from called peer: ${peerId}`);
      
      if (!connectedPeers.includes(peerId)) {
        setConnectedPeers(prev => [...prev, peerId]);
        
        // If this is the first peer and we don't have a focused peer yet, focus on them
        if (connectedPeers.length === 0 && !focusedPeerId) {
          setFocusedPeerId(peerId);
        }
      }
      
      // Store the connection
      peerConnections.current[peerId] = call;
      
      // Update connection status
      setConnectionStatus(prev => ({
        ...prev,
        [peerId]: 'connected'
      }));
      
      // More reliable approach to attach the stream to the video element
      setTimeout(() => {
        const videoElement = peerVideoRefs.current[peerId];
        if (videoElement) {
          // Only set srcObject if it's not already set to avoid unnecessary reload
          if (videoElement.srcObject !== remoteStream) {
            videoElement.srcObject = remoteStream;
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
          }
        }
      }, 500); // Increased timeout for better DOM stability
    });
    
    call.on('close', () => {
      console.log(`Call closed with called peer: ${peerId}`);
      setConnectedPeers(prev => prev.filter(id => id !== peerId));
      
      // If this was the focused peer, reset focused peer
      if (focusedPeerId === peerId) {
        setFocusedPeerId(null);
      }
      
      delete peerConnections.current[peerId];
      setConnectionStatus(prev => ({
        ...prev,
        [peerId]: 'disconnected'
      }));
    });
    
    call.on('error', (err) => {
      console.error(`Call error with called peer ${peerId}:`, err);
      setConnectionStatus(prev => ({
        ...prev,
        [peerId]: 'error'
      }));
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
          <p>Connecting to video call...</p>
          <p className="connecting-tip">Please allow camera and microphone access</p>
        </div>
      ) : (
        <div className="video-call-content-wrapper">
          <div className="video-call-header">
            <h3>Video Call</h3>
            <div className="active-users">
              <Users size={16} />
              <span>{activeCallers.length} active</span>
            </div>
          </div>
          
          <div className="video-main-area">
            {/* Focus view or grid layout */}
            {focusedPeerId ? (
              <div className="video-focus-layout">
                {/* Main focused video */}
                <div className="focus-video-container">
                  {focusedPeerId === 'local' ? (
                    <div className="video-wrapper focused">
                      <video
                        ref={myVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className={isVideoEnabled ? "" : "video-disabled"}
                      />
                      <div className="video-label">You {isScreenSharing ? '(Sharing Screen)' : ''}</div>
                      {!isVideoEnabled && <div className="video-off-indicator">Camera Off</div>}
                      <div className="focus-control">
                        <button className="unfocus-button" onClick={() => handleFocusVideo(null)}>
                          <span>Exit Focus View</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="video-wrapper focused">
                      <video
                        ref={el => peerVideoRefs.current[focusedPeerId!] = el}
                        autoPlay
                        playsInline
                        muted={remoteMuted}
                      />
                      <div className="video-label">{getPeerName(focusedPeerId)}</div>
                      {getConnectionStatusIndicator(focusedPeerId)}
                      <div className="focus-control">
                        <button className="unfocus-button" onClick={() => handleFocusVideo(null)}>
                          <span>Exit Focus View</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Thumbnails strip */}
                <div className="thumbnails-container">
                  {/* Local user thumbnail */}
                  <div className={`video-thumbnail ${focusedPeerId === 'local' ? 'active' : ''}`} onClick={() => handleFocusVideo('local')}>
                    <video
                      ref={focusedPeerId !== 'local' ? myVideoRef : undefined}
                      autoPlay
                      muted
                      playsInline
                      className={isVideoEnabled ? "" : "video-disabled"}
                    />
                    <div className="thumbnail-label">You</div>
                    {!isVideoEnabled && <div className="thumbnail-off-indicator">Off</div>}
                  </div>
                  
                  {/* Remote peers thumbnails */}
                  {connectedPeers.map(peerId => (
                    peerId !== focusedPeerId && (
                      <div 
                        key={peerId} 
                        className={`video-thumbnail ${connectionStatus[peerId] === 'error' ? 'error' : ''}`}
                        onClick={() => handleFocusVideo(peerId)}
                      >
                        <video
                          ref={el => {
                            if (peerId !== focusedPeerId) {
                              peerVideoRefs.current[peerId] = el;
                              // Auto-connect stream if available
                              const conn = peerConnections.current[peerId];
                              if (conn && el && !el.srcObject && conn.remoteStream) {
                                el.srcObject = conn.remoteStream;
                                el.muted = remoteMuted;
                                el.play().catch(err => console.warn(`Error playing thumbnail: ${err.message}`));
                              }
                            }
                          }}
                          autoPlay
                          playsInline
                          muted={remoteMuted}
                        />
                        <div className="thumbnail-label">{getPeerName(peerId)}</div>
                        {connectionStatus[peerId] === 'error' && <div className="thumbnail-error-indicator">Error</div>}
                      </div>
                    )
                  ))}
                </div>
              </div>
            ) : (
              /* Grid layout for all participants */
              <div className={`videos-grid participants-${getParticipantCount()}`}>
                {/* Local user's video */}
                <div 
                  className="video-wrapper self-video" 
                  onClick={() => handleFocusVideo('local')}
                >
                  <video 
                    ref={myVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={isVideoEnabled ? "" : "video-disabled"}
                  />
                  <div className="video-label">You {isScreenSharing ? '(Sharing Screen)' : ''}</div>
                  {!isVideoEnabled && <div className="video-off-indicator">Camera Off</div>}
                  <div className="focus-icon" title="Focus on this video">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="22 3 2 3 2 21 22 21 22 3"></polygon>
                      <path d="M15 9l-6 6"></path>
                      <path d="M9 9l0 0"></path>
                      <path d="M15 15l0 0"></path>
                    </svg>
                  </div>
                </div>

                {/* Remote peers' videos */}
                {connectedPeers.map(peerId => (
                  <div 
                    key={peerId} 
                    className={`video-wrapper ${connectionStatus[peerId] === 'error' ? 'error' : ''}`}
                    onClick={() => handleFocusVideo(peerId)}
                  >
                    <video
                      ref={el => {
                        peerVideoRefs.current[peerId] = el;
                        // Auto-connect stream if available
                        const conn = peerConnections.current[peerId];
                        if (conn && el && !el.srcObject && conn.remoteStream) {
                          el.srcObject = conn.remoteStream;
                          el.muted = remoteMuted;
                          
                          const attemptPlay = (attempts = 0, delay = 200) => {
                            if (attempts >= 5) return;
                            
                            el.play().catch(err => {
                              if (err.name === 'AbortError' && attempts < 5) {
                                setTimeout(() => attemptPlay(attempts + 1, delay * 1.5), delay);
                              }
                            });
                          };
                          
                          attemptPlay();
                        }
                      }}
                      autoPlay
                      playsInline
                      muted={remoteMuted}
                    />
                    <div className="video-label">{getPeerName(peerId)}</div>
                    {getConnectionStatusIndicator(peerId)}
                    <div className="focus-icon" title="Focus on this video">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="22 3 2 3 2 21 22 21 22 3"></polygon>
                        <path d="M15 9l-6 6"></path>
                        <path d="M9 9l0 0"></path>
                        <path d="M15 15l0 0"></path>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Message overlays */}
            {activeCallers.length <= 1 && (
              <div className="message-overlay solo-message">
                <p>Waiting for others to join...</p>
                <p className="solo-tip">Share the room link to invite others</p>
              </div>
            )}
          </div>
          
          {/* Video Controls */}
          <div className="video-controls">
            <button 
              className={`control-button ${!isAudioEnabled ? 'disabled' : ''}`}
              onClick={toggleAudio}
              title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            
            <button 
              className={`control-button ${!isVideoEnabled ? 'disabled' : ''}`}
              onClick={toggleVideo}
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? <VideoIcon size={20} /> : <VideoOff size={20} />}
            </button>
            
            <button 
              className={`control-button ${isScreenSharing ? 'active' : ''}`}
              onClick={toggleScreenShare}
              title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
            >
              {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
            </button>
            
            <button 
              className="control-button end-call"
              onClick={handleEndCall}
              title="End call"
            >
              <Phone size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallComponent; 