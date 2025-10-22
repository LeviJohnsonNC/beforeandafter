import { computePHash } from './phash';

export interface ImageMetrics {
  brightness: number;
  sharpness: number;
  entropy: number;
  pHash: string;
  colorHistogram: number[];
  hasFaces?: boolean;
}

export async function computeImageMetrics(file: File): Promise<ImageMetrics> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        // Use reasonable size for processing (max 800px)
        const maxSize = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        
        const brightness = computeBrightness(imageData);
        const sharpness = computeSharpness(imageData);
        const entropy = computeEntropy(imageData);
        const pHash = computePHash(imageData);
        const colorHistogram = computeColorHistogram(imageData);
        
        URL.revokeObjectURL(url);
        
        resolve({
          brightness,
          sharpness,
          entropy,
          pHash,
          colorHistogram,
          hasFaces: false, // MVP: not implemented
        });
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

function computeBrightness(imageData: ImageData): number {
  const { data, width, height } = imageData;
  let sum = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    // Convert to luma (Y)
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    sum += luma;
  }
  
  const pixelCount = width * height;
  const avgBrightness = sum / pixelCount;
  
  // Normalize to 0..1
  return avgBrightness / 255;
}

function computeSharpness(imageData: ImageData): number {
  const { data, width, height } = imageData;
  
  // Convert to grayscale first
  const gray: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    gray.push(avg);
  }
  
  // Apply Laplacian operator
  let variance = 0;
  let count = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Laplacian kernel
      const laplacian =
        -1 * gray[idx - width - 1] + -1 * gray[idx - width] + -1 * gray[idx - width + 1] +
        -1 * gray[idx - 1] + 8 * gray[idx] + -1 * gray[idx + 1] +
        -1 * gray[idx + width - 1] + -1 * gray[idx + width] + -1 * gray[idx + width + 1];
      
      variance += laplacian * laplacian;
      count++;
    }
  }
  
  return variance / count;
}

function computeEntropy(imageData: ImageData): number {
  const { data } = imageData;
  const histogram: number[] = new Array(256).fill(0);
  
  // Build histogram from grayscale values
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
    histogram[gray]++;
  }
  
  const total = data.length / 4;
  let entropy = 0;
  
  for (let i = 0; i < histogram.length; i++) {
    if (histogram[i] > 0) {
      const p = histogram[i] / total;
      entropy -= p * Math.log2(p);
    }
  }
  
  // Normalize to 0..1 (max entropy for 256 levels is 8 bits)
  return entropy / 8;
}

function computeColorHistogram(imageData: ImageData): number[] {
  const { data } = imageData;
  const hBins = 18; // 20-degree bins for hue
  const sBins = 3;  // 3 bins for saturation
  const vBins = 3;  // 3 bins for value
  
  const histogram = new Array(hBins + sBins + vBins).fill(0);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    
    // Convert RGB to HSV
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    // Hue
    let h = 0;
    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
      } else if (max === g) {
        h = ((b - r) / delta + 2) / 6;
      } else {
        h = ((r - g) / delta + 4) / 6;
      }
    }
    
    // Saturation
    const s = max === 0 ? 0 : delta / max;
    
    // Value
    const v = max;
    
    // Bin the values
    const hBin = Math.floor(h * hBins);
    const sBin = Math.floor(s * sBins);
    const vBin = Math.floor(v * vBins);
    
    histogram[Math.min(hBin, hBins - 1)]++;
    histogram[hBins + Math.min(sBin, sBins - 1)]++;
    histogram[hBins + sBins + Math.min(vBin, vBins - 1)]++;
  }
  
  // Normalize histogram
  const total = data.length / 4;
  return histogram.map(count => count / total);
}

export function normalizeMetrics(
  images: Array<{ metrics?: ImageMetrics }>
): void {
  const sharpnessValues = images
    .map(img => img.metrics?.sharpness ?? 0)
    .filter(v => v > 0);
  
  if (sharpnessValues.length === 0) return;
  
  const minSharpness = Math.min(...sharpnessValues);
  const maxSharpness = Math.max(...sharpnessValues);
  const range = maxSharpness - minSharpness;
  
  if (range === 0) {
    // All images have same sharpness
    images.forEach(img => {
      if (img.metrics) {
        img.metrics.sharpness = 0.5;
      }
    });
    return;
  }
  
  // Normalize sharpness to 0..1
  images.forEach(img => {
    if (img.metrics && img.metrics.sharpness > 0) {
      img.metrics.sharpness = (img.metrics.sharpness - minSharpness) / range;
    }
  });
}
