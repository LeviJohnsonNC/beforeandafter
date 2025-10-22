import ExifReader from 'exifreader';

export async function extractExifDate(file: File): Promise<string | undefined> {
  try {
    const tags = await ExifReader.load(file);
    
    // Try various date fields in order of preference
    const dateFields = [
      'DateTimeOriginal',
      'DateTime',
      'DateTimeDigitized',
      'CreateDate'
    ];

    for (const field of dateFields) {
      const tag = tags[field];
      if (tag?.description) {
        // EXIF dates are typically in format "YYYY:MM:DD HH:MM:SS"
        // Convert to ISO format
        const dateStr = tag.description.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
    
    return undefined;
  } catch (error) {
    console.warn('Failed to extract EXIF data:', error);
    return undefined;
  }
}
