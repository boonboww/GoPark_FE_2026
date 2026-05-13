import { get, patch } from "@/lib/api";

export interface AdminStats {
  totalUsers: number;
  userChangePercent: number;
  totalParkingLots: number;
  newParkingLotsThisMonth: number;
  todayBookings: number;
  bookingChangePercent: number;
  thisMonthRevenue: number;
  revenueChangePercent: number;
  pendingApprovals: number;
  activeBookings: number;
}

export interface ParkingLotStats {
  totalParkingLots: number;
  activeParkingLots: number;
  availableSpacesParkingSlot: string;
  averageRating: string;
}

export interface AdminActivity {
  id: string;
  type: string;
  content: string;
  username: string;
  time: string;
  status: "SUCCESS" | "WARNING" | "ERROR" | "success" | "warning" | "error" | string;
}

export interface SystemStatus {
  apiService: { status: string; message: string };
  database: { status: string; message: string };
  paymentGateway: { status: string; message: string };
  notification: { status: string; message: string };
}

export interface WrappedResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface UserStats {
  totalUsers: number;
  newUsersLastMonth: number;
  activeUsers: number;
  blockedUsers: number;
}

export interface CustomerList {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  status: "ACTIVE" | "BLOCKED" | "SPENDING" | string;
  totalBookings: number;
  totalSpending: number;
  lastActive?: string;
  createdAt: string;
  address?: string;
}

export interface OwnerStats {
  totalOwners: number;
  newOwnersLastMonth: number;
  activeOwners: number;
  blockedOwners: number;
}

export interface OwnerList {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalParkingLots?: number;
  totalRevenue?: string; // Backend returns string like "0 Tr ₫"
  totalSpending?: number;
  totalBookings: number;
  status: "ACTIVE" | "BLOCKED" | string;
  createdAt: string;
}

/** Transaction related types */
export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "SUCCESS";
export type TransactionType =
  | "TOP_UP"
  | "WITHDRAW"
  | "PENALTY"
  | "BOOKING_PAYMENT"
  | "BOOKING_REFUND"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "EARN_PARKING_FEE"
  | "PAYMENT";

export interface WalletInfo {
  id: string;
  balance: number;
  user?: {
    id: string;
    userName: string;
    email: string;
    role: string;
    phoneNumber?: string;
    profile?: {
      id: number;
      name: string;
      phone: string;
      gender: string | null;
      image: string | null;
    };
  };
}

export interface Transaction {
  id: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  type: TransactionType | string;
  status: TransactionStatus | string;
  ref_type: string | null;
  ref_id: string | null;
  created_at: string;
  updated_at: string;
  wallet_id: string | null;
  wallet?: WalletInfo;
}

/** Report related types */
export interface MonthlyRevenue {
  month: string;
  bookingRevenue: number;
  subscriptionRevenue: number;
  penaltyRevenue: number;
  totalRevenue: number;
  refunds: number;
  netRevenue: number;
}

export interface ParkingLotRevenue {
  name: string;
  revenue: number;
  bookings: number;
  percentage: number;
}

export interface RevenueSource {
  name: string;
  value: number;
  color: string;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  bookings: number;
}

export interface RecentTransaction {
  _id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  time: string;
}

/** Parking Lot related types */
export type ParkingLotStatus = "ACTIVE" | "PENDING" | "INACTIVE" | "CLOSED";
export type ParkingLotType =
  | "OUTDOOR"
  | "INDOOR"
  | "UNDERGROUND"
  | "ROOFTOP"
  | "MULTI_LEVEL";

export interface OwnerInfoShort {
  _id: string;
  userName: string;
  email: string;
  phoneNumber: string;
}

export interface ParkingZone {
  name: string;
  totalSlots: number;
  availableSlots: number;
}

