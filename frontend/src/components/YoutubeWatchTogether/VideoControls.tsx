import React from 'react';

interface VideoState {
  videoId: string;
  status: 'playing' | 'paused' | 'buffering' | 'ended';
  timestamp: number;
  lastUpdated: any;
  updatedBy: string;
  updatedByName: string;
  queue: {
    videoId: string;
    title: string;
    thumbnail: string;
    addedBy: string;
    addedByName: string;
  }[];
}

interface VideoControlsProps {
  videoState: VideoState | null;
  isHost: boolean;
  onPlayNext: () => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({ videoState, isHost, onPlayNext }) => {
  // Format time in mm:ss format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle "Next Video" button click
  const handleNextVideo = () => {
    if (videoState?.queue.length) {
      onPlayNext();
    }
  };
  
  if (!videoState) return null;
  
  const hasNextVideo = videoState.queue.length > 0;
  const isPlaying = videoState.status === 'playing';
  const formattedTime = formatTime(videoState.timestamp);
  
  return (
    <div className="video-controls">
      <div className="video-info">
        {videoState.videoId ? (
          <div className="current-video-info">
            <span className="video-time">{formattedTime}</span>
            <span className="status-indicator">
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
              {isPlaying ? 'Playing' : 'Paused'}
            </span>
            <span className="control-by">
              Last action by: {videoState.updatedByName}
            </span>
          </div>
        ) : (
          <div className="no-video-info">
            <span>No video playing</span>
          </div>
        )}
      </div>
      
      {hasNextVideo && (
        <div className="next-video-info">
          <span className="up-next">Up next: </span>
          <span className="next-title">{videoState.queue[0].title}</span>
          
          <button 
            className="next-video-btn"
            onClick={handleNextVideo}
            title="Play next video"
          >
            Next Video
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoControls; 