import { useEffect } from 'react';
import Navigation from '../components/Navigation';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import ProgramsSection from '../components/ProgramsSection';
import Footer from '../components/Footer';

const Index = () => {
  // Handle scrolling to sections based on URL hash
  useEffect(() => {
    // Get the hash from the URL
    const hash = window.location.hash.substring(1);
    if (hash) {
      // Give time for the page to fully render
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-900 m-0 p-0 overflow-x-hidden custom-cursor-page">
      <Navigation />
      <HeroSection />
      <div className="relative bg-transparent">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-gray-900 to-gray-900/50"></div>
        <div className="relative">
          <ProgramsSection />
          <FeaturesSection />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
