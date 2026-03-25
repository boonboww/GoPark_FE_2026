import { apiClient } from "@/lib/api";

export interface OcrResponse {
  statusCode: number;
  message: string;
  data: {
    licensePlate: string;
  };
}

export const ocrService = {
  /**
   * Send image to backend for OCR processing
   * POST /parking-lots/ocr
   */
  recognizeLicensePlate: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient<OcrResponse>("/parking-lots/ocr", {
        method: "POST",
        body: formData,
      }); 
      
      if (!response.data || !response.data.licensePlate) {
        throw new Error("Không thể trích xuất biển số từ ảnh");
      }

      return response.data.licensePlate;
    } catch (error: unknown) {
      console.error("OCR Error:", error);
      throw new Error((error as any)?.message || "Lỗi xử lý ảnh biển số");
    }
  },
};
