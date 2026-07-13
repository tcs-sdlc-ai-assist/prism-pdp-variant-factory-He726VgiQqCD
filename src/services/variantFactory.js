/**
 * @module variantFactory
 * @description VariantFactory: deterministic engine that generates 10 PDP variants
 * from canonical products and cohort configs. Applies cohort tailoring rules to produce
 * variant-specific title, description, hero image, CTA, badge, price display, and
 * feature ordering. Each variant gets a unique id, cohortId, productId, tailoredFields,
 * and a generated manifest. Uses SchemaValidator before returning.
 * [Pipeline-aligned: synthetic data only]
 */

import { VARIANT_COUNT, ERROR_MESSAGES } from '@/constants/constants.js';
import { validateVariantManifest } from '@/utils/schemaValidator.js';

/**
 * Generates a deterministic unique variant ID from product and cohort IDs.
 * @param {string} productId - The canonical product ID.
 * @param {string} cohortId - The cohort ID.
 * @param {number} index - The variant index.
 * @returns {string} A unique variant ID.
 */
function generateVariantId(productId, cohortId, index) {
  return `variant-${productId}-${cohortId}-${index}`;
}

/**
 * Applies title tailoring based on cohort configuration.
 * @param {string} originalTitle - The canonical product title.
 * @param {object} cohort - The cohort configuration.
 * @returns {string} The tailored title.
 */
function tailorTitle(originalTitle, cohort) {
  const cohortId = cohort.id;

  if (cohortId === 'cohort-budget-shopper') {
    return `${originalTitle} — Great Value Deal`;
  }
  if (cohortId === 'cohort-tech-enthusiast') {
    return `${originalTitle} — Performance Edition`;
  }
  if (cohortId === 'cohort-premium-buyer') {
    return `${originalTitle} — Premium Collection`;
  }
  if (cohortId === 'cohort-student') {
    return `${originalTitle} — Student Essentials`;
  }
  if (cohortId === 'cohort-business-buyer') {
    return `${originalTitle} — Business Pro`;
  }

  return originalTitle;
}

/**
 * Applies description tailoring based on cohort configuration.
 * @param {string} originalDescription - The canonical product description.
 * @param {object} cohort - The cohort configuration.
 * @returns {string} The tailored description.
 */
function tailorDescription(originalDescription, cohort) {
  const cohortId = cohort.id;

  if (cohortId === 'cohort-budget-shopper') {
    return `${originalDescription} Save more with this incredible value pick — designed to deliver top performance without breaking the bank. [Synthetic variant.]`;
  }
  if (cohortId === 'cohort-tech-enthusiast') {
    return `${originalDescription} Engineered for power users who demand cutting-edge specs and benchmark-topping performance. Dive into the full technical details below. [Synthetic variant.]`;
  }
  if (cohortId === 'cohort-premium-buyer') {
    return `${originalDescription} Elevate your experience with premium craftsmanship, exclusive features, and white-glove service options included. [Synthetic variant.]`;
  }
  if (cohortId === 'cohort-student') {
    return `${originalDescription} Perfect for campus life — portable, reliable, and ready for all-day productivity. Student pricing available. [Synthetic variant.]`;
  }
  if (cohortId === 'cohort-business-buyer') {
    return `${originalDescription} Enterprise-ready with robust security, fleet management support, and volume pricing for your organization. [Synthetic variant.]`;
  }

  return originalDescription;
}

/**
 * Tailors the hero image selection based on cohort.
 * Reorders images to prioritize the most relevant image for the cohort.
 * @param {string[]} originalImages - The canonical product images.
 * @param {object} cohort - The cohort configuration.
 * @returns {string[]} The tailored image array.
 */
function tailorImages(originalImages, cohort) {
  if (!originalImages || originalImages.length === 0) {
    return originalImages;
  }

  const images = [...originalImages];
  const cohortId = cohort.id;

  if (cohortId === 'cohort-budget-shopper') {
    // Prioritize front/value image (index 0 stays)
    return images;
  }
  if (cohortId === 'cohort-tech-enthusiast') {
    // Prioritize technical detail shot (move last image to front if available)
    if (images.length > 2) {
      const techImage = images.splice(2, 1)[0];
      images.unshift(techImage);
    }
    return images;
  }
  if (cohortId === 'cohort-premium-buyer') {
    // Prioritize lifestyle/angle shot (move second image to front if available)
    if (images.length > 1) {
      const lifestyleImage = images.splice(1, 1)[0];
      images.unshift(lifestyleImage);
    }
    return images;
  }
  if (cohortId === 'cohort-student') {
    // Prioritize portable/keyboard shot (move third image to front if available)
    if (images.length > 2) {
      const portableImage = images.splice(2, 1)[0];
      images.unshift(portableImage);
    }
    return images;
  }
  if (cohortId === 'cohort-business-buyer') {
    // Prioritize professional setting (move last image to front if available)
    if (images.length > 1) {
      const businessImage = images.splice(images.length - 1, 1)[0];
      images.unshift(businessImage);
    }
    return images;
  }

  return images;
}

