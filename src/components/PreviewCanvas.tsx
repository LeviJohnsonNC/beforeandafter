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

    // Swap to fix display order
    const beforeImg = images.find(img => img.id === selectedPair.afterId);
    const afterImg = images.find(img => img.id === selectedPair.beforeId);

    if (!beforeImg || !afterImg) return;

    renderCanvas(beforeImg.objectUrl, afterImg.objectUrl);
  }, [selectedPair, images, branding]);

  const renderCanvas = async (beforeUrl: string, afterUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load images
    const beforeImg = await loadImage(beforeUrl);
    const afterImg = await loadImage(afterUrl);

    // Calculate dimensions
    const targetHeight = 600;
    const gutter = 16;
    
    const beforeAspect = beforeImg.width / beforeImg.height;
    const afterAspect = afterImg.width / afterImg.height;
    
    const beforeWidth = Math.round(targetHeight * beforeAspect);
    const afterWidth = Math.round(targetHeight * afterAspect);
    
    canvas.width = beforeWidth + gutter + afterWidth;
    canvas.height = targetHeight;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw before image
    ctx.drawImage(beforeImg, 0, 0, beforeWidth, targetHeight);

    // Draw after image
    ctx.drawImage(afterImg, beforeWidth + gutter, 0, afterWidth, targetHeight);

    // Draw labels
    drawLabel(ctx, 'Before', 20, 30);
    drawLabel(ctx, 'After', beforeWidth + gutter + 20, 30);

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

  const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number) => {
    ctx.save();
    
    // Measure text
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    const metrics = ctx.measureText(text);
    const padding = 12;
    const width = metrics.width + padding * 2;
    const height = 32;

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();

    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + padding, y + height / 2);

    ctx.restore();
  };

  const drawWatermark = (
    ctx: CanvasRenderingContext2D,
    logoImg: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const maxLogoWidth = canvasWidth * 0.1;
    const logoAspect = logoImg.width / logoImg.height;
    const logoWidth = Math.min(maxLogoWidth, 150);
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
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(caption, canvasWidth / 2, canvasHeight - 15);
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
