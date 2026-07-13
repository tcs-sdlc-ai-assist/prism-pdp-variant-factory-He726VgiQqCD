/**
 * @module cohorts
 * @description Synthetic cohort configuration data defining 5 customer cohorts.
 * Each cohort includes id, name, description, behaviorSignals, and tailoringRules.
 * All data is obviously fake and for prototype/demo purposes only.
 * [Pipeline-aligned: synthetic data]
 */

/**
 * Synthetic cohort configuration for budget-conscious shoppers.
 * @type {object}
 */
const budgetShopperCohort = {
  id: 'cohort-budget-shopper',
  name: 'Budget Shopper',
  description:
    'Price-sensitive customers who prioritize deals, discounts, and value-for-money. They compare prices across products and respond well to savings messaging. [Synthetic cohort — not real user data.]',
  behaviorSignals: [
    'frequent-price-filter-usage',
    'sort-by-price-low-to-high',
    'coupon-page-visits',
    'deal-of-the-day-clicks',
    'open-box-browsing',
  ],
  tailoringRules: [
    {
      ruleId: 'rule-budget-hero-image',
      description: 'Prioritize hero image showing price tag or value badge overlay',
      applied: true,
    },
    {
      ruleId: 'rule-budget-cta-text',
      description: 'Set CTA text to "See Best Price" to emphasize savings',
      applied: true,
    },
    {
      ruleId: 'rule-budget-badge',
      description: 'Display "Great Value" promotional badge',
      applied: true,
    },
    {
      ruleId: 'rule-budget-price-display',
      description: 'Show price prominently with savings comparison and monthly payment option',
      applied: true,
    },
    {
      ruleId: 'rule-budget-feature-emphasis',
      description: 'Emphasize cost-saving features such as energy efficiency and warranty coverage',
      applied: true,
    },
  ],
};

/**
 * Synthetic cohort configuration for tech enthusiast customers.
 * @type {object}
 */
const techEnthusiastCohort = {
  id: 'cohort-tech-enthusiast',
  name: 'Tech Enthusiast',
  description:
    'Early adopters and power users who seek cutting-edge specs, performance benchmarks, and detailed technical information. They value innovation and are willing to pay for the latest technology. [Synthetic cohort — not real user data.]',
  behaviorSignals: [
    'spec-comparison-tool-usage',
    'review-section-deep-scroll',
    'new-release-page-visits',
    'benchmark-content-clicks',
    'tech-blog-referral-traffic',
  ],
  tailoringRules: [
    {
      ruleId: 'rule-tech-hero-image',
      description: 'Prioritize hero image showcasing internal hardware or technical detail shots',
      applied: true,
    },
    {
      ruleId: 'rule-tech-cta-text',
      description: 'Set CTA text to "Explore Full Specs" to drive technical engagement',
      applied: true,
    },
    {
      ruleId: 'rule-tech-badge',
      description: 'Display "Latest Tech" promotional badge',
      applied: true,
    },
    {
      ruleId: 'rule-tech-price-display',
      description: 'Show price with performance-per-dollar value indicator',
      applied: true,
    },
    {
      ruleId: 'rule-tech-feature-emphasis',
      description: 'Emphasize processor specs, refresh rates, connectivity, and benchmark-relevant features',
      applied: true,
    },
  ],
};

/**
 * Synthetic cohort configuration for premium buyer customers.
 * @type {object}
 */
