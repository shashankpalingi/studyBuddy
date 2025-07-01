
import { useEffect, useRef, useState } from 'react';

const FeaturesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('virtual-class');
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
    { id: 'virtual-class', label: 'Study Rooms', color: 'bg-yellow-400' },
    { id: 'scholarship', label: 'Group Sessions', color: 'bg-blue-400' },
    { id: 'monitoring', label: 'Progress Tracking', color: 'bg-pink-400' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'virtual-class':
        return (
          <div className="bg-yellow-400 rounded-xl p-8 relative overflow-hidden">
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-yellow-300 rounded-full opacity-50"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500 rounded-full opacity-30"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">LEARNING VIRTUALLY EVERYWHERE.</h3>
                <p className="text-gray-800 mb-8">
                  Our platform allows you to access high-quality education from anywhere in the world.
                  With interactive lessons, real-time collaboration, and personalized learning paths,
                  you can master new skills at your own pace.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <i className="ri-time-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Learn at Your Own Pace</h4>
                    <p className="text-gray-800">Flexible scheduling that fits your lifestyle</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <i className="ri-group-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Interactive Community</h4>
                    <p className="text-gray-800">Connect with peers and instructors worldwide</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {['Emily Johnson', 'Michael Chen', 'Sophia Rodriguez', 'James Wilson'].map((name, index) => (
                    <div key={name} className={`bg-${['blue', 'green', 'purple', 'orange'][index]}-100 rounded-lg p-3 flex flex-col items-center`}>
                      <div className={`w-16 h-16 bg-${['blue', 'green', 'purple', 'orange'][index]}-400 rounded-full mb-2 flex items-center justify-center`}>
                        <i className="ri-user-smile-line text-2xl text-white"></i>
                      </div>
                      <p className="text-sm font-medium text-center">{name}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-semibold">Live Session: Advanced Mathematics</h5>
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">LIVE</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Professor Williams is currently explaining the applications of calculus in real-world scenarios.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'scholarship':
        return (
          <div className="bg-blue-400 rounded-xl p-8 relative overflow-hidden">
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-300 rounded-full opacity-50"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500 rounded-full opacity-30"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">EMPOWERING FUTURE LEADERS.</h3>
                <p className="text-gray-800 mb-8">
                  Our group sessions bring together students from diverse backgrounds to collaborate,
                  learn, and grow together. Experience the power of collective learning and peer support.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <i className="ri-group-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Collaborative Learning</h4>
                    <p className="text-gray-800">Work together on challenging problems</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <i className="ri-user-star-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Peer Support</h4>
                    <p className="text-gray-800">Get help and motivation from fellow students</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="space-y-4">
                  <div className="bg-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold">Study Group: Physics</h5>
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Active</span>
                    </div>
                    <p className="text-sm text-gray-600">8 members working on quantum mechanics</p>
                  </div>
                  <div className="bg-green-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold">Math Challenge</h5>
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Open</span>
                    </div>
                    <p className="text-sm text-gray-600">Daily problem-solving sessions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'monitoring':
        return (
          <div className="bg-pink-400 rounded-xl p-8 relative overflow-hidden">
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-300 rounded-full opacity-50"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500 rounded-full opacity-30"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">TRACK YOUR PROGRESS.</h3>
                <p className="text-gray-800 mb-8">
                  Our advanced monitoring system provides real-time insights into your learning journey.
                  With detailed analytics and personalized feedback, we help you stay on track and
                  achieve your goals.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                    <i className="ri-line-chart-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Performance Analytics</h4>
                    <p className="text-gray-800">Track your progress with detailed metrics</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                    <i className="ri-feedback-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Personalized Feedback</h4>
                    <p className="text-gray-800">Get insights from expert instructors</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="space-y-4">
                  <div className="bg-pink-100 rounded-lg p-4">
                    <h5 className="font-semibold mb-2">Course Progress</h5>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-pink-500 h-2 rounded-full w-3/4"></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">75% Complete</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-100 rounded-lg p-3 text-center">
                      <h6 className="font-semibold text-gray-900">Assignments</h6>
                      <p className="text-2xl font-bold text-blue-600">12/15</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-3 text-center">
                      <h6 className="font-semibold text-gray-900">Average Score</h6>
                      <p className="text-2xl font-bold text-green-600">92%</p>
                      <p className="text-sm text-gray-600">Excellence</p>
                    </div>
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
            STUDY ROOMS THAT <span className="bg-green-400 px-4 py-1 rounded-full text-gray-900">EMPOWER</span> <br />
            YOUR LEARNING JOURNEY
          </h2>
          <p className="text-gray-300 text-xl max-w-2xl">
            Join interactive study rooms designed for collaborative learning. Connect with peers,
            share knowledge, and excel in your academic goals together.
          </p>
          {/* Floating Element */}
          <div className="absolute bottom-0 right-0 w-12 h-12 text-blue-400 animate-floating">
            <i className="ri-book-open-line text-5xl"></i>
          </div>
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
        <div className="transition-all duration-500">
          {renderTabContent()}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
