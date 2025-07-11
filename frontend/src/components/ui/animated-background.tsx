import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
  isTop?: boolean;
  isBottom?: boolean;
}

export const AnimatedBackground = ({ isTop, isBottom }: AnimatedBackgroundProps) => {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient overlay with extended boundaries and smoother transition */}
        <div 
          className={`absolute inset-0 
            ${isTop ? 'bg-gradient-to-b from-gray-900 via-gray-900/95 to-transparent -top-1/4' : ''}
            ${isBottom ? 'bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent -bottom-1/4' : ''}
          `}
        />
        
        {/* Animated circles positioned based on section */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`absolute w-96 h-96 bg-violet-500/10 rounded-full blur-3xl
            ${isTop ? 'top-0' : 'top-1/4'} -right-20`}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl
            ${isBottom ? 'bottom-0' : 'bottom-1/4'} -left-20`}
        />
        
        {/* Additional animated elements that cross section boundaries */}
        <motion.div
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`absolute w-64 h-64 bg-blue-500/10 rounded-full blur-3xl
            ${isTop ? 'top-1/4' : 'top-1/2'} left-1/4 mix-blend-screen`}
        />
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1.1, 1, 1.1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`absolute w-72 h-72 bg-purple-500/10 rounded-full blur-3xl
            ${isBottom ? 'bottom-1/4' : 'bottom-1/2'} right-1/4 mix-blend-screen`}
        />
      </div>
      
      {/* Noise overlay with reduced opacity */}
      <div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay"></div>
    </>
  );
}; 