/**
 * Generates a badge text based on cohort.
 * @param {object} cohort - The cohort configuration.
 * @returns {string} The badge text.
 */
function generateBadge(cohort) {
  const cohortId = cohort.id;

  if (cohortId === 'cohort-budget-shopper') {
    return 'Great Value';
  }
  if (cohortId === 'cohort-tech-enthusiast') {
    return 'Latest Tech';
  }
  if (cohortId === 'cohort-premium-buyer') {
    return 'Premium Pick';
  }
  if (cohortId === 'cohort-student') {
    return 'Student Favorite';
  }
  if (cohortId === 'cohort-business-buyer') {
    return 'Business Ready';
  }

  return '';
}

/**
 * Generates a promotion message based on cohort.
 * @param {object} cohort - The cohort configuration.
 * @param {number} price - The canonical product price.
 * @returns {string} The promotion message.
 */
function generatePromotionMessage(cohort, price) {
  const cohortId = cohort.id;

  if (cohortId === 'cohort-budget-shopper') {
    const monthlyPayment = (price / 24).toFixed(2);
    return `As low as $${monthlyPayment}/mo with 0% APR financing. Save big today!`;
  }
  if (cohortId === 'cohort-tech-enthusiast') {
    return 'Free expedited shipping on the latest tech. Order now for launch-day delivery.';
  }
  if (cohortId === 'cohort-premium-buyer') {
    return 'Includes complimentary white-glove delivery, setup, and 2-year extended warranty.';
  }
  if (cohortId === 'cohort-student') {
    const studentPrice = (price * 0.9).toFixed(2);
    return `Student price: $${studentPrice} — verify your .edu email to save 10%.`;
  }
  if (cohortId === 'cohort-business-buyer') {
    return 'Volume discounts available. Request a custom quote for your organization.';
  }

  return '';
}

/**
 * Tailors the price display based on cohort.
 * @param {number} originalPrice - The canonical product price.
 * @param {object} cohort - The cohort configuration.
 * @returns {number} The tailored price.
 */
function tailorPrice(originalPrice, cohort) {
  const cohortId = cohort.id;

  if (cohortId === 'cohort-student') {
    return Math.round(originalPrice * 0.9 * 100) / 100;
  }

  return originalPrice;
}

/**
 * Tailors the feature list ordering and emphasis based on cohort.
 * @param {string[]} originalFeatures - The canonical product features.
 * @param {object} cohort - The cohort configuration.
 * @returns {string[]} The tailored feature list.
 */
function tailorFeatures(originalFeatures, cohort) {
  if (!originalFeatures || originalFeatures.length === 0) {
    return originalFeatures;
  }

  const features = [...originalFeatures];
  const cohortId = cohort.id;

  if (cohortId === 'cohort-budget-shopper') {
    // Prioritize cost-saving features (energy, warranty)
    const priorityKeywords = ['energy', 'warranty', 'efficient', 'value', 'save'];
    return sortFeaturesByKeywords(features, priorityKeywords);
  }
  if (cohortId === 'cohort-tech-enthusiast') {
    // Prioritize performance specs
    const priorityKeywords = ['processor', 'refresh', 'hz', 'core', 'thread', 'gpu', 'ddr', 'nvme', 'pcie', 'hdmi', 'thunderbolt'];
    return sortFeaturesByKeywords(features, priorityKeywords);
  }
  if (cohortId === 'cohort-premium-buyer') {
    // Prioritize design and quality features
    const priorityKeywords = ['design', 'premium', 'quality', 'dolby', 'atmos', 'ambient', 'art'];
    return sortFeaturesByKeywords(features, priorityKeywords);
  }
  if (cohortId === 'cohort-student') {
    // Prioritize portability and battery
    const priorityKeywords = ['battery', 'portable', 'light', 'hour', 'backlit', 'keyboard', 'wi-fi'];
    return sortFeaturesByKeywords(features, priorityKeywords);
  }
  if (cohortId === 'cohort-business-buyer') {
    // Prioritize security and management features
    const priorityKeywords = ['security', 'manage', 'enterprise', 'thunderbolt', 'usb', 'port', 'bluetooth'];
    return sortFeaturesByKeywords(features, priorityKeywords);
  }

  return features;
}

