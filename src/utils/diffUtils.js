/**
 * @module diffUtils
 * @description Utility functions for computing visual diffs between a control PDP
 * and a variant. Used by gallery and detail views for diff highlighting.
 * [Pipeline-aligned: synthetic data only]
 */

/**
 * Deeply compares two values for equality using JSON serialization.
 * @param {*} a - First value.
 * @param {*} b - Second value.
 * @returns {boolean} True if values are deeply equal.
 */
function deepEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) {
      return true;
    }
    return a === b;
  }

  if (typeof a === 'string' || typeof a === 'boolean') {
    return a === b;
  }

  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (_e) {
    return false;
  }
}

/**
 * Computes a visual diff between a control variant and a target variant.
 * Returns an object mapping field names to { changed, controlValue, variantValue }.
 * Compares the variantData fields of each manifest.
 *
 * @param {object} control - The control variant manifest (or its variantData).
 * @param {object} variant - The target variant manifest (or its variantData).
 * @returns {Object<string, { changed: boolean, controlValue: *, variantValue: * }>}
 *   An object mapping each field name to its diff result.
 */
function computeDiff(control, variant) {
  const diff = {};

  if (!control || !variant) {
    return diff;
  }

  const controlData = control.variantData || control;
  const variantData = variant.variantData || variant;

  if (typeof controlData !== 'object' || controlData === null || Array.isArray(controlData)) {
    return diff;
  }

  if (typeof variantData !== 'object' || variantData === null || Array.isArray(variantData)) {
    return diff;
  }

  const allKeys = new Set([
    ...Object.keys(controlData),
    ...Object.keys(variantData),
  ]);

  for (const key of allKeys) {
    const controlValue = controlData[key] !== undefined ? controlData[key] : null;
    const variantValue = variantData[key] !== undefined ? variantData[key] : null;
    const changed = !deepEqual(controlValue, variantValue);

    diff[key] = {
      changed,
      controlValue,
      variantValue,
    };
  }

  return diff;
}

/**
 * Returns an array of field names that have changed between control and variant.
 * @param {object} control - The control variant manifest (or its variantData).
 * @param {object} variant - The target variant manifest (or its variantData).
 * @returns {string[]} Array of changed field names.
 */
function getChangedFields(control, variant) {
  const diff = computeDiff(control, variant);
  return Object.keys(diff).filter((key) => diff[key].changed);
}

/**
 * Returns the count of fields that have changed between control and variant.
 * @param {object} control - The control variant manifest (or its variantData).
 * @param {object} variant - The target variant manifest (or its variantData).
 * @returns {number} Number of changed fields.
 */
function getChangedFieldCount(control, variant) {
  return getChangedFields(control, variant).length;
}

/**
 * Checks whether a specific field has changed between control and variant.
 * @param {object} control - The control variant manifest (or its variantData).
 * @param {object} variant - The target variant manifest (or its variantData).
 * @param {string} fieldName - The field name to check.
 * @returns {boolean} True if the field has changed.
 */
function hasFieldChanged(control, variant, fieldName) {
  const diff = computeDiff(control, variant);
  if (diff[fieldName]) {
    return diff[fieldName].changed;
  }
  return false;
}

export {
  computeDiff,
  getChangedFields,
  getChangedFieldCount,
  hasFieldChanged,
  deepEqual,
};