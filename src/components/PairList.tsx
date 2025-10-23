import { useEffect, useState } from 'react';
import { Info, CheckCircle2, AlertTriangle, ChevronDown, Sparkles, Sun, Focus, Palette, ScanEye, Clock, Bot } from 'lucide-react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

export const PairList = () => {
  const { images, candidates, setCandidates, selectedPair, setSelectedPair } = useAppStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedPairs, setExpandedPairs] = useState<Set<string>>(new Set());

  const toggleExpanded = (pairId: string) => {
    setExpandedPairs(prev => {
      const next = new Set(prev);
      if (next.has(pairId)) {
        next.delete(pairId);
      } else {
        next.add(pairId);
      }
      return next;
    });
  };

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
          <h2 className="text-xl font-semibold">Before / After Matches (Top {candidates.length})</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-5 h-5">
                  <Info className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm max-w-xs">
                  Pairs are identified using a multi-stage computer vision pipeline: (1) 256-bit perceptual hashing with DCT for scene matching, (2) HSV histogram analysis across 162 color bins, and (3) spatial analysis using brightness and entropy metrics. The algorithm weights structural similarity (60%), color (30%), and spatial features (10%). Quality assessment uses Laplacian edge detection for sharpness and ITU-R BT.601 for luminance. High-scoring candidates are verified by Google's Gemini 2.5 Flash vision model, with a three-tier confidence system (80%+ high, 70-79% medium, &lt;70% rejected).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {isAnalyzing && (
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm">🧠 Running computer vision analysis...</span>
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
            const beforeImg = getBeforeImage(pair.beforeId);
            const afterImg = getAfterImage(pair.afterId);
            
            if (!beforeImg || !afterImg) return null;

            const isSelected = selectedPair?.beforeId === pair.beforeId && 
                              selectedPair?.afterId === pair.afterId;
            const pairId = `${pair.beforeId}-${pair.afterId}`;
            const isExpanded = expandedPairs.has(pairId);

            return (
              <div
                key={pairId}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all
                  ${isSelected 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-border hover:border-primary/50 hover:shadow-sm'
                  }
                `}
              >
                <button
                  onClick={() => setSelectedPair(pair)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-4">
                     {/* Thumbnails */}
                    <div className="flex gap-2 flex-shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <img
                          src={beforeImg.objectUrl}
                          alt="Before"
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <span className="text-xs text-muted-foreground">
                          Before
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <img
                          src={afterImg.objectUrl}
                          alt="After"
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <span className="text-xs text-muted-foreground">
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
                      <div className="mb-3">
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

                      {/* Enhanced Metrics Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Scene Match */}
                        {pair.sceneSimilarity >= 1.0 ? (
                          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 justify-start">
                            <CheckCircle2 className="w-3 h-3 mr-1.5 flex-shrink-0" />
                            <span className="truncate">Scene Match</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="justify-start">
                            <ScanEye className="w-3 h-3 mr-1.5 flex-shrink-0 opacity-70" />
                            <span className="truncate">Scene</span>
                          </Badge>
                        )}

                        {/* Color Match */}
                        {pair.colorSimilarity >= 1.0 ? (
                          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 justify-start">
                            <CheckCircle2 className="w-3 h-3 mr-1.5 flex-shrink-0" />
                            <span className="truncate">Color Match</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="justify-start">
                            <Palette className="w-3 h-3 mr-1.5 flex-shrink-0 opacity-70" />
                            <span className="truncate">Color {(pair.colorSimilarity * 100).toFixed(0)}%</span>
                          </Badge>
                        )}

                        {/* Clutter Reduction */}
                        {pair.entropyDrop > 0 && (
                          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 justify-start">
                            <Sparkles className="w-3 h-3 mr-1.5 flex-shrink-0" />
                            <span className="truncate">Cleaner</span>
                          </Badge>
                        )}

                        {/* Brightness Increase */}
                        {pair.brightnessIncrease > 0 && (
                          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 justify-start">
                            <Sun className="w-3 h-3 mr-1.5 flex-shrink-0" />
                            <span className="truncate">Brighter +{pair.brightnessIncrease.toFixed(2)}</span>
                          </Badge>
                        )}

                        {/* Sharpness Increase */}
                        {pair.sharpnessIncrease > 0 && (
                          <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 justify-start">
                            <Focus className="w-3 h-3 mr-1.5 flex-shrink-0" />
                            <span className="truncate">Sharper</span>
                          </Badge>
                        )}

                        {/* AI Verified */}
                        {pair.aiVerified && (
                          <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 justify-start">
                            <Bot className="w-3 h-3 mr-1.5 flex-shrink-0" />
                            <span className="truncate">AI Verified</span>
                          </Badge>
                        )}

                        {/* Timeline */}
                        {pair.timestampDelta !== undefined && (
                          <Badge variant="secondary" className="justify-start">
                            <Clock className="w-3 h-3 mr-1.5 flex-shrink-0" />
                            <span className="truncate">Timeline ✓</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Collapsible Details */}
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(pairId)}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-2 h-8 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Show Details</span>
                      <ChevronDown 
                        className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 pl-4">
                    {pair.aiReasoning && (
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        {pair.aiReasoning}
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
