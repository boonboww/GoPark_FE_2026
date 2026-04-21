

export interface OcrResponse {
  statusCode: number;
  message: string;
  data: {
    licensePlate: string;
  };
}

export interface VehicleRegistrationScanResult {
  rawText: string;
  ownerName: string;
  licensePlate: string;
  brand: string;
}

type OcrLanguage = "eng" | "vie";

const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không thể đọc ảnh giấy tờ"));
    };
    img.src = url;
  });
};

const addPaddingForOcr = async (file: File): Promise<File> => {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;

  try {
    const img = await loadImageFromFile(file);
    const padRatio = 0.08;
    const padX = Math.max(20, Math.round(img.width * padRatio));
    const padY = Math.max(20, Math.round(img.height * padRatio));

    const canvas = document.createElement("canvas");
    canvas.width = img.width + padX * 2;
    canvas.height = img.height + padY * 2;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, padX, padY, img.width, img.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.98);
    });

    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + "-ocr.jpg", {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
};

const createEnhancedOcrImage = async (file: File): Promise<File> => {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;

  try {
    const img = await loadImageFromFile(file);
    const scale = 1.25;
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return file;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const contrast = ((gray - 128) * 1.35) + 128;
      const boosted = Math.max(0, Math.min(255, contrast));

      data[i] = boosted;
      data[i + 1] = boosted;
      data[i + 2] = boosted;
    }

    ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.98);
    });

    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + "-ocr-enhanced.jpg", {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
};

const normalizeOwnerName = (value: string): string => {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const refineOwnerName = (value: string): string => {
  const normalized = value
    .replace(/[0]/g, "O")
    .replace(/[1]/g, "I")
    .replace(/[5]/g, "S")
    .replace(/\s+/g, " ")
    .trim();

  const filteredTokens = normalized
    .split(" ")
    .filter(Boolean)
    .filter((token) => token.length >= 2 || /^[A-ZÀ-Ỹ]$/u.test(token));

  const hasVowel = (token: string): boolean => {
    const plain = token
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/đ/gi, "d");
    return /[aeiouy]/i.test(plain);
  };

  const cleanedTokens = [...filteredTokens];
  while (cleanedTokens.length > 2 && !hasVowel(cleanedTokens[0])) {
    cleanedTokens.shift();
  }

  return cleanedTokens.join(" ");
};

const toSearchText = (value: string): string => {
  return value
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const looksLikeVietnameseName = (line: string): boolean => {
  const words = line.trim().split(/\s+/).filter(Boolean);

  if (words.length < 2 || words.length > 6) return false;

  return words.every((word) => /^[\p{L}.\-']+$/u.test(word));
};

const NAME_STOPWORDS = new Set([
  "TEN",
  "CHU",
  "XE",
  "OWNER",
  "FULL",
  "NAME",
  "SO",
  "MAY",
  "ENGINE",
  "KHUNG",
  "CHASSIS",
  "DIA",
  "CHI",
  "ADDRESS",
  "BRAND",
  "TYPE",
  "COLOR",
  "PLATE",
  "REGISTRATION",
  "ENGIN",
  "ENGINC",
  "NO",
  "NUMBER",
]);

const ADDRESS_HINT_WORDS = new Set([
  "THON",
  "AP",
  "TO",
  "KHU",
  "XA",
  "PHUONG",
  "QUAN",
  "HUYEN",
  "THI",
  "TINH",
  "TP",
  "THANHPHO",
  "DUONG",
  "PHO",
  "CITY",
  "DISTRICT",
  "PROVINCE",
]);

const countAddressHints = (candidate: string): number => {
  const words = toSearchText(candidate)
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.toUpperCase());

  return words.reduce((acc, word) => {
    return acc + (ADDRESS_HINT_WORDS.has(word) ? 1 : 0);
  }, 0);
};

const isLikelyHumanName = (candidate: string): boolean => {
  const words = candidate
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) =>
      w
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toUpperCase(),
    );

  if (words.length < 2 || words.length > 5) return false;
  if (words.some((w) => NAME_STOPWORDS.has(w))) return false;
  if (countAddressHints(candidate) >= 2) return false;
  return words.every((w) => /^[A-Z]{2,}$/.test(w));
};

