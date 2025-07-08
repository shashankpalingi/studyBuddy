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
      myVideoRef.current.play().catch(err => {
        console.error("Error playing local video from useEffect:", err);
      });
    }
  }, [streamRef.current, myVideoRef.current]);
  
  // Initialize peer connection
  useEffect(() => {
    if (!currentUser || !roomId) return;
    
    const initializePeer = async () => {
      try {
        setIsConnecting(true);
        // Get user media stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        streamRef.current = stream;
        
        // Create peer connection with unique ID based on user and room
        const peerId = `${roomId}-${currentUser.uid}`;
        const peer = new Peer(peerId);
        
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
            // Continue with the call even if registration fails
            // The P2P connection can still work without Firebase tracking
          }
          
          // Listen for incoming calls
          peer.on('call', (call) => {
            // Answer the call with our stream
            call.answer(streamRef.current!);
            
            // Handle stream from the caller
            call.on('stream', (remoteStream) => {
              // Extract the caller's ID from their peer ID
              const callerId = call.peer;
              if (!connectedPeers.includes(callerId)) {
                setConnectedPeers(prev => [...prev, callerId]);
              }
              
              // Store the connection
              peerConnections.current[callerId] = call;
              
              // Schedule attaching the stream to the element in the next frame
              // This ensures the element exists in the DOM
              setTimeout(() => {
                const videoElement = peerVideoRefs.current[callerId];
                if (videoElement) {
                  videoElement.srcObject = remoteStream;
                  videoElement.play().catch(err => {
                    console.error("Error playing remote video:", err);
                  });
                }
              }, 100);
            });
          });
          
          peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            setError(`Connection error: ${err.message}`);
            setIsConnecting(false);
          });
          
          setIsConnecting(false);
        });
        
        return peer;
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
    
    const peer = initializePeer();
    
    return () => {
      // Clean up
      streamRef.current?.getTracks().forEach(track => track.stop());
      
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      
      // Unregister from active callers
      if (currentUser && roomId) {
        // Try to unregister but don't block on it
        VideoCallService.unregisterCaller(roomId, currentUser.uid).catch(err => {
          console.error('Failed to unregister caller:', err);
          // We can safely ignore this error during cleanup
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
      
      return () => {
        try {
          unsubscribe();
        } catch (err) {
          console.error('Error unsubscribing from active callers:', err);
        }
      };
    } catch (err) {
      console.error('Error subscribing to active callers:', err);
      // Continue without active callers subscription
      // The P2P connection can still work directly
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
        console.log(`Calling peer: ${caller.peerId}`);
        callPeer(caller.peerId);
      });
    };
    
    connectToNewCallers();
  }, [activeCallers, connectedPeers, myPeerId, currentUser]);
  
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
      if (!connectedPeers.includes(peerId)) {
        setConnectedPeers(prev => [...prev, peerId]);
      }
      
      // Store the connection
      peerConnections.current[peerId] = call;
      
      // Schedule attaching the stream to the element in the next frame
      // This ensures the element exists in the DOM
      setTimeout(() => {
        const videoElement = peerVideoRefs.current[peerId];
        if (videoElement) {
          videoElement.srcObject = remoteStream;
          videoElement.play().catch(err => {
            console.error("Error playing remote video:", err);
          });
        }
      }, 100);
    });
    
    call.on('close', () => {
      setConnectedPeers(prev => prev.filter(id => id !== peerId));
      delete peerConnections.current[peerId];
    });
  };
  
  const handleEndCall = () => {
    // Stop all media tracks
    streamRef.current?.getTracks().forEach(track => track.stop());
    
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
            {/* Grid layout for all participants */}
            <div className={`videos-grid participants-${Math.min(activeCallers.length, 4)}`}>
              {/* Local user's video */}
              <div className="video-wrapper self-video">
                <video 
                  ref={myVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={isVideoEnabled ? "" : "video-disabled"}
                />
                <div className="video-label">You</div>
                {!isVideoEnabled && <div className="video-off-indicator">Camera Off</div>}
              </div>

              {/* Remote peers' videos */}
              {connectedPeers.map(peerId => (
                <div key={peerId} className="video-wrapper">
                  <video
                    ref={el => {
                      peerVideoRefs.current[peerId] = el;
                      // If we already have a stream for this peer, assign it now
                      const conn = peerConnections.current[peerId];
                      if (conn && el && !el.srcObject && conn.remoteStream) {
                        el.srcObject = conn.remoteStream;
                        el.play().catch(err => console.error("Error playing remote video:", err));
                      }
                    }}
                    autoPlay
                    playsInline
                  />
                  <div className="video-label">{getPeerName(peerId)}</div>
                </div>
              ))}
            </div>

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
            >
              {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            
            <button 
              className={`control-button ${!isVideoEnabled ? 'disabled' : ''}`}
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <VideoIcon size={20} /> : <VideoOff size={20} />}
            </button>
            
            <button 
              className={`control-button ${isScreenSharing ? 'active' : ''}`}
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
            </button>
            
            <button 
              className="control-button end-call"
              onClick={handleEndCall}
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