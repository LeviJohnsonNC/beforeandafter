# Before/After - AI-Powered Photo Pair Finder

A modern web application that automatically detects the best before/after photo pairs from a batch upload, then generates branded side-by-side comparison images.

## Features

- **Batch Photo Upload**: Drag & drop 4-20 images at once
- **AI Pair Detection**: Automatic scene matching using perceptual hashing
- **Smart Metrics**: Computes brightness, sharpness, entropy, and EXIF timestamps
- **Confidence Scoring**: Ranks pairs based on scene similarity, quality improvements, and chronology
- **Brand Watermarking**: Upload logo with automatic dominant color extraction
- **Custom Positioning**: Choose watermark placement (4 corners)
- **Professional Export**: Download high-quality PNG with labels and branding

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS with custom design system
- **State Management**: Zustand
- **UI Components**: Radix UI (shadcn/ui)
- **Image Processing**: Canvas API, perceptual hashing, EXIF reading

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Build for Production

```bash
npm run build
```

## How It Works

### Image Metrics

For each uploaded image, the app computes:

- **Brightness**: Mean luma (Y) from RGB, normalized 0-1
- **Sharpness**: Laplacian variance, min-max normalized across batch
- **Entropy**: Shannon entropy from grayscale histogram
- **pHash**: 64-bit perceptual hash for scene similarity
- **EXIF**: Extracts capture timestamp if available

### Pair Scoring Algorithm

Each pair receives a confidence score (0-1) based on:

```
totalScore = 0.30 × sceneSimilarity
           + 0.15 × chronologyBonus
           + 0.20 × brightnessIncrease
           + 0.10 × sharpnessIncrease
           + 0.10 × entropyDrop
           - 0.10 × privacyPenalty
```

Top 3 pairs are displayed with confidence bars and rationale bullets.

### Canvas Export

The preview canvas:
- Resizes both images to same height
- Adds 16px gutter between panels
- Places "Before | After" pill labels
- Overlays watermark logo at 60% opacity
- Exports as PNG under 1MB

## Project Structure

```
src/
├── components/
│   ├── Topbar.tsx           # Header with branding
│   ├── UploadZone.tsx       # Drag & drop upload
│   ├── ImageGrid.tsx        # Thumbnail grid with metrics
│   ├── PairList.tsx         # AI candidate pairs
│   ├── BrandingPanel.tsx    # Logo/watermark config
│   └── PreviewCanvas.tsx    # Side-by-side render
├── lib/
│   ├── imageMetrics.ts      # Brightness, sharpness, entropy
│   ├── phash.ts             # Perceptual hashing + Hamming distance
│   ├── pairScoring.ts       # Pair ranking algorithm
│   ├── exif.ts              # EXIF date extraction
│   └── color.ts             # Dominant color detection
├── store/
│   └── useAppStore.ts       # Zustand state management
├── types/
│   └── index.ts             # TypeScript interfaces
└── pages/
    └── Index.tsx            # Main application page
```

## Accessibility

- Full keyboard navigation
- Visible focus states
- ARIA live regions for status updates
- Color contrast ≥ 4.5:1
- Semantic HTML structure

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

## Credits

Built with ❤️ using React, TypeScript, and TailwindCSS
