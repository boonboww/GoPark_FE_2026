import { create } from "zustand";

// TODO: thay bằng id thật từ auth khi có login
export const TEMP_OWNER_ID = "019cd647-122f-7035-b07c-6f8b13b982d1";

/**
 * Customer UI State (Zustand)
 * Chỉ chứa client/UI state — không fetch API trực tiếp (việc đó là của React Query).
 */
interface CustomerUIState {
  /** ID bãi đỗ xe đang xem. null = chưa chọn (chờ load danh sách bãi) */
  lotId: number | null;
  /** Text trong ô tìm kiếm, dùng để filter client-side */
  searchText: string;

  // Actions
  setLotId: (id: number) => void;
  setSearchText: (text: string) => void;
}

export const useCustomerStore = create<CustomerUIState>((set) => ({
  lotId: null,
  searchText: "",

  setLotId: (id) => set({ lotId: id }),
  setSearchText: (text) => set({ searchText: text }),
}));

