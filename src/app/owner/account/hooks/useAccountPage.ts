import { useState, useEffect } from "react";
import { useOwnerStore } from "@/stores/owner.store";
import { useAuthStore } from "@/stores/auth.store";

export function useAccountPage() {
  // 1. Kéo data và actions từ Zustand Store
  const { profile, parkingLots, isLoadingLots, fetchProfile, fetchParkingLots } = useOwnerStore();
  const { user } = useAuthStore();
  
  // 2. Local State cho UI
  const [showParkingLots, setShowParkingLots] = useState(false);

  // 3. Logic Side Effects
  useEffect(() => {
    // Chỉ fetch khi có userId hợp lệ và không phải chuỗi "undefined"
    if (!profile && user?.id && user.id !== "undefined") {
      console.log("Fetching profile for userId:", user.id);
      fetchProfile(user.id);
    }
  }, [profile, fetchProfile, user?.id]);

  // 4. Logic UI Handler
  const handleViewParkingLots = async () => {
    if (!showParkingLots && parkingLots.length === 0) {
      await fetchParkingLots();
    }
    setShowParkingLots(!showParkingLots);
  };

  return {
    profile,
    parkingLots,
    showParkingLots,
    isLoadingLots,
    handleViewParkingLots
  };
}
