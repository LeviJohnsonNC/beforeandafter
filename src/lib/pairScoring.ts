import { UploadedImage, PairCandidate } from '@/types';
import { hammingDistance } from './phash';
import { verifySceneMatch } from './aiVerification';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x / 3600)); // Normalize by 1 hour
}

function computeSceneSimilarity(img1: UploadedImage, img2: UploadedImage): number {
  if (!img1.metrics?.pHash || !img2.metrics?.pHash) return 0;
  
  const distance = hammingDistance(img1.metrics.pHash, img2.metrics.pHash);
  const maxDistance = 256; // 256 bits in hash (16x16)
  
  return 1 - (distance / maxDistance);
}

function computeColorSimilarity(img1: UploadedImage, img2: UploadedImage): number {
  if (!img1.metrics?.colorHistogram || !img2.metrics?.colorHistogram) return 0;
  
  const hist1 = img1.metrics.colorHistogram;
  const hist2 = img2.metrics.colorHistogram;
  
  // Compute histogram intersection (similarity measure)
  let intersection = 0;
  for (let i = 0; i < hist1.length; i++) {
    intersection += Math.min(hist1[i], hist2[i]);
  }
  
  return intersection; // Already normalized 0..1
}

function computeSpatialSimilarity(img1: UploadedImage, img2: UploadedImage): number {
  if (!img1.metrics || !img2.metrics) return 0;
  
  // Compare brightness distribution in a 3x3 grid
  // This helps distinguish different room layouts even if overall brightness is similar
  // For MVP, we use a simplified proxy based on entropy and brightness correlation
  
  const brightnessDiff = Math.abs(img1.metrics.brightness - img2.metrics.brightness);
  const entropyDiff = Math.abs(img1.metrics.entropy - img2.metrics.entropy);
  
  // If both brightness and entropy are very similar, spatial layout is likely similar
  const similarity = 1 - (brightnessDiff * 0.5 + entropyDiff * 0.5);
  
  return clamp(similarity, 0, 1);
}

function getTimestampDelta(img1: UploadedImage, img2: UploadedImage): number | undefined {
  if (!img1.exif?.takenAt || !img2.exif?.takenAt) return undefined;
  
  const date1 = new Date(img1.exif.takenAt).getTime();
  const date2 = new Date(img2.exif.takenAt).getTime();
  
  return (date2 - date1) / 1000; // seconds
}

