import React, { useState, useRef, useEffect } from 'react';
import YoutubePlayer from './YoutubePlayer';
import './DraggableYoutubePlayer.css';

interface DraggableYoutubePlayerProps {
  videoId: string;
  onReady: (event: any) => void;
  onStateChange: (event: any) => void;
  isPipMode: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

const DraggableYoutubePlayer: React.FC<DraggableYoutubePlayerProps> = ({
  videoId,
  onReady,
  onStateChange,
  isPipMode,
  onClose,
  onMinimize
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 320, height: 180 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });

  // Only apply draggable behavior when in PiP mode
  if (!isPipMode) {
    return (
      <YoutubePlayer
        videoId={videoId}
        onReady={onReady}
        onStateChange={onStateChange}
      />
    );
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if clicked on header or drag handle
    if (headerRef.current && (headerRef.current.contains(e.target as Node) || e.currentTarget === headerRef.current)) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsResizing(true);
    setResizeStart({
      width: size.width,
      height: size.height,
      x: e.clientX,
      y: e.clientY
    });
    e.stopPropagation();
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Calculate new position
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragStart.y));
        
        setPosition({
          x: newX,
          y: newY
        });
      }
      
      if (isResizing) {
        // Calculate new size maintaining 16:9 aspect ratio
        const widthDiff = e.clientX - resizeStart.x;
        const newWidth = Math.max(240, Math.min(window.innerWidth - position.x, resizeStart.width + widthDiff));
        const newHeight = Math.floor(newWidth * 0.5625); // 16:9 aspect ratio
        
        setSize({
          width: newWidth,
          height: newHeight
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, position.x, position.y, size.width, size.height]);

  return (
    <div
      ref={containerRef}
      className="draggable-youtube-player"
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 1000,
      }}
    >
      <div 
        ref={headerRef}
        className="draggable-header"
        onMouseDown={handleMouseDown}
      >
        <div className="drag-handle"></div>
        <div className="player-controls">
          <button className="minimize-btn" onClick={onMinimize} title="Return to full view">
            <span>⤢</span>
          </button>
          <button className="close-btn" onClick={onClose} title="Close player">
            <span>×</span>
          </button>
        </div>
      </div>
      
      <div className="player-container">
        <YoutubePlayer
          videoId={videoId}
          onReady={onReady}
          onStateChange={onStateChange}
        />
      </div>
      
      <div 
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
      ></div>
    </div>
  );
};

export default DraggableYoutubePlayer; 