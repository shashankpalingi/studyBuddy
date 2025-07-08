"use client";

import Spline from '@splinetool/react-spline';
import { useRef, useState, useEffect } from 'react';
import Logos3Demo from './Logos3Demo';
import studybuddyLogo from '../pages/studybuddylogo.png';

const HeroSection = () => {
  const splineRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = (spline) => {
    splineRef.current = spline;
    // Zoom out to 0.52 (slightly more than half the original size)
    spline.setZoom(0.45);
    setIsLoaded(true);
  };

  // Lazy load the 3D model
  const [shouldLoadSpline, setShouldLoadSpline] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Load the 3D model when user scrolls or after a short delay
      if (!shouldLoadSpline) {
        setShouldLoadSpline(true);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { once: true });

    // Optional: Set a timeout to load the model if user doesn't scroll
    const timeoutId = setTimeout(() => {
      if (!shouldLoadSpline) {
        setShouldLoadSpline(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

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

        {shouldLoadSpline && (
          <Spline 
            scene="https://prod.spline.design/l6LIDRva5KqYpjNV/scene.splinecode" 
            className="w-full h-full object-cover"
            onLoad={handleLoad}
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out'
            }}
          />
        )}
        <div className="absolute bottom-0 left-0 w-full">
          <Logos3Demo />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
