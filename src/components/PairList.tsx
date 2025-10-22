import { useEffect } from 'react';
import { Info, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { scorePairs } from '@/lib/pairScoring';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export const PairList = () => {
  const { images, candidates, setCandidates, selectedPair, setSelectedPair } = useAppStore();

  useEffect(() => {
    if (images.length >= 2 && images.every(img => img.metrics)) {
      const pairs = scorePairs(images);
      setCandidates(pairs);
      
      // Auto-select best pair if confidence is high
      if (pairs.length > 0 && pairs[0].sceneSimilarity >= 0.75) {
        setSelectedPair(pairs[0]);
      }
    }
  }, [images, setCandidates, setSelectedPair]);

  if (images.length < 2 || images.some(img => !img.metrics)) {
    return null;
  }

  const getBeforeImage = (beforeId: string) => images.find(img => img.id === beforeId);
  const getAfterImage = (afterId: string) => images.find(img => img.id === afterId);

  const hasLowConfidence = candidates.length > 0 && candidates[0].sceneSimilarity < 0.75;

  return (
    <Card className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">AI Picks (Top {candidates.length})</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-5 h-5">
                  <Info className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm max-w-xs">
                  We score pairs based on scene similarity (30%), brightness improvement (20%),
                  sharpness (10%), clutter reduction (10%), chronology (15%), and privacy (-10%).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {hasLowConfidence && (
        <Alert className="mb-6 border-warning/50 bg-warning/10">
          <AlertDescription className="text-sm">
            We're not confident these photos match the same scene. You can still proceed or choose another pair.
          </AlertDescription>
        </Alert>
      )}

      {candidates.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No suitable pairs found. Try uploading more similar images.
        </p>
      ) : (
        <div className="space-y-4">
          {candidates.map((pair, index) => {
            const beforeImg = getBeforeImage(pair.beforeId);
            const afterImg = getAfterImage(pair.afterId);
            
            if (!beforeImg || !afterImg) return null;

            const isSelected = selectedPair?.beforeId === pair.beforeId && 
                              selectedPair?.afterId === pair.afterId;

            return (
              <button
                key={`${pair.beforeId}-${pair.afterId}`}
                onClick={() => setSelectedPair(pair)}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all text-left
                  ${isSelected 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-border hover:border-primary/50 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnails */}
                  <div className="flex gap-2 flex-shrink-0">
                    <div className="relative">
                      <img
                        src={beforeImg.objectUrl}
                        alt="Before"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
                        Before
                      </span>
                    </div>
                    <div className="relative">
                      <img
                        src={afterImg.objectUrl}
                        alt="After"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
                        After
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Pair {index + 1}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>

                    {/* Confidence bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-medium">
                          {(pair.totalScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={pair.totalScore * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Rationale */}
                    <ul className="space-y-1">
                      {pair.rationale.map((reason, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start">
                          <span className="mr-2">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
};
