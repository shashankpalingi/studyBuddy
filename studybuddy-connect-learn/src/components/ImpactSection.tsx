
import { useEffect, useRef, useState } from 'react';

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
            ACHIEVE THEIR <span className="text-yellow-400">DREAMS</span>
          </h2>
          <p className="text-gray-300 text-xl max-w-2xl">
            Our platform has helped thousands of students worldwide reach their full potential
            and achieve remarkable educational milestones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-800 rounded-xl p-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <i className="ri-user-star-line text-3xl text-white"></i>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">95%</h3>
                  <p className="text-gray-400">Student Success Rate</p>
                </div>
              </div>
              <p className="text-gray-300">
                Our students consistently achieve their academic goals through personalized learning paths
                and dedicated support from expert instructors.
              </p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/20 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                  <i className="ri-medal-line text-3xl text-white"></i>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">50K+</h3>
                  <p className="text-gray-400">Certified Graduates</p>
                </div>
              </div>
              <p className="text-gray-300">
                Join our growing community of successful graduates who have transformed their careers
                through our comprehensive educational programs.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 rounded-xl p-6 transform hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center mb-4">
              <i className="ri-global-line text-2xl text-white"></i>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Global Reach</h4>
            <p className="text-gray-400">
              Students from over 150 countries accessing quality education without boundaries.
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 transform hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center mb-4">
              <i className="ri-book-open-line text-2xl text-white"></i>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Expert Instructors</h4>
            <p className="text-gray-400">
              Learn from industry professionals with years of experience in their fields.
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 transform hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 bg-pink-400 rounded-full flex items-center justify-center mb-4">
              <i className="ri-customer-service-line text-2xl text-white"></i>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">24/7 Support</h4>
            <p className="text-gray-400">
              Round-the-clock assistance to ensure your learning journey stays on track.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
