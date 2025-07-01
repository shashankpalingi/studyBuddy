import Navigation from '../components/Navigation';
import HeroSection from '../components/HeroSection';
import ProgramsSection from '../components/ProgramsSection';
import ImpactSection from '../components/ImpactSection';
import FeaturesSection from '../components/FeaturesSection';
import CTASection from '../components/CTASection';

const Index = () => {
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
