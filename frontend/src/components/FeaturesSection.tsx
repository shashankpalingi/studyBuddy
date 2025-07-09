import { useEffect, useRef, useState } from 'react';
import { 
  MessageSquare, 
  Clock, 
  FileText, 
  CheckSquare, 
  Vote, 
  Pencil, 
  Youtube,
  Users
} from 'lucide-react';
import { GlowCard } from './ui/spotlight-card';

const FeaturesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('collaboration');
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

  const tabs = [
    { id: 'collaboration', label: 'Real-time Collaboration', color: 'bg-violet-400' },
    { id: 'productivity', label: 'Productivity Tools', color: 'bg-emerald-400' },
    { id: 'engagement', label: 'Interactive Learning', color: 'bg-amber-400' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'collaboration':
        return (
          <GlowCard glowColor="purple" customSize={true} className="p-6 relative overflow-hidden h-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">
              <div>
                <h3 className="text-3xl font-bold text-white mb-6">COLLABORATE IN REAL-TIME</h3>
                <p className="text-gray-300 mb-8">
                  Work together with your study group in real-time using our comprehensive suite of collaborative tools.
                  Share ideas, discuss concepts, and learn together effectively.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-violet-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Real-time Chat</h4>
                    <p className="text-gray-300">Instant messaging for quick discussions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-500 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Collaborative Notes</h4>
                    <p className="text-gray-300">Take and share notes together</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-violet-900/30 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Pencil className="w-5 h-5 text-violet-400" />
                    <h5 className="font-semibold text-white">Whiteboard</h5>
                  </div>
                  <p className="text-sm text-gray-300">Draw, explain, and visualize concepts together</p>
                </div>
                <div className="bg-violet-900/30 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-violet-400" />
                    <h5 className="font-semibold text-white">File Sharing</h5>
                  </div>
                  <p className="text-sm text-gray-300">Share study materials and resources</p>
                </div>
              </div>
            </div>
          </GlowCard>
        );
      
      case 'productivity':
        return (
          <GlowCard glowColor="green" customSize={true} className="p-6 relative overflow-hidden h-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">
              <div>
                <h3 className="text-3xl font-bold text-white mb-6">BOOST YOUR PRODUCTIVITY</h3>
                <p className="text-gray-300 mb-8">
                  Stay focused and organized with our productivity tools designed specifically for
                  effective study sessions and time management.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Study Timer</h4>
                    <p className="text-gray-300">Track and manage your study sessions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Task Manager</h4>
                    <p className="text-gray-300">Organize and track study tasks</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-emerald-900/30 backdrop-blur-sm rounded-xl p-4">
                  <h5 className="font-semibold mb-2 text-white">Study Session</h5>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full w-3/4"></div>
                  </div>
                  <p className="text-sm text-gray-300 mt-2">45 minutes remaining</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-900/30 backdrop-blur-sm rounded-xl p-3 text-center">
                    <h6 className="font-semibold text-white">Tasks</h6>
                    <p className="text-2xl font-bold text-emerald-400">8/10</p>
                    <p className="text-sm text-gray-300">Completed</p>
                  </div>
                  <div className="bg-emerald-900/30 backdrop-blur-sm rounded-xl p-3 text-center">
                    <h6 className="font-semibold text-white">Focus Time</h6>
                    <p className="text-2xl font-bold text-emerald-400">2h</p>
                    <p className="text-sm text-gray-300">Today</p>
                  </div>
                </div>
              </div>
            </div>
          </GlowCard>
        );
      
      case 'engagement':
        return (
          <GlowCard glowColor="orange" customSize={true} className="p-6 relative overflow-hidden h-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">
              <div>
                <h3 className="text-3xl font-bold text-white mb-6">INTERACTIVE LEARNING</h3>
                <p className="text-gray-300 mb-8">
                  Engage with your study group through interactive features designed to make
                  learning more effective and enjoyable.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                    <Vote className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Poll System</h4>
                    <p className="text-gray-300">Quick votes and quizzes</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                    <Youtube className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Watch Together</h4>
                    <p className="text-gray-300">Synchronized educational videos</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-amber-900/30 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-white">Active Poll</h5>
                    <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">Live</span>
                  </div>
                  <p className="text-sm text-gray-300">Which topic should we cover next?</p>
                </div>
                <div className="bg-amber-900/30 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-white">YouTube Session</h5>
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Playing</span>
                  </div>
                  <p className="text-sm text-gray-300">Watching: Advanced Calculus Tutorial</p>
                </div>
              </div>
            </div>
          </GlowCard>
        );
      
      default:
        return null;
    }
  };

  return (
    <section id="features" ref={sectionRef} className="bg-gray-900 py-32 px-6">
      <div className={`container mx-auto transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}>
        <div className="mb-16 relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            STUDY ROOMS THAT <span className="bg-violet-400 px-4 py-1 rounded-full text-gray-900">ENHANCE</span> <br />
            YOUR LEARNING EXPERIENCE
          </h2>
          <p className="text-gray-300 text-xl max-w-2xl">
            Join interactive study rooms packed with powerful tools for collaborative learning.
            Connect with peers, share knowledge, and excel together in real-time.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap mb-8 gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${tab.color} text-gray-900 px-6 py-3 rounded-button font-semibold whitespace-nowrap transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                activeTab === tab.id ? 'shadow-lg -translate-y-1' : 'opacity-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feature Content */}
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
