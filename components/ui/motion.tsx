'use client';

import { motion, AnimatePresence, useMotionValue, useTransform, animate, useInView, Reorder } from 'framer-motion';
import { useEffect, useRef, ReactNode, forwardRef } from 'react';

// ============================================
// PAGE & LAYOUT ANIMATIONS
// ============================================

// Page entrance - wrap every page's main content
export const PageTransition = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

// Stagger container - parent for staggered list animations
export const StaggerContainer = ({
  children,
  className,
  delay = 0,
  staggerDelay = 0.05
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}) => (
  <motion.div
    initial="hidden"
    animate="show"
    exit="hidden"
    variants={{
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: delay,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Stagger item - direct child of StaggerContainer
export const StaggerItem = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20, scale: 0.95 },
      show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 24 },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// ============================================
// CARD ANIMATIONS
// ============================================

// 3D tilt effect on hover
export const TiltCard = ({
  children,
  className,
  tiltDegree = 5,
  scale = 1.02
}: {
  children: ReactNode;
  className?: string;
  tiltDegree?: number;
  scale?: number;
}) => (
  <motion.div
    whileHover={{
      rotateX: -tiltDegree,
      rotateY: tiltDegree,
      scale: scale,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    style={{ transformPerspective: 1000 }}
    className={className}
  >
    {children}
  </motion.div>
);

// Subtle hover lift (less dramatic than tilt)
export const HoverLift = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ y: -4, boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.4)' }}
    whileTap={{ y: 0 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className={className}
  >
    {children}
  </motion.div>
);

// Glow effect on hover (for important cards)
export const GlowCard = ({
  children,
  className,
  glowColor = 'rgba(20, 184, 166, 0.3)' // teal
}: {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}) => (
  <motion.div
    whileHover={{
      boxShadow: `0 0 30px 5px ${glowColor}`,
    }}
    transition={{ duration: 0.3 }}
    className={className}
  >
    {children}
  </motion.div>
);

// ============================================
// EXPANDABLE / ACCORDION
// ============================================

export const Expandable = ({
  isOpen,
  children,
  className
}: {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
}) => (
  <AnimatePresence initial={false}>
    {isOpen && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ overflow: 'hidden' }}
        className={className}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================
// MODAL / DIALOG
// ============================================

export const ModalBackdrop = ({ onClick }: { onClick?: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClick}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
  />
);

export const ModalContent = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9, y: 20 }}
    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    className={className}
  >
    {children}
  </motion.div>
);

// ============================================
// BUTTONS
// ============================================

interface SpringButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: unknown;
}

export const SpringButton = forwardRef<HTMLButtonElement, SpringButtonProps>(
  ({ children, className, onClick, disabled = false, type = 'button', ...props }, ref) => (
    <motion.button
      ref={ref}
      type={type}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
);
SpringButton.displayName = 'SpringButton';

// Bouncy icon button (for action icons)
export const IconButton = ({
  children,
  className,
  onClick
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.1, rotate: 5 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
    onClick={onClick}
    className={className}
  >
    {children}
  </motion.button>
);

// ============================================
// TAB INDICATOR
// ============================================

export const TabIndicator = ({ layoutId = 'tab-indicator' }: { layoutId?: string }) => (
  <motion.div
    layoutId={layoutId}
    className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400"
    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
  />
);

// ============================================
// NOTIFICATIONS / TOASTS
// ============================================

export const SlideInFromRight = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    initial={{ x: 100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 100, opacity: 0 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideInFromBottom = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    initial={{ y: 50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 50, opacity: 0 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className={className}
  >
    {children}
  </motion.div>
);

// ============================================
// LOADING STATES
// ============================================

export const SkeletonPulse = ({ className }: { className?: string }) => (
  <motion.div
    animate={{ opacity: [0.4, 0.7, 0.4] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    className={`bg-slate-700 rounded ${className}`}
  />
);

export const LoadingDots = () => (
  <div className="flex gap-1">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
        className="w-2 h-2 bg-teal-400 rounded-full"
      />
    ))}
  </div>
);

export const SpinnerRing = ({ size = 24 }: { size?: number }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    style={{ width: size, height: size }}
    className="border-2 border-teal-400 border-t-transparent rounded-full"
  />
);

// ============================================
// ANIMATED NUMBERS
// ============================================

export const AnimatedNumber = ({
  value,
  duration = 1,
  className
}: {
  value: number;
  duration?: number;
  className?: string;
}) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const animation = animate(count, value, { duration });
    return animation.stop;
  }, [value, duration, count]);

  return <motion.span className={className}>{rounded}</motion.span>;
};

// ============================================
// SCROLL REVEAL
// ============================================

export const ScrollReveal = ({
  children,
  className,
  direction = 'up'
}: {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const directions = {
    up: { y: 50 },
    down: { y: -50 },
    left: { x: 50 },
    right: { x: -50 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// PRESENCE LISTS (Add/Remove Animation)
// ============================================

export const PresenceList = ({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) => (
  <AnimatePresence mode="popLayout">
    <motion.div layout className={className}>
      {children}
    </motion.div>
  </AnimatePresence>
);

export const PresenceItem = ({
  children,
  className,
  layoutId
}: {
  children: ReactNode;
  className?: string;
  layoutId?: string;
}) => (
  <motion.div
    layout
    layoutId={layoutId}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
    className={className}
  >
    {children}
  </motion.div>
);

// ============================================
// FLIP CARD (For reveals)
// ============================================

export const FlipCard = ({
  front,
  back,
  isFlipped,
  className
}: {
  front: ReactNode;
  back: ReactNode;
  isFlipped: boolean;
  className?: string;
}) => (
  <div className={`relative ${className}`} style={{ perspective: 1000 }}>
    <motion.div
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ transformStyle: 'preserve-3d' }}
      className="relative w-full h-full"
    >
      <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>{front}</div>
      <div
        className="absolute inset-0"
        style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
      >
        {back}
      </div>
    </motion.div>
  </div>
);

// ============================================
// SHAKE (For errors/attention)
// ============================================

export const Shake = ({
  trigger,
  children,
  className
}: {
  trigger: boolean;
  children: ReactNode;
  className?: string;
}) => (
  <motion.div
    animate={trigger ? { x: [-10, 10, -10, 10, 0] } : {}}
    transition={{ duration: 0.4 }}
    className={className}
  >
    {children}
  </motion.div>
);

// ============================================
// FADE IN
// ============================================

export const FadeIn = ({
  children,
  className,
  delay = 0,
  duration = 0.3
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay, duration }}
    className={className}
  >
    {children}
  </motion.div>
);

// ============================================
// SCALE IN
// ============================================

export const ScaleIn = ({
  children,
  className,
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: 'spring', stiffness: 300, damping: 25, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// ============================================
// HOVER SCALE
// ============================================

export const HoverScale = ({
  children,
  className,
  scale = 1.05
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
}) => (
  <motion.div
    whileHover={{ scale }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    className={className}
  >
    {children}
  </motion.div>
);

// ============================================
// EXPORTS FOR REORDER (Drag & Drop)
// ============================================

export { Reorder, AnimatePresence, motion };
