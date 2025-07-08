import React, { useState, useEffect } from 'react';

interface VideoSearchProps {
  onVideoSelect: (videoId: string, videoDetails: { title: string, thumbnail: string }) => void;
}

interface VideoResult {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
    };
    channelTitle: string;
  };
}

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

const VideoSearch: React.FC<VideoSearchProps> = ({ onVideoSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPrompt, setShowPrompt] = useState(true);

  // Handle search form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      setShowPrompt(false);
      
      if (!YOUTUBE_API_KEY) {
        throw new Error('YouTube API key not configured');
      }
      
      // Make request to YouTube Data API
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(
          searchTerm
        )}&type=video&key=${YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search videos');
      }
      
      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (err: any) {
      console.error('Error searching videos:', err);
      setError(err.message || 'Failed to search videos');
      
      // If API key is missing, provide fallback search functionality with simple video IDs
      if (err.message.includes('API key')) {
        setError('YouTube API key not configured. Using direct video ID lookup.');
        
        // Check if the search term looks like a YouTube video ID or URL
        const videoIdMatch = searchTerm.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/) || 
                             searchTerm.match(/^([\w-]{11})$/);
        
        if (videoIdMatch) {
          const videoId = videoIdMatch[1];
          // Create a basic result with minimal info
          setSearchResults([
            {
              id: { videoId },
              snippet: {
                title: 'YouTube Video',
                description: 'No description available (using direct ID)',
                thumbnails: {
                  default: { url: `https://i.ytimg.com/vi/${videoId}/default.jpg` },
                  medium: { url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` }
                },
                channelTitle: 'Unknown Channel'
              }
            }
          ]);
        } else {
          setSearchResults([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle video selection
  const handleSelectVideo = (video: VideoResult) => {
    onVideoSelect(video.id.videoId, {
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.default.url
    });
    
    // Clear search results
    setSearchResults([]);
    setSearchTerm('');
    setShowPrompt(true);
  };
  
  return (
    <div className="video-search">
      <h3>Search Videos</h3>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search YouTube or paste video URL"
          className="search-input"
        />
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {error && <div className="search-error">{error}</div>}
      
      <div className="search-results">
        {searchResults.length > 0 ? (
          <ul className="video-results-list">
            {searchResults.map((video) => (
              <li 
                key={video.id.videoId} 
                className="video-result-item"
                onClick={() => handleSelectVideo(video)}
              >
                <div className="video-thumbnail">
                  <img 
                    src={video.snippet.thumbnails.medium.url} 
                    alt={video.snippet.title}
                  />
                </div>
                <div className="video-info">
                  <h4>{video.snippet.title}</h4>
                  <p>{video.snippet.channelTitle}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          showPrompt && (
            <div className="search-prompt">
              <p>Search for videos to watch together</p>
              <small>Enter search terms or paste a YouTube URL</small>
            </div>
          )
        )}
        
        {loading && (
          <div className="search-loading">
            <p>Searching videos...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSearch; 