export interface ParkingLot {
  _id: string;
  name: string;
  address: string;
  description?: string;
  owner: OwnerInfoShort;
  status: ParkingLotStatus;
  type: ParkingLotType;
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  pricePerHour: {
    zonename?: string;
    pricePerHour: number;
    pricePerDay: number;
  }[];
  rating: number;
  totalReviews: number;
  totalBookings: number;
  totalRevenue: number;
  openTime: string;
  closeTime: string;
  amenities: string[];
  zones?: ParkingZone[];
  images?: string[];
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingLotItem {
  id: number;
  name: string;
  location: string;
  description: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING" | string;
  type: string;
  occupiedSlots: number;
  owner: {
    id: number;
    name: string;
    phone: string;
    gender: string | null;
    image: string | null;
  };
  availableSpaces: {
    totalSlots: number;
    availableSlots: number;
  };
  totalSpaces: number;
  pricePerHour: {
    zonename?: string;
    pricePerHour: number;
    pricePerDay: number;
  }[];
  averageRating: string;
  totalReviews: number;
  totalBookings: number;
  totalRevenue: string;
  openTime: string;
  closeTime: string;
  amenities: string[];
  zones: {
    id: number;
    name: string;
    totalSlots: number;
    availableSlots: number;
  }[];
}

/** Approval Request related types */
export type RequestType =
  | "UPDATE_PARKING_LOT"
  | "PAYMENT"
  | "BECOME_OWNER"
  | "WITHDRAW_FUND"
  | "REFUND"
  | "NEW_PARKING_LOT"
  | "OTHER";

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING";

export interface Requester {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  role?: "user" | "owner";
}

export interface StatsApprovalRequest {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

export interface ApprovalRequest {
  id: string;
  requester: Requester;
  type: RequestType;
  status: RequestStatus;
  title?: string;
  description: string;
  payload?: any;
  attachments?: string[];
  adminNote?: string;
  relatedParkingLot?: {
    id: string;
    name: string;
    address: string;
  };
  newValue?: string;
  oldValue?: string;
  amount?: number;
  createdAt: string;
  updatedAt: string;
}

class AdminService {
  /**
   * Get overview stats for admin dashboard
   * GET /api/v1/admin/stats/overview
   */
  async getOverviewStats(): Promise<AdminStats> {
    const response = await get<ApiResponse<AdminStats>>(
      "/admin/stats/overview",
    );
    return response.data;
  }

  /**
   * Get recent activities for admin dashboard
   * GET /api/v1/admin/stats/activities-recent
   */
  async getRecentActivities(page?: number, limit?: number): Promise<{ data: AdminActivity[], total: number }> {
    const url = page && limit ? `/admin/stats/activities-recent?page=${page}&limit=${limit}` : "/admin/stats/activities-recent";
    const response = await get<ApiResponse<{ items: AdminActivity[], meta: any }>>(url);
    
    // The response data is { items: [...], meta: {...} }
    const items = response.data?.items || [];
    const total = response.data?.meta?.totalItems || items.length || 0;
    
    return { data: items, total };
  }

  /**
   * Get user statistics
   * GET /api/v1/admin/stats/users
   */
  async getUserStats(): Promise<UserStats> {
    const response = await get<
      ApiResponse<{
        totalUsers: number;
        newUsersLastMonth: number;
        activeUsers: number;
        blockedUsers: number;
      }>
    >("/admin/stats/users");
    return response.data;
  }

  /**
   * Get system status for admin dashboard
   * GET /api/v1/admin/dashboard/system-status
   * (Keeping this one as it was before, assuming it still exists)
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const response = await get<ApiResponse<SystemStatus>>(
      "/admin/dashboard/system-status",
    );
    return response.data;
  }

  async getCustomers(page?: number, limit?: number): Promise<{ data: CustomerList[], total: number }> {
    const params: Record<string, string> = {};
    if (page) params.page = String(page);
    if (limit) params.limit = String(limit);
    
    const response = await get<ApiResponse<{ data: CustomerList[], meta: any }>>(
      "/admin/users/list",
      params
    );
    const items = response.data?.data || [];
    const total = response.data?.meta?.totalItems || items.length || 0;
    return { data: items, total };
  }

  /**
   * Get owner statistics
   * GET /api/v1/admin/stats/owners
   */
  async getOwnerStats(): Promise<OwnerStats> {
    const response = await get<ApiResponse<OwnerStats>>("/admin/stats/owners");
    return response.data;
  }

  /**
   * Get list of owners
   * GET /api/v1/admin/owners/list
   */
  async getOwners(page?: number, limit?: number): Promise<{ data: OwnerList[], total: number }> {
    const params: Record<string, string> = {};
    if (page) params.page = String(page);
    if (limit) params.limit = String(limit);

    const response = await get<ApiResponse<{ data: OwnerList[], meta: any }>>(
      "/admin/owners/list",
      params
    );
    const items = response.data?.data || [];
    const total = response.data?.meta?.totalItems || items.length || 0;
    return { data: items, total };
  }

