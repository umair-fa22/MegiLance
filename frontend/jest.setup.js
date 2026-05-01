// @AI-HINT: Jest setup file that runs before each test.
// This file sets up the testing environment, including:
// - Mocking modules that aren't available in the test environment
// - Setting up global test utilities
// - Initializing mock service workers for API mocking

import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js image component
jest.mock('next/image', () => {
  const MockImage = ({ src, alt, ...props }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
  
  MockImage.displayName = 'NextImageMock';
  return MockImage;
});

// Mock Next.js head component
jest.mock('next/head', () => {
  return ({ children }) => {
    return <>{children}</>;
  };
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  
  disconnect() {
    return null;
  }
  
  observe() {
    return null;
  }
  
  takeRecords() {
    return null;
  }
  
  unobserve() {
    return null;
  }
};

// Mock framer-motion to render plain elements in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  const createMotionComponent = (component) => React.forwardRef((props, ref) => {
    const {
      initial,
      animate,
      exit,
      whileHover,
      whileTap,
      whileInView,
      transition,
      variants,
      layout,
      style,
      ...rest
    } = props;
    return React.createElement(component, { ...rest, ref, style });
  });
  const motion = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'create') return createMotionComponent;
      return createMotionComponent(prop);
    },
  });
  return {
    __esModule: true,
    motion,
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
    useMotionValue: (val) => ({ set: jest.fn(), get: () => val }),
    useSpring: (val) => val,
    useTransform: (_val, _input, _output) => ({ set: jest.fn(), get: () => 0 }),
    useMotionTemplate: (...args) => '',
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn() }),
    useInView: () => true,
  };
});
