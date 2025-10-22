import { X, Sparkles, Sun, Zap, Hash } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export const ImageGrid = () => {
  const { images, removeImage } = useAppStore();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((img) => (
        <div
          key={img.id}
          className="relative group rounded-lg overflow-hidden border border-border bg-muted hover:shadow-lg transition-all"
        >
          <div className="aspect-square relative">
            <img
              src={img.objectUrl}
              alt="Upload"
              className="w-full h-full object-cover"
            />
            
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                URL.revokeObjectURL(img.objectUrl);
                removeImage(img.id);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {img.metrics && (
            <div className="p-2 space-y-1">
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  {(img.metrics.sharpness * 100).toFixed(0)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Sun className="w-3 h-3 mr-1" />
                  {(img.metrics.brightness * 100).toFixed(0)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {(img.metrics.entropy * 100).toFixed(0)}
                </Badge>
              </div>
              {img.exif?.takenAt && (
                <Badge variant="outline" className="text-xs w-full justify-center">
                  <Hash className="w-3 h-3 mr-1" />
                  {new Date(img.exif.takenAt).toLocaleDateString()}
                </Badge>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
