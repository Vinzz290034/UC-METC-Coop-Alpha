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
  const nameLower = productName.toLowerCase().trim();
  if (nameLower.includes('hard bound') || nameLower.includes('hardbound')) {
    return 'Hard Bound';
  }

  if (!selectedOptions || Object.keys(selectedOptions).length === 0) {
    return productName;
  }

  const parts: string[] = [productName];
  let isMemberPrice = false;

  // Extract bundle name (without pricing) and check if member price was used
  if (selectedOptions['bundle']) {
    const bundleText = selectedOptions['bundle'];
    const bundleName = bundleText.split('(')[0].trim();
    parts.push(bundleName);
    
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
    parts.push(partName);
  }

  // Extract color (without pricing)
  if (selectedOptions['color']) {
    const colorName = selectedOptions['color'].split('(')[0].trim();
    parts.push(colorName);
  }

  // Extract size (without pricing)
  if (selectedOptions['size']) {
    const sizeName = selectedOptions['size'].split('(')[0].trim();
    parts.push(sizeName);
  }

  // Add course in parentheses if present (and not already added as main info)
  if (selectedOptions['course'] && !selectedOptions['bundle']) {
    parts.push(selectedOptions['course']);
  } else if (selectedOptions['course'] && selectedOptions['bundle']) {
    // For Gala, add course in parentheses
    const courseInfo = selectedOptions['course'];
    const result = `${parts.join(' - ')} (${courseInfo})`;
    // Only add "- Member Price" suffix if member pricing was actually used
    return isMemberPrice ? `${result} - Member Price` : result;
  }

  // Handle the generic 'Variants' key used by products with a single variant selector
  // e.g., Patch product stores {"Variants": "BSMT Patch"}
  if (selectedOptions['Variants'] || selectedOptions['variants']) {
    const variantValue = selectedOptions['Variants'] || selectedOptions['variants'];
    const variantName = variantValue.split('(')[0].trim();
    if (variantName && variantName !== productName) {
      parts.push(variantName);
    }
  }

  // Fallback: append any other option values not yet handled above
  const knownKeys = new Set(['bundle', 'part', 'color', 'size', 'course', 'Variants', 'variants']);
  for (const [key, value] of Object.entries(selectedOptions)) {
    if (!knownKeys.has(key) && value) {
      const valName = String(value).split('(')[0].trim();
      if (valName) parts.push(valName);
    }
  }

  const result = parts.join(' - ');
  return isMemberPrice ? `${result} - Member Price` : result;
}

/**
 * Parse product name from the old format stored in database
 * Example: "Gala (bundle: Bundle A (₱1,200 / ₱1,150 Member), course: BSMT)"
 * Returns: "Gala - Bundle A (BSMT) - Member Price" if member price was used
 * Returns: "Gala - Bundle A (BSMT)" if regular price was used
 */
export function parseAndFormatLegacyProductName(fullProductName: string, unitPrice?: number): string {
  const nameLower = fullProductName.toLowerCase().trim();
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
    parts.push(bundleName);
    
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
    const result = `${parts.join(' - ')} (${course})`;
    // Only add "- Member Price" suffix if member pricing was actually used
    return isMemberPrice ? `${result} - Member Price` : result;
  }
  
  const result = parts.join(' - ');
  return isMemberPrice ? `${result} - Member Price` : result;
}
