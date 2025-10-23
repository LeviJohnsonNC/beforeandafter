import { Columns2, PanelLeft, PanelRight, SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

export const LayoutControls = () => {
  const { branding, updateBranding } = useAppStore();

  return (
    <div className="space-y-4">
      {/* Labels Toggle - Compact */}
      <div className="flex items-center justify-between">
        <Label htmlFor="show-labels" className="text-sm font-medium">
          Show Before/After Labels
        </Label>
        <Switch
          id="show-labels"
          checked={branding.showLabels}
          onCheckedChange={(checked) => updateBranding({ showLabels: checked })}
        />
      </div>

      {/* Layout Selection - Horizontal */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Image Layout</Label>
        <ToggleGroup
          type="single"
          value={branding.layout}
          onValueChange={(value) => {
            if (value) updateBranding({ layout: value as typeof branding.layout });
          }}
          className="justify-start gap-2 flex-wrap"
        >
          <ToggleGroupItem
            value="equal"
            aria-label="Equal size"
            className="flex items-center gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Columns2 className="w-4 h-4" />
            <span className="text-sm">Equal</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="before-larger"
            aria-label="Before image larger"
            className="flex items-center gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <PanelLeft className="w-4 h-4" />
            <span className="text-sm">Before Larger</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="after-larger"
            aria-label="After image larger"
            className="flex items-center gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <PanelRight className="w-4 h-4" />
            <span className="text-sm">After Larger</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="slide-reveal"
            aria-label="Slide reveal comparison"
            className="flex items-center gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm">Slide Reveal</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};
