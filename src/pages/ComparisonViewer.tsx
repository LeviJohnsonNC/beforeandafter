import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SlidersHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type ComparisonData = {
  id: string;
  before_image_url: string;
  after_image_url: string;
  branding_config?: {
    logoUrl?: string;
    dominantColor?: string;
    watermarkPosition?: string;
    caption?: string;
  };
};

export default function ComparisonViewer() {
  const { id } = useParams<{ id: string }>();
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchComparison = async () => {
      if (!id) {
        setError('No comparison ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('comparisons')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        setComparison({
          ...data,
          branding_config: data.branding_config as ComparisonData['branding_config']
        });

        // Increment view count
        await supabase
          .from('comparisons')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', id);
      } catch (err) {
        console.error('Error fetching comparison:', err);
        setError('Failed to load comparison');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [id]);

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

  const getWatermarkPosition = (position?: string) => {
    const margin = '20px';
    switch (position) {
      case 'top-left':
        return { top: margin, left: margin };
      case 'top-right':
        return { top: margin, right: margin };
      case 'bottom-left':
        return { bottom: margin, left: margin };
      case 'bottom-right':
      default:
        return { bottom: margin, right: margin };
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <Skeleton className="w-full max-w-[960px] aspect-video rounded-xl" />
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Comparison Not Found</h1>
          <p className="text-muted-foreground">{error || 'This comparison does not exist or has been removed.'}</p>
        </div>
      </div>
    );
  }

  const bgColor = comparison.branding_config?.dominantColor || '#FFFFFF';
  const textColor = getContrastColor(comparison.branding_config?.dominantColor);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-background p-4">
      <div
        ref={containerRef}
        className="relative w-full max-w-[960px] overflow-hidden rounded-xl shadow-lg select-none"
        style={{ 
          aspectRatio: '16/9',
          cursor: isDragging ? 'col-resize' : 'default'
        }}
      >
        {/* Before Image */}
        <img
          src={comparison.before_image_url}
          alt="Before"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* After Image */}
        <img
          src={comparison.after_image_url}
          alt="After"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
          }}
          draggable={false}
        />

        {/* Watermark */}
        {comparison.branding_config?.logoUrl && (
          <img
            src={comparison.branding_config.logoUrl}
            alt="Logo"
            className="absolute w-[100px] h-auto opacity-60 pointer-events-none"
            style={{
              ...getWatermarkPosition(comparison.branding_config.watermarkPosition)
            }}
          />
        )}

        {/* Caption */}
        {comparison.branding_config?.caption && (
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-5 rounded-2xl font-semibold text-2xl border-[3px] shadow-lg"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              borderColor: comparison.branding_config.dominantColor ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.1)'
            }}
          >
            {comparison.branding_config.caption}
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
            <SlidersHorizontal className="w-5 h-5 text-gray-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
