import { useRef, useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const SlideRevealPreview = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const { images, selectedPair, branding } = useAppStore();

  const beforeImg = images.find(img => img.id === selectedPair?.beforeId);
  const afterImg = images.find(img => img.id === selectedPair?.afterId);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, percentage)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, percentage)));
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  if (!beforeImg || !afterImg) return null;

  const getContrastColor = (hexColor?: string): string => {
    if (!hexColor) return '#000000';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const luminance = (c: number) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    
    const L = 0.2126 * luminance(r) + 0.7152 * luminance(g) + 0.0722 * luminance(b);
    return L > 0.5 ? '#000000' : '#FFFFFF';
  };

  const bgColor = branding.dominantColor || '#FFFFFF';
  const textColor = getContrastColor(branding.dominantColor);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-border bg-muted shadow-lg select-none"
      style={{ 
        aspectRatio: '16/9',
        maxHeight: '600px',
        cursor: isDragging ? 'col-resize' : 'default'
      }}
    >
      {/* Before Image (Background) */}
      <img
        src={beforeImg.objectUrl}
        alt="Before"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* After Image (Clipped) */}
      <img
        src={afterImg.objectUrl}
        alt="After"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
        }}
        draggable={false}
      />

      {/* Labels */}
      {branding.showLabels && (
        <>
          <div
            className="absolute top-5 left-5 px-6 py-3 rounded-xl font-black text-lg border-2 shadow-md"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              borderColor: branding.dominantColor ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.1)'
            }}
          >
            Before
          </div>
          <div
            className="absolute top-5 right-5 px-6 py-3 rounded-xl font-black text-lg border-2 shadow-md"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              borderColor: branding.dominantColor ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.1)',
              opacity: sliderPosition > 75 ? 1 : 0,
              transition: 'opacity 0.2s'
            }}
          >
            After
          </div>
        </>
      )}

      {/* Watermark */}
      {branding.logoUrl && (
        <img
          src={branding.logoUrl}
          alt="Logo"
          className="absolute w-[100px] h-auto opacity-60 pointer-events-none"
          style={{
            ...getWatermarkPosition(branding.watermarkPosition)
          }}
        />
      )}

      {/* Caption */}
      {branding.caption && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-5 rounded-2xl font-semibold text-2xl border-[3px] shadow-lg"
          style={{
            backgroundColor: bgColor,
            color: textColor,
            borderColor: branding.dominantColor ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.1)'
          }}
        >
          {branding.caption}
        </div>
      )}

      {/* Slider Divider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-opacity"
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)',
          opacity: isDragging ? 1 : 0.8
        }}
      >
        {/* Slider Handle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center cursor-col-resize hover:scale-110 transition-transform active:scale-95"
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          <SlidersHorizontal className="w-5 h-5 text-foreground" />
        </div>
      </div>
    </div>
  );
};

const getWatermarkPosition = (position: string) => {
  const margin = '20px';
  switch (position) {
    case 'top-left':
      return { top: margin, left: margin };
    case 'top-right':
      return { top: margin, right: margin };
    case 'bottom-left':
      return { bottom: margin, left: margin };
    case 'bottom-right':
      return { bottom: margin, right: margin };
    default:
      return { bottom: margin, right: margin };
  }
};
