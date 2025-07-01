
import { useEffect, useRef, useState } from 'react';

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
            <span className="relative z-10">STUDY ROOMS FOR <br />
            EVERY</span> <span className="bg-green-400 px-4 py-1 rounded-full text-gray-900 relative">SUBJECT</span>
          </h2>
          <p className="text-gray-300 text-xl max-w-2xl">
            Join subject-specific study rooms where you can collaborate with peers, share resources,
            and prepare for exams together in an interactive environment.
          </p>
          {/* Floating Element */}
          <div className="absolute -top-10 right-0 w-12 h-12 text-orange-400 animate-floating">
            <i className="ri-rocket-line text-5xl"></i>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Study Groups Card */}
          <div className="bg-yellow-400 rounded-xl p-6 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
              <i className="ri-group-line text-3xl text-white"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Study Groups</h3>
            <p className="text-gray-800 mb-4">
              Create or join study groups for specific subjects. Share notes, discuss topics,
              and solve problems together in real-time.
            </p>
            <a href="#" className="inline-flex items-center font-semibold text-gray-900 hover:text-gray-700 transition-colors">
              Learn more
              <span className="w-6 h-6 ml-2 flex items-center justify-center">
                <i className="ri-arrow-right-line"></i>
              </span>
            </a>
          </div>

          {/* Exam Prep Rooms Card */}
          <div className="bg-blue-400 rounded-xl p-6 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <i className="ri-calendar-event-line text-3xl text-white"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Exam Prep Rooms</h3>
            <p className="text-gray-800 mb-4">
              Dedicated rooms for exam preparation. Practice with past papers,
              share exam strategies, and get peer support for better results.
            </p>
            <a href="#" className="inline-flex items-center font-semibold text-gray-900 hover:text-gray-700 transition-colors">
              Learn more
              <span className="w-6 h-6 ml-2 flex items-center justify-center">
                <i className="ri-arrow-right-line"></i>
              </span>
            </a>
          </div>

          {/* Resource Sharing Card */}
          <div className="bg-pink-400 rounded-xl p-6 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl">
            <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mb-4">
              <i className="ri-book-open-line text-3xl text-white"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Resource Sharing</h3>
            <p className="text-gray-800 mb-4">
              Share and access study materials, notes, and resources.
              Collaborate on documents and create shared study guides.
            </p>
            <a href="#" className="inline-flex items-center font-semibold text-gray-900 hover:text-gray-700 transition-colors">
              Learn more
              <span className="w-6 h-6 ml-2 flex items-center justify-center">
                <i className="ri-arrow-right-line"></i>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
