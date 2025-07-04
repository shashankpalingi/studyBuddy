import React from 'react';

interface QueueItem {
  videoId: string;
  title: string;
  thumbnail: string;
  addedBy: string;
  addedByName: string;
}

interface VideoQueueProps {
  queue: QueueItem[];
  onRemove: (index: number) => void;
  isHost: boolean;
}

const VideoQueue: React.FC<VideoQueueProps> = ({ queue, onRemove, isHost }) => {
  if (queue.length === 0) {
    return (
      <div className="video-queue empty">
        <h3>Queue</h3>
        <div className="empty-queue">
          <p>No videos in queue</p>
          <p className="queue-tip">Search for videos to add them to the queue</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="video-queue">
      <h3>Queue ({queue.length})</h3>
      <ul className="queue-list">
        {queue.map((item, index) => (
          <li key={`${item.videoId}-${index}`} className="queue-item">
            <div className="queue-item-thumbnail">
              <img src={item.thumbnail} alt={item.title} />
              <span className="queue-position">{index + 1}</span>
            </div>
            
            <div className="queue-item-details">
              <h4 className="queue-item-title">{item.title}</h4>
              <span className="queue-item-added-by">Added by: {item.addedByName}</span>
            </div>
            
            <button 
              className="remove-from-queue" 
              onClick={() => onRemove(index)}
              title="Remove from queue"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </li>
        ))}
      </ul>
      
      {queue.length > 0 && (
        <div className="queue-controls">
          <small className="participant-note">
            All participants can manage the queue and control video playback
          </small>
        </div>
      )}
    </div>
  );
};

export default VideoQueue; 