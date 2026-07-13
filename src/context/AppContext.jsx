/**
 * @module AppContext
 * @description React Context + useReducer for global application state.
 * Manages variants, cohorts, canonicalProducts, errors, loading state, and export status.
 * Integrates StorageAdapter for persistence and VariantFactory for generation on initial load.
 * [Pipeline-aligned: synthetic data only]
 */

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { storageAdapter } from '@/services/storageAdapter.js';
import { generateVariants } from '@/services/variantFactory.js';
import { canonicalProducts as defaultCanonicalProducts } from '@/data/canonicalProducts.js';
import { cohorts as defaultCohorts } from '@/data/cohorts.js';
import { STORAGE_KEYS, ERROR_MESSAGES } from '@/constants/constants.js';

/**
 * Action types for the app reducer.
 * @enum {string}
 */
const ACTION_TYPES = {
  SET_VARIANTS: 'SET_VARIANTS',
  SET_COHORTS: 'SET_COHORTS',
  SET_CANONICAL: 'SET_CANONICAL',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
  SET_EXPORT_STATUS: 'SET_EXPORT_STATUS',
};

/**
 * Initial state for the app reducer.
 * @type {object}
 */
const initialState = {
  variants: [],
  cohorts: [],
  canonicalProducts: [],
  error: null,
  loading: false,
  exportStatus: null,
};

/**
 * Reducer function for global application state.
 * @param {object} state - The current state.
 * @param {object} action - The dispatched action.
 * @returns {object} The new state.
 */
function appReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_VARIANTS:
      return { ...state, variants: action.payload };
    case ACTION_TYPES.SET_COHORTS:
      return { ...state, cohorts: action.payload };
    case ACTION_TYPES.SET_CANONICAL:
      return { ...state, canonicalProducts: action.payload };
    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTION_TYPES.CLEAR_ERROR:
      return { ...state, error: null };
    case ACTION_TYPES.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTION_TYPES.SET_EXPORT_STATUS:
      return { ...state, exportStatus: action.payload };
    default:
      return state;
  }
}

/**
 * React context for global application state.
 * @type {React.Context}
 */
const AppContext = createContext(null);

/**
 * Determines whether to seed sample data on initial load.
 * @returns {boolean}
 */
function shouldSeedOnLoad() {
  const envValue = import.meta.env.VITE_SEED_ON_LOAD;
  if (envValue === undefined || envValue === null) {
    return true;
  }
  return String(envValue).toLowerCase() === 'true';
}

/**
 * AppProvider component that wraps the application with global state context.
 * Integrates StorageAdapter for persistence and VariantFactory for generation on initial load.
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element}
 */
