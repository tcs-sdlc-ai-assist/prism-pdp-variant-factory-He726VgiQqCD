/**
 * @module storageAdapter
 * @description StorageAdapter class abstracting localStorage with sessionStorage fallback
 * and in-memory last-resort. Handles quota exceeded, unavailable storage, corrupted JSON.
 * All keys prefixed with STORAGE_PREFIX.
 * [Pipeline-aligned: UI hints + mock API]
 */

import { STORAGE_PREFIX, ERROR_MESSAGES } from '@/constants/constants.js';

/**
 * In-memory fallback storage implementation.
 * Used when both localStorage and sessionStorage are unavailable.
 */
function createMemoryStorage() {
  let store = {};
  return {
    getItem(key) {
      return key in store ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key(index) {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
}

/**
 * Checks whether a given storage mechanism is available and functional.
 * @param {string} type - 'localStorage' or 'sessionStorage'
 * @returns {boolean}
 */
function storageAvailable(type) {
  try {
    const storage = window[type];
    const testKey = `__${STORAGE_PREFIX}_storage_test__`;
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (_e) {
    return false;
  }
}

/**
 * Prefixes a key with the configured STORAGE_PREFIX.
 * @param {string} key - The raw key
 * @returns {string} The prefixed key
 */
function prefixKey(key) {
  if (key.startsWith(`${STORAGE_PREFIX}-`)) {
    return key;
  }
  return `${STORAGE_PREFIX}-${key}`;
}

/**
 * StorageAdapter class that abstracts browser storage with fallback chain:
 * localStorage -> sessionStorage -> in-memory storage.
 *
 * All public methods return Promises for consistency.
 */
class StorageAdapter {
  /**
   * Creates a new StorageAdapter instance.
   * @param {string} [storageType='localStorage'] - Preferred storage type ('localStorage' or 'sessionStorage').
   */
  constructor(storageType = 'localStorage') {
    /** @type {string} */
    this._preferredType = storageType;

    /** @type {object} */
    this._storage = null;

    /** @type {string} */
    this._activeType = 'memory';

    /** @type {object} */
    this._memoryStorage = createMemoryStorage();

    this._initStorage();
  }

  /**
   * Initializes the storage backend based on availability.
   * Falls back through localStorage -> sessionStorage -> in-memory.
   * @private
   */
  _initStorage() {
    if (storageAvailable(this._preferredType)) {
      this._storage = window[this._preferredType];
      this._activeType = this._preferredType;
    } else if (this._preferredType !== 'sessionStorage' && storageAvailable('sessionStorage')) {
      this._storage = window.sessionStorage;
      this._activeType = 'sessionStorage';
    } else {
      this._storage = this._memoryStorage;
      this._activeType = 'memory';
    }
  }

  /**
   * Returns the currently active storage type.
   * @returns {string} 'localStorage', 'sessionStorage', or 'memory'
   */
  get activeType() {
    return this._activeType;
  }

  /**
   * Checks whether the preferred storage type is available.
   * @returns {boolean}
   */
  isAvailable() {
    return storageAvailable(this._preferredType);
  }

  /**
   * Retrieves and parses a value from storage by key.
   * @param {string} key - The storage key (will be prefixed automatically).
   * @returns {Promise<*>} The parsed value, or null if not found.
   */
  async get(key) {
    const prefixed = prefixKey(key);
    try {
      const raw = this._storage.getItem(prefixed);
      if (raw === null || raw === undefined) {
        return null;
      }
      try {
        return JSON.parse(raw);
      } catch (_parseError) {
        console.error(ERROR_MESSAGES.PARSE_ERROR, { key: prefixed });
        this._storage.removeItem(prefixed);
        return null;
      }
    } catch (error) {
      console.error(ERROR_MESSAGES.STORAGE_READ, { key: prefixed, error });
      return this._fallbackGet(prefixed);
    }
  }

  /**
   * Serializes and stores a value under the given key.
   * @param {string} key - The storage key (will be prefixed automatically).
   * @param {*} value - The value to store (must be JSON-serializable).
   * @returns {Promise<void>}
   */
  async set(key, value) {
    const prefixed = prefixKey(key);
    const serialized = JSON.stringify(value);
    try {
      this._storage.setItem(prefixed, serialized);
    } catch (error) {
      console.error(ERROR_MESSAGES.STORAGE_WRITE, { key: prefixed, error });
      this._fallbackSet(prefixed, serialized);
    }
  }

  /**
   * Removes a value from storage by key.
   * @param {string} key - The storage key (will be prefixed automatically).
   * @returns {Promise<void>}
   */
  async remove(key) {
    const prefixed = prefixKey(key);
    try {
      this._storage.removeItem(prefixed);
    } catch (error) {
      console.error(ERROR_MESSAGES.STORAGE_CLEAR, { key: prefixed, error });
      this._fallbackRemove(prefixed);
    }
  }

  /**
   * Clears all keys that match the STORAGE_PREFIX from the active storage.
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      const keysToRemove = [];
      const storageLength = this._storage.length;
      for (let i = 0; i < storageLength; i++) {
        const k = this._storage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => {
        this._storage.removeItem(k);
      });
    } catch (error) {
      console.error(ERROR_MESSAGES.STORAGE_CLEAR, { error });
      try {
        this._memoryStorage.clear();
      } catch (_fallbackError) {
        // Last resort: nothing more we can do
      }
    }
  }

  /**
   * Returns all keys in storage that match the STORAGE_PREFIX.
   * @returns {Promise<string[]>}
   */
  async keys() {
    try {
      const result = [];
      const storageLength = this._storage.length;
      for (let i = 0; i < storageLength; i++) {
        const k = this._storage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          result.push(k);
        }
      }
      return result;
    } catch (error) {
      console.error(ERROR_MESSAGES.STORAGE_READ, { error });
      return [];
    }
  }

  /**
   * Fallback get using sessionStorage or memory storage.
   * @param {string} prefixedKey - The already-prefixed key.
   * @returns {*} The parsed value, or null.
   * @private
   */
  _fallbackGet(prefixedKey) {
    try {
      if (this._activeType !== 'sessionStorage' && storageAvailable('sessionStorage')) {
        const raw = window.sessionStorage.getItem(prefixedKey);
        if (raw === null) {
          return null;
        }
        return JSON.parse(raw);
      }
    } catch (_e) {
      // Fall through to memory
    }
    try {
      const raw = this._memoryStorage.getItem(prefixedKey);
      if (raw === null) {
        return null;
      }
      return JSON.parse(raw);
    } catch (_e) {
      return null;
    }
  }

  /**
   * Fallback set using sessionStorage or memory storage.
   * @param {string} prefixedKey - The already-prefixed key.
   * @param {string} serialized - The JSON-serialized value.
   * @private
   */
  _fallbackSet(prefixedKey, serialized) {
    try {
      if (this._activeType !== 'sessionStorage' && storageAvailable('sessionStorage')) {
        window.sessionStorage.setItem(prefixedKey, serialized);
        return;
      }
    } catch (_e) {
      // Fall through to memory
    }
    try {
      this._memoryStorage.setItem(prefixedKey, serialized);
    } catch (_e) {
      console.error(ERROR_MESSAGES.STORAGE_WRITE, { key: prefixedKey });
    }
  }

  /**
   * Fallback remove using sessionStorage or memory storage.
   * @param {string} prefixedKey - The already-prefixed key.
   * @private
   */
  _fallbackRemove(prefixedKey) {
    try {
      if (this._activeType !== 'sessionStorage' && storageAvailable('sessionStorage')) {
        window.sessionStorage.removeItem(prefixedKey);
        return;
      }
    } catch (_e) {
      // Fall through to memory
    }
    try {
      this._memoryStorage.removeItem(prefixedKey);
    } catch (_e) {
      // Nothing more we can do
    }
  }
}

/**
 * Default StorageAdapter instance using localStorage as preferred storage.
 * @type {StorageAdapter}
 */
const storageAdapter = new StorageAdapter('localStorage');

export { StorageAdapter, storageAdapter, createMemoryStorage, prefixKey };
export default storageAdapter;