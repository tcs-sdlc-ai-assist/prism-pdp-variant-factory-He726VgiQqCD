/**
 * @module canonicalProducts
 * @description Synthetic canonical PDP data for demo products.
 * Each product conforms to the canonicalPdpSchema defined in schemas.js.
 * All data is obviously fake and for prototype/demo purposes only.
 * [Pipeline-aligned: synthetic data]
 */

/**
 * Synthetic canonical PDP for a television product.
 * @type {object}
 */
const syntheticTV = {
  id: 'canonical-tv-001',
  sku: 'SKU-TV-88Q900',
  title: 'Prism UltraView 65" 4K QLED Smart TV (2024 Model)',
  description:
    'Experience stunning picture quality with the Prism UltraView 65-inch 4K QLED Smart TV. Featuring Quantum HDR processing, 120Hz refresh rate, and built-in voice assistant integration. Perfect for movies, gaming, and everyday entertainment. [Synthetic product — not a real listing.]',
  price: 1299.99,
  images: [
    'https://placehold.co/800x600/0046be/ffffff?text=Prism+TV+Front',
    'https://placehold.co/800x600/003da6/ffffff?text=Prism+TV+Angle',
    'https://placehold.co/800x600/00338e/ffffff?text=Prism+TV+Back',
    'https://placehold.co/800x600/002a76/ffffff?text=Prism+TV+Remote',
  ],
  features: [
    '65-inch 4K QLED display with Quantum HDR',
    '120Hz native refresh rate for smooth motion',
    'Built-in voice assistant (Prism Voice)',
    'Smart TV platform with 500+ streaming apps',
    'Dolby Atmos and DTS:X audio support',
    '4 HDMI 2.1 ports, 2 USB-A ports',
    'Wi-Fi 6E and Bluetooth 5.3 connectivity',
    'Ambient Mode with art gallery display',
  ],
  category: 'TVs & Home Theater',
  brand: 'Prism Electronics',
  specs: {
    displaySize: '65 inches',
    resolution: '3840 x 2160 (4K UHD)',
    panelType: 'QLED',
    refreshRate: '120Hz',
    hdrFormat: 'Quantum HDR 10+',
    smartPlatform: 'Prism OS 4.0',
    audio: '40W 2.1ch with Dolby Atmos',
    weight: '42.5 lbs',
    dimensions: '57.1 x 32.7 x 1.1 inches (without stand)',
    warranty: '1-year limited manufacturer warranty',
  },
};

/**
 * Synthetic canonical PDP for a laptop product.
 * @type {object}
 */
const syntheticLaptop = {
  id: 'canonical-laptop-001',
  sku: 'SKU-LPT-PRO16X',
  title: 'Prism ProBook 16X — 16" Performance Laptop',
  description:
    'Power through your workday with the Prism ProBook 16X. Equipped with a 13th-gen Prism P9 processor, 32GB DDR5 RAM, and a 1TB NVMe SSD. The 16-inch 2.5K IPS display delivers vibrant colors for creative professionals and power users alike. [Synthetic product — not a real listing.]',
  price: 1749.99,
  images: [
    'https://placehold.co/800x600/0046be/ffffff?text=Prism+Laptop+Open',
    'https://placehold.co/800x600/003da6/ffffff?text=Prism+Laptop+Side',
    'https://placehold.co/800x600/00338e/ffffff?text=Prism+Laptop+Keyboard',
    'https://placehold.co/800x600/002a76/ffffff?text=Prism+Laptop+Ports',
  ],
  features: [
    '13th-gen Prism P9 processor (12-core, 20-thread)',
    '32GB DDR5-5600 RAM (upgradeable to 64GB)',
    '1TB PCIe Gen 4 NVMe SSD',
    '16-inch 2.5K IPS display (2560 x 1600) at 165Hz',
    'Prism Arc GPU with 8GB GDDR6 VRAM',
    'Backlit keyboard with numeric keypad',
    'Thunderbolt 4, USB-C, USB-A, HDMI 2.1, SD card reader',
    'Up to 10 hours battery life',
  ],
  category: 'Laptops & Computers',
  brand: 'Prism Electronics',
  specs: {
    processor: 'Prism P9 (13th Gen), 12-core / 20-thread',
    memory: '32GB DDR5-5600',
    storage: '1TB PCIe Gen 4 NVMe SSD',
    display: '16-inch 2.5K IPS (2560 x 1600), 165Hz, 100% sRGB',
    graphics: 'Prism Arc GPU, 8GB GDDR6',
    operatingSystem: 'Prism OS Desktop 12',
    battery: '84Wh, up to 10 hours',
    weight: '4.4 lbs',
    dimensions: '14.0 x 9.8 x 0.7 inches',
    warranty: '1-year limited manufacturer warranty',
  },
};

/**
 * Array of all synthetic canonical products.
 * @type {object[]}
 */
const canonicalProducts = [syntheticTV, syntheticLaptop];

export { syntheticTV, syntheticLaptop, canonicalProducts };
export default canonicalProducts;