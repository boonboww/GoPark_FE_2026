import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TourType = 'full' | 'booking' | 'page' | null;

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TourState {
  isTourActive: boolean;
  currentStep: number;
  tourType: TourType;
  steps: TourStep[];
  startTour: (type: TourType, steps: TourStep[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  stopTour: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      isTourActive: false,
      currentStep: 0,
      tourType: null,
      steps: [],

      startTour: (type, steps) => set({ 
        isTourActive: true, 
        tourType: type, 
        steps, 
        currentStep: 0 
      }),

      nextStep: () => set((state) => ({ 
        currentStep: Math.min(state.currentStep + 1, state.steps.length - 1) 
      })),

      prevStep: () => set((state) => ({ 
        currentStep: Math.max(state.currentStep - 1, 0) 
      })),

      stopTour: () => set({ 
        isTourActive: false, 
        tourType: null, 
        steps: [], 
        currentStep: 0 
      }),
    }),
    {
      name: 'gopark-tour-storage',
    }
  )
);

