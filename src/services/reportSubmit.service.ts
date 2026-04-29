import { post } from "@/lib/api";

export interface CreateReportDto {
  parkingLotId: string;
  bookingId?: string;
  title: string;
  description: string;
  type: string;
  images?: string[];
}

export const reportService = {
  /**
   * Gửi báo cáo/khiếu nại mới
   * POST /reports
   */
  submitReport: async (data: CreateReportDto) => {
    return await post<any>("/reports", data);
  },
};
