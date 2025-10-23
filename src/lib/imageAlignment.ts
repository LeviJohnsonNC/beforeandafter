import { UploadedImage } from '@/types';

// Simple alignment detection based on image metrics
export function needsAlignment(img1: UploadedImage, img2: UploadedImage): boolean {
  // If we don't have metrics, assume alignment might help
  if (!img1.metrics || !img2.metrics) {
    return true;
  }

  // Check if images have significantly different brightness (could indicate different exposure/angle)
  const brightnessDiff = Math.abs(img1.metrics.brightness - img2.metrics.brightness);
  
  // Check if images have different sharpness (could indicate different focus/distance)
  const sharpnessDiff = Math.abs(img1.metrics.sharpness - img2.metrics.sharpness);
  
  // Check perceptual hash distance for structural differences
  const pHashDistance = hammingDistance(img1.metrics.pHash, img2.metrics.pHash);
  
  // Needs alignment if:
  // - pHash distance suggests structural differences (likely different angle/perspective)
  // - OR significant brightness/sharpness differences suggest different capture conditions
  const needsAlign = pHashDistance > 15 || brightnessDiff > 0.15 || sharpnessDiff > 0.15;
  
  if (needsAlign) {
    console.log('Alignment detected needed:', {
      pHashDistance,
      brightnessDiff,
      sharpnessDiff
    });
  }
  
  return needsAlign;
}

// Calculate Hamming distance between two pHash strings
function hammingDistance(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) {
    return 64; // Max distance if hashes are invalid
  }
  
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
}

// Convert image to base64 for API transmission
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Align images using the backend API
export async function alignImages(
  referenceImg: UploadedImage,
  targetImg: UploadedImage
): Promise<string | null> {
  try {
    console.log('Converting images to base64...');
    const referenceBase64 = await imageToBase64(referenceImg.file);
    const targetBase64 = await imageToBase64(targetImg.file);

    console.log('Calling alignment API...');
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/align-images`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          referenceImage: referenceBase64,
          imageToAlign: targetBase64,
        }),
      }
    );

    if (!response.ok) {
      console.error('Alignment API failed:', response.status);
      return null;
    }

    const result = await response.json();
    console.log('Alignment successful');
    return result.alignedImage;
  } catch (error) {
    console.error('Error aligning images:', error);
    return null;
  }
}