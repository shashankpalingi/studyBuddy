import React, { useState, useEffect, useRef } from 'react';
import './VideoRoom.css';

interface VideoRoomProps {
  roomId: string;
}

const VideoRoom: React.FC<VideoRoomProps> = ({ roomId }) => {
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate unique Jitsi room name based on study room ID
  const jitsiRoomName = `studybuddy-${roomId}`;
  const jitsiUrl = `https://meet.jit.si/${jitsiRoomName}`;

  // Start video call
  const startVideoCall = () => {
    setIsVideoActive(true);
    setShowControls(false);
  };

  // End video call
  const endVideoCall = () => {
    setIsVideoActive(false);
    setShowControls(true);
    // Reload iframe to properly disconnect
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  };

  // Toggle controls visibility
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // Copy meeting link to clipboard
  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(jitsiUrl);
      alert('Meeting link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy meeting link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = jitsiUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Meeting link copied to clipboard!');
    }
  };

  return (
    <div className="video-room-container">
      {/* Video Controls */}
      {showControls && (
        <div className="video-controls">
          <div className="video-header">
            <h3>🎥 Video Conference</h3>
            <p>Study Room: {roomId}</p>
          </div>

          {!isVideoActive ? (
            <div className="video-start-section">
              <div className="video-info">
                <h4>Ready to start video conference?</h4>
                <p>This will open a video call that other room members can join.</p>
                <div className="meeting-link">
                  <strong>Meeting Link:</strong>
                  <div className="link-container">
                    <span className="link-text">{jitsiUrl}</span>
                    <button 
                      className="copy-link-btn"
                      onClick={copyMeetingLink}
                      title="Copy meeting link"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="video-actions">
                <button 
                  className="start-video-btn"
                  onClick={startVideoCall}
                >
                  🎥 Start Video Call
                </button>
              </div>
            </div>
          ) : (
            <div className="video-active-controls">
              <div className="control-buttons">
                <button 
                  className="control-btn copy-btn"
                  onClick={copyMeetingLink}
                  title="Copy meeting link"
                >
                  📋 Copy Link
                </button>
                <button 
                  className="control-btn hide-btn"
                  onClick={toggleControls}
                  title="Hide controls"
                >
                  👁️ Hide Controls
                </button>
                <button 
                  className="control-btn end-btn"
                  onClick={endVideoCall}
                  title="End video call"
                >
                  📞 End Call
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating controls when video is active and controls are hidden */}
      {isVideoActive && !showControls && (
        <div className="floating-controls">
          <button 
            className="floating-btn show-controls-btn"
            onClick={toggleControls}
            title="Show controls"
          >
            ⚙️
          </button>
          <button 
            className="floating-btn copy-link-btn"
            onClick={copyMeetingLink}
            title="Copy meeting link"
          >
            📋
          </button>
          <button 
            className="floating-btn end-call-btn"
            onClick={endVideoCall}
            title="End call"
          >
            📞
          </button>
        </div>
      )}

      {/* Jitsi Meet Iframe */}
      {isVideoActive && (
        <div className="video-iframe-container">
          <iframe
            ref={iframeRef}
            src={jitsiUrl}
            className="video-iframe"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            allowFullScreen
            title={`Video Conference - Study Room ${roomId}`}
          />
        </div>
      )}

      {/* Instructions when no video is active */}
      {!isVideoActive && (
        <div className="video-instructions">
          <div className="instructions-content">
            <div className="icon">🎥</div>
            <h3>Video Conference Room</h3>
            <p>Start a video call to collaborate with your study group in real-time.</p>
            
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">👥</span>
                <span>Multiple participants can join</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎤</span>
                <span>Audio and video communication</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🖥️</span>
                <span>Screen sharing capability</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💬</span>
                <span>Built-in text chat</span>
              </div>
            </div>

            <div className="privacy-note">
              <strong>Privacy:</strong> Only members of this study room can access the video call using the unique meeting link.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoRoom;
