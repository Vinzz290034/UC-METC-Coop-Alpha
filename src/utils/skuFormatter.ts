/**
 * Category SKU prefix mapping & Next SKU generator utility
 */

export const getCategoryPrefix = (category?: string): string => {
  if (!category) return 'UNI';
  const catLower = category.toLowerCase();
  if (catLower === 'uniform') return 'UNI';
  if (catLower === 'accessory') return 'ACC';
  if (catLower === 'equipment' || catLower === 'ppe') return 'PPE';
  if (catLower === 'service') return 'SERV';
  if (catLower === 'essentials' || catLower === 'grocery') return 'ESS';
  return 'UNI';
};

/**
 * Generates the next available sequential SKU number for a given category.
 * e.g., if highest uniform SKU is UNI-009, returns UNI-010.
 */
export const generateCategoryNextSKU = (
  category: string,
  allProducts: Array<{ id?: string; category?: string; sku?: string }>,
  excludeProductId?: string
): string => {
  const prefix = getCategoryPrefix(category);

  const categorySkus = allProducts
    .filter(p => {
      if (p.id && p.id === excludeProductId) return false;
      if (!p.sku) return false;
      
      const pPrefix = getCategoryPrefix(p.category);
      return pPrefix === prefix || p.sku.toUpperCase().startsWith(`${prefix}-`);
    })
    .map(p => {
      const parts = (p.sku || '').split(/[-–\s]+/);
      const numPart = parts[parts.length - 1];
      const num = parseInt(numPart, 10);
      return isNaN(num) ? 0 : num;
    });

  const maxNum = categorySkus.length > 0 ? Math.max(...categorySkus) : 0;
  const nextNum = maxNum + 1;
  return `${prefix}-${String(nextNum).padStart(3, '0')}`;
};

/**
 * Formats or resolves a product SKU to ensure it has a unique sequential SKU matching its category.
 */
export const formatDisplaySKU = (
  sku?: string,
  category?: string
): string => {
  if (!sku) return '';
  let cleanSku = sku.replace(/^GROC\s*-\s*/i, 'ESS-').replace(/^GROC-/i, 'ESS-').replace(/^EQUIP-/, 'PPE-');

  if (!category) return cleanSku;

  const prefix = getCategoryPrefix(category);

  if (/^(PPE|EQUIP|UNI|ACC|SERV|ESS|GROC)[-–\s]+/i.test(cleanSku)) {
    return cleanSku.replace(/^(PPE|EQUIP|UNI|ACC|SERV|ESS|GROC)[-–\s]+/i, `${prefix}-`);
  }

  return cleanSku;
};
