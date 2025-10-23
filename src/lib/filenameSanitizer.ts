/**
 * Sanitizes a filename to be safe for Supabase Storage
 * Removes/replaces invalid characters and spaces
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || filename.trim() === '') {
    return 'unnamed';
  }

  // Extract extension
  const lastDotIndex = filename.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0 && lastDotIndex < filename.length - 1;
  
  let baseName = hasExtension ? filename.slice(0, lastDotIndex) : filename;
  const extension = hasExtension ? filename.slice(lastDotIndex + 1) : '';

  // Replace spaces with hyphens
  baseName = baseName.replace(/\s+/g, '-');
  
  // Remove or replace invalid characters: < > : " / \ | ? * and control characters
  baseName = baseName.replace(/[<>:"/\\|?*\x00-\x1f\x80-\x9f]/g, '');
  
  // Remove any remaining special characters except hyphens, underscores, and dots
  baseName = baseName.replace(/[^a-zA-Z0-9._-]/g, '');
  
  // Remove leading/trailing dots and hyphens
  baseName = baseName.replace(/^[.-]+|[.-]+$/g, '');
  
  // Convert to lowercase for consistency
  baseName = baseName.toLowerCase();
  
  // If after sanitization the name is empty, use fallback
  if (!baseName) {
    baseName = 'file';
  }
  
  // Limit length to 100 characters
  if (baseName.length > 100) {
    baseName = baseName.slice(0, 100);
  }
  
  // Reconstruct filename with extension
  return extension ? `${baseName}.${extension.toLowerCase()}` : baseName;
}
