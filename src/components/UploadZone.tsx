import { useCallback, useState } from 'react';
import { Upload, X, RotateCcw } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useAppStore } from '@/store/useAppStore';
import { UploadedImage } from '@/types';
import { computeImageMetrics, normalizeMetrics } from '@/lib/imageMetrics';
import { extractExifDate } from '@/lib/exif';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';
import { ImageGrid } from './ImageGrid';

export const UploadZone = () => {
  const { images, addImages, setProcessing, reset } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Please upload image files');
      return;
    }

    if (images.length + imageFiles.length > 20) {
      toast.error('Maximum 20 images allowed');
      return;
    }

    if (images.length + imageFiles.length < 2) {
      toast.info('Upload at least 2 images to find pairs');
    }

    setProcessing(true);
    toast.info('Processing images...');

    const newImages: UploadedImage[] = [];

    for (const file of imageFiles) {
      const id = nanoid();
      const objectUrl = URL.createObjectURL(file);
      
      console.log(`📸 Generated unique ID for ${file.name}: ${id}`);
      
      const exifDate = await extractExifDate(file);
      
      newImages.push({
        id,
        file,
        objectUrl,
        exif: exifDate ? { takenAt: exifDate } : undefined,
      });
    }

    addImages(newImages);

    // Compute metrics for new images
    const metricsPromises = newImages.map(async (img) => {
      try {
        const metrics = await computeImageMetrics(img.file);
        return { id: img.id, metrics };
      } catch (error) {
        console.error('Failed to compute metrics:', error);
        return null;
      }
    });

    const results = await Promise.all(metricsPromises);
    
    // Update images with metrics
    const store = useAppStore.getState();
    results.forEach(result => {
      if (result) {
        store.updateImage(result.id, { metrics: result.metrics });
      }
    });

    // Normalize sharpness across all images
    normalizeMetrics(useAppStore.getState().images);

    setProcessing(false);
    toast.success(`Processed ${imageFiles.length} images`);
  }, [images, addImages, setProcessing]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  }, [processFiles]);

  return (
    <Card className="p-8">
      <h2 className="text-xl font-semibold mb-4">Upload Photos</h2>
      
      {images.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-all
            ${isDragging 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
          `}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            Drop your job photos here (4–20)
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            We'll detect the best before/after pair
          </p>
          <Button asChild>
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              Choose Files
            </label>
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {images.length} image{images.length !== 1 ? 's' : ''} uploaded
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Revoke object URLs to prevent memory leaks
                  images.forEach(img => URL.revokeObjectURL(img.objectUrl));
                  reset();
                  toast.success('All photos cleared');
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  Add More
                </label>
              </Button>
            </div>
          </div>
          <ImageGrid />
        </div>
      )}
    </Card>
  );
};
