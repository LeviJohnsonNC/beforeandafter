import { UploadedImage } from '@/types';

async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
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
      console.error('AI verification failed:', response.status);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error verifying scene match:', error);
    return null;
  }
}
