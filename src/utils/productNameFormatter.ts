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

  if (!selectedOptions || Object.keys(selectedOptions).length === 0) {
    return cleanRepeatedSegments(productName);
  }

  const parts: string[] = [productName];
  let isMemberPrice = false;

  // Extract bundle name (without pricing) and check if member price was used
  if (selectedOptions['bundle']) {
    const bundleText = selectedOptions['bundle'];
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
  if (selectedOptions['part']) {
    const partName = selectedOptions['part'].split('(')[0].trim();
    if (!productName.toLowerCase().includes(partName.toLowerCase())) {
      parts.push(partName);
    }
  }

  // Extract color (without pricing)
  if (selectedOptions['color']) {
    const colorName = selectedOptions['color'].split('(')[0].trim();
    if (!productName.toLowerCase().includes(colorName.toLowerCase())) {
      parts.push(colorName);
    }
  }

  // Extract size (without pricing)
  if (selectedOptions['size']) {
    const sizeName = selectedOptions['size'].split('(')[0].trim();
    if (!productName.toLowerCase().includes(sizeName.toLowerCase())) {
      parts.push(sizeName);
    }
  }

  // Add course in parentheses if present (and not already added as main info)
  if (selectedOptions['course'] && !selectedOptions['bundle']) {
    const courseInfo = selectedOptions['course'].split('(')[0].trim();
    if (!productName.toLowerCase().includes(courseInfo.toLowerCase())) {
      parts.push(courseInfo);
    }
  } else if (selectedOptions['course'] && selectedOptions['bundle']) {
    // For Gala, add course in parentheses
    const courseInfo = selectedOptions['course'].split('(')[0].trim();
    const result = `${parts.join(' - ')} (${courseInfo})`;
    const formatted = isMemberPrice ? `${result} - Member Price` : result;
    return cleanRepeatedSegments(formatted);
  }

  // Handle the generic 'Variants' key used by products with a single variant selector
  // e.g., Patch product stores {"Variants": "BSMT Patch"}
  if (selectedOptions['Variants'] || selectedOptions['variants']) {
    const variantValue = selectedOptions['Variants'] || selectedOptions['variants'];
    const variantName = variantValue.split('(')[0].trim();
    if (variantName && variantName !== productName && !productName.toLowerCase().includes(variantName.toLowerCase())) {
      parts.push(variantName);
    }
  }

  // Fallback: append any other option values not yet handled above
  const knownKeys = new Set(['bundle', 'part', 'color', 'size', 'course', 'Variants', 'variants']);
  for (const [key, value] of Object.entries(selectedOptions)) {
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
  
  // Extract bundle
  const bundleMatch = fullProductName.match(/bundle:\s*([^,)]+)/);
  const bundleText = bundleMatch ? bundleMatch[1].trim() : null;
  
  // Extract course
  const courseMatch = fullProductName.match(/course:\s*([^,)]+)/);
  const course = courseMatch ? courseMatch[1].trim() : null;
  
  // Build formatted name
  const parts: string[] = [baseName];
  let isMemberPrice = false;
  
  if (bundleText) {
    // Extract just the bundle name without pricing
    const bundleName = bundleText.split('(')[0].trim();
    if (!baseName.toLowerCase().includes(bundleName.toLowerCase())) {
      parts.push(bundleName);
    }
    
    // Check if member price was used
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
  
  if (course) {
    const courseTrim = course.split('(')[0].trim();
    if (!baseName.toLowerCase().includes(courseTrim.toLowerCase())) {
      const result = `${parts.join(' - ')} (${courseTrim})`;
      const formatted = isMemberPrice ? `${result} - Member Price` : result;
      return cleanRepeatedSegments(formatted);
    }
  }
  
  const result = parts.join(' - ');
  const formatted = isMemberPrice ? `${result} - Member Price` : result;
  return cleanRepeatedSegments(formatted);
}