function computeRationale(
  sceneSimilarity: number,
  colorSimilarity: number,
  spatialSimilarity: number,
  brightnessIncrease: number,
  sharpnessIncrease: number,
  entropyDrop: number,
  timestampDelta: number | undefined,
  privacyPenalty: number
): string[] {
  const rationale: string[] = [];
  
  // Scene similarity (combined)
  const combinedScene = (sceneSimilarity * 0.6 + colorSimilarity * 0.3 + spatialSimilarity * 0.1);
  rationale.push(`Scene match ${(combinedScene * 100).toFixed(0)}%`);
  
  // Color similarity
  if (colorSimilarity >= 0.75) {
    rationale.push(`Color match ${(colorSimilarity * 100).toFixed(0)}%`);
  }
  
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
    rationale.push(`Less clutter -${entropyDrop.toFixed(2)} entropy`);
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

export async function scorePairs(images: UploadedImage[]): Promise<PairCandidate[]> {
  console.log(`\n🔍 === DIAGNOSTIC: Starting pair analysis for ${images.length} images ===`);
  images.forEach((img, idx) => {
    console.log(`  Image ${idx + 1}: ${img.file.name} (ID: ${img.id})`);
    console.log(`    Brightness: ${img.metrics?.brightness.toFixed(3)}, Timestamp: ${img.exif?.takenAt || 'none'}`);
  });

  const candidates: PairCandidate[] = [];
  let totalPairsEvaluated = 0;
  let pairsPassingThreshold = 0;
  let pairsRejectedByThreshold = 0;
  
  // Generate all possible pairs
  for (let i = 0; i < images.length; i++) {
    for (let j = i + 1; j < images.length; j++) {
      const img1 = images[i];
      const img2 = images[j];
      
      if (!img1.metrics || !img2.metrics) continue;
      
      totalPairsEvaluated++;
      
      const sceneSimilarity = computeSceneSimilarity(img1, img2);
      const colorSimilarity = computeColorSimilarity(img1, img2);
      const spatialSimilarity = computeSpatialSimilarity(img1, img2);
      
      // Combined scene matching score (structure + color + spatial)
      const combinedSceneScore = 
        0.60 * sceneSimilarity +
        0.30 * colorSimilarity +
        0.10 * spatialSimilarity;
      
      console.log(`\n📊 Pair ${totalPairsEvaluated}: "${img1.file.name}" vs "${img2.file.name}"`);
      console.log(`  IDs: ${img1.id} vs ${img2.id}`);
      console.log(`  Scene Similarity: ${sceneSimilarity.toFixed(3)} (pHash)`);
      console.log(`  Color Similarity: ${colorSimilarity.toFixed(3)}`);
      console.log(`  Spatial Similarity: ${spatialSimilarity.toFixed(3)}`);
      console.log(`  Combined Score: ${combinedSceneScore.toFixed(3)} (threshold: 0.50)`);
      
      // DIAGNOSTIC: Lowered threshold to 0.50 to see more candidates
      if (combinedSceneScore < 0.50) {
        console.log(`  ❌ REJECTED: Below threshold`);
        pairsRejectedByThreshold++;
        continue;
      }
      
      console.log(`  ✅ PASSED threshold, will evaluate improvements...`);
      pairsPassingThreshold++;
      
      const timestampDelta = getTimestampDelta(img1, img2);
      
      // Determine before/after based on timestamp or brightness
      let beforeImg = img1;
      let afterImg = img2;
      let orderingMethod = 'default';
      
      console.log(`  🔄 Ordering pair: "${img1.file.name}" vs "${img2.file.name}"`);
      console.log(`    img1 brightness: ${img1.metrics.brightness.toFixed(3)}, timestamp: ${img1.exif?.takenAt || 'none'}`);
      console.log(`    img2 brightness: ${img2.metrics.brightness.toFixed(3)}, timestamp: ${img2.exif?.takenAt || 'none'}`);
      
      if (timestampDelta !== undefined) {
        // Use timestamp if available (positive delta = img2 is later)
        if (timestampDelta > 0) {
          // img2 is later, so img1 = before, img2 = after
          beforeImg = img1;
          afterImg = img2;
          orderingMethod = 'timestamp (img2 later)';
        } else {
          // img1 is later, so img2 = before, img1 = after
          beforeImg = img2;
          afterImg = img1;
          orderingMethod = 'timestamp (img1 later)';
        }
        console.log(`    timestampDelta: ${timestampDelta.toFixed(0)}s, method: ${orderingMethod}`);
      } else {
        // No timestamp - use brightness: BRIGHTER = AFTER (cleaner)
        if (img1.metrics.brightness > img2.metrics.brightness) {
          // img1 is brighter = after, img2 is darker = before
          beforeImg = img2;
          afterImg = img1;
          orderingMethod = 'brightness (img1 brighter)';
        } else {
          // img2 is brighter = after, img1 is darker = before
          beforeImg = img1;
          afterImg = img2;
          orderingMethod = 'brightness (img2 brighter)';
        }
        console.log(`    No timestamp, using brightness. Method: ${orderingMethod}`);
      }
      
      console.log(`    Result: before="${beforeImg.file.name}" (${beforeImg.metrics.brightness.toFixed(3)}), after="${afterImg.file.name}" (${afterImg.metrics.brightness.toFixed(3)})`);
      console.log(`    Ordering method: ${orderingMethod}`);
      
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
      
      // Rebalanced scoring: 50% scene matching, 50% improvements
      const totalScore = 
        0.50 * combinedSceneScore +
        0.15 * timestampBonus +
        0.15 * Math.max(0, brightnessIncrease) +
        0.10 * Math.max(0, sharpnessIncrease) +
        0.10 * Math.max(0, entropyDrop) -
        0.10 * privacyPenalty;
      
      // Determine confidence tier
      let confidenceTier: 'high' | 'medium' | 'low';
      if (combinedSceneScore >= 0.85) {
        confidenceTier = 'high';
      } else if (combinedSceneScore >= 0.70) {
        confidenceTier = 'medium';
      } else {
        confidenceTier = 'low';
      }
      
      const rationale = computeRationale(
        sceneSimilarity,
        colorSimilarity,
        spatialSimilarity,
        brightnessIncrease,
        sharpnessIncrease,
        entropyDrop,
        timestampDelta,
        privacyPenalty
      );
      
      console.log(`  💯 Candidate Score: ${totalScore.toFixed(3)} (confidence: ${confidenceTier})`);
      
      candidates.push({
        beforeId: beforeImg.id,
        afterId: afterImg.id,
        sceneSimilarity,
        colorSimilarity,
        spatialSimilarity,
        brightnessIncrease,
        sharpnessIncrease,
        entropyDrop,
        timestampDelta,
        privacyPenalty,
        totalScore: clamp(totalScore, 0, 1),
        confidenceTier,
        rationale,
      });
    }
  }
  
  console.log(`\n📈 === PRE-AI FILTERING SUMMARY ===`);
  console.log(`  Total pairs evaluated: ${totalPairsEvaluated}`);
  console.log(`  Pairs passing threshold (≥0.50): ${pairsPassingThreshold}`);
  console.log(`  Pairs rejected by threshold: ${pairsRejectedByThreshold}`);
  console.log(`  Candidates for AI verification: ${candidates.length}`);
  
  // Sort by score
  const sortedCandidates = candidates.sort((a, b) => b.totalScore - a.totalScore);
  
  if (sortedCandidates.length === 0) {
    console.log(`\n✅ === FINAL RESULTS ===`);
    console.log(`  No candidates found after perceptual filtering`);
    return [];
  }
  
  console.log(`\n🤖 === AI VERIFICATION PHASE ===`);
  console.log(`  Sending top ${Math.min(6, sortedCandidates.length)} candidates to AI for verification`);
  
  // MANDATORY AI verification for ALL top candidates (not just medium confidence)
  const verifiedCandidates = await Promise.all(
    sortedCandidates.slice(0, 6).map(async (candidate, idx) => {
      // Verify ALL top 6 candidates regardless of confidence tier
      const beforeImg = images.find(img => img.id === candidate.beforeId);
      const afterImg = images.find(img => img.id === candidate.afterId);
      
      if (beforeImg && afterImg) {
        console.log(`  Verifying candidate ${idx + 1}: "${beforeImg.file.name}" vs "${afterImg.file.name}" (score: ${candidate.totalScore.toFixed(2)}, tier: ${candidate.confidenceTier})`);
        const aiResult = await verifySceneMatch(beforeImg, afterImg);
        
        if (aiResult) {
          candidate.aiVerified = aiResult.match;
          candidate.aiReasoning = aiResult.reasoning;
          
          console.log(`    AI Result: ${aiResult.match ? '✅ MATCH' : '❌ NO MATCH'} (confidence: ${aiResult.confidence}%)`);
          console.log(`    Reasoning: ${aiResult.reasoning}`);
          
          // Use AI's determination of before/after order
          if (aiResult.match && aiResult.image1IsBefore !== undefined) {
            // beforeImg was passed as image1, so if AI says image1 is NOT before, swap them
            if (!aiResult.image1IsBefore) {
              console.log(`    🔄 AI says order is REVERSED, swapping: "${beforeImg.file.name}" ↔ "${afterImg.file.name}"`);
              const tempId = candidate.beforeId;
              candidate.beforeId = candidate.afterId;
              candidate.afterId = tempId;
              // Recalculate improvement metrics with swapped order
              candidate.brightnessIncrease = -candidate.brightnessIncrease;
              candidate.sharpnessIncrease = -candidate.sharpnessIncrease;
              candidate.entropyDrop = -candidate.entropyDrop;
            } else {
              console.log(`    ✅ AI confirms order is CORRECT`);
            }
          }
          
          // Three-tier AI scoring system
          if (aiResult.match && aiResult.confidence >= 80) {
            // Tier 1: High confidence (80-100%) - boost score and upgrade to high
            const aiBoost = (aiResult.confidence / 100) * 0.15;
            candidate.totalScore = Math.min(1, candidate.totalScore + aiBoost);
            candidate.confidenceTier = 'high';
            console.log(`    ✅ Tier 1: Boosted score to ${candidate.totalScore.toFixed(2)}, upgraded to HIGH`);
          } else if (aiResult.match && aiResult.confidence >= 70) {
            // Tier 2: Medium confidence (70-79%) - keep original score and tier
            console.log(`    ✅ Tier 2: Kept original score ${candidate.totalScore.toFixed(2)}, tier: ${candidate.confidenceTier}`);
          } else {
            // Tier 3: Low confidence (<70%) or no match - reject completely
            candidate.totalScore = 0;
            console.log(`    ❌ Tier 3: REJECTED`);
          }
        } else {
          console.log(`    ⚠️ AI verification failed - keeping original score`);
        }
      }
      
      return candidate;
    })
  );
  
  // Filter out rejected pairs and return top 3
  const finalCandidates = verifiedCandidates
    .filter(c => c.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3);
  
  console.log(`\n✅ === FINAL RESULTS ===`);
  console.log(`  Accepted ${finalCandidates.length} candidates after AI verification`);
  finalCandidates.forEach((c, idx) => {
    const beforeImg = images.find(img => img.id === c.beforeId);
    const afterImg = images.find(img => img.id === c.afterId);
    console.log(`  ${idx + 1}. "${beforeImg?.file.name}" → "${afterImg?.file.name}" (score: ${c.totalScore.toFixed(2)})`);
  });
  
  return finalCandidates;
}
