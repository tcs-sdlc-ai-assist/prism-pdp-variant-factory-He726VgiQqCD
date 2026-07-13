const STORAGE_PREFIX = import.meta.env.VITE_STORAGE_PREFIX || 'prism-pdp';

const APP_VERSION = '1.0.0';

const VARIANT_COUNT = 10;

const STORAGE_KEYS = {
  variants: `${STORAGE_PREFIX}-variants`,
  cohorts: `${STORAGE_PREFIX}-cohorts`,
  canonicalPDP: `${STORAGE_PREFIX}-canonical-pdp`,
  meta: `${STORAGE_PREFIX}-meta`,
};

const COHORT_IDS = {
  CONTROL: 'control',
  VARIANT_A: 'variant-a',
  VARIANT_B: 'variant-b',
  VARIANT_C: 'variant-c',
};

const ERROR_MESSAGES = {
  STORAGE_READ: 'Failed to read from local storage.',
  STORAGE_WRITE: 'Failed to write to local storage.',
  STORAGE_CLEAR: 'Failed to clear local storage.',
  VARIANT_NOT_FOUND: 'The requested variant could not be found.',
  VARIANT_LIMIT_REACHED: `Maximum of ${VARIANT_COUNT} variants allowed.`,
  COHORT_NOT_FOUND: 'The requested cohort could not be found.',
  INVALID_VARIANT_DATA: 'Variant data is invalid or incomplete.',
  INVALID_COHORT_DATA: 'Cohort data is invalid or incomplete.',
  CANONICAL_NOT_SET: 'No canonical PDP has been set.',
  PARSE_ERROR: 'Failed to parse stored data.',
};

const PIPELINE_TAGS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

export {
  STORAGE_PREFIX,
  APP_VERSION,
  VARIANT_COUNT,
  STORAGE_KEYS,
  COHORT_IDS,
  ERROR_MESSAGES,
  PIPELINE_TAGS,
};