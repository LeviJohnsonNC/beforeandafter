export type UploadedImage = {
  id: string;
  file: File;
  objectUrl: string;
  exif?: { takenAt?: string }; // ISO if available
  metrics?: {
    brightness: number;     // 0..1
    sharpness: number;      // 0..1 (Laplacian variance normalized)
    entropy: number;        // 0..1
    pHash: string;          // 256-bit hex (16x16)
    colorHistogram: number[]; // HSV histogram [H bins, S bins, V bins]
    hasFaces?: boolean;     // MVP: false or undefined
  };
};

export type PairCandidate = {
  beforeId: string;
  afterId: string;
  sceneSimilarity: number;     // 0..1 via pHash distance
  colorSimilarity: number;     // 0..1 via histogram comparison
  spatialSimilarity: number;   // 0..1 via grid comparison
  brightnessIncrease: number;  // -1..1
  sharpnessIncrease: number;   // -1..1
  entropyDrop: number;         // -1..1
  timestampDelta?: number;     // seconds (positive = after is later)
  privacyPenalty: number;      // 0 or 0.2 MVP
  totalScore: number;          // 0..1
  confidenceTier: 'high' | 'medium' | 'low'; // based on scene matching
  rationale: string[];         // technical details for UI
  highlightsSummary?: string[]; // user-friendly summary
  aiVerified?: boolean;        // LLM confirmed scene match
  aiReasoning?: string;        // LLM explanation
  image1IsBefore?: boolean;    // AI determined order (true = image1 is before)
};

export type BrandingConfig = {
  logoUrl?: string;
  logoFile?: File;
  dominantColor?: string;
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  caption?: string;
  showLabels: boolean;
  layout: 'equal' | 'before-larger' | 'after-larger';
};

export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
