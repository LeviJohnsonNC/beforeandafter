import { create } from 'zustand';
import { UploadedImage, PairCandidate, BrandingConfig } from '@/types';

interface AppStore {
  images: UploadedImage[];
  isProcessing: boolean;
  candidates: PairCandidate[];
  selectedPair: PairCandidate | null;
  branding: BrandingConfig;
  
  addImages: (images: UploadedImage[]) => void;
  updateImage: (id: string, updates: Partial<UploadedImage>) => void;
  removeImage: (id: string) => void;
  setProcessing: (processing: boolean) => void;
  setCandidates: (candidates: PairCandidate[]) => void;
  setSelectedPair: (pair: PairCandidate | null) => void;
  updateBranding: (branding: Partial<BrandingConfig>) => void;
  reset: () => void;
}

const defaultBranding: BrandingConfig = {
  watermarkPosition: 'bottom-right',
  caption: '',
};

export const useAppStore = create<AppStore>((set) => ({
  images: [],
  isProcessing: false,
  candidates: [],
  selectedPair: null,
  branding: defaultBranding,

  addImages: (images) => set((state) => ({
    images: [...state.images, ...images]
  })),

  updateImage: (id, updates) => set((state) => ({
    images: state.images.map(img => 
      img.id === id ? { ...img, ...updates } : img
    )
  })),

  removeImage: (id) => set((state) => ({
    images: state.images.filter(img => img.id !== id)
  })),

  setProcessing: (processing) => set({ isProcessing: processing }),

  setCandidates: (candidates) => set({ candidates }),

  setSelectedPair: (pair) => set({ selectedPair: pair }),

  updateBranding: (branding) => set((state) => ({
    branding: { ...state.branding, ...branding }
  })),

  reset: () => set({
    images: [],
    isProcessing: false,
    candidates: [],
    selectedPair: null,
    branding: defaultBranding,
  }),
}));