/**
 * Sorts features by moving those matching priority keywords to the top.
 * @param {string[]} features - The feature list.
 * @param {string[]} keywords - Priority keywords.
 * @returns {string[]} Sorted feature list.
 */
function sortFeaturesByKeywords(features, keywords) {
  const prioritized = [];
  const remaining = [];

  for (const feature of features) {
    const lowerFeature = feature.toLowerCase();
    const hasPriority = keywords.some((kw) => lowerFeature.includes(kw));
    if (hasPriority) {
      prioritized.push(feature);
    } else {
      remaining.push(feature);
    }
  }

  return [...prioritized, ...remaining];
}

/**
 * Extracts the applied tailoring rules from a cohort configuration.
 * @param {object} cohort - The cohort configuration.
 * @returns {Array<{ruleId: string, description: string, applied: boolean}>}
 */
function getAppliedRules(cohort) {
  if (!cohort.tailoringRules || !Array.isArray(cohort.tailoringRules)) {
    return [];
  }

  return cohort.tailoringRules.map((rule) => ({
    ruleId: rule.ruleId,
    description: rule.description,
    applied: rule.applied === true,
  }));
}

/**
 * Generates a single variant manifest from a canonical product and cohort.
 * @param {object} canonicalProduct - The canonical PDP data.
 * @param {object} cohort - The cohort configuration.
 * @param {number} index - The variant index.
 * @returns {object} The variant manifest object.
 */
function generateSingleVariant(canonicalProduct, cohort, index) {
  const variantId = generateVariantId(canonicalProduct.id, cohort.id, index);

  const tailoredTitle = tailorTitle(canonicalProduct.title, cohort);
  const tailoredDescription = tailorDescription(canonicalProduct.description, cohort);
  const tailoredImages = tailorImages(canonicalProduct.images, cohort);
  const tailoredPrice = tailorPrice(canonicalProduct.price, cohort);
  const tailoredFeatures = tailorFeatures(canonicalProduct.features, cohort);
  const badge = generateBadge(cohort);
  const promotionMessage = generatePromotionMessage(cohort, canonicalProduct.price);
  const tailoringRules = getAppliedRules(cohort);

  const variant = {
    variantId,
    canonicalPdpId: canonicalProduct.id,
    cohort: {
      id: cohort.id,
      name: cohort.name,
      behaviorSignals: cohort.behaviorSignals || [],
    },
    tailoringRules,
    variantData: {
      title: tailoredTitle,
      description: tailoredDescription,
      price: tailoredPrice,
      sku: canonicalProduct.sku,
      category: canonicalProduct.category,
      features: tailoredFeatures,
      images: tailoredImages,
      badge,
      promotionMessage,
    },
    schemaVersion: 1,
  };

  return variant;
}

/**
 * VariantFactory: generates up to VARIANT_COUNT (10) PDP variants from canonical
 * products and cohort configurations. Distributes cohorts across products
 * deterministically. Validates each variant against ManifestSchema before inclusion.
 *
 * @param {object[]} canonicalProducts - Array of canonical PDP objects.
 * @param {object[]} cohorts - Array of cohort configuration objects.
 * @returns {Promise<object[]>} Array of validated variant manifest objects.
 * @throws {Error} If inputs are invalid.
 */
async function generateVariants(canonicalProducts, cohorts) {
  if (!Array.isArray(canonicalProducts) || canonicalProducts.length === 0) {
    throw new Error(ERROR_MESSAGES.INVALID_VARIANT_DATA + ' Canonical products array is required.');
  }

  if (!Array.isArray(cohorts) || cohorts.length === 0) {
    throw new Error(ERROR_MESSAGES.INVALID_COHORT_DATA + ' Cohorts array is required.');
  }

  const variants = [];
  let variantIndex = 0;

  // Distribute cohorts across products deterministically to produce up to VARIANT_COUNT variants
  for (let i = 0; i < VARIANT_COUNT; i++) {
    if (variantIndex >= VARIANT_COUNT) {
      break;
    }

    const productIndex = i % canonicalProducts.length;
    const cohortIndex = i % cohorts.length;

    const canonicalProduct = canonicalProducts[productIndex];
    const cohort = cohorts[cohortIndex];

    const variant = generateSingleVariant(canonicalProduct, cohort, variantIndex);

    const validationResult = validateVariantManifest(variant);

    if (validationResult.valid) {
      variants.push(variant);
    } else {
      console.error(
        `${ERROR_MESSAGES.INVALID_VARIANT_DATA} Variant ${variant.variantId} failed validation:`,
        validationResult.errors,
      );
    }

    variantIndex++;
  }

  return variants;
}

