import React, { useEffect, useRef } from 'react';

interface YoutubePlayerProps {
  videoId: string;
  onReady: (event: any) => void;
  onStateChange: (event: any) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YoutubePlayer: React.FC<YoutubePlayerProps> = ({ videoId, onReady, onStateChange }) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const youtubeApiLoaded = useRef(false);
  const pendingPlayer = useRef(false);

  // Load YouTube API
  useEffect(() => {
    // If the script is already loaded, don't load it again
    if (window.YT || document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      youtubeApiLoaded.current = true;
    }

    if (!youtubeApiLoaded.current) {
      // Create script element
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      
      // Insert the script tag before the first script
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(tag, firstScript);
      
      // Setup callback for when API loads
      window.onYouTubeIframeAPIReady = () => {
        youtubeApiLoaded.current = true;
        if (pendingPlayer.current && videoId) {
          createPlayer();
        }
      };
    }
    
    return () => {
      // Clean up the global callback on unmount
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, []);
  
  // Create or update the player when videoId changes
  useEffect(() => {
    if (youtubeApiLoaded.current) {
      createPlayer();
    } else {
      pendingPlayer.current = true;
    }
  }, [videoId]);
  
  const createPlayer = () => {
    if (!playerContainerRef.current) return;
    
    // Clear existing player
    playerContainerRef.current.innerHTML = '';
    
    if (!videoId) return;
    
    // Create a div for the player
    const playerDiv = document.createElement('div');
    playerDiv.id = 'youtube-player';
    playerContainerRef.current.appendChild(playerDiv);
    
    // Create YouTube player
    new window.YT.Player('youtube-player', {
      videoId,
      playerVars: {
        autoplay: 0,
        modestbranding: 1,
        rel: 0,
        fs: 1 // fullscreen
      },
      events: {
        onReady,
        onStateChange
      }
    });
  };
  
  return (
    <div className="youtube-player-container" ref={playerContainerRef}>
      {!videoId && (
        <div className="placeholder-player">
          <div className="placeholder-content">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
            </svg>
            <p>Waiting for video selection</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default YoutubePlayer; 