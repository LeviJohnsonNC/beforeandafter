import { useRef, useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';

export const PreviewCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { images, selectedPair, branding } = useAppStore();

  useEffect(() => {
    if (!selectedPair || !canvasRef.current) return;

    const beforeImg = images.find(img => img.id === selectedPair.beforeId);
    const afterImg = images.find(img => img.id === selectedPair.afterId);

    if (!beforeImg || !afterImg) return;

    renderCanvas(beforeImg.objectUrl, afterImg.objectUrl);
  }, [selectedPair, images, branding]);

  const calculateDimensions = (
    beforeImg: HTMLImageElement,
    afterImg: HTMLImageElement,
    layout: 'equal' | 'before-larger' | 'after-larger'
  ) => {
    const targetHeight = 600;
    const gutter = 16;
    const beforeAspect = beforeImg.width / beforeImg.height;
    const afterAspect = afterImg.width / afterImg.height;

    let beforeWidth: number;
    let afterWidth: number;
    let beforeHeight: number;
    let afterHeight: number;
    let canvasHeight: number;

    if (layout === 'equal') {
      // Both images same height, widths vary by aspect ratio
      beforeWidth = Math.round(targetHeight * beforeAspect);
      afterWidth = Math.round(targetHeight * afterAspect);
      beforeHeight = targetHeight;
      afterHeight = targetHeight;
      canvasHeight = targetHeight;
    } else {
      // For unequal layouts, preserve aspect ratios
      const baseWidth = 1200;
      const availableWidth = baseWidth - gutter;
      
      if (layout === 'before-larger') {
        // 65% for before, 35% for after
        beforeWidth = Math.round(availableWidth * 0.65);
        afterWidth = Math.round(availableWidth * 0.35);
      } else {
        // 35% for before, 65% for after
        beforeWidth = Math.round(availableWidth * 0.35);
        afterWidth = Math.round(availableWidth * 0.65);
      }
      
      // Calculate heights based on aspect ratios
      beforeHeight = Math.round(beforeWidth / beforeAspect);
      afterHeight = Math.round(afterWidth / afterAspect);
      canvasHeight = Math.max(beforeHeight, afterHeight);
    }

    return {
      beforeWidth,
      afterWidth,
      beforeHeight,
      afterHeight,
      canvasWidth: beforeWidth + gutter + afterWidth,
      canvasHeight,
      gutter,
    };
  };

  // Helper function to calculate contrast color for text
  const getContrastColor = (hexColor: string): string => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // Calculate relative luminance (WCAG standard)
    const luminance = (c: number) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    
    const L = 0.2126 * luminance(r) + 0.7152 * luminance(g) + 0.0722 * luminance(b);
    
    // Return white for dark colors, black for light colors
    return L > 0.5 ? '#000000' : '#FFFFFF';
  };

  const renderCanvas = async (beforeUrl: string, afterUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load images
    const beforeImg = await loadImage(beforeUrl);
    const afterImg = await loadImage(afterUrl);

    // Calculate dimensions based on layout
    const { beforeWidth, afterWidth, beforeHeight, afterHeight, canvasWidth, canvasHeight, gutter } = 
      calculateDimensions(beforeImg, afterImg, branding.layout);
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // For unequal layouts, use crop-to-fill approach to eliminate whitespace
    if (branding.layout !== 'equal') {
      // Draw before image
      if (beforeHeight < canvasHeight) {
        // Scale up and crop to fill height
        const scaleToFill = canvasHeight / beforeHeight;
        const scaledWidth = beforeWidth * scaleToFill;
        const cropX = (scaledWidth - beforeWidth) / 2;
        ctx.drawImage(
          beforeImg, 
          cropX / scaleToFill, 0, // Source x, y
          beforeImg.width - (cropX * 2 / scaleToFill), beforeImg.height, // Source width, height
          0, 0, // Dest x, y
          beforeWidth, canvasHeight // Dest width, height
        );
      } else {
        ctx.drawImage(beforeImg, 0, 0, beforeWidth, beforeHeight);
      }

      // Draw after image
      if (afterHeight < canvasHeight) {
        // Scale up and crop to fill height
        const scaleToFill = canvasHeight / afterHeight;
        const scaledWidth = afterWidth * scaleToFill;
        const cropX = (scaledWidth - afterWidth) / 2;
        ctx.drawImage(
          afterImg, 
          cropX / scaleToFill, 0, // Source x, y
          afterImg.width - (cropX * 2 / scaleToFill), afterImg.height, // Source width, height
          beforeWidth + gutter, 0, // Dest x, y
          afterWidth, canvasHeight // Dest width, height
        );
      } else {
        ctx.drawImage(afterImg, beforeWidth + gutter, 0, afterWidth, afterHeight);
      }
    } else {
      // Equal layout - no cropping needed
      ctx.drawImage(beforeImg, 0, 0, beforeWidth, beforeHeight);
      ctx.drawImage(afterImg, beforeWidth + gutter, 0, afterWidth, afterHeight);
    }

    // Draw labels if enabled
    if (branding.showLabels) {
      drawLabel(ctx, 'Before', 20, 30, canvasHeight, branding.dominantColor);
      drawLabel(ctx, 'After', beforeWidth + gutter + 20, 30, canvasHeight, branding.dominantColor);
    }

    // Draw watermark if logo exists
    if (branding.logoUrl) {
      try {
        const logoImg = await loadImage(branding.logoUrl);
        drawWatermark(ctx, logoImg, canvas.width, canvas.height);
      } catch (error) {
        console.warn('Failed to load logo:', error);
      }
    }

    // Draw caption if exists
    if (branding.caption) {
      drawCaption(ctx, branding.caption, canvas.width, canvas.height);
    }
  };

  const drawLabel = (
    ctx: CanvasRenderingContext2D, 
    text: string, 
    x: number, 
    y: number, 
    canvasHeight: number,
    brandColor?: string
  ) => {
    ctx.save();
    
    // Scale factor based on canvas height (600 is base target)
    const scaleFactor = canvasHeight / 600;
    
    // Set all canvas properties explicitly with scaling
    const fontSize = Math.round(30 * scaleFactor);
    ctx.font = `900 ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = 'middle';
    
    // Measure text for chip dimensions
    const metrics = ctx.measureText(text);
    const paddingX = Math.round(24 * scaleFactor);
    const paddingY = Math.round(15 * scaleFactor);
    const width = metrics.width + paddingX * 2;
    const height = Math.round(60 * scaleFactor);
    const borderRadius = Math.round(12 * scaleFactor);

    // Determine colors based on brand
    const bgColor = brandColor || '#FFFFFF';
    const textColor = brandColor ? getContrastColor(brandColor) : '#000000';
    const borderColor = brandColor ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.1)';

    // Draw background (fresh context, no shadows)
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, borderRadius);
    ctx.fill();

    // Draw border (fresh path)
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = Math.round(2 * scaleFactor);
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, borderRadius);
    ctx.stroke();

    // Draw text (completely fresh state, explicit properties)
    ctx.fillStyle = textColor;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.textAlign = 'left';
    ctx.fillText(text, x + paddingX, y + height / 2);

    ctx.restore();
  };

  const drawWatermark = (
    ctx: CanvasRenderingContext2D,
    logoImg: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Fixed logo size regardless of canvas dimensions
    const logoAspect = logoImg.width / logoImg.height;
    const logoWidth = 100; // Fixed width
    const logoHeight = logoWidth / logoAspect;
    
    const margin = 20;
    let x = 0;
    let y = 0;

    switch (branding.watermarkPosition) {
      case 'top-left':
        x = margin;
        y = margin;
        break;
      case 'top-right':
        x = canvasWidth - logoWidth - margin;
        y = margin;
        break;
      case 'bottom-left':
        x = margin;
        y = canvasHeight - logoHeight - margin;
        break;
      case 'bottom-right':
        x = canvasWidth - logoWidth - margin;
        y = canvasHeight - logoHeight - margin;
        break;
    }

    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
    ctx.restore();
  };

  const drawCaption = (
    ctx: CanvasRenderingContext2D,
    caption: string,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    ctx.save();
    
    // Scale factor based on canvas height (600 is base target)
    const scaleFactor = canvasHeight / 600;
    
    // Set font for measuring with scaling
    const fontSize = Math.round(36 * scaleFactor);
    ctx.font = `600 ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = 'middle';
    
    // Measure text for chip dimensions
    const metrics = ctx.measureText(caption);
    const paddingX = Math.round(32 * scaleFactor);
    const paddingY = Math.round(20 * scaleFactor);
    const width = metrics.width + paddingX * 2;
    const height = Math.round(76 * scaleFactor);
    const borderRadius = Math.round(16 * scaleFactor);
    
    // Position centered horizontally, with margin from bottom
    const x = (canvasWidth - width) / 2;
    const y = canvasHeight - height - Math.round(30 * scaleFactor);
    
    // Determine colors based on brand
    const bgColor = branding.dominantColor || '#FFFFFF';
    const textColor = branding.dominantColor ? getContrastColor(branding.dominantColor) : '#000000';
    const borderColor = branding.dominantColor ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.1)';
    
    // Draw background chip
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, borderRadius);
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = Math.round(3 * scaleFactor);
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, borderRadius);
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = textColor;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.fillText(caption, canvasWidth / 2, y + height / 2);
    
    ctx.restore();
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png', 1.0);
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `before-after-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Image downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download image');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!selectedPair) {
    return null;
  }

  return (
    <Card className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Preview</h2>
        <Button 
          onClick={handleDownload} 
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download PNG
            </>
          )}
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden border border-border bg-muted shadow-lg">
        <canvas 
          ref={canvasRef}
          className="w-full h-auto"
        />
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Looks good? Download PNG
      </p>
    </Card>
  );
};
