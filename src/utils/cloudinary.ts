/**
 * Uploads a base64 image or a File object to Cloudinary.
 * Falls back to returning the base64 string if configuration is missing or upload fails.
 * 
 * @param fileOrBase64 - The file or base64 data string to upload
 * @param folder - Cloudinary folder/tag
 * @returns The Cloudinary secure_url on success, or the original base64/string on failure.
 */
export async function uploadToCloudinary(
  fileOrBase64: File | string,
  folder: 'products' | 'receipts' = 'products'
): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'doas4qcdo';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

  // If it's already a URL (not base64 and not a File), just return it
  if (typeof fileOrBase64 === 'string' && !fileOrBase64.startsWith('data:')) {
    return fileOrBase64;
  }

  try {
    const formData = new FormData();
    formData.append('file', fileOrBase64);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', `uc_coop/${folder}`);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Cloudinary upload failed, falling back to original value:', errorData);
      return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
    }

    const data = await response.json();
    return data.secure_url || data.url;
  } catch (error) {
    console.error('Error uploading to Cloudinary, falling back to original value:', error);
    return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
  }
}
