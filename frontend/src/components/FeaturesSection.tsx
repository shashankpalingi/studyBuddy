import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
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
import { ContainerScroll } from './ui/container-scroll-animation';
import { AnimatedBackground } from './ui/animated-background';
import './ui/animated-background.css';

const FeatureCard = ({ children, isActive, delay = 0 }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref);

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.6,
            delay: delay,
            type: "spring",
            stiffness: 100
          }
        }
      }}
      whileHover={{
        scale: 1.02,
        rotateY: 5,
        transition: { duration: 0.2 }
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
      className={`w-full rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 
        bg-white/90 dark:bg-white/20 shadow-lg hover:shadow-xl
        border border-white/20`}
    >
      {children}
    </motion.div>
  );
};

const FeaturesSection = () => {
  const [activeTab, setActiveTab] = useState('collaboration');
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { 
    once: true,
    margin: "-100px"
  });

  const tabs = [
    { 
      id: 'collaboration',
      label: 'Real-time Collaboration',
      color: 'bg-violet-400',
      icon: <MessageSquare className="w-5 h-5" />
    },
    { 
      id: 'productivity',
      label: 'Productivity Tools',
      color: 'bg-emerald-400',
      icon: <Clock className="w-5 h-5" />
    },
    { 
      id: 'engagement',
      label: 'Interactive Learning',
      color: 'bg-amber-400',
      icon: <Vote className="w-5 h-5" />
    }
  ];

  const features = {
    collaboration: [
      {
        icon: <MessageSquare className="w-6 h-6 text-violet-500" />,
        title: "Real-time Chat",
        description: "Instant messaging for quick discussions"
      },
      {
        icon: <FileText className="w-6 h-6 text-violet-500" />,
        title: "Collaborative Notes",
        description: "Take and share notes together"
      },
      {
        icon: <Pencil className="w-6 h-6 text-violet-500" />,
        title: "Whiteboard",
        description: "Draw, explain, and visualize concepts together"
      },
      {
        icon: <Users className="w-6 h-6 text-violet-500" />,
        title: "File Sharing",
        description: "Share study materials and resources"
      }
    ],
    productivity: [
      {
        icon: <Clock className="w-6 h-6 text-emerald-500" />,
        title: "Study Timer",
        description: "Track and manage your study sessions"
      },
      {
        icon: <CheckSquare className="w-6 h-6 text-emerald-500" />,
        title: "Task Manager",
        description: "Organize and track study tasks"
      }
    ],
    engagement: [
      {
        icon: <Vote className="w-6 h-6 text-amber-500" />,
        title: "Poll System",
        description: "Quick votes and quizzes"
      },
      {
        icon: <Youtube className="w-6 h-6 text-amber-500" />,
        title: "Watch Together",
        description: "Synchronized educational videos"
      }
    ]
  };

  return (
    <section 
      ref={sectionRef}
      id="features" 
      className="relative -mt-32 overflow-hidden"
    >
      <div className="absolute inset-0 bg-black w-full h-full" />
      <div className="absolute inset-0 w-full h-[150%] bg-black" />
      <AnimatedBackground isBottom={true} />
      <div className="relative z-10">
        <ContainerScroll
          titleComponent={
            <>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                STUDY ROOMS THAT{" "}
                <motion.span
                  animate={{
                    backgroundColor: ["#8B5CF6", "#34D399", "#F59E0B"],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="px-4 py-1 rounded-full text-gray-900"
                >
                  ENHANCE
                </motion.span>{" "}
                <br />
                YOUR LEARNING EXPERIENCE
              </h2>
            </>
          }
        >
          <div className="w-full h-full flex flex-col items-center justify-center py-8">
            {/* Tabs */}
            <div className="flex flex-wrap justify-center mb-8 gap-4">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${tab.color} text-gray-900 px-6 py-3 rounded-xl font-semibold 
                    flex items-center gap-2 transition-all duration-300 hover:shadow-lg 
                    transform hover:-translate-y-1 ${
                    activeTab === tab.id 
                      ? 'shadow-lg scale-105' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
              {features[activeTab].map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  isActive={true}
                  delay={index * 0.1}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 rounded-xl bg-white/80 dark:bg-white/10 flex items-center justify-center shadow-sm"
                      >
                        {feature.icon}
                      </motion.div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                </FeatureCard>
              ))}
            </div>
          </div>
        </ContainerScroll>
      </div>
    </section>
  );
};

export default FeaturesSection;
