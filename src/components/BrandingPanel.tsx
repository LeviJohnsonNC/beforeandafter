import { Upload } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { extractDominantColor } from '@/lib/color';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { WatermarkPosition } from '@/types';

export const BrandingPanel = () => {
  const { branding, updateBranding } = useAppStore();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const logoUrl = URL.createObjectURL(file);
    
    try {
      const dominantColor = await extractDominantColor(file);
      updateBranding({ 
        logoUrl, 
        logoFile: file,
        dominantColor 
      });
      toast.success('Logo uploaded');
    } catch (error) {
      updateBranding({ logoUrl, logoFile: file });
      toast.success('Logo uploaded');
    }
  };

  return (
    <Card className="p-8">
      <h2 className="text-xl font-semibold mb-6">Branding</h2>

      <div className="space-y-6">
        {/* Logo upload */}
        <div>
          <Label>Brand Logo (Optional)</Label>
          <div className="mt-2">
            {branding.logoUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={branding.logoUrl}
                  alt="Brand logo"
                  className="w-24 h-24 object-contain border border-border rounded-lg p-2"
                />
                <div className="flex-1">
                  <Button variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      Change Logo
                    </label>
                  </Button>
                  {branding.dominantColor && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Dominant color: 
                      <span 
                        className="inline-block w-4 h-4 rounded ml-2 align-middle border border-border"
                        style={{ backgroundColor: branding.dominantColor }}
                      />
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </label>
              </Button>
            )}
          </div>
        </div>

        {/* Watermark position */}
        <div>
          <Label htmlFor="watermark-position">Watermark Position</Label>
          <Select
            value={branding.watermarkPosition}
            onValueChange={(value) => updateBranding({ watermarkPosition: value as WatermarkPosition })}
          >
            <SelectTrigger id="watermark-position" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top-left">Top Left</SelectItem>
              <SelectItem value="top-right">Top Right</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Caption */}
        <div>
          <Label htmlFor="caption">Caption (Optional)</Label>
          <Input
            id="caption"
            placeholder="e.g., Company Name - 2024"
            value={branding.caption || ''}
            onChange={(e) => updateBranding({ caption: e.target.value })}
            className="mt-2"
          />
        </div>
      </div>
    </Card>
  );
};
