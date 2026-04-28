import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConfigState {
  locationEnabled: boolean;
  notificationsEnabled: boolean;
  biometricEnabled: boolean;
  privacyMode: boolean;
}

interface ConfigActions {
  setLocationEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setPrivacyMode: (enabled: boolean) => void;
}

export const useConfigStore = create<ConfigState & ConfigActions>()(
  persist(
    (set) => ({
      // Initial state
      locationEnabled: true,
      notificationsEnabled: true,
      biometricEnabled: false,
      privacyMode: false,

      // Actions
      setLocationEnabled: (enabled) => set({ locationEnabled: enabled }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),
      setPrivacyMode: (enabled) => set({ privacyMode: enabled }),
    }),
    {
      name: "gopark-config-storage", // Key in localStorage
    }
  )
);
