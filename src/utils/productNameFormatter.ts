/**
 * Deduplicates repeated variant or course segments in a product name string
 * Example: "Type A & B Uniform - BSMT - BSMT (₱2,950)" -> "Type A & B Uniform - BSMT (₱2,950)"
 * Example: "Type A & B Uniform - SHS - SHS (₱2,700)" -> "Type A & B Uniform - SHS (₱2,700)"
 */
export function cleanRepeatedSegments(name: string): string {
  if (!name || typeof name !== 'string') return '';
  let cleaned = name.replace(/\s+/g, ' ').trim();

  // Deduplicate hyphen-separated parts
  const parts = cleaned.split(' - ');
  const uniqueParts: string[] = [];
  parts.forEach((p, idx) => {
    const trimmed = p.trim();
    const basePart = trimmed.split('(')[0].trim();
    const prevPart = uniqueParts.length > 0 ? uniqueParts[uniqueParts.length - 1].split('(')[0].trim() : '';
    if (idx > 0 && (basePart.toLowerCase() === prevPart.toLowerCase() || trimmed.toLowerCase() === prevPart.toLowerCase())) {
      // If the duplicate has parentheses details (like (₱2,950)), preserve them
      if (trimmed.includes('(')) {
        const parenContent = trimmed.substring(trimmed.indexOf('('));
        if (!uniqueParts[uniqueParts.length - 1].includes(parenContent)) {
          uniqueParts[uniqueParts.length - 1] = `${uniqueParts[uniqueParts.length - 1]} ${parenContent}`.trim();
        }
      }
      return;
    }
    uniqueParts.push(trimmed);
  });
  cleaned = uniqueParts.join(' - ');

  // Clean patterns like "BSMT - BSMT" or "SHS - SHS" or "BSMARE - BSMARE"
  cleaned = cleaned.replace(/\b([A-Za-z0-9]+)\s*-\s*\1\b/gi, '$1');
  return cleaned;
}

/**
 * Resolves or corrects size/tier variant for products where unit price indicates the true variant
 */
export function reconcileProductVariantByPrice(
  productName: string,
  currentOptionValue: string | undefined,
  unitPrice: number | undefined
): string | undefined {
  if (!unitPrice || isNaN(unitPrice) || unitPrice <= 0) return currentOptionValue;

  const nameLower = productName.toLowerCase().trim();
  const roundPrice = Math.round(unitPrice);

  // 1. PE Tshirt (Small/Medium/Large: 190, XL: 200, 2XL: 210, 3XL: 220, 4XL: 230, 5XL: 240)
  if (nameLower.includes('pe tshirt') || nameLower.includes('pe shirt') || nameLower.includes('p.e. shirt') || nameLower.includes('pe t-shirt')) {
    if (roundPrice === 190) {
      if (currentOptionValue) {
        const optLower = currentOptionValue.toLowerCase();
        if (optLower.includes('small') || optLower === 's') return 'Small';
        if (optLower.includes('medium') || optLower === 'm') return 'Medium';
        if (optLower.includes('large') || optLower === 'l') return 'Large';
      }
      return 'Medium';
    }
    if (roundPrice === 200) return 'XL';
    if (roundPrice === 210) return '2XL';
    if (roundPrice === 220) return '3XL';
    if (roundPrice === 230) return '4XL';
    if (roundPrice === 240) return '5XL';
  }

  // 2. PE Pants (Small/Medium/Large: 260, XL/2XL: 280, 3XL: 320)
  if (nameLower.includes('pe pants') || nameLower.includes('p.e. pants')) {
    if (roundPrice === 260) {
      if (currentOptionValue) {
        const optLower = currentOptionValue.toLowerCase();
        if (optLower.includes('small') || optLower === 's') return 'Small';
        if (optLower.includes('medium') || optLower === 'm') return 'Medium';
        if (optLower.includes('large') || optLower === 'l') return 'Large';
      }
      return 'Medium';
    }
    if (roundPrice === 280) {
      if (currentOptionValue && (currentOptionValue.toLowerCase().includes('2xl') || currentOptionValue.toLowerCase().includes('xxl'))) {
        return '2XL';
      }
      return 'XL';
    }
    if (roundPrice === 320) return '3XL';
  }

  // 3. Hard Hat (Yellow: 150, Blue: 300)
  if (nameLower.includes('hard hat')) {
    if (roundPrice === 150) return 'Yellow';
    if (roundPrice === 300) return 'Blue';
  }

  // 4. Type A & B Uniform (SHS: 2700, BSMT/BSMARE: 2950)
  if (nameLower.includes('type a') || nameLower.includes('type b')) {
    if (roundPrice === 2700) return 'SHS';
    if (roundPrice === 2950) {
      if (currentOptionValue && currentOptionValue.toLowerCase().includes('bsmare')) return 'BSMARE';
      return 'BSMT';
    }
  }

  return currentOptionValue;
}

