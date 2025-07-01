
import { useEffect, useState } from 'react';

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex items-center hero-bg">
      <div className="absolute inset-0 bg-black/40"></div>
      <div className={`relative z-10 w-full transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}>
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-4xl lg:max-w-5xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-8">
              FIND YOUR <span className="text-green-400">STUDY</span> PARTNER <br />
              AND <span className="text-yellow-400">EXCEL</span> <span className="text-blue-400">TOGETHER</span>
            </h1>
            <p className="text-white text-xl lg:text-2xl mb-12 max-w-3xl">
              Join virtual study rooms, connect with like-minded students, and prepare for exams together.
              Make studying more engaging and effective with peer learning.
            </p>
            <div className="flex flex-wrap gap-6">
              <button className="bg-primary/80 backdrop-blur-sm text-white px-10 py-4 rounded-button text-lg lg:text-xl font-semibold hover:bg-primary transition-all whitespace-nowrap transform hover:scale-105">
                Join Study Room
              </button>
              <button className="bg-white/10 backdrop-blur-sm text-white px-10 py-4 rounded-button text-lg lg:text-xl font-semibold hover:bg-white hover:text-gray-900 transition-all whitespace-nowrap transform hover:scale-105">
                Find Study Buddies
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
