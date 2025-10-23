import { Columns2, PanelLeft, PanelRight, SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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

      {/* Layout Selection - Icon Only with Tooltips */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Image Layout</Label>
        <TooltipProvider>
          <ToggleGroup
            type="single"
            value={branding.layout}
            onValueChange={(value) => {
              if (value) updateBranding({ layout: value as typeof branding.layout });
            }}
            className="justify-start gap-1"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="equal"
                  aria-label="Equal size"
                  className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <Columns2 className="w-5 h-5" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Equal Size</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="before-larger"
                  aria-label="Before image larger"
                  className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <PanelLeft className="w-5 h-5" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Before Larger</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="after-larger"
                  aria-label="After image larger"
                  className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <PanelRight className="w-5 h-5" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>After Larger</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="slide-reveal"
                  aria-label="Slide reveal comparison"
                  className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Slide Reveal</p>
              </TooltipContent>
            </Tooltip>
          </ToggleGroup>
        </TooltipProvider>
      </div>
    </div>
  );
};
