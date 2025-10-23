import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { ShareableComparison } from '@/lib/comparisonSharing';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comparison: ShareableComparison | null;
}

export function ShareDialog({ open, onOpenChange, comparison }: ShareDialogProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const copyToClipboard = async (text: string, type: 'url' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!comparison) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share Your Comparison</DialogTitle>
          <DialogDescription>
            Your before/after comparison is ready to share! Copy the link or embed code below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Shareable URL */}
          <div className="space-y-2">
            <Label htmlFor="share-url">Shareable Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-url"
                value={comparison.url}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(comparison.url, 'url')}
              >
                {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
              >
                <a href={comparison.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Embed Code */}
          <div className="space-y-2">
            <Label htmlFor="embed-code">Embed Code (for your website)</Label>
            <div className="relative">
              <textarea
                id="embed-code"
                value={comparison.embedCode}
                readOnly
                className="w-full h-32 p-3 font-mono text-xs border rounded-md resize-none bg-muted"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(comparison.embedCode, 'embed')}
              >
                {copiedEmbed ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste this code into your website's HTML to embed the interactive comparison.
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-lg overflow-hidden bg-muted">
              <iframe
                src={comparison.url}
                style={{
                  width: '100%',
                  height: '300px',
                  border: 0,
                  borderRadius: '8px'
                }}
                loading="lazy"
                title="Comparison Preview"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
