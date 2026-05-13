import { get } from "@/lib/api";

export enum VoucherDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum VoucherStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: VoucherDiscountType;
  discount_value: number;
  max_discount_amount: number | null;
  min_booking_value: number;
  usage_limit: number;
  used_count: number;
  min_booking_count: number | null;
  first_booking_only: boolean;
  start_time: string;
  end_time: string;
  status: VoucherStatus;
  // UI related fields that might come from eligibility endpoint
  is_eligible?: boolean;
  ineligibility_reason?: string;
  title?: string; // We can generate this from code if missing
  description?: string; // We can generate this from values
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

class PromotionService {
  /**
   * Lấy danh sách voucher đang hoạt động
   */
  async getActiveVouchers() {
    const response = await get<ApiResponse<Voucher[]>>("/vouchers");
    return response.data;
  }

  /**
   * Lấy danh sách voucher phù hợp với người dùng hiện tại
   */
  async getEligibleVouchers() {
    const response = await get<ApiResponse<Voucher[]>>("/vouchers/eligible");
    return response.data;
  }

  /**
   * Lấy tất cả voucher kèm thông tin có phù hợp hay không
   */
  async getAllWithEligibility() {
    const response = await get<ApiResponse<Voucher[]>>("/vouchers/all-with-eligibility");
    return response.data;
  }
}

export const promotionService = new PromotionService();
