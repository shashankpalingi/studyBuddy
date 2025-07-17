"use client";

import Spline from '@splinetool/react-spline';
import { useRef, useState, useEffect } from 'react';
import Logos3Demo from './Logos3Demo';
import studybuddyLogo from '../pages/studybuddylogo.png';

const HeroSection = () => {
  const splineRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);

  // Use this to cache the Spline scene in sessionStorage
  useEffect(() => {
    // Check if we're returning from another page
    const isReturning = sessionStorage.getItem('returningToIndex') === 'true';
    
    if (isReturning) {
      // Set a quick timeout to ensure smooth transition
      setTimeout(() => {
        setIsLoaded(true);
      }, 100);
    }
    
    // Set flag when component is unmounted (user leaves page)
    return () => {
      sessionStorage.setItem('returningToIndex', 'true');
    };
  }, []);

  const handleLoad = (spline) => {
    splineRef.current = spline;
    // Zoom out to 0.45 (slightly less than half the original size)
    spline.setZoom(0.45);
    setIsLoaded(true);
  };

  return (
    <section id="hero" className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0">
        {/* Logo in top-left corner */}
        <div className="absolute top-4 left-4 z-50">
          <img 
            src={studybuddyLogo} 
            alt="StudyBuddy Logo" 
            className="h-16 w-16 object-contain" 
          />
        </div>

        {/* Add a loading state */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <Spline 
          scene="https://prod.spline.design/l6LIDRva5KqYpjNV/scene.splinecode" 
          className="w-full h-full object-cover"
          onLoad={handleLoad}
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }}
        />
        <div className="absolute bottom-0 left-0 w-full">
          <Logos3Demo />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
