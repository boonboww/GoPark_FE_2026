import { create } from "zustand";
import { notificationService, SendToRoleDto, SendToUserDto } from "@/services/notification.service";
import { userService } from "@/services/userService";

export interface UserSelectItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

export type NotificationType = "PROMOTIONAL" | "ALERT" | "REMINDER" | "SYSTEM" | "PROMOTION";
export type TargetType = "all" | "role" | "specific" | "ALL";
export type NotificationStatus = "SENT" | "SCHEDULED" | "DRAFT" | "FAILED" | "sent" | "scheduled" | "draft" | "failed" | string;

export interface SentNotification {
  id: string;
  title: string;
  content?: string;
  type: NotificationType;
  targetType?: TargetType;
  targetRole?: string;
  targetUsers?: string[];
  recipientCount: number;
  readCount: number;
  isRead?: boolean;
  readSummary: string;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string;
  readAt?: string | null;
  createdBy: string;
}

interface NotificationFilters {
  searchTerm: string;
  filterType: string;
  filterTarget: string;
  filterStatus: string;
}

interface NotificationUIState {
  notifications: SentNotification[];
  availableUsers: UserSelectItem[];
  filters: NotificationFilters;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setNotifications: (
    notifications: SentNotification[] | ((prev: SentNotification[]) => SentNotification[])
  ) => void;
  setFilters: (filters: Partial<NotificationFilters>) => void;
  clearFilters: () => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchNotifications: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  sendToUser: (data: SendToUserDto) => Promise<void>;
  sendToRole: (data: SendToRoleDto) => Promise<void>;
}

export const useNotificationStore = create<NotificationUIState>((set, get) => ({
  notifications: [],
  availableUsers: [],
  filters: {
    searchTerm: "",
    filterType: "",
    filterTarget: "",
    filterStatus: "",
  },
  currentPage: 1,
  pageSize: 10,
  isLoading: false,
  error: null,

  setNotifications: (updater) =>
    set((state) => ({
      notifications:
        typeof updater === "function" ? updater(state.notifications) : updater,
    })),
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 1, // Reset to first page when filtering
    })),
  clearFilters: () =>
    set({
      filters: {
        searchTerm: "",
        filterType: "",
        filterTarget: "",
        filterStatus: "",
      },
      currentPage: 1,
    }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchNotifications: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await notificationService.getAll();
      set({ notifications: response.data.items || [] });
    } catch (err: any) {
      console.error("Lỗi khi tải thông báo:", err);
      set({ error: err.message || "Lỗi không xác định" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUsers: async () => {
    try {
      const users = await userService.getAllUsers();
      const mappedUsers: UserSelectItem[] = users.map((u) => ({
        id: u._id,
        name: u.userName,
        email: u.email,
        role: u.role,
      }));
      set({ availableUsers: mappedUsers });
    } catch (err) {
      console.error("Lỗi khi tải người dùng:", err);
    }
  },

  sendToUser: async (data: SendToUserDto) => {
    try {
      set({ isLoading: true, error: null });
      await notificationService.sendToUser(data);
      await get().fetchNotifications();
    } catch (err: any) {
      set({ error: err.message || "Lỗi khi gửi thông báo" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  sendToRole: async (data: SendToRoleDto) => {
    try {
      set({ isLoading: true, error: null });
      await notificationService.sendToRole(data);
      await get().fetchNotifications();
    } catch (err: any) {
      set({ error: err.message || "Lỗi khi gửi thông báo" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
}));