/**
 * Generates variants for a single canonical product across all provided cohorts.
 * @param {object} canonicalProduct - A single canonical PDP object.
 * @param {object[]} cohorts - Array of cohort configuration objects.
 * @returns {Promise<object[]>} Array of validated variant manifest objects.
 */
async function generateVariantsForProduct(canonicalProduct, cohorts) {
  if (!canonicalProduct || typeof canonicalProduct !== 'object') {
    throw new Error(ERROR_MESSAGES.INVALID_VARIANT_DATA + ' A valid canonical product is required.');
  }

  if (!Array.isArray(cohorts) || cohorts.length === 0) {
    throw new Error(ERROR_MESSAGES.INVALID_COHORT_DATA + ' Cohorts array is required.');
  }

  const variants = [];

  for (let i = 0; i < cohorts.length; i++) {
    const variant = generateSingleVariant(canonicalProduct, cohorts[i], i);

    const validationResult = validateVariantManifest(variant);

    if (validationResult.valid) {
      variants.push(variant);
    } else {
      console.error(
        `${ERROR_MESSAGES.INVALID_VARIANT_DATA} Variant ${variant.variantId} failed validation:`,
        validationResult.errors,
      );
    }
  }

  return variants;
}

/**
 * Computes a visual diff between a control variant and a target variant.
 * Returns an object mapping field names to { control, variant } pairs for differing fields.
 * @param {object} controlVariant - The control variant manifest.
 * @param {object} targetVariant - The target variant manifest to compare.
 * @returns {object} An object with keys for each differing field.
 */
function getVisualDiff(controlVariant, targetVariant) {
  if (!controlVariant || !controlVariant.variantData) {
    return {};
  }
  if (!targetVariant || !targetVariant.variantData) {
    return {};
  }

  const diff = {};
  const controlData = controlVariant.variantData;
  const targetData = targetVariant.variantData;

  const allKeys = new Set([
    ...Object.keys(controlData),
    ...Object.keys(targetData),
  ]);

  for (const key of allKeys) {
    const controlValue = controlData[key];
    const targetValue = targetData[key];

    const controlStr = JSON.stringify(controlValue);
    const targetStr = JSON.stringify(targetValue);

    if (controlStr !== targetStr) {
      diff[key] = {
        control: controlValue,
        variant: targetValue,
      };
    }
  }

  return diff;
}

/**
 * VariantFactory class providing a static API for variant generation.
 */
class VariantFactory {
  /**
   * Generates up to VARIANT_COUNT variants from canonical products and cohorts.
   * @param {object[]} canonicalProducts - Array of canonical PDP objects.
   * @param {object[]} cohorts - Array of cohort configuration objects.
   * @returns {Promise<object[]>} Array of validated variant manifest objects.
   */
  static async generateVariants(canonicalProducts, cohorts) {
    return generateVariants(canonicalProducts, cohorts);
  }

  /**
   * Generates variants for a single product across all cohorts.
   * @param {object} canonicalProduct - A single canonical PDP object.
   * @param {object[]} cohorts - Array of cohort configuration objects.
   * @returns {Promise<object[]>} Array of validated variant manifest objects.
   */
  static async generateVariantsForProduct(canonicalProduct, cohorts) {
    return generateVariantsForProduct(canonicalProduct, cohorts);
  }

  /**
   * Computes a visual diff between two variants.
   * @param {object} controlVariant - The control variant.
   * @param {object} targetVariant - The target variant.
   * @returns {object} Diff object with differing fields.
   */
  static getVisualDiff(controlVariant, targetVariant) {
    return getVisualDiff(controlVariant, targetVariant);
  }
}

export {
  VariantFactory,
  generateVariants,
  generateVariantsForProduct,
  generateSingleVariant,
  getVisualDiff,
  generateVariantId,
  tailorTitle,
  tailorDescription,
  tailorImages,
  tailorPrice,
  tailorFeatures,
  generateBadge,
  generatePromotionMessage,
  getAppliedRules,
  sortFeaturesByKeywords,
};

export default VariantFactory;