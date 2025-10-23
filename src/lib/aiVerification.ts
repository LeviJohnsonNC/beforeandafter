import { UploadedImage } from '@/types';

async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      try {
        // Resize to max 1024px for AI processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        
        let width = img.width;
        let height = img.height;
        const maxSize = 1024;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with 85% quality for better compatibility
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        URL.revokeObjectURL(url);
        resolve(base64);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

export async function verifySceneMatch(
  img1: UploadedImage,
  img2: UploadedImage
): Promise<{ match: boolean; confidence: number; reasoning: string; image1IsBefore?: boolean } | null> {
  try {
    const image1Base64 = await imageToBase64(img1.file);
    const image2Base64 = await imageToBase64(img2.file);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-scene-match`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ image1Base64, image2Base64 }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI verification failed:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error verifying scene match:', error);
    return null;
  }
}
