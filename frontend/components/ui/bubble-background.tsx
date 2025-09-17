'use client';

import * as React from 'react';
import { HTMLMotionProps, motion, useMotionValue, useSpring } from 'motion/react';
import { cn } from '@/lib/utils';

type BubbleBackgroundProps = HTMLMotionProps<'div'> & {
  objectCount?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  children?: React.ReactNode;
  colors?: {
    background?: string;
    objects?: string[];
  };
};

function BubbleBackground({
  className,
  objectCount = 12,
  children,
  colors = {},
  ...props
}: BubbleBackgroundProps) {
  const {
    background = 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
    objects = [
      'bg-cyan-400/20',
      'bg-purple-400/20',
      'bg-fuchsia-400/20',
      'bg-violet-400/20',
      'bg-blue-400/20',
      'bg-indigo-400/20',
    ],
  } = colors;

  // Mouse position tracking for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring animations for smooth parallax with slower exit
  const springX = useSpring(mouseX, {
    stiffness: 300,
    damping: 30,
    // Slower return to center when hover ends
    restSpeed: 0.1,
    restDelta: 0.1,
  });
  const springY = useSpring(mouseY, {
    stiffness: 300,
    damping: 30,
    restSpeed: 0.1,
    restDelta: 0.1,
  });

  const animatedObjects = React.useMemo(
    () =>
      Array.from({ length: objectCount }, (_, i) => {
        const shape = Math.random() > 0.5 ? 'circle' : 'square';
        return {
          id: i,
          x: Math.random() * 90 + 5, // 5-95% to avoid edges
          y: Math.random() * 90 + 5,
          size: Math.random() * 60 + 20, // 20-80px
          color: objects[i % objects.length],
          delay: Math.random() * 2,
          shape,
          floatDirection: Math.random() > 0.5 ? 1 : -1,
          breathDuration: Math.random() * 3 + 3, // 3-6 seconds
          parallaxStrength: Math.random() * 0.5 + 0.3, // 0.3-0.8 for more varied parallax depth
          baseRotation: Math.random() * 360, // Random starting rotation offset
        };
      }),
    [objectCount, objects],
  );

  return (
    <motion.div
      data-slot="bubble-background"
      className={cn('relative size-full overflow-hidden', background, className)}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      style={{
        backgroundSize: '200% 200%',
      }}
      {...props}
    >
      {/* Subtle ambient glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Animated Objects */}
      {animatedObjects.map((obj) => (
        <motion.div
          key={obj.id}
          className={cn(
            'absolute backdrop-blur-sm border border-white/10',
            obj.color,
            obj.shape === 'circle' ? 'rounded-full' : 'rounded-lg rotate-45',
          )}
          style={{
            left: `${obj.x}%`,
            top: `${obj.y}%`,
            width: obj.size,
            height: obj.size,
            // Apply parallax with individual object strength
            x: springX.get() * obj.parallaxStrength,
            y: springY.get() * obj.parallaxStrength,
          }}
          initial={{
            scale: 0.6,
            opacity: 0.4,
            rotate: obj.baseRotation,
          }}
          animate={{
            // Default state animations - breathing with base rotation offset
            scale: [0.6, 0.8, 0.6],
            opacity: [0.4, 0.6, 0.4],
            rotate:
              obj.shape === 'circle'
                ? [obj.baseRotation, obj.baseRotation + 10, obj.baseRotation]
                : [obj.baseRotation, obj.baseRotation + 5, obj.baseRotation],
            y: [0, obj.floatDirection * 15, 0],
            x: [0, obj.floatDirection * 8, 0],
          }}
          transition={{
            duration: obj.breathDuration,
            delay: obj.delay,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      ))}

      {/* Content Layer */}
      <div className="relative z-10 size-full flex items-center justify-center">
        {children}
      </div>
    </motion.div>
  );
}

export { BubbleBackground, type BubbleBackgroundProps };
