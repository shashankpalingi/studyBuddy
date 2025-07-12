
import { useEffect, useRef, useState } from 'react';
import './ProgramsSection.css';
import { AnimatedBackground } from './ui/animated-background';
import '../components/ui/animated-background.css';

const ProgramsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const totalSlides = 4; // Updated to 4 slides for more content

  useEffect(() => {
    // Add font import
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

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

  // Function to handle navigation
  const navigateSlide = (index: number) => {
    if (carouselRef.current) {
      setCurrentSlide(index);
      const slideWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth'
      });
    }
  };

  // Function to handle next/prev
  const handlePrev = () => {
    if (currentSlide > 0) {
      navigateSlide(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      navigateSlide(currentSlide + 1);
    }
  };

  // Function to detect current slide on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (carouselRef.current) {
        const scrollLeft = carouselRef.current.scrollLeft;
        const slideWidth = carouselRef.current.offsetWidth;
        const newSlide = Math.round(scrollLeft / slideWidth);
        if (newSlide !== currentSlide) {
          setCurrentSlide(newSlide);
        }
      }
    };

    const carouselElement = carouselRef.current;
    if (carouselElement) {
      carouselElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (carouselElement) {
        carouselElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [currentSlide]);

  return (
    <section id="programs" ref={sectionRef} className="relative bg-black pt-32 pb-32">
      <AnimatedBackground isTop={true} />
      <div className={`container mx-auto relative z-10 transition-all duration-1000 px-6 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}>
        <div className="mb-16 text-center relative">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 relative z-10 programs-heading">
            STUDY BUDDY PROGRAMS
          </h2>
          <p className="text-2xl text-gray-300 mx-auto programs-description">
            Discover our specialized study programs designed to help you achieve excellence
          </p>
          <div className="absolute -top-20 right-0 w-12 h-12 text-orange-400 animate-floating">
            <i className="ri-rocket-line text-5xl"></i>
          </div>
        </div>
        
        <div className="sprite-wrapper">
          <div className="book">
            <div 
              ref={carouselRef}
              className="carousel" 
              style={{ "--slides": totalSlides } as React.CSSProperties}
            >
              <div className="sprite"></div>
              
              {/* Page 1-2: Introduction & Academic Excellence */}
              <div className="carousel-item">
                <div className="page-container">
                  <div className="page left-page">
                    <div className="book-content">
                      <h3 style={{ textAlign: "center" }}>
                        STUDY BUDDY PROGRAMS
                      </h3>
                      <p style={{ margin: "1rem 0", textIndent: "1rem" }}>
                        Welcome to Study Buddy's comprehensive academic programs! We offer four specialized tracks designed to meet diverse learning needs and goals:
                      </p>
                      <ul style={{ padding: "1rem", listStyle: "none", margin: "1rem 0" }}>
                        <li>⭐ Academic Excellence Program</li>
                        <li>👥 Peer Learning Groups</li>
                        <li>📚 Subject Mastery Program</li>
                        <li>🎯 Exam Success Track</li>
                      </ul>
                      <p style={{ margin: "1rem 0", textIndent: "1rem" }}>
                        Each program is carefully crafted to provide you with the best learning experience and help you achieve your academic goals.
                      </p>
                    </div>
                  </div>
                  <div className="page right-page">
                    <div className="book-content">
                      <h3>Academic Excellence Program</h3>
                      <p style={{ margin: "1rem 0", textIndent: "1rem" }}>
                        Our flagship program designed for students aiming for academic distinction. This comprehensive program includes:
                      </p>
                      <h4>Program Structure:</h4>
                      <ul style={{ padding: "0 1rem" }}>
                        <li>• 12-week intensive learning cycles</li>
                        <li>• Personalized study roadmaps</li>
                        <li>• Weekly progress evaluations</li>
                        <li>• One-on-one mentoring sessions</li>
                      </ul>
                      <p style={{ margin: "1rem 0", textIndent: "1rem" }}>
                        Students in this program consistently achieve 30% higher grades and report 90% satisfaction rates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 3-4: Peer Learning Groups */}
              <div className="carousel-item">
                <div className="page-container">
                  <div className="page left-page">
                    <div className="book-content">
                      <h3>Peer Learning Groups</h3>
                      <p style={{ margin: "1rem 0", textIndent: "1rem" }}>
                        Our innovative peer learning program connects you with fellow students in your field of study. Groups are formed based on:
                      </p>
                      <ul style={{ padding: "0 1rem" }}>
                        <li>• Academic interests</li>
                        <li>• Study goals</li>
                        <li>• Schedule compatibility</li>
                        <li>• Learning style preferences</li>
                      </ul>
                      <h4>Group Dynamics:</h4>
                      <p style={{ margin: "0.5rem 0", textIndent: "1rem" }}>
                        - Small groups (4-6 students)<br />
                        - Rotating leadership roles<br />
                        - Weekly study sessions<br />
                        - Monthly progress reviews
                      </p>
                    </div>
                  </div>
                  <div className="page right-page">
                    <div className="book-content">
                      <h4>Learning Activities:</h4>
                      <p style={{ margin: "1rem 0", textIndent: "1rem" }}>
                        Peer groups engage in various collaborative activities:
                      </p>
                      <ul style={{ padding: "0 1rem" }}>
                        <li>• Problem-solving workshops</li>
                        <li>• Group discussions</li>
                        <li>• Project collaborations</li>
                        <li>• Peer teaching sessions</li>
                      </ul>
                      <p style={{ margin: "1rem 0", textIndent: "1rem" }}>
                        Students in peer groups show improved understanding and retention of complex topics, with 85% reporting enhanced learning experiences.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 5-6: Subject Mastery Program */}
              <div className="carousel-item">
                <div className="page-container">
                  <div className="page left-page">
                    <div className="book-content">
                      <h3>Subject Mastery Program</h3>
                      <p style={{ margin: "1rem 0", textIndent: "1rem" }}>
                        Specialized programs for in-depth subject understanding. Available for:
                      </p>
                      <h4>STEM Subjects:</h4>
                      <ul style={{ padding: "0 1rem" }}>
                        <li>• Advanced Mathematics</li>
                        <li>• Physics & Chemistry</li>
                        <li>• Biology & Life Sciences</li>
                        <li>• Computer Science</li>
                      </ul>
                      <h4>Humanities:</h4>
                      <ul style={{ padding: "0 1rem" }}>
                        <li>• Literature Analysis</li>
                        <li>• World History</li>
                        <li>• Social Sciences</li>
                        <li>• Languages</li>
                      </ul>
                    </div>
            </div>
                  <div className="page right-page">
                    <div className="book-content">
                      <h4>Program Components:</h4>
                      <p style={{ margin: "1rem 0", textIndent: "1rem" }}>
                        Each subject program includes:
                      </p>
                      <ul style={{ padding: "0 1rem" }}>
                        <li>• Concept mastery modules</li>
                        <li>• Practice problem sets</li>
                        <li>• Subject expert sessions</li>
                        <li>• Topic-specific resources</li>
                      </ul>
                      <p style={{ margin: "1rem 0", textIndent: "1rem" }}>
                        Our subject mastery programs have helped students achieve an average grade improvement of two letter grades within one semester.
                      </p>
                    </div>
                  </div>
                </div>
            </div>

              {/* Page 7-8: Exam Success Track */}
              <div className="carousel-item">
                <div className="page-container">
                  <div className="page left-page">
                    <div className="book-content">
                      <h3>Exam Success Track</h3>
                      <p style={{ margin: "1rem 0", textIndent: "1rem" }}>
                        A focused program designed for exam preparation and success. Available for:
                      </p>
                      <ul style={{ padding: "0 1rem" }}>
                        <li>• University Entrance Exams</li>
                        <li>• Professional Certifications</li>
                        <li>• Standardized Tests</li>
                        <li>• Course Final Exams</li>
                      </ul>
                      <h4>Preparation Timeline:</h4>
                      <p style={{ margin: "0.5rem 0", textIndent: "1rem" }}>
                        - 8-week intensive prep<br />
                        - 4-week advanced review<br />
                        - 2-week final preparation<br />
                        - Mock exam sessions
                      </p>
                    </div>
            </div>
                  <div className="page right-page">
                    <div className="book-content">
                      <h4>Success Elements:</h4>
                      <ul style={{ padding: "0 1rem" }}>
                        <li>• Custom study schedules</li>
                        <li>• Topic-wise preparation</li>
                        <li>• Practice test series</li>
                        <li>• Performance analytics</li>
                      </ul>
                      <p style={{ margin: "1rem 0", textIndent: "1rem" }}>
                        Students following our exam success track have achieved:
                      </p>
                      <ul style={{ padding: "0 1rem" }}>
                        <li>• 95% pass rate</li>
                        <li>• 80% above-average scores</li>
                        <li>• 70% top percentile ranks</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation buttons and indicators */}
            <div className="carousel-nav">
              <button 
                className="prev-btn" 
                onClick={handlePrev} 
                disabled={currentSlide === 0}
                aria-label="Previous slide"
              />
              
              <div className="carousel-indicators">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <div 
                    key={index} 
                    className={`indicator ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => navigateSlide(index)}
                  />
                ))}
              </div>
              
              <button 
                className="next-btn" 
                onClick={handleNext} 
                disabled={currentSlide === totalSlides - 1}
                aria-label="Next slide"
              />
            </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
