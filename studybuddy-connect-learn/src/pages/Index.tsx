import { useEffect } from 'react';
import Navigation from '../components/Navigation';
import HeroSection from '../components/HeroSection';
import ProgramsSection from '../components/ProgramsSection';
import ImpactSection from '../components/ImpactSection';
import FeaturesSection from '../components/FeaturesSection';
import CTASection from '../components/CTASection';

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
    <div className="w-full min-h-screen bg-gray-900 m-0 p-0 overflow-x-hidden">
      <Navigation />
      <HeroSection />
      <ProgramsSection />
      <ImpactSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
};

export default Index;
