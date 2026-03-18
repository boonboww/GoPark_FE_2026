import axios from "axios";

export const ocrService = {
  recognizeLicensePlate: async (file: File): Promise<string> => {
    const apiKey = process.env.NEXT_PUBLIC_OCR_API_KEY;
    if (!apiKey) {
      throw new Error("OCR API Key is not configured");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("apikey", apiKey);
    formData.append("language", "eng"); // Dùng 'eng' tối ưu cho ký tự số và chữ của biển số
    formData.append("isOverlayRequired", "false");
    formData.append("scale", "true");
    formData.append("detectOrientation", "true");
    formData.append("OCREngine", "2"); // Engine 2 supports Vietnamese

    try {
      const response = await axios.post("https://api.ocr.space/parse/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.OCRExitCode === 1) {
        const parsedText = response.data.ParsedResults[0].ParsedText;
        // Xử lý làm sạch chuỗi (loại bỏ xuống dòng, khoảng trắng thừa)
        return parsedText.replace(/\s+/g, " ").trim();
      } else {
        throw new Error(response.data.ErrorMessage || "OCR failed to process image");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      throw error;
    }
  },
};