const isMetadataLine = (line: string): boolean => {
  const normalized = toSearchText(line);
  return (
    !normalized ||
    /(owner s full name|owner name|ten chu xe|ho ten chu xe|dia chi|address|so may|engine|engin|enginc|so khung|chassis|nhan hieu|brand|loai xe|type|mau son|color|tai trong|hang hoa|bien so|plate|registration)/.test(
      normalized,
    )
  );
};

const scoreNameCandidate = (line: string): number => {
  const words = line.trim().split(/\s+/).filter(Boolean);
  let score = 0;

  if (!line) return 0;
  if (isMetadataLine(line)) return 0;
  if (looksLikeVietnameseName(line)) score += 3;
  if (words.length >= 2 && words.length <= 5) score += 2;
  if (/^[A-ZÀ-Ỹ\s.'-]+$/.test(line.trim())) score += 1;
  if (/[a-zà-ỹ]/.test(line)) score += 1;

  return score;
};

const scoreOwnerNameQuality = (candidate: string): number => {
  const cleaned = refineOwnerName(candidate);
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (!cleaned || !isLikelyHumanName(cleaned) || isMetadataLine(cleaned)) return 0;

  let score = 0;
  if (words.length >= 2 && words.length <= 4) score += 3;
  if (words.every((word) => /^[A-ZÀ-Ỹ][a-zà-ỹ]{1,}$/u.test(word))) score += 2;
  if (!/\b([A-ZÀ-Ỹ])\1\1\b/u.test(cleaned)) score += 1;
  if (countAddressHints(cleaned) === 0) score += 2;
  return score;
};

const extractOwnerNameFromText = (text: string): string => {
  const normalizedText = text.replace(/\r/g, "");
  const compactText = normalizedText.replace(/\s+/g, " ").trim();
  const searchText = toSearchText(compactText);
  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const cleanOwnerCandidate = (value: string): string =>
    refineOwnerName(
      value
      .replace(/\b\d{4}\b/g, " ")
      .replace(/[^\p{L}\s.'-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim(),
    );

  const ownerCandidates: string[] = [];

  const nextFieldPattern =
    /(dia chi|address|so may|engine|engin|enginc|so khung|chassis|nhan hieu|brand|loai xe|type|mau son|color|tai trong|hang hoa|bien so|plate)\s*:?/i;

  // Fast path for one-line OCR result from backend
  const ownerLabelMatch = searchText.match(
    /(ho ten chu xe|ten chu xe|owner s full name|owner full name|owner name)\s*:?/i,
  );
  if (ownerLabelMatch?.index !== undefined) {
    const start = ownerLabelMatch.index + ownerLabelMatch[0].length;
    const tail = searchText.slice(start).trim();
    const nextFieldMatch = tail.match(nextFieldPattern);
    const ownerSegment = nextFieldMatch ? tail.slice(0, nextFieldMatch.index) : tail;
    const cleanedSegment = cleanOwnerCandidate(ownerSegment);
    if (
      cleanedSegment.length >= 4 &&
      isLikelyHumanName(cleanedSegment) &&
      !isMetadataLine(cleanedSegment) &&
      countAddressHints(cleanedSegment) < 2
    ) {
      ownerCandidates.push(cleanedSegment);
    }
  }

  // Fallback for two-column OCR where fields are interleaved in one line
  const ownerLabelOriginal = compactText.match(
    /(?:tên\s*chủ\s*xe|họ\s*tên\s*chủ\s*xe|chủ\s*xe|owner\s*[’'`]?s?\s*full\s*name|owner\s*name)\s*:?/i,
  );
  if (ownerLabelOriginal?.index !== undefined) {
    const tail = compactText
      .slice(ownerLabelOriginal.index + ownerLabelOriginal[0].length)
      .slice(0, 220);

    const tailSearch = toSearchText(tail);
    const stopAt = tailSearch.match(nextFieldPattern);
    const reducedTail = stopAt ? tail.slice(0, stopAt.index) : tail;

    const uppercaseCandidates = reducedTail.match(/[A-ZÀ-Ỹ]{2,}(?:\s+[A-ZÀ-Ỹ]{2,}){1,4}/g) || [];
    const mixedCaseCandidates =
      reducedTail.match(/[A-ZÀ-Ỹ][a-zà-ỹ]{1,}(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]{1,}){1,4}/g) || [];
    const nameCandidates = [...uppercaseCandidates, ...mixedCaseCandidates];

    for (const rawCandidate of nameCandidates) {
      const cleaned = cleanOwnerCandidate(rawCandidate);
      if (cleaned.length >= 4 && isLikelyHumanName(cleaned) && countAddressHints(cleaned) < 2) {
        ownerCandidates.push(cleaned);
      }
    }
  }

  const labelPattern = /(?:t[êe]n\s*ch[ủu]\s*xe|h[ọo]\s*t[êe]n\s*ch[ủu]\s*xe|ch[ủu]\s*xe|owner\s*[’'`]?s?\s*full\s*name|owner\s*name)\s*(?:\(.*?\))?\s*[:\-]?\s*(.*)?/i;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const matched = line.match(labelPattern);

    if (matched) {
      const inlineRaw = matched[1] || "";
      const inlineStopMatch = inlineRaw.match(nextFieldPattern);
      const inlineReduced = inlineStopMatch
        ? inlineRaw.slice(0, inlineStopMatch.index)
        : inlineRaw;
      const inlineCandidate = cleanOwnerCandidate(inlineReduced);
      if (
        inlineCandidate.length >= 4 &&
        isLikelyHumanName(inlineCandidate) &&
        !isMetadataLine(inlineCandidate) &&
        countAddressHints(inlineCandidate) < 2
      ) {
        ownerCandidates.push(inlineCandidate);
      }

      const nextLineRaw = lines[index + 1] || "";
      const nextLineStopMatch = nextLineRaw.match(nextFieldPattern);
      const nextLineReduced = nextLineStopMatch
        ? nextLineRaw.slice(0, nextLineStopMatch.index)
        : nextLineRaw;
      const nextLine = cleanOwnerCandidate(nextLineReduced);
      if (
        nextLine.length >= 4 &&
        isLikelyHumanName(nextLine) &&
        !isMetadataLine(nextLine) &&
        countAddressHints(nextLine) < 2
      ) {
        ownerCandidates.push(nextLine);
      }
    }
  }

  if (ownerCandidates.length > 0) {
    const bestOwnerCandidate = ownerCandidates
      .map((candidate) => ({
        candidate,
        score: scoreOwnerNameQuality(candidate),
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (bestOwnerCandidate?.score > 0) {
      return normalizeOwnerName(bestOwnerCandidate.candidate);
    }
  }

  const fallbackCandidate = lines
    .map((line) => cleanOwnerCandidate(line))
    .map((line) => ({ line, score: scoreNameCandidate(line) }))
    .sort((a, b) => b.score - a.score)[0];

  if (fallbackCandidate && fallbackCandidate.score >= 4 && fallbackCandidate.line) {
    return normalizeOwnerName(fallbackCandidate.line);
  }

  return "";
};

const extractLicensePlateFromText = (text: string): string => {
  const normalized = text.toUpperCase().replace(/[–—]/g, "-");

  const grouped = normalized.match(/\b(\d{2}[A-Z]{1,2})\s*[-.]?\s*(\d{3})\s*[-.]?\s*(\d{2})\b/);
  if (grouped) {
    return `${grouped[1]}-${grouped[2]}.${grouped[3]}`;
  }

  const compact = normalized.match(/\b(\d{2}[A-Z]{1,2})\s*(\d{5})\b/);
  if (compact) {
    const suffix = compact[2];
    return `${compact[1]}-${suffix.slice(0, 3)}.${suffix.slice(3)}`;
  }

  return "";
};

const normalizeVehicleBrand = (value: string): string => {
  const cleaned = value
    .replace(/[^\p{L}\p{N}\s.&-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (/^[A-Z0-9]+$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

const extractVehicleBrandFromText = (text: string): string => {
  const normalizedText = text.replace(/\r/g, "");
  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const labelPattern = /(?:nh[ãa]n\s*hi[ệe]u|brand|make)\s*(?:\(.*?\))?\s*[:\-]?\s*(.*)?/i;
  const stopPattern = /(?:loai xe|type|so may|engine|so khung|chassis|mau son|color|bien so|plate|owner|ten chu xe|dia chi|address)/i;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const matched = line.match(labelPattern);
    if (!matched) continue;

    const inline = (matched[1] || "").trim();
    if (inline && !stopPattern.test(inline)) {
      const normalized = normalizeVehicleBrand(inline);
      if (normalized.length >= 2 && normalized.length <= 30) return normalized;
    }

    const nextLine = (lines[index + 1] || "").trim();
    if (nextLine && !stopPattern.test(nextLine)) {
      const normalized = normalizeVehicleBrand(nextLine);
      if (normalized.length >= 2 && normalized.length <= 30) return normalized;
    }
  }

  const compactText = normalizedText.replace(/\s+/g, " ").trim();
  const oneLineMatch = compactText.match(
    /(?:nh[ãa]n\s*hi[ệe]u|brand|make)\s*:?\s*([\p{L}\p{N}.&\-\s]{2,30}?)(?=\s+(?:loai xe|type|so may|engine|so khung|chassis|mau son|color|bien so|plate|owner|ten chu xe|dia chi|address)|$)/iu,
  );
  if (oneLineMatch?.[1]) {
    return normalizeVehicleBrand(oneLineMatch[1]);
  }

  return "";
};

export const ocrService = {
  /**
   * Send image to backend for OCR processing
   * POST /parking-lots/ocr
   */
  recognizeLicensePlate: async (
    file: File,
    options?: { language?: OcrLanguage },
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    if (options?.language) {
      formData.append("language", options.language);
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    let token = null;
    if (typeof window !== "undefined") {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          token = parsed?.state?.accessToken;
        } catch {}
      }
    }

    try {
      let response = await fetch(`${API_BASE_URL}/parking-lots/ocr`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // Fallback if OCR provider rejects requested language.
      if (!response.ok && options?.language === "vie") {
        const retryFormData = new FormData();
        retryFormData.append("image", file);
        retryFormData.append("language", "eng");
        response = await fetch(`${API_BASE_URL}/parking-lots/ocr`, {
          method: "POST",
          body: retryFormData,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }

      if (!response.ok) {
        throw new Error(`Lỗi từ máy chủ: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();

        if (typeof json === "string") {
          return json;
        }

        if (typeof json?.data === "string") {
          return json.data;
        }

        const extractedPlate = 
          json.data?.licensePlate || 
          json.licensePlate || 
          (typeof json.data === "string" ? json.data : null) || 
          json.data?.plate || 
          json.plate || 
          json.data?.text || 
          json.text;

        // Nếu không trích xuất được chuỗi, stringify để có thể thấy được cấu trúc thay vì [object Object]
        return typeof extractedPlate === "string" ? extractedPlate : JSON.stringify(json);
      } else {
        const text = await response.text();
        return text;
      }
    } catch (error: unknown) {
      console.error("OCR Error:", error);
      throw new Error(error instanceof Error ? error.message : "Lỗi xử lý ảnh biển số");
    }
  },

  recognizeVehicleRegistration: async (
    file: File,
  ): Promise<VehicleRegistrationScanResult> => {
    const preprocessedFile = await addPaddingForOcr(file);
    const enhancedFile = await createEnhancedOcrImage(preprocessedFile);
    const variants = [preprocessedFile, enhancedFile];
    const results: VehicleRegistrationScanResult[] = [];

    for (const variant of variants) {
      const rawText = await ocrService.recognizeLicensePlate(variant, { language: "vie" });
      results.push({
        rawText,
        ownerName: extractOwnerNameFromText(rawText),
        licensePlate: extractLicensePlateFromText(rawText),
        brand: extractVehicleBrandFromText(rawText),
      });
    }

    const bestByOwner = [...results].sort(
      (a, b) => scoreOwnerNameQuality(b.ownerName) - scoreOwnerNameQuality(a.ownerName),
    )[0];
    const bestByPlate = results.find((item) => item.licensePlate);

    return {
      rawText: bestByOwner?.rawText || results[0]?.rawText || "",
      ownerName: bestByOwner?.ownerName || "",
      licensePlate: bestByPlate?.licensePlate || bestByOwner?.licensePlate || "",
      brand: bestByOwner?.brand || results.find((item) => item.brand)?.brand || "",
    };
  },
};
