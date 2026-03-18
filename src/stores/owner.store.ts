import { create } from "zustand";
import { OwnerProfileType, ParkingLotType } from "@/types/owner";
import { getOwnerProfile, getOwnerParkingLots } from "@/services/ownerService";

interface OwnerState {
  profile: OwnerProfileType | null;
  parkingLots: ParkingLotType[];
  isLoadingLots: boolean;
  
  // Actions
  fetchProfile: (id: string) => Promise<void>;
  fetchParkingLots: () => Promise<void>;
}

export const useOwnerStore = create<OwnerState>((set, get) => ({
  profile: null,
  parkingLots: [],
  isLoadingLots: false,

  fetchProfile: async (id: string) => {
    try {
      const data = await getOwnerProfile(id);
      set({ profile: data });
    } catch (error) {
      console.error("Failed to load profile", error);
    }
  },

  fetchParkingLots: async () => {
    // Nếu đã load rồi thì bỏ qua để tối ưu
    if (get().parkingLots.length > 0) return; 

    set({ isLoadingLots: true });
    try {
      const lots = await getOwnerParkingLots();
      set({ parkingLots: lots, isLoadingLots: false });
    } catch (error) {
      console.error("Failed to load parking lots", error);
      set({ isLoadingLots: false });
    }
  }
}));
