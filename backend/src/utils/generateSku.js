const ProductVariant = require('../models/ProductVariant');

/**
 * Generate a clean standard SKU from product name, colour, and size.
 * Example: T-Shirt, Black, L -> TS-BLK-L
 */
const generateSku = async (productName, colour, size) => {
  const cleanStr = (str) =>
    (str || '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();

  // Extract up to 3-4 chars from product words
  const words = (productName || 'PRD').trim().split(/\s+/);
  let prodCode = '';
  if (words.length === 1) {
    prodCode = cleanStr(words[0]).slice(0, 3);
  } else {
    prodCode = words.map((w) => cleanStr(w).charAt(0)).join('').slice(0, 4);
  }
  if (!prodCode) prodCode = 'PRD';

  const colCode = cleanStr(colour).slice(0, 3) || 'GEN';
  const sizeCode = cleanStr(size).slice(0, 3) || 'STD';

  const baseSku = `${prodCode}-${colCode}-${sizeCode}`;

  let finalSku = baseSku;
  let counter = 1;

  while (await ProductVariant.findOne({ sku: finalSku })) {
    counter++;
    finalSku = `${baseSku}-${counter}`;
  }

  return finalSku;
};

module.exports = { generateSku };