/**
 * Formats a product name with its selected options in a concise way
 * Example: "Gala - Bundle F (BSMARE) - Member Price" for members
 * Example: "Gala - Bundle F (BSMARE)" for non-members
 * 
 * @param productName - The base product name
 * @param selectedOptions - The selected options for the product
 * @param unitPrice - Optional unit price to determine if member discount was applied
 * @returns Formatted product name string
 */
export function formatProductName(
  productName: string,
  selectedOptions?: Record<string, string>,
  unitPrice?: number
): string {
  if (!productName || typeof productName !== 'string') {
    return 'Item';
  }
  const nameLower = productName.toLowerCase().trim();
  if (nameLower.includes('class ring') || nameLower.includes('official class ring')) {
    const model = selectedOptions?.['Model'] || selectedOptions?.['model'];
    const ringSize = selectedOptions?.['Ring Size'] || selectedOptions?.['ringSize'] || selectedOptions?.['size'];
    if (model && ringSize) {
      return cleanRepeatedSegments(`Class Ring - ${model} (${ringSize.startsWith('Size') ? ringSize : 'Size ' + ringSize})`);
    }
    if (model) {
      return cleanRepeatedSegments(`Class Ring - ${model}`);
    }
    return 'Class Ring';
  }

  if (nameLower.includes('hard bound') || nameLower.includes('hardbound')) {
    return 'Hard Bound';
  }

  const options = { ...(selectedOptions || {}) };

  // Reconcile size / option if unitPrice indicates a specific variant (e.g. 2XL for 210, 4XL for 230 on PE Tshirt)
  if (unitPrice && unitPrice > 0) {
    if (options['size']) {
      const reconciled = reconcileProductVariantByPrice(productName, options['size'], unitPrice);
      if (reconciled) options['size'] = reconciled;
    } else {
      const autoVariant = reconcileProductVariantByPrice(productName, undefined, unitPrice);
      if (autoVariant) {
        options['size'] = autoVariant;
      }
    }

    if (options['color']) {
      const reconciled = reconcileProductVariantByPrice(productName, options['color'], unitPrice);
      if (reconciled) options['color'] = reconciled;
    }

    if (options['course'] && !options['bundle']) {
      const reconciled = reconcileProductVariantByPrice(productName, options['course'], unitPrice);
      if (reconciled) options['course'] = reconciled;
    }
  }

  if (!options || Object.keys(options).length === 0) {
    return cleanRepeatedSegments(productName);
  }

  const parts: string[] = [productName];
  let isMemberPrice = false;

  // Extract bundle name (without pricing) and check if member price was used
  if (options['bundle']) {
    const bundleText = options['bundle'];
    const bundleName = bundleText.split('(')[0].trim();
    if (!productName.toLowerCase().includes(bundleName.toLowerCase())) {
      parts.push(bundleName);
    }
    
    // Check if member pricing was applied by comparing unit price
    if (unitPrice && bundleText.includes('Member')) {
      const memberPriceMatch = bundleText.match(/₱([\d,]+)\s*Member/);
      if (memberPriceMatch) {
        const memberPrice = parseInt(memberPriceMatch[1].replace(/,/g, ''));
        // Check if the unit price matches the member price
        if (unitPrice === memberPrice) {
          isMemberPrice = true;
        }
      }
    }
  }

  // Extract part name (for ROTC Manual)
  if (options['part']) {
    const partName = options['part'].split('(')[0].trim();
    if (!productName.toLowerCase().includes(partName.toLowerCase())) {
      parts.push(partName);
    }
  }

  // Extract color (without pricing)
  if (options['color']) {
    const colorName = options['color'].split('(')[0].trim();
    if (!productName.toLowerCase().includes(colorName.toLowerCase())) {
      parts.push(colorName);
    }
  }

  // Extract size (without pricing)
  if (options['size']) {
    const sizeName = options['size'].split('(')[0].trim();
    if (!productName.toLowerCase().includes(sizeName.toLowerCase())) {
      parts.push(sizeName);
    }
  }

  // Add course in parentheses if present (and not already added as main info)
  if (options['course'] && !options['bundle']) {
    const courseInfo = options['course'].split('(')[0].trim();
    if (!productName.toLowerCase().includes(courseInfo.toLowerCase())) {
      parts.push(courseInfo);
    }
  } else if (options['course'] && options['bundle']) {
    // For Gala, add course in parentheses
    const courseInfo = options['course'].split('(')[0].trim();
    const result = `${parts.join(' - ')} (${courseInfo})`;
    const formatted = isMemberPrice ? `${result} - Member Price` : result;
    return cleanRepeatedSegments(formatted);
  }

  // Handle the generic 'Variants' key used by products with a single variant selector
  if (options['Variants'] || options['variants']) {
    const variantValue = options['Variants'] || options['variants'];
    const variantName = variantValue.split('(')[0].trim();
    if (variantName && variantName !== productName && !productName.toLowerCase().includes(variantName.toLowerCase())) {
      parts.push(variantName);
    }
  }

  // Fallback: append any other option values not yet handled above
  const knownKeys = new Set(['bundle', 'part', 'color', 'size', 'course', 'Variants', 'variants']);
  for (const [key, value] of Object.entries(options)) {
    if (!knownKeys.has(key) && value) {
      const valName = String(value).split('(')[0].trim();
      if (valName && !productName.toLowerCase().includes(valName.toLowerCase())) {
        parts.push(valName);
      }
    }
  }

  const result = parts.join(' - ');
  const formatted = isMemberPrice ? `${result} - Member Price` : result;
  return cleanRepeatedSegments(formatted);
}

