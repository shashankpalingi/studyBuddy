"use client";

import Spline from '@splinetool/react-spline';
import { useRef, useState } from 'react';
import Logos3Demo from './Logos3Demo';
import studybuddyLogo from '../pages/studybuddylogo.png';

const HeroSection = () => {
  const splineRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);

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