function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  /**
   * Sets variants in state and persists to storage.
   * @param {object[]} variants - Array of variant manifest objects.
   */
  const setVariants = useCallback(async (variants) => {
    dispatch({ type: ACTION_TYPES.SET_VARIANTS, payload: variants });
    try {
      await storageAdapter.set(STORAGE_KEYS.variants, variants);
    } catch (error) {
      console.error(ERROR_MESSAGES.STORAGE_WRITE, error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: ERROR_MESSAGES.STORAGE_WRITE });
    }
  }, []);

  /**
   * Sets cohorts in state and persists to storage.
   * @param {object[]} cohorts - Array of cohort configuration objects.
   */
  const setCohorts = useCallback(async (cohorts) => {
    dispatch({ type: ACTION_TYPES.SET_COHORTS, payload: cohorts });
    try {
      await storageAdapter.set(STORAGE_KEYS.cohorts, cohorts);
    } catch (error) {
      console.error(ERROR_MESSAGES.STORAGE_WRITE, error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: ERROR_MESSAGES.STORAGE_WRITE });
    }
  }, []);

  /**
   * Sets canonical products in state and persists to storage.
   * @param {object[]} products - Array of canonical PDP objects.
   */
  const setCanonicalProducts = useCallback(async (products) => {
    dispatch({ type: ACTION_TYPES.SET_CANONICAL, payload: products });
    try {
      await storageAdapter.set(STORAGE_KEYS.canonicalPDP, products);
    } catch (error) {
      console.error(ERROR_MESSAGES.STORAGE_WRITE, error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: ERROR_MESSAGES.STORAGE_WRITE });
    }
  }, []);

  /**
   * Sets an error message in state.
   * @param {string} errorMessage - The error message.
   */
  const setError = useCallback((errorMessage) => {
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: errorMessage });
  }, []);

  /**
   * Clears the current error from state.
   */
  const clearError = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_ERROR });
  }, []);

  /**
   * Sets the loading state.
   * @param {boolean} isLoading - Whether the app is loading.
   */
  const setLoading = useCallback((isLoading) => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: isLoading });
  }, []);

  /**
   * Sets the export status.
   * @param {string|null} status - The export status message or null.
   */
  const setExportStatus = useCallback((status) => {
    dispatch({ type: ACTION_TYPES.SET_EXPORT_STATUS, payload: status });
  }, []);

  /**
   * Regenerates variants from current canonical products and cohorts.
   * @param {object[]} [products] - Optional canonical products override.
   * @param {object[]} [cohortList] - Optional cohorts override.
   */
  const regenerateVariants = useCallback(async (products, cohortList) => {
    const productsToUse = products || state.canonicalProducts;
    const cohortsToUse = cohortList || state.cohorts;

    if (!productsToUse.length || !cohortsToUse.length) {
      return;
    }

    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
    dispatch({ type: ACTION_TYPES.CLEAR_ERROR });

    try {
      const variants = await generateVariants(productsToUse, cohortsToUse);
      dispatch({ type: ACTION_TYPES.SET_VARIANTS, payload: variants });
      await storageAdapter.set(STORAGE_KEYS.variants, variants);
    } catch (error) {
      console.error(ERROR_MESSAGES.INVALID_VARIANT_DATA, error);
      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: error instanceof Error ? error.message : ERROR_MESSAGES.INVALID_VARIANT_DATA,
      });
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  }, [state.canonicalProducts, state.cohorts]);

  /**
   * Initializes state from storage or seeds default data on first load.
   */
  useEffect(() => {
    let cancelled = false;

    async function initializeState() {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

      try {
        const storedVariants = await storageAdapter.get(STORAGE_KEYS.variants);
        const storedCohorts = await storageAdapter.get(STORAGE_KEYS.cohorts);
        const storedCanonical = await storageAdapter.get(STORAGE_KEYS.canonicalPDP);

        if (cancelled) {
          return;
        }

        const hasStoredData =
          Array.isArray(storedVariants) && storedVariants.length > 0 &&
          Array.isArray(storedCohorts) && storedCohorts.length > 0 &&
          Array.isArray(storedCanonical) && storedCanonical.length > 0;

        if (hasStoredData) {
          dispatch({ type: ACTION_TYPES.SET_CANONICAL, payload: storedCanonical });
          dispatch({ type: ACTION_TYPES.SET_COHORTS, payload: storedCohorts });
          dispatch({ type: ACTION_TYPES.SET_VARIANTS, payload: storedVariants });
        } else if (shouldSeedOnLoad()) {
          dispatch({ type: ACTION_TYPES.SET_CANONICAL, payload: defaultCanonicalProducts });
          dispatch({ type: ACTION_TYPES.SET_COHORTS, payload: defaultCohorts });

          await storageAdapter.set(STORAGE_KEYS.canonicalPDP, defaultCanonicalProducts);
          await storageAdapter.set(STORAGE_KEYS.cohorts, defaultCohorts);

          const variants = await generateVariants(defaultCanonicalProducts, defaultCohorts);

          if (cancelled) {
            return;
          }

          dispatch({ type: ACTION_TYPES.SET_VARIANTS, payload: variants });
          await storageAdapter.set(STORAGE_KEYS.variants, variants);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(ERROR_MESSAGES.STORAGE_READ, error);
          dispatch({
            type: ACTION_TYPES.SET_ERROR,
            payload: error instanceof Error ? error.message : ERROR_MESSAGES.STORAGE_READ,
          });
        }
      } finally {
        if (!cancelled) {
          dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
        }
      }
    }

    initializeState();

    return () => {
      cancelled = true;
    };
  }, []);

  const contextValue = {
    state,
    dispatch,
    setVariants,
    setCohorts,
    setCanonicalProducts,
    setError,
    clearError,
    setLoading,
    setExportStatus,
    regenerateVariants,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the AppContext.
 * Throws an error if used outside of an AppProvider.
 * @returns {object} The context value containing state and action dispatchers.
 */
function useAppContext() {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppContext must be used within an AppProvider.');
  }
  return context;
}

export { AppContext, AppProvider, useAppContext, ACTION_TYPES, appReducer, initialState };
export default AppProvider;