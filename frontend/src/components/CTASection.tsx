
import { useEffect, useRef, useState } from 'react';
import { GlowCard } from './ui/spotlight-card';

const CTASection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="cta" ref={sectionRef} className="bg-gray-900 py-20 px-6 relative">
      
      <div className={`container mx-auto relative z-10 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}>
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-8">
            <span className="gradient-text">CONNECT & LEARN<br />TOGETHER</span><br />
            <span className="text-yellow-400">WITH</span> <span className="font-pacifico text-primary">StudyBuddy</span>
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join our vibrant community of students, find your perfect study partners, and excel in your academic journey. Together, we make learning more engaging and effective.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button className="bg-primary text-white px-10 py-4 rounded-button text-xl font-bold hover:bg-opacity-90 transition-all shadow-lg whitespace-nowrap transform hover:scale-105 group">
              <span className="flex items-center gap-2">
                <i className="ri-user-add-line"></i>
                Find Study Partners
              </span>
            </button>
            <button className="bg-white/10 backdrop-blur-sm text-white px-10 py-4 rounded-button text-xl font-bold hover:bg-white/20 transition-all shadow-lg whitespace-nowrap transform hover:scale-105 group">
              <span className="flex items-center gap-2">
                <i className="ri-door-open-line"></i>
                Join Study Room
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <GlowCard glowColor="orange" customSize={true} className="p-4 text-center">
              <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-group-line text-3xl text-yellow-400"></i>
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">10K+</h3>
              <p className="text-gray-400">Active Students</p>
            </GlowCard>
            
            <GlowCard glowColor="blue" customSize={true} className="p-4 text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-book-open-line text-3xl text-primary"></i>
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">500+</h3>
              <p className="text-gray-400">Study Rooms</p>
            </GlowCard>
            
            <GlowCard glowColor="green" customSize={true} className="p-4 text-center">
              <div className="w-12 h-12 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-medal-line text-3xl text-green-400"></i>
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">95%</h3>
              <p className="text-gray-400">Success Rate</p>
            </GlowCard>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-12 h-12 text-yellow-400 animate-floating">
          <i className="ri-book-mark-line text-5xl"></i>
        </div>
        <div className="absolute bottom-20 right-20 w-12 h-12 text-blue-400 animate-floating floating-delay-2">
          <i className="ri-graduation-cap-line text-5xl"></i>
        </div>
        <div className="absolute top-1/4 right-10 w-12 h-12 text-primary animate-floating floating-delay-1">
          <i className="ri-lightbulb-line text-5xl"></i>
        </div>
        <div className="absolute bottom-10 left-20 w-12 h-12 text-green-400 animate-floating floating-delay-3">
          <i className="ri-team-line text-5xl"></i>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