const premiumBuyerCohort = {
  id: 'cohort-premium-buyer',
  name: 'Premium Buyer',
  description:
    'Affluent customers who prioritize quality, brand prestige, and premium experiences. They respond to luxury positioning, extended warranties, and white-glove service options. [Synthetic cohort — not real user data.]',
  behaviorSignals: [
    'premium-brand-filter-usage',
    'sort-by-price-high-to-low',
    'extended-warranty-page-visits',
    'installation-service-clicks',
    'high-aov-purchase-history',
  ],
  tailoringRules: [
    {
      ruleId: 'rule-premium-hero-image',
      description: 'Prioritize hero image with lifestyle or premium environment staging',
      applied: true,
    },
    {
      ruleId: 'rule-premium-cta-text',
      description: 'Set CTA text to "Experience Premium" to reinforce luxury positioning',
      applied: true,
    },
    {
      ruleId: 'rule-premium-badge',
      description: 'Display "Premium Pick" promotional badge',
      applied: true,
    },
    {
      ruleId: 'rule-premium-price-display',
      description: 'Show price with included premium services and extended warranty bundling',
      applied: true,
    },
    {
      ruleId: 'rule-premium-feature-emphasis',
      description: 'Emphasize build quality, design aesthetics, brand heritage, and exclusive features',
      applied: true,
    },
  ],
};

/**
 * Synthetic cohort configuration for student customers.
 * @type {object}
 */
const studentCohort = {
  id: 'cohort-student',
  name: 'Student',
  description:
    'College and university students looking for reliable, portable, and affordable products for academic use. They respond to student discounts, back-to-school promotions, and productivity-focused messaging. [Synthetic cohort — not real user data.]',
  behaviorSignals: [
    'student-deals-page-visits',
    'back-to-school-campaign-clicks',
    'education-discount-verification',
    'portable-device-filter-usage',
    'productivity-app-bundle-interest',
  ],
  tailoringRules: [
    {
      ruleId: 'rule-student-hero-image',
      description: 'Prioritize hero image showing product in a study or campus environment',
      applied: true,
    },
    {
      ruleId: 'rule-student-cta-text',
      description: 'Set CTA text to "Get Student Deal" to highlight education pricing',
      applied: true,
    },
    {
      ruleId: 'rule-student-badge',
      description: 'Display "Student Favorite" promotional badge',
      applied: true,
    },
    {
      ruleId: 'rule-student-price-display',
      description: 'Show price with student discount callout and financing options',
      applied: true,
    },
    {
      ruleId: 'rule-student-feature-emphasis',
      description: 'Emphasize portability, battery life, productivity features, and durability',
      applied: true,
    },
  ],
};

/**
 * Synthetic cohort configuration for business buyer customers.
 * @type {object}
 */
const businessBuyerCohort = {
  id: 'cohort-business-buyer',
  name: 'Business Buyer',
  description:
    'Small business owners and IT procurement professionals seeking reliable, scalable, and enterprise-ready products. They value bulk pricing, support contracts, and integration capabilities. [Synthetic cohort — not real user data.]',
  behaviorSignals: [
    'business-account-login',
    'bulk-order-page-visits',
    'enterprise-support-clicks',
    'fleet-management-interest',
    'b2b-pricing-requests',
  ],
  tailoringRules: [
    {
      ruleId: 'rule-business-hero-image',
      description: 'Prioritize hero image showing product in a professional office or conference room setting',
      applied: true,
    },
    {
      ruleId: 'rule-business-cta-text',
      description: 'Set CTA text to "Request Business Quote" to drive B2B engagement',
      applied: true,
    },
    {
      ruleId: 'rule-business-badge',
      description: 'Display "Business Ready" promotional badge',
      applied: true,
    },
    {
      ruleId: 'rule-business-price-display',
      description: 'Show price with volume discount tiers and tax-exempt pricing note',
      applied: true,
    },
    {
      ruleId: 'rule-business-feature-emphasis',
      description: 'Emphasize security features, manageability, warranty/support options, and scalability',
      applied: true,
    },
  ],
};

/**
 * Array of all synthetic cohort configurations.
 * @type {object[]}
 */
const cohorts = [
  budgetShopperCohort,
  techEnthusiastCohort,
  premiumBuyerCohort,
  studentCohort,
  businessBuyerCohort,
];

export {
  budgetShopperCohort,
  techEnthusiastCohort,
  premiumBuyerCohort,
  studentCohort,
  businessBuyerCohort,
  cohorts,
};
export default cohorts;