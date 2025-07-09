
import { useEffect, useRef, useState } from 'react';
import { GlowCard } from './ui/spotlight-card';

const ProgramsSection = () => {
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
    <section id="programs" ref={sectionRef} className="bg-gray-900 py-32 px-6">
      <div className={`container mx-auto transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}>
        <div className="mb-16 relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 relative z-10">
            <span className="relative z-10">INTERACTIVE STUDY <br />
            ROOMS FOR</span> <span className="bg-green-400 px-4 py-1 rounded-full text-gray-900 relative">SUCCESS</span>
          </h2>
          <p className="text-gray-300 text-xl max-w-2xl">
            Experience collaborative learning with our feature-rich study rooms. Connect with peers,
            share knowledge, and achieve your academic goals together.
          </p>
          {/* Floating Element */}
          <div className="absolute -top-10 right-0 w-12 h-12 text-orange-400 animate-floating">
            <i className="ri-rocket-line text-5xl"></i>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Collaborative Learning Card */}
          <GlowCard glowColor="orange" customSize={true} className="h-full">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
              <i className="ri-team-line text-3xl text-white"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">Collaborative Learning</h3>
              <p className="text-gray-300 mb-4">
                Engage in real-time video calls, chat discussions, and collaborative whiteboarding.
                Work together seamlessly with screen sharing and interactive tools.
              </p>
              <a href="#" className="inline-flex items-center font-semibold text-yellow-400 hover:text-yellow-300 transition-colors">
                Learn more
                <span className="w-6 h-6 ml-2 flex items-center justify-center">
                  <i className="ri-arrow-right-line"></i>
                </span>
              </a>
            </div>
          </GlowCard>

          {/* Smart Study Tools Card */}
          <GlowCard glowColor="blue" customSize={true} className="h-full">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <i className="ri-ai-generate text-3xl text-white"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">Smart Study Tools</h3>
              <p className="text-gray-300 mb-4">
                Boost productivity with AI study assistance, task management, and focused study timers.
                Track progress and stay organized with our intelligent tools.
              </p>
              <a href="#" className="inline-flex items-center font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Learn more
                <span className="w-6 h-6 ml-2 flex items-center justify-center">
                  <i className="ri-arrow-right-line"></i>
                </span>
              </a>
            </div>
          </GlowCard>

          {/* Interactive Features Card */}
          <GlowCard glowColor="purple" customSize={true} className="h-full">
            <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mb-4">
              <i className="ri-file-list-3-line text-3xl text-white"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">Interactive Features</h3>
              <p className="text-gray-300 mb-4">
                Create polls, share files, watch YouTube together, and collaborate on notes in real-time.
                Make learning engaging and effective with our interactive tools.
              </p>
              <a href="#" className="inline-flex items-center font-semibold text-pink-400 hover:text-pink-300 transition-colors">
                Learn more
                <span className="w-6 h-6 ml-2 flex items-center justify-center">
                  <i className="ri-arrow-right-line"></i>
                </span>
              </a>
            </div>
          </GlowCard>
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