  /**
   * Get transaction statistics
   * GET /api/v1/admin/stats/transactions
   */
  async getTransactionStats(): Promise<{
    totalTransactions: number;
    successTransactions: number;
    totalIncome: string;
    totalRefund: string;
  }> {
    const response = await get<ApiResponse<{
      totalTransactions: number;
      successTransactions: number;
      totalIncome: string;
      totalRefund: string;
    }>>("/admin/stats/transactions");
    return response.data;
  }

  /**
   * Get list of transactions (from wallets)
   * GET /api/v1/admin/wallets
   */
  async getTransactions(page?: number, limit?: number): Promise<{ data: Transaction[], total: number }> {
    const params: Record<string, string> = {};
    if (page) params.page = String(page);
    if (limit) params.limit = String(limit);

    const response = await get<ApiResponse<{ items: Transaction[], meta: any }>>(
      "/admin/wallets",
      params
    );
    const items = response.data?.items || [];
    const total = response.data?.meta?.totalItems || items.length || 0;
    return { data: items, total };
  }

  /**
   * Get list of all parking lots
   * GET /api/v1/admin/parking-lots
   */
  async getParkingLots(page?: number, limit?: number): Promise<{ data: ParkingLot[], total: number }> {
    const params: Record<string, string> = {};
    if (page) params.page = String(page);
    if (limit) params.limit = String(limit);

    const response = await get<ApiResponse<{ items: ParkingLot[], meta: any }>>(
      "/admin/parking-lots",
      params
    );
    const items = response.data?.items || [];
    const total = response.data?.meta?.totalItems || items.length || 0;
    return { data: items, total };
  }

  /**
   * Get parking lot stats
   * GET /api/v1/admin/stats/parking-lots
   */
  async getParkingLotStats(): Promise<ParkingLotStats> {
    const response = await get<ApiResponse<ParkingLotStats>>("/admin/stats/parking-lots");
    return response.data;
  }

  /**
   * Get parking lot list
   * GET /api/v1/admin/parking-lots/list
   */
  async getParkingLotsList(page?: number, limit?: number): Promise<{ data: ParkingLotItem[]; total: number }> {
    const params: Record<string, string> = {};
    if (page) params.page = String(page);
    if (limit) params.limit = String(limit);

    const response = await get<ApiResponse<{ data: ParkingLotItem[], meta: any }>>(
      "/admin/parking-lots/list",
      params
    );
    const items = response.data?.data || [];
    const total = response.data?.meta?.totalItems || items.length || 0;
    return { data: items, total };
  }

  /**
   * Get list of all approval requests
   * GET /api/v1/admin/stats/requests
   */
  async getStatsApprovalRequests(): Promise<StatsApprovalRequest> {
    const response =
      await get<ApiResponse<StatsApprovalRequest>>("/admin/stats/requests");
    return response.data;
  }

  /**  * Get list of all approval requests
   * GET /api/v1/admin/requests
   */
  async getApprovalRequests(page?: number, limit?: number): Promise<{ data: ApprovalRequest[], total: number }> {
    const params: Record<string, string> = {};
    if (page) params.page = String(page);
    if (limit) params.limit = String(limit);

    const response = await get<
      ApiResponse<{
        items: ApprovalRequest[];
        meta: any;
      }>
    >("/admin/requests", params);
    const items = response.data?.items || [];
    const total = response.data?.meta?.totalItems || items.length || 0;
    return { data: items, total };
  }

  /**
   * Update user status (block/unblock)
   * PATCH /api/v1/admin/users/:userId/status
   */
  async updateUserStatus(userId: string, status: "ACTIVE" | "BLOCKED"): Promise<void> {
    await patch(`/admin/users/${userId}/status`, { status });
  }

  /**
   * Approve an approval request
   * PATCH /api/v1/admin/requests/:requestId/approve
   */
  async approveRequest(requestId: string, adminId: string, reason: string): Promise<void> {
    await patch(`/admin/requests/${requestId}/approve`, { adminId, reason });
  }

  /**
   * Reject an approval request
   * PATCH /api/v1/admin/requests/:requestId/reject
   */
  async rejectRequest(requestId: string, adminId: string, reason: string): Promise<void> {
    await patch(`/admin/requests/${requestId}/reject`, { adminId, reason });
  }
}

export const adminService = new AdminService();
