// @AI-HINT: Stub implementation of framer-motion to remove dependency while maintaining API compatibility
// ES module version for Next.js compatibility
/* eslint-disable @typescript-eslint/no-unused-vars */

import React from 'react';

// Create a generic component factory that passes through all props
const createMotionComponent = (element) => {
  return React.forwardRef((props, ref) => {
    // Filter out motion-specific props (extracted but intentionally unused)
    const {
      initial,
      animate,
      exit,
      variants,
      transition,
      whileHover,
      whileTap,
      whileFocus,
      whileDrag,
      whileInView,
      drag,
      dragConstraints,
      dragElastic,
      dragMomentum,
      onDrag,
      onDragStart,
      onDragEnd,
      layout,
      layoutId,
      ...rest
    } = props;

    return React.createElement(element, Object.assign({}, rest, { ref }));
  });
};

// Export motion components for all HTML elements
export const motion = new Proxy({}, {
  get: function(_target, prop) {
    if (prop === 'create') {
      return function() { return createMotionComponent('div'); };
    }
    return createMotionComponent(prop);
  },
});

// AnimatePresence - just renders children without animation
export function AnimatePresence(props) {
  return props.children || null;
}

// Hooks - return no-op values
export const useMotionValue = (initial) => ({ 
  get: () => initial, 
  set: () => {}, 
  onChange: () => {} 
});

export const useTransform = () => ({ get: () => 0 });
export const useSpring = () => ({ get: () => 0 });
export const useMotionTemplate = () => ({ get: () => '' });
export const useScroll = () => ({ scrollYProgress: { get: () => 0 } });
export const useInView = () => true;
export const useAnimation = () => ({ 
  start: () => Promise.resolve(), 
  stop: () => {}, 
  set: () => {} 
});
