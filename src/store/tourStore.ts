import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TourType = 'full' | 'booking' | 'page' | null;

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  triggerId?: string;
  action?: 'click' | 'close-dialog';
}

interface TourState {
  isTourActive: boolean;
  currentStep: number;
  tourType: TourType;
  steps: TourStep[];
  initialPathname: string | null;
  startTour: (type: TourType, steps: TourStep[], pathname?: string) => void;
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
      initialPathname: null,

      startTour: (type, steps, pathname) => set({ 
        isTourActive: true, 
        tourType: type, 
        steps, 
        currentStep: 0,
        initialPathname: pathname || null
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
        currentStep: 0,
        initialPathname: null
      }),
    }),
    {
      name: 'gopark-tour-storage',
    }
  )
);

