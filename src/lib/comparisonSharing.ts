import { supabase } from '@/integrations/supabase/client';
import { BrandingConfig } from '@/types';

export type ShareableComparison = {
  id: string;
  url: string;
  embedCode: string;
};

export async function uploadImageToStorage(file: File, filename: string): Promise<string | null> {
  try {
    console.log('Uploading image:', filename, 'Size:', file.size, 'Type:', file.type);
    
    const { data, error } = await supabase.storage
      .from('comparison-images')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    console.log('Upload successful, path:', data.path);

    const { data: publicUrlData } = supabase.storage
      .from('comparison-images')
      .getPublicUrl(data.path);

    console.log('Public URL generated:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

export async function createShareableComparison(
  beforeImageUrl: string,
  afterImageUrl: string,
  branding: BrandingConfig
): Promise<ShareableComparison | null> {
  try {
    const brandingConfig = {
      logoUrl: branding.logoUrl,
      dominantColor: branding.dominantColor,
      watermarkPosition: branding.watermarkPosition,
      caption: branding.caption,
    };

    const { data, error } = await supabase
      .from('comparisons')
      .insert({
        before_image_url: beforeImageUrl,
        after_image_url: afterImageUrl,
        branding_config: brandingConfig,
      })
      .select('id')
      .single();

    if (error) throw error;

    const baseUrl = window.location.origin;
    const comparisonUrl = `${baseUrl}/compare/${data.id}`;
    const embedCode = `<iframe
  src="${comparisonUrl}"
  style="width:100%;max-width:960px;height:540px;border:0;overflow:hidden;border-radius:12px"
  loading="lazy"
  allowfullscreen
></iframe>`;

    return {
      id: data.id,
      url: comparisonUrl,
      embedCode,
    };
  } catch (error) {
    console.error('Error creating shareable comparison:', error);
    return null;
  }
}

export async function uploadAndCreateComparison(
  beforeFile: File,
  afterFile: File,
  branding: BrandingConfig
): Promise<ShareableComparison | null> {
  const timestamp = Date.now();
  const beforeFilename = `before-${timestamp}-${beforeFile.name}`;
  const afterFilename = `after-${timestamp}-${afterFile.name}`;

  const [beforeUrl, afterUrl] = await Promise.all([
    uploadImageToStorage(beforeFile, beforeFilename),
    uploadImageToStorage(afterFile, afterFilename)
  ]);

  if (!beforeUrl || !afterUrl) {
    return null;
  }

  return createShareableComparison(beforeUrl, afterUrl, branding);
}
