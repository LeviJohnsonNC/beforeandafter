import { UploadedImage, PairCandidate } from '@/types';
import { hammingDistance } from './phash';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x / 3600)); // Normalize by 1 hour
}

function computeSceneSimilarity(img1: UploadedImage, img2: UploadedImage): number {
  if (!img1.metrics?.pHash || !img2.metrics?.pHash) return 0;
  
  const distance = hammingDistance(img1.metrics.pHash, img2.metrics.pHash);
  const maxDistance = 64; // 64 bits in hash
  
  return 1 - (distance / maxDistance);
}

function getTimestampDelta(img1: UploadedImage, img2: UploadedImage): number | undefined {
  if (!img1.exif?.takenAt || !img2.exif?.takenAt) return undefined;
  
  const date1 = new Date(img1.exif.takenAt).getTime();
  const date2 = new Date(img2.exif.takenAt).getTime();
  
  return (date2 - date1) / 1000; // seconds
}

function computeRationale(
  sceneSimilarity: number,
  brightnessIncrease: number,
  sharpnessIncrease: number,
  entropyDrop: number,
  timestampDelta: number | undefined,
  privacyPenalty: number
): string[] {
  const rationale: string[] = [];
  
  // Scene similarity
  rationale.push(`Same scene ${sceneSimilarity.toFixed(2)}`);
  
  // Brightness
  if (brightnessIncrease > 0.1) {
    rationale.push(`Cleaner +${brightnessIncrease.toFixed(2)} brightness`);
  } else if (brightnessIncrease < -0.1) {
    rationale.push(`Darker ${brightnessIncrease.toFixed(2)} brightness`);
  }
  
  // Sharpness
  if (sharpnessIncrease > 0.05) {
    rationale.push(`Sharper +${sharpnessIncrease.toFixed(2)}`);
  }
  
  // Entropy (clutter reduction)
  if (entropyDrop > 0.05) {
    rationale.push(`Less clutter +${entropyDrop.toFixed(2)} entropy drop`);
  }
  
  // Timestamp
  if (timestampDelta !== undefined && timestampDelta > 60) {
    rationale.push('Chronology ✓');
  } else if (timestampDelta !== undefined && timestampDelta < -60) {
    rationale.push('Chronology ✗ (reversed)');
  }
  
  // Privacy
  if (privacyPenalty > 0) {
    rationale.push('Faces detected');
  }
  
  return rationale;
}

export function scorePairs(images: UploadedImage[]): PairCandidate[] {
  const candidates: PairCandidate[] = [];
  
  // Generate all possible pairs
  for (let i = 0; i < images.length; i++) {
    for (let j = i + 1; j < images.length; j++) {
      const img1 = images[i];
      const img2 = images[j];
      
      if (!img1.metrics || !img2.metrics) continue;
      
      const sceneSimilarity = computeSceneSimilarity(img1, img2);
      
      // Skip pairs with very low scene similarity
      if (sceneSimilarity < 0.5) continue;
      
      const timestampDelta = getTimestampDelta(img1, img2);
      
      // Determine before/after based on timestamp or brightness
      let beforeImg = img1;
      let afterImg = img2;
      
      if (timestampDelta !== undefined) {
        if (timestampDelta < 0) {
          beforeImg = img2;
          afterImg = img1;
        }
      } else {
        // If no timestamp, assume darker is before
        if (img2.metrics.brightness < img1.metrics.brightness) {
          beforeImg = img2;
          afterImg = img1;
        }
      }
      
      const brightnessIncrease = clamp(
        afterImg.metrics.brightness - beforeImg.metrics.brightness,
        -1,
        1
      );
      
      const sharpnessIncrease = clamp(
        afterImg.metrics.sharpness - beforeImg.metrics.sharpness,
        -1,
        1
      );
      
      const entropyDrop = clamp(
        beforeImg.metrics.entropy - afterImg.metrics.entropy,
        -1,
        1
      );
      
      const timestampBonus = timestampDelta !== undefined 
        ? sigmoid(Math.abs(timestampDelta))
        : 0;
      
      const privacyPenalty = 
        (beforeImg.metrics.hasFaces || afterImg.metrics.hasFaces) ? 0.2 : 0;
      
      const totalScore = 
        0.30 * sceneSimilarity +
        0.15 * timestampBonus +
        0.20 * Math.max(0, brightnessIncrease) +
        0.10 * Math.max(0, sharpnessIncrease) +
        0.10 * Math.max(0, entropyDrop) -
        0.10 * privacyPenalty;
      
      const rationale = computeRationale(
        sceneSimilarity,
        brightnessIncrease,
        sharpnessIncrease,
        entropyDrop,
        timestampDelta,
        privacyPenalty
      );
      
      candidates.push({
        beforeId: beforeImg.id,
        afterId: afterImg.id,
        sceneSimilarity,
        brightnessIncrease,
        sharpnessIncrease,
        entropyDrop,
        timestampDelta,
        privacyPenalty,
        totalScore: clamp(totalScore, 0, 1),
        rationale,
      });
    }
  }
  
  // Sort by score and return top 3
  return candidates
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3);
}