/**
 * Parse product name from the old format stored in database
 * Example: "Gala (bundle: Bundle A (₱1,200 / ₱1,150 Member), course: BSMT)"
 * Returns: "Gala - Bundle A (BSMT) - Member Price" if member price was used
 * Returns: "Gala - Bundle A (BSMT)" if regular price was used
 */
export function parseAndFormatLegacyProductName(fullProductName: string, unitPrice?: number): string {
  if (!fullProductName || typeof fullProductName !== 'string') {
    return 'Item';
  }
  const nameLower = fullProductName.toLowerCase().trim();
  if (nameLower.includes('class ring') || nameLower.includes('official class ring')) {
    return 'Class Ring';
  }

  if (nameLower.includes('hard bound') || nameLower.includes('hardbound')) {
    return 'Hard Bound';
  }

  // Extract base product name
  const baseNameMatch = fullProductName.match(/^([^(]+)/);
  const baseName = baseNameMatch ? baseNameMatch[1].trim() : fullProductName;
  
  const options: Record<string, string> = {};

  // Extract bundle
  const bundleMatch = fullProductName.match(/bundle:\s*([^,)]+)/i);
  if (bundleMatch) options['bundle'] = bundleMatch[1].trim();
  
  // Extract course
  const courseMatch = fullProductName.match(/course:\s*([^,)]+)/i);
  if (courseMatch) options['course'] = courseMatch[1].trim();

  // Extract size
  const sizeMatch = fullProductName.match(/size:\s*([^,)]+)/i);
  if (sizeMatch) options['size'] = sizeMatch[1].trim();

  // Extract color
  const colorMatch = fullProductName.match(/color:\s*([^,)]+)/i);
  if (colorMatch) options['color'] = colorMatch[1].trim();

  // Extract part
  const partMatch = fullProductName.match(/part:\s*([^,)]+)/i);
  if (partMatch) options['part'] = partMatch[1].trim();

  // If options were extracted or unitPrice exists, run standard formatProductName
  if (Object.keys(options).length > 0 || (unitPrice && unitPrice > 0)) {
    return formatProductName(baseName, options, unitPrice);
  }
  
  return cleanRepeatedSegments(baseName);
}
