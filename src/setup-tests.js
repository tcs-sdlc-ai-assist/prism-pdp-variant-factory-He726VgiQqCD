import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

function createMockStorage() {
  let store = {};
  return {
    getItem: vi.fn((key) => {
      return key in store ? store[key] : null;
    }),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    _getStore: () => store,
  };
}

let mockLocalStorage;
let mockSessionStorage;

beforeEach(() => {
  mockLocalStorage = createMockStorage();
  mockSessionStorage = createMockStorage();

  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  mockLocalStorage.clear();
  mockSessionStorage.clear();
  vi.restoreAllMocks();
});

export { createMockStorage };