import { PRODUCT_IMAGES } from '../constants/cloudinaryAssets';
import patchVariants from '../../patch_variants.json';

/**
 * Resolves the Cloudinary image URL for a product based on its name and selected options.
 * This is used to display product images on pages like the Cart Page where the database
 * doesn't store direct image paths.
 * 
 * @param productName - The name of the product
 * @param selectedOpts - The selected options dictionary for the product
 * @returns Cloudinary image URL or empty string if not found
 */
export function getProductImageByName(productName: string, selectedOpts: Record<string, string> = {}): string {
  if (!productName) return '';

  // Standardize the product name lookup (trim whitespace)
  const name = productName.trim();

  // Products with variant images based on options
  if (name === 'Patch') {
    const optionValue = Object.values(selectedOpts).find(val => 
      val === 'UC Patch' || val === 'BSMT Patch' || val === 'BSMARE Patch'
    );
    if (optionValue) {
      const matchedKey = Object.keys(patchVariants).find(key => key.endsWith(`:${optionValue}`));
      if (matchedKey) {
        return (patchVariants as any)[matchedKey]?.image || '';
      }
    }
    const defaultKey = Object.keys(patchVariants).find(key => key.endsWith(':UC Patch')) || '';
    return (patchVariants as any)[defaultKey]?.image || '';
  }

  if (name === 'Type A & B Uniform') {
    return PRODUCT_IMAGES['Type A & B Uniform'];
  }
  
  if (name === 'Gala') {
    const bundleOption = selectedOpts['bundle'];
    if (bundleOption) {
      if (bundleOption.includes('Bundle A')) return PRODUCT_IMAGES['Gala Bundle A'];
      if (bundleOption.includes('Bundle B')) return PRODUCT_IMAGES['Gala Bundle B'];
      if (bundleOption.includes('Bundle C')) return PRODUCT_IMAGES['Gala Bundle C'];
      if (bundleOption.includes('Bundle D')) return PRODUCT_IMAGES['Gala Bundle D'];
      if (bundleOption.includes('Bundle E')) return PRODUCT_IMAGES['Gala Bundle E'];
      if (bundleOption.includes('Bundle F')) return PRODUCT_IMAGES['Gala Bundle F'];
      if (bundleOption.includes('Bundle G')) return PRODUCT_IMAGES['Gala Bundle G'];
      if (bundleOption.includes('Bundle H')) return PRODUCT_IMAGES['Gala Bundle H'];
      if (bundleOption.includes('Bundle I')) return PRODUCT_IMAGES['Gala Bundle I'];
    }
    return PRODUCT_IMAGES['Gala Bundle A']; // Default to Bundle A
  }
  
  if (name === 'Type C Uniform') {
    const courseOption = selectedOpts['course'];
    if (courseOption) {
      if (courseOption.includes('BSMT')) return PRODUCT_IMAGES['Type C-BSMT'];
      if (courseOption.includes('BSMARE')) return PRODUCT_IMAGES['Type C-BSMARE'];
      if (courseOption.includes('SHS') || courseOption.includes('JHS')) return PRODUCT_IMAGES['Type C-SHS'];
    }
    return PRODUCT_IMAGES['Type C-BSMT']; // Default to BSMT
  }
  
  if (name === 'Lanyard') {
    const courseOption = selectedOpts['course'];
    if (courseOption) {
      if (courseOption.includes('BSMT')) return PRODUCT_IMAGES['Lanyard-BSMT'];
      if (courseOption.includes('BSMARE')) return PRODUCT_IMAGES['Lanyard-BSMARE'];
      if (courseOption.includes('SHS') || courseOption.includes('JHS')) return PRODUCT_IMAGES['Lanyard-SHS'];
      if (courseOption.includes('HM')) return PRODUCT_IMAGES['Lanyard-HM'];
      if (courseOption.includes('TM') || courseOption.includes('TOURISM')) return PRODUCT_IMAGES['Lanyard-TM'];
    }
    return PRODUCT_IMAGES['Lanyard-BSMT']; // Default to BSMT
  }
  
  if (name === 'Hard Hat') {
    const colorOption = selectedOpts['color'];
    if (colorOption) {
      if (colorOption.includes('Yellow')) return PRODUCT_IMAGES['Hardhat-Yellow'];
      if (colorOption.includes('Blue')) return PRODUCT_IMAGES['Hardhat-Blue'];
    }
    return PRODUCT_IMAGES['Hardhat-Yellow']; // Default to Yellow
  }
  
  if (name === 'Pershing Cap') {
    const courseOption = selectedOpts['course'];
    if (courseOption) {
      if (courseOption.includes('BSMARE')) return PRODUCT_IMAGES['Pershing Cap BSMARE'];
      if (courseOption.includes('BSMT')) return PRODUCT_IMAGES['Pershing Cap'];
    }
    return PRODUCT_IMAGES['Pershing Cap']; // Default to BSMT
  }
  
  if (name === 'Cover All') {
    const colorOption = selectedOpts['color'];
    if (colorOption) {
      if (colorOption.includes('Blue')) return PRODUCT_IMAGES['Cover All BLUE'];
      if (colorOption.includes('Orange')) return PRODUCT_IMAGES['Coverall'];
    }
    return PRODUCT_IMAGES['Coverall']; // Default to Orange
  }
  
  if (name === 'Belt') {
    const colorOption = selectedOpts['color'];
    if (colorOption) {
      if (colorOption.includes('Black')) return PRODUCT_IMAGES['Black Belt'];
      if (colorOption.includes('White')) return PRODUCT_IMAGES['White Belt'];
    }
    return PRODUCT_IMAGES['Black Belt']; // Default to Black
  }
  
  if (name === 'Shoulder Board') {
    const courseOption = selectedOpts['course'];
    if (courseOption) {
      if (courseOption.includes('BSMT')) return PRODUCT_IMAGES['Shoulder board 2'];
      if (courseOption.includes('BSMARE')) return PRODUCT_IMAGES['Shoulder board 1'];
    }
    return PRODUCT_IMAGES['Shoulder board 2']; // Default to BSMT
  }
  
  if (name === 'ROTC Manual') {
    const partOption = selectedOpts['part'];
    if (partOption) {
      if (partOption.includes('Part 1')) return PRODUCT_IMAGES['ROTC Manual Part 1'];
      if (partOption.includes('Part 2')) return PRODUCT_IMAGES['ROTC Manual'];
    }
    return PRODUCT_IMAGES['ROTC Manual']; // Default to Part 2
  }
  
  // Products with single static images
  if (name === 'BSNAME Uniform') return PRODUCT_IMAGES['BSNAME Uniform'];
  if (name === 'ID Case') return PRODUCT_IMAGES['ID Case'];
  if (name === 'Handbag') return PRODUCT_IMAGES['Handbag'];
  if (name === 'Hard Bound') return PRODUCT_IMAGES['Hardbound'];
  if (name === 'Safety Shoes') return PRODUCT_IMAGES['Safety Shoes'];
  if (name === 'Gloves') return PRODUCT_IMAGES['Gloves'];
  if (name === 'PE Tshirt') return PRODUCT_IMAGES['PE Shirt'];
  if (name === 'PE Pants') return PRODUCT_IMAGES['PE Pants'];
  if (name === 'Plotting Sheet') return PRODUCT_IMAGES['Plotting Sheet'];
  if (name === 'PE Short') return PRODUCT_IMAGES['PE Shorts'];
  if (name === 'Buttons') return PRODUCT_IMAGES['Buttons'];
  if (name === 'Anchor Pins') return PRODUCT_IMAGES['Anchor'];
  if (name === 'Propeller Pins') return PRODUCT_IMAGES['Propeller'];
  if (name === 'Swimming Set') return PRODUCT_IMAGES['Swimming Trunks'];
  if (name === 'Swimming Cap') return PRODUCT_IMAGES['Cap'];
  if (name === 'CWTS Shirt') return PRODUCT_IMAGES['CWTS Shirt'];
  if (name === 'White Shoes') return PRODUCT_IMAGES['White Shoes '];
  if (name === 'Safety Goggles') return PRODUCT_IMAGES['Goggles'];
  if (name === 'Rope') return PRODUCT_IMAGES['Rope'];
  if (name.toLowerCase().includes('class ring') || name.toLowerCase().includes('official class ring')) return '/class_ring.jpg';

  return '';
}
