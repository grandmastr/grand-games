// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Date for consistent timestamps
const mockDateNow = 1619712000000; // Fixed timestamp for testing
global.Date.now = jest.fn(() => mockDateNow);

// Mock Math.random for consistent random values
const mockMath = Object.create(global.Math);
mockMath.random = () => 0.5; // Always return 0.5 for predictable "random" values
global.Math = mockMath;
