// Improved perceptual hash implementation
// Returns a 256-bit hash as a hex string (16x16 for better precision)

export function computePHash(imageData: ImageData): string {
  const size = 32; // Use 32x32 for DCT
  const smallerSize = 16; // Reduce to 16x16 for hash (256 bits)
  
  // Step 1: Resize to 32x32 and convert to grayscale
  const grayscale = resizeAndGrayscale(imageData, size);
  
  // Step 2: Compute DCT
  const dct = computeDCT(grayscale, size);
  
  // Step 3: Extract top-left 8x8 (excluding DC component)
  const reduced: number[] = [];
  for (let y = 0; y < smallerSize; y++) {
    for (let x = 0; x < smallerSize; x++) {
      reduced.push(dct[y * size + x]);
    }
  }
  
  // Step 4: Compute median
  const sorted = [...reduced].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // Step 5: Create binary hash
  let hash = '';
  for (let i = 0; i < reduced.length; i++) {
    hash += reduced[i] > median ? '1' : '0';
  }
  
  // Convert binary to hex
  let hexHash = '';
  for (let i = 0; i < hash.length; i += 4) {
    const nibble = hash.substr(i, 4);
    hexHash += parseInt(nibble, 2).toString(16);
  }
  
  return hexHash.padStart(64, '0'); // 256 bits = 64 hex chars
}

function resizeAndGrayscale(imageData: ImageData, targetSize: number): number[] {
  const { width, height, data } = imageData;
  const result: number[] = [];
  
  const xRatio = width / targetSize;
  const yRatio = height / targetSize;
  
  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      // Sample from original image
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const idx = (srcY * width + srcX) * 4;
      
      // Convert to grayscale (simple average)
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      result.push(gray);
    }
  }
  
  return result;
}

function computeDCT(signal: number[], size: number): number[] {
  const result: number[] = new Array(size * size).fill(0);
  
  // 2D DCT
  for (let v = 0; v < size; v++) {
    for (let u = 0; u < size; u++) {
      let sum = 0;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const pixel = signal[y * size + x];
          sum += pixel *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * size)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * size));
        }
      }
      
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      result[v * size + u] = (cu * cv * sum) / 4;
    }
  }
  
  return result;
}

export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error('Hashes must be the same length');
  }
  
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const a = parseInt(hash1[i], 16);
    const b = parseInt(hash2[i], 16);
    const xor = a ^ b;
    
    // Count set bits
    let bits = xor;
    while (bits > 0) {
      distance += bits & 1;
      bits >>= 1;
    }
  }
  
  return distance;
}
