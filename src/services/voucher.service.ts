import { get, post, patch, put } from "@/lib/api";

export interface VoucherResData {
  id: string;
  createdAt: string;
  updatedAt: string;
  code: string;
  discount_type: "PERCENTAGE" | "FIXED_AMOUNT";
  discount_value: string | number;
  max_discount_amount: string | number | null;
  min_booking_value: string | number;
  usage_limit: number;
  used_count: number;
  min_booking_count: number | null;
  first_booking_only: boolean;
  start_time: string;
  end_time: string;
  status: "ACTIVE" | "UPCOMING" | "EXPIRED" | "INACTIVE";
}

export interface VoucherListResponse {
  statusCode: number;
  message: string;
  data: {
    items: VoucherResData[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  };
}

export interface VoucherCreateResponse {
  statusCode: number;
  message: string;
  data: VoucherResData;
}

export interface CreateVoucherDto {
  code: string;
  discount_type: "PERCENTAGE" | "FIXED_AMOUNT";
  discount_value: number;
  max_discount_amount: number | null;
  min_booking_value: number;
  usage_limit: number;
  start_time: string;
  end_time: string;
  min_booking_count: number | null;
  first_booking_only: boolean;
  status: "ACTIVE" | "UPCOMING" | "EXPIRED" | "DISABLED";
}

export const voucherService = {
  getAll: async (params?: Record<string, string | number>): Promise<VoucherListResponse> => {
    // API client expects Record<string, string>
    const stringParams: Record<string, string> = {};
    if (params) {
      Object.keys(params).forEach(key => {
        stringParams[key] = String(params[key]);
      });
    }
    return await get<VoucherListResponse>("/admin/vouchers", stringParams);
  },
  create: async (data: CreateVoucherDto): Promise<VoucherCreateResponse> => {
    return await post<VoucherCreateResponse>("/admin/vouchers", data);
  },
  updateStatus: async (id: string, status: string): Promise<VoucherCreateResponse> => {
    return await patch<VoucherCreateResponse>(`/admin/vouchers/${id}/status`, { status });
  },
  update: async (id: string, data: Partial<CreateVoucherDto>): Promise<VoucherCreateResponse> => {
    return await put<VoucherCreateResponse>(`/admin/vouchers/${id}`, data);
  },
};
