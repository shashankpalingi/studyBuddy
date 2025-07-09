
import { useEffect, useRef, useState } from 'react';
import { GlowCard } from './ui/spotlight-card';

const ImpactSection = () => {
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
    <section id="impact" ref={sectionRef} className="bg-gray-900 py-32 px-6">
      <div className={`container mx-auto transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}>
        <div className="mb-16 relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            EMPOWERING <span className="bg-primary px-4 py-1 rounded-full text-white">STUDENTS</span> TO<br />
            EXCEL <span className="text-yellow-400">TOGETHER</span>
          </h2>
          <p className="text-gray-300 text-xl max-w-2xl">
            Our collaborative study platform brings students together, fostering peer learning
            and creating an engaging environment for academic success.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <GlowCard glowColor="purple" customSize={true} className="h-full">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <i className="ri-team-line text-3xl text-white"></i>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">10K+</h3>
                  <p className="text-gray-400">Active Study Groups</p>
                </div>
              </div>
              <p className="text-gray-300">
                Students are forming dynamic study groups across various subjects,
                collaborating in real-time with video calls, shared whiteboards, and interactive tools.
              </p>
            </div>
          </GlowCard>

          <GlowCard glowColor="orange" customSize={true} className="h-full">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                  <i className="ri-timer-line text-3xl text-white"></i>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">1M+</h3>
                  <p className="text-gray-400">Study Hours</p>
                </div>
              </div>
              <p className="text-gray-300">
                Students are maximizing their productivity with our focused study timers,
                task management tools, and AI-powered study assistance.
              </p>
            </div>
          </GlowCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GlowCard glowColor="blue" customSize={true} className="h-full">
            <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center mb-4">
              <i className="ri-vidicon-line text-2xl text-white"></i>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Real-time Collaboration</h4>
              <p className="text-gray-400">
                Connect instantly through video calls, chat, and interactive whiteboards for seamless group study sessions.
              </p>
            </div>
          </GlowCard>

          <GlowCard glowColor="green" customSize={true} className="h-full">
            <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center mb-4">
              <i className="ri-ai-generate text-2xl text-white"></i>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">AI Study Assistant</h4>
              <p className="text-gray-400">
                Get intelligent study recommendations and answers to your questions with our AI-powered assistant.
              </p>
            </div>
          </GlowCard>

          <GlowCard glowColor="purple" customSize={true} className="h-full">
            <div className="w-12 h-12 bg-pink-400 rounded-full flex items-center justify-center mb-4">
              <i className="ri-tools-line text-2xl text-white"></i>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Study Tools</h4>
              <p className="text-gray-400">
                Stay organized with task management, study timers, polls, and YouTube watch-together features.
              </p>
            </div>
          </GlowCard>
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
