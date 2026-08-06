const fileToCompressedBase64 = (file: File | string, maxWidth = 1200, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(typeof file === 'string' ? file : '');
      }
    };
    img.onerror = () => resolve(typeof file === 'string' ? file : '');

    if (typeof file === 'string') {
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        img.src = (event.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    }
  });
};

export function getThumbnailUrl(url: string, width = 350): string {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // Replace any existing transformation segment right after /upload/ (e.g. /upload/f_auto,q_auto,w_1200/ or /upload/w_300,f_auto,q_auto/)
    return url.replace(
      /\/upload\/(?:[a-z0-9_,-]+\/)?(v\d+|\w+)/i,
      `/upload/c_scale,w_${width},f_auto,q_auto/$1`
    );
  }
  return url;
}

export async function uploadToCloudinary(
  fileOrBase64: File | string,
  folder: 'products' | 'receipts' | 'announcements' = 'products'
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
      console.warn('Cloudinary upload failed, falling back to compressed base64:', errorData);
      if (fileOrBase64 instanceof File) {
        return await fileToCompressedBase64(fileOrBase64);
      }
      return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
    }

    const data = await response.json();
    return data.secure_url || data.url;
  } catch (error) {
    console.error('Error uploading to Cloudinary, falling back to compressed base64:', error);
    if (fileOrBase64 instanceof File) {
      return await fileToCompressedBase64(fileOrBase64);
    }
    return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
  }
}
