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
          <div className="bg-violet-400 rounded-xl p-8 relative overflow-hidden">
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-violet-300 rounded-full opacity-50"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500 rounded-full opacity-30"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">COLLABORATE IN REAL-TIME</h3>
                <p className="text-gray-800 mb-8">
                  Work together with your study group in real-time using our comprehensive suite of collaborative tools.
                  Share ideas, discuss concepts, and learn together effectively.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-violet-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Real-time Chat</h4>
                    <p className="text-gray-800">Instant messaging for quick discussions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-500 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Collaborative Notes</h4>
                    <p className="text-gray-800">Take and share notes together</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="space-y-4">
                  <div className="bg-violet-100 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Pencil className="w-5 h-5 text-violet-600" />
                      <h5 className="font-semibold">Whiteboard</h5>
                    </div>
                    <p className="text-sm text-gray-600">Draw, explain, and visualize concepts together</p>
                  </div>
                  <div className="bg-violet-100 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-violet-600" />
                      <h5 className="font-semibold">File Sharing</h5>
                    </div>
                    <p className="text-sm text-gray-600">Share study materials and resources</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'productivity':
        return (
          <div className="bg-emerald-400 rounded-xl p-8 relative overflow-hidden">
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-300 rounded-full opacity-50"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500 rounded-full opacity-30"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">BOOST YOUR PRODUCTIVITY</h3>
                <p className="text-gray-800 mb-8">
                  Stay focused and organized with our productivity tools designed specifically for
                  effective study sessions and time management.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Study Timer</h4>
                    <p className="text-gray-800">Track and manage your study sessions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Task Manager</h4>
                    <p className="text-gray-800">Organize and track study tasks</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="space-y-4">
                  <div className="bg-emerald-100 rounded-lg p-4">
                    <h5 className="font-semibold mb-2">Study Session</h5>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full w-3/4"></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">45 minutes remaining</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-100 rounded-lg p-3 text-center">
                      <h6 className="font-semibold text-gray-900">Tasks</h6>
                      <p className="text-2xl font-bold text-emerald-600">8/10</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                    <div className="bg-emerald-100 rounded-lg p-3 text-center">
                      <h6 className="font-semibold text-gray-900">Focus Time</h6>
                      <p className="text-2xl font-bold text-emerald-600">2h</p>
                      <p className="text-sm text-gray-600">Today</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'engagement':
        return (
          <div className="bg-amber-400 rounded-xl p-8 relative overflow-hidden">
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-300 rounded-full opacity-50"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500 rounded-full opacity-30"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">INTERACTIVE LEARNING</h3>
                <p className="text-gray-800 mb-8">
                  Engage with your study group through interactive features designed to make
                  learning more effective and enjoyable.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                    <Vote className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Poll System</h4>
                    <p className="text-gray-800">Quick votes and quizzes</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                    <Youtube className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Watch Together</h4>
                    <p className="text-gray-800">Synchronized educational videos</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="space-y-4">
                  <div className="bg-amber-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold">Active Poll</h5>
                      <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">Live</span>
                    </div>
                    <p className="text-sm text-gray-600">Which topic should we cover next?</p>
                  </div>
                  <div className="bg-amber-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold">YouTube Session</h5>
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Playing</span>
                    </div>
                    <p className="text-sm text-gray-600">Watching: Advanced Calculus Tutorial</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
        {renderTabContent()}
      </div>
    </section>
  );
};

export default FeaturesSection;
