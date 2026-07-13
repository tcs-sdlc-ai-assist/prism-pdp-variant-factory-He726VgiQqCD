/**
 * @module storageAdapter.test
 * @description Unit tests for StorageAdapter: get/set/remove/clear operations,
 * localStorage fallback to sessionStorage, in-memory fallback, quota exceeded
 * handling, corrupted JSON recovery, key prefixing, and error callbacks.
 * [Pipeline-aligned: synthetic data only]
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageAdapter, createMemoryStorage, prefixKey } from '@/services/storageAdapter.js';
import { STORAGE_PREFIX } from '@/constants/constants.js';

/**
 * Helper: creates a mock storage object with optional overrides.
 * @param {object} [overrides] - Optional method overrides.
 * @returns {object} A mock storage object.
 */
function createMockStorage(overrides = {}) {
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
    ...overrides,
  };
}

describe('StorageAdapter', () => {
  let originalLocalStorage;
  let originalSessionStorage;

  beforeEach(() => {
    originalLocalStorage = window.localStorage;
    originalSessionStorage = window.sessionStorage;
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: originalSessionStorage,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe('prefixKey', () => {
    it('prefixes a key with the storage prefix', () => {
      const result = prefixKey('test-key');
      expect(result).toBe(`${STORAGE_PREFIX}-test-key`);
    });

    it('does not double-prefix a key that already has the prefix', () => {
      const alreadyPrefixed = `${STORAGE_PREFIX}-my-key`;
      const result = prefixKey(alreadyPrefixed);
      expect(result).toBe(alreadyPrefixed);
    });

    it('handles empty string key', () => {
      const result = prefixKey('');
      expect(result).toBe(`${STORAGE_PREFIX}-`);
    });
  });

  describe('createMemoryStorage', () => {
    it('creates a functional in-memory storage', () => {
      const mem = createMemoryStorage();
      expect(mem.getItem('foo')).toBeNull();
      mem.setItem('foo', 'bar');
      expect(mem.getItem('foo')).toBe('bar');
      expect(mem.length).toBe(1);
      expect(mem.key(0)).toBe('foo');
    });

    it('removes items correctly', () => {
      const mem = createMemoryStorage();
      mem.setItem('a', '1');
      mem.setItem('b', '2');
      expect(mem.length).toBe(2);
      mem.removeItem('a');
      expect(mem.getItem('a')).toBeNull();
      expect(mem.length).toBe(1);
    });

    it('clears all items', () => {
      const mem = createMemoryStorage();
      mem.setItem('x', '1');
      mem.setItem('y', '2');
      mem.clear();
      expect(mem.length).toBe(0);
      expect(mem.getItem('x')).toBeNull();
    });

    it('returns null for non-existent key index', () => {
      const mem = createMemoryStorage();
      expect(mem.key(0)).toBeNull();
      expect(mem.key(99)).toBeNull();
    });

    it('converts values to strings on setItem', () => {
      const mem = createMemoryStorage();
      mem.setItem('num', 42);
      expect(mem.getItem('num')).toBe('42');
    });
  });

  describe('constructor and initialization', () => {
    it('creates an instance with localStorage as default', () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      expect(adapter.activeType).toBe('localStorage');
    });

    it('falls back to sessionStorage when localStorage is unavailable', () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('localStorage unavailable');
        },
        configurable: true,
      });

      const mockSS = createMockStorage();
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      expect(adapter.activeType).toBe('sessionStorage');
    });

    it('falls back to memory when both localStorage and sessionStorage are unavailable', () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('localStorage unavailable');
        },
        configurable: true,
      });

      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new Error('sessionStorage unavailable');
        },
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      expect(adapter.activeType).toBe('memory');
    });

    it('uses sessionStorage when specified as preferred type', () => {
      const mockSS = createMockStorage();
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('sessionStorage');
      expect(adapter.activeType).toBe('sessionStorage');
    });

    it('falls back to memory when sessionStorage is preferred but unavailable', () => {
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new Error('sessionStorage unavailable');
        },
        configurable: true,
      });

      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('localStorage unavailable');
        },
        configurable: true,
      });

      const adapter = new StorageAdapter('sessionStorage');
      expect(adapter.activeType).toBe('memory');
    });
  });

  describe('isAvailable', () => {
    it('returns true when preferred storage is available', () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      expect(adapter.isAvailable()).toBe(true);
    });

    it('returns false when preferred storage is unavailable', () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('unavailable');
        },
        configurable: true,
      });

      Object.defineProperty(window, 'sessionStorage', {
        value: createMockStorage(),
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      expect(adapter.isAvailable()).toBe(false);
    });
  });

  describe('get', () => {
    it('retrieves and parses a stored JSON value', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const testData = { name: 'test', value: 42 };
      const prefixed = prefixKey('my-key');
      mockLS.setItem(prefixed, JSON.stringify(testData));

      const result = await adapter.get('my-key');
      expect(result).toEqual(testData);
    });

    it('returns null for a non-existent key', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const result = await adapter.get('nonexistent');
      expect(result).toBeNull();
    });

    it('retrieves an array value', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const testArray = [1, 2, 3, 'four'];
      const prefixed = prefixKey('array-key');
      mockLS.setItem(prefixed, JSON.stringify(testArray));

      const result = await adapter.get('array-key');
      expect(result).toEqual(testArray);
    });

    it('retrieves a string value', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const prefixed = prefixKey('string-key');
      mockLS.setItem(prefixed, JSON.stringify('hello'));

      const result = await adapter.get('string-key');
      expect(result).toBe('hello');
    });

    it('retrieves a numeric value', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const prefixed = prefixKey('num-key');
      mockLS.setItem(prefixed, JSON.stringify(99.99));

      const result = await adapter.get('num-key');
      expect(result).toBe(99.99);
    });

    it('retrieves a boolean value', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const prefixed = prefixKey('bool-key');
      mockLS.setItem(prefixed, JSON.stringify(true));

      const result = await adapter.get('bool-key');
      expect(result).toBe(true);
    });

    it('handles corrupted JSON by removing the key and returning null', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const prefixed = prefixKey('corrupt-key');
      mockLS.setItem(prefixed, '{invalid json!!!');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await adapter.get('corrupt-key');

      expect(result).toBeNull();
      expect(mockLS.removeItem).toHaveBeenCalledWith(prefixed);
      consoleSpy.mockRestore();
    });

    it('falls back to sessionStorage when primary getItem throws', async () => {
      const throwingLS = createMockStorage({
        getItem: vi.fn(() => {
          throw new Error('read error');
        }),
      });
      Object.defineProperty(window, 'localStorage', {
        value: throwingLS,
        writable: true,
        configurable: true,
      });

      const mockSS = createMockStorage();
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      // Manually set the adapter's active type since the constructor test passes
      // because setItem/removeItem work in the mock
      const prefixed = prefixKey('fallback-key');
      mockSS.setItem(prefixed, JSON.stringify({ fallback: true }));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await adapter.get('fallback-key');

      expect(result).toEqual({ fallback: true });
      consoleSpy.mockRestore();
    });
  });

  describe('set', () => {
    it('serializes and stores a value', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const testData = { variants: [1, 2, 3] };
      await adapter.set('test-set', testData);

      const prefixed = prefixKey('test-set');
      expect(mockLS.setItem).toHaveBeenCalledWith(prefixed, JSON.stringify(testData));
    });

    it('stores a string value', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      await adapter.set('str-key', 'hello world');

      const prefixed = prefixKey('str-key');
      expect(mockLS.setItem).toHaveBeenCalledWith(prefixed, JSON.stringify('hello world'));
    });

    it('stores a null value', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      await adapter.set('null-key', null);

      const prefixed = prefixKey('null-key');
      expect(mockLS.setItem).toHaveBeenCalledWith(prefixed, 'null');
    });

    it('stores an array value', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const arr = ['a', 'b', 'c'];
      await adapter.set('arr-key', arr);

      const prefixed = prefixKey('arr-key');
      expect(mockLS.setItem).toHaveBeenCalledWith(prefixed, JSON.stringify(arr));
    });

    it('handles quota exceeded by falling back to sessionStorage', async () => {
      const throwingLS = createMockStorage({
        setItem: vi.fn(() => {
          throw new DOMException('QuotaExceededError', 'QuotaExceededError');
        }),
      });
      Object.defineProperty(window, 'localStorage', {
        value: throwingLS,
        writable: true,
        configurable: true,
      });

      const mockSS = createMockStorage();
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await adapter.set('quota-key', { data: 'test' });

      const prefixed = prefixKey('quota-key');
      expect(mockSS.setItem).toHaveBeenCalledWith(prefixed, JSON.stringify({ data: 'test' }));
      consoleSpy.mockRestore();
    });

    it('handles setItem error by falling back to memory storage', async () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('unavailable');
        },
        configurable: true,
      });

      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new Error('unavailable');
        },
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      expect(adapter.activeType).toBe('memory');

      await adapter.set('mem-key', { memory: true });
      const result = await adapter.get('mem-key');
      expect(result).toEqual({ memory: true });
    });
  });

  describe('remove', () => {
    it('removes a value from storage', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const prefixed = prefixKey('remove-key');
      mockLS.setItem(prefixed, JSON.stringify('to-remove'));

      await adapter.remove('remove-key');
      expect(mockLS.removeItem).toHaveBeenCalledWith(prefixed);
    });

    it('handles removeItem error gracefully', async () => {
      const throwingLS = createMockStorage({
        removeItem: vi.fn(() => {
          throw new Error('remove error');
        }),
      });
      Object.defineProperty(window, 'localStorage', {
        value: throwingLS,
        writable: true,
        configurable: true,
      });

      const mockSS = createMockStorage();
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      await adapter.remove('error-key');
      consoleSpy.mockRestore();
    });

    it('does not throw when removing a non-existent key', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      await expect(adapter.remove('nonexistent-key')).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    it('clears all keys matching the storage prefix', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const prefixed1 = prefixKey('key1');
      const prefixed2 = prefixKey('key2');
      mockLS.setItem(prefixed1, JSON.stringify('val1'));
      mockLS.setItem(prefixed2, JSON.stringify('val2'));
      mockLS.setItem('other-app-key', JSON.stringify('other'));

      await adapter.clear();

      expect(mockLS.removeItem).toHaveBeenCalledWith(prefixed1);
      expect(mockLS.removeItem).toHaveBeenCalledWith(prefixed2);
      // The 'other-app-key' should not be removed
      const store = mockLS._getStore();
      expect(store['other-app-key']).toBe(JSON.stringify('other'));
    });

    it('handles clear error gracefully', async () => {
      let callCount = 0;
      const throwingLS = createMockStorage({
        get length() {
          throw new Error('length error');
        },
        key: vi.fn(() => {
          throw new Error('key error');
        }),
      });
      Object.defineProperty(window, 'localStorage', {
        value: throwingLS,
        writable: true,
        configurable: true,
      });

      const mockSS = createMockStorage();
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      await expect(adapter.clear()).resolves.toBeUndefined();
      consoleSpy.mockRestore();
    });
  });

  describe('keys', () => {
    it('returns all keys matching the storage prefix', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const prefixed1 = prefixKey('key-a');
      const prefixed2 = prefixKey('key-b');
      mockLS.setItem(prefixed1, JSON.stringify('a'));
      mockLS.setItem(prefixed2, JSON.stringify('b'));
      mockLS.setItem('unrelated-key', JSON.stringify('c'));

      const result = await adapter.keys();
      expect(result).toContain(prefixed1);
      expect(result).toContain(prefixed2);
      expect(result).not.toContain('unrelated-key');
    });

    it('returns an empty array when no matching keys exist', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const result = await adapter.keys();
      expect(result).toEqual([]);
    });

    it('returns an empty array when storage throws', async () => {
      const throwingLS = createMockStorage({
        get length() {
          throw new Error('length error');
        },
      });
      Object.defineProperty(window, 'localStorage', {
        value: throwingLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await adapter.keys();
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('in-memory fallback', () => {
    it('stores and retrieves data using in-memory storage', async () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('unavailable');
        },
        configurable: true,
      });

      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new Error('unavailable');
        },
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      expect(adapter.activeType).toBe('memory');

      const testData = { items: [1, 2, 3], name: 'test' };
      await adapter.set('mem-test', testData);
      const result = await adapter.get('mem-test');
      expect(result).toEqual(testData);
    });

    it('removes data from in-memory storage', async () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('unavailable');
        },
        configurable: true,
      });

      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new Error('unavailable');
        },
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      await adapter.set('mem-remove', 'value');
      await adapter.remove('mem-remove');
      const result = await adapter.get('mem-remove');
      expect(result).toBeNull();
    });

    it('clears data from in-memory storage', async () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('unavailable');
        },
        configurable: true,
      });

      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new Error('unavailable');
        },
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      await adapter.set('mem-clear-1', 'a');
      await adapter.set('mem-clear-2', 'b');
      await adapter.clear();

      const result1 = await adapter.get('mem-clear-1');
      const result2 = await adapter.get('mem-clear-2');
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('round-trip operations', () => {
    it('performs a full set-get-remove cycle', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const data = { id: 'variant-1', price: 99.99, features: ['a', 'b'] };

      await adapter.set('cycle-key', data);
      const retrieved = await adapter.get('cycle-key');
      expect(retrieved).toEqual(data);

      await adapter.remove('cycle-key');
      const afterRemove = await adapter.get('cycle-key');
      expect(afterRemove).toBeNull();
    });

    it('overwrites existing data on set', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');

      await adapter.set('overwrite-key', { version: 1 });
      await adapter.set('overwrite-key', { version: 2 });

      const result = await adapter.get('overwrite-key');
      expect(result).toEqual({ version: 2 });
    });

    it('handles multiple keys independently', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');

      await adapter.set('key-alpha', 'alpha');
      await adapter.set('key-beta', 'beta');
      await adapter.set('key-gamma', 'gamma');

      expect(await adapter.get('key-alpha')).toBe('alpha');
      expect(await adapter.get('key-beta')).toBe('beta');
      expect(await adapter.get('key-gamma')).toBe('gamma');

      await adapter.remove('key-beta');
      expect(await adapter.get('key-alpha')).toBe('alpha');
      expect(await adapter.get('key-beta')).toBeNull();
      expect(await adapter.get('key-gamma')).toBe('gamma');
    });
  });

  describe('corrupted JSON recovery', () => {
    it('removes corrupted data and returns null', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const prefixed = prefixKey('corrupt');
      mockLS.setItem(prefixed, 'not valid json {{{');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await adapter.get('corrupt');

      expect(result).toBeNull();
      expect(mockLS.removeItem).toHaveBeenCalledWith(prefixed);
      consoleSpy.mockRestore();
    });

    it('handles partially valid JSON gracefully', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const prefixed = prefixKey('partial');
      mockLS.setItem(prefixed, '{"key": "value",}');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await adapter.get('partial');

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('allows subsequent set after corrupted get', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const prefixed = prefixKey('recover');
      mockLS.setItem(prefixed, 'corrupted!!!');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await adapter.get('recover');
      consoleSpy.mockRestore();

      await adapter.set('recover', { recovered: true });
      const result = await adapter.get('recover');
      expect(result).toEqual({ recovered: true });
    });
  });

  describe('key prefixing', () => {
    it('automatically prefixes keys on set', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      await adapter.set('my-data', 'value');

      const prefixed = prefixKey('my-data');
      expect(mockLS.setItem).toHaveBeenCalledWith(prefixed, expect.any(String));
    });

    it('automatically prefixes keys on get', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      await adapter.get('my-data');

      const prefixed = prefixKey('my-data');
      expect(mockLS.getItem).toHaveBeenCalledWith(prefixed);
    });

    it('automatically prefixes keys on remove', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      await adapter.remove('my-data');

      const prefixed = prefixKey('my-data');
      expect(mockLS.removeItem).toHaveBeenCalledWith(prefixed);
    });

    it('does not double-prefix already-prefixed keys', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const alreadyPrefixed = `${STORAGE_PREFIX}-already`;
      await adapter.set(alreadyPrefixed, 'value');

      expect(mockLS.setItem).toHaveBeenCalledWith(alreadyPrefixed, expect.any(String));
    });
  });

  describe('activeType property', () => {
    it('returns localStorage when localStorage is available', () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      expect(adapter.activeType).toBe('localStorage');
    });

    it('returns sessionStorage when falling back', () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('unavailable');
        },
        configurable: true,
      });

      const mockSS = createMockStorage();
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      expect(adapter.activeType).toBe('sessionStorage');
    });

    it('returns memory when all browser storage is unavailable', () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('unavailable');
        },
        configurable: true,
      });

      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new Error('unavailable');
        },
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      expect(adapter.activeType).toBe('memory');
    });
  });

  describe('complex data types', () => {
    it('handles deeply nested objects', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const deepData = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
              array: [1, { nested: true }],
            },
          },
        },
      };

      await adapter.set('deep-key', deepData);
      const result = await adapter.get('deep-key');
      expect(result).toEqual(deepData);
    });

    it('handles empty objects', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      await adapter.set('empty-obj', {});
      const result = await adapter.get('empty-obj');
      expect(result).toEqual({});
    });

    it('handles empty arrays', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      await adapter.set('empty-arr', []);
      const result = await adapter.get('empty-arr');
      expect(result).toEqual([]);
    });

    it('handles numeric zero', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      await adapter.set('zero', 0);
      const result = await adapter.get('zero');
      expect(result).toBe(0);
    });

    it('handles boolean false', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      await adapter.set('false-val', false);
      const result = await adapter.get('false-val');
      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles get returning undefined from getItem', async () => {
      const mockLS = createMockStorage({
        getItem: vi.fn(() => undefined),
      });
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const result = await adapter.get('undef-key');
      expect(result).toBeNull();
    });

    it('handles storing and retrieving large arrays', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      const largeArray = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        value: i * 10,
      }));

      await adapter.set('large-array', largeArray);
      const result = await adapter.get('large-array');
      expect(result).toEqual(largeArray);
      expect(result.length).toBe(100);
    });

    it('clear does not affect keys from other applications', async () => {
      const mockLS = createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: mockLS,
        writable: true,
        configurable: true,
      });

      const adapter = new StorageAdapter('localStorage');
      mockLS.setItem('other-app-data', 'should-remain');
      mockLS.setItem(prefixKey('our-data'), JSON.stringify('should-go'));

      await adapter.clear();

      const store = mockLS._getStore();
      expect(store['other-app-data']).toBe('should-remain');
    });
  });
});