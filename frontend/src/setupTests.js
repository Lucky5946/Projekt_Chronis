// src/setupTests.js
// Mock global fetch if needed

import '@testing-library/jest-dom';

global.fetch = global.fetch || (() => Promise.resolve({
  json: () => Promise.resolve({})
}));

// Mock IntersectionObserver for Framer Motion
class IntersectionObserverMock {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = global.IntersectionObserver || IntersectionObserverMock;
