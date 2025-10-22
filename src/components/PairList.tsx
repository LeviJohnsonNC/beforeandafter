import { useEffect, useState } from 'react';
import { Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { scorePairs } from '@/lib/pairScoring';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export const PairList = () => {
  const { images, candidates, setCandidates, selectedPair, setSelectedPair } = useAppStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const analyzePairs = async () => {
      if (images.length >= 2 && images.every(img => img.metrics)) {
        setIsAnalyzing(true);
        const pairs = await scorePairs(images);
        setCandidates(pairs);
        setIsAnalyzing(false);
        
        // Auto-select best pair if confidence is high
        if (pairs.length > 0 && pairs[0].confidenceTier === 'high') {
          setSelectedPair(pairs[0]);
        }
      }
    };
    
    analyzePairs();
  }, [images, setCandidates, setSelectedPair]);

  if (images.length < 2 || images.some(img => !img.metrics)) {
    return null;
  }

  const getBeforeImage = (beforeId: string) => images.find(img => img.id === beforeId);
  const getAfterImage = (afterId: string) => images.find(img => img.id === afterId);

  const hasLowConfidence = candidates.length > 0 && candidates[0].confidenceTier === 'medium';

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
                  Pairs are scored using perceptual hashing, color histograms, and spatial analysis.
                  Uncertain pairs are verified by AI vision to ensure they show the same location.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {isAnalyzing && (
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm">Analyzing scenes with AI...</span>
        </div>
      )}

      {hasLowConfidence && !isAnalyzing && (
        <Alert className="mb-6 border-warning/50 bg-warning/10">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <AlertDescription className="text-sm">
            Medium confidence match detected. Verify these photos are from the same scene before downloading.
          </AlertDescription>
        </Alert>
      )}

      {!isAnalyzing && candidates.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No suitable pairs found. Try uploading more similar images.
        </p>
      ) : (
        <div className="space-y-4">
          {candidates.map((pair, index) => {
            // Swap to fix display order
            const beforeImg = getBeforeImage(pair.afterId);
            const afterImg = getAfterImage(pair.beforeId);
            
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
                      <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/50 text-white text-[10px] rounded max-w-[72px] truncate">
                        {beforeImg.file.name}
                      </div>
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
                      <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/50 text-white text-[10px] rounded max-w-[72px] truncate">
                        {afterImg.file.name}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          Pair {index + 1}
                        </span>
                        {pair.confidenceTier === 'high' && (
                          <Badge variant="default" className="bg-green-600">
                            High
                          </Badge>
                        )}
                        {pair.confidenceTier === 'medium' && (
                          <Badge variant="secondary">
                            Medium
                          </Badge>
                        )}
                        {pair.aiVerified && (
                          <Badge variant="default" className="bg-blue-600">
                            AI Verified ✓
                          </Badge>
                        )}
                      </div>
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
                      {pair.aiReasoning && (
                        <li className="text-xs text-blue-700 dark:text-blue-400 flex items-start mt-2">
                          <span className="mr-2">🤖</span>
                          <span>{pair.aiReasoning}</span>
                        </li>
                      )}
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
