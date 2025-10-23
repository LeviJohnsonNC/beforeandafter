import { AlignCenterHorizontal, AlignLeft, AlignRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

export const LayoutControls = () => {
  const { branding, updateBranding } = useAppStore();

  return (
    <div className="flex flex-col gap-6 p-6 border border-border rounded-lg bg-card">
      {/* Labels Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="show-labels" className="text-sm font-medium">
            Show Before/After Labels
          </Label>
          <p className="text-xs text-muted-foreground">
            Toggle the label chips on the images
          </p>
        </div>
        <Switch
          id="show-labels"
          checked={branding.showLabels}
          onCheckedChange={(checked) => updateBranding({ showLabels: checked })}
        />
      </div>

      {/* Layout Selection */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Image Layout</Label>
          <p className="text-xs text-muted-foreground">
            Choose how to size the before and after images
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={branding.layout}
          onValueChange={(value) => {
            if (value) updateBranding({ layout: value as typeof branding.layout });
          }}
          className="justify-start gap-2"
        >
          <ToggleGroupItem
            value="equal"
            aria-label="Equal size"
            className="flex items-center gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <AlignCenterHorizontal className="w-4 h-4" />
            <span>Equal</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="before-larger"
            aria-label="Before image larger"
            className="flex items-center gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <AlignLeft className="w-4 h-4" />
            <span>Before Larger</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="after-larger"
            aria-label="After image larger"
            className="flex items-center gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <AlignRight className="w-4 h-4" />
            <span>After Larger</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};
