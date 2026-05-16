"use client";
import { useAuthStore } from "@/stores";
import { API_BASE_URL } from "@/lib/api";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useState, useRef, useCallback } from "react";
import Tesseract from "tesseract.js";
import {
  IconQrcode,
  IconCamera,
  IconBuildingStore,
  IconCalendarEvent,
  IconClock,
  IconMapPin,
  IconCircleCheck,
  IconHistory,
  IconArrowRight,
  IconArrowLeft,
  IconEye,
  IconRefresh,
  IconAlertCircle,
  IconLoader2
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function StaffDashboard() {
  const [qrContent, setQrContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGateId, setSelectedGateId] = useState<string>("1");
  const [lastPlateScanTime, setLastPlateScanTime] = useState<number>(0);
  const [isScanningPlate, setIsScanningPlate] = useState(false);
  const [detectedPlate, setDetectedPlate] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [gates, setGates] = useState<any[]>([]);
  const [gatesLoading, setGatesLoading] = useState(true);
  const [selectedParkingLotId, setSelectedParkingLotId] = useState<string>("");
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [lastPenaltyScan, setLastPenaltyScan] = useState<any>(null);
  const [lastExtensionScan, setLastExtensionScan] = useState<any>(null);

  // Filtering & Pagination states
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | 'MONTH' | 'CUSTOM' | 'ALL'>('24H');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const plateVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tesseractWorkerRef = useRef<Tesseract.Worker | null>(null);
  const isInitializing = useRef(false);
  const { accessToken, user } = useAuthStore();

  const isOcrRunning = useRef(false);
  const isVerifying = useRef(false);
  const isMounted = useRef(true);
  const lastDetectedPlateRef = useRef<string>("");
  const detectionConsistencyRef = useRef<number>(0);

  useEffect(() => {
    const parts = user?.email?.split('.');
    if (parts && parts[0] === 'staff' && parts[1]) {
      setSelectedParkingLotId(parts[1]);
    } else {
      const fetchFirstLot = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/parking-lots/all`);
          if (res.ok) {
            const result = await res.json();
            const lotsData = result.data || [];
            if (Array.isArray(lotsData) && lotsData.length > 0) {
              setSelectedParkingLotId(lotsData[0].id.toString());
            }
          }
        } catch (err) {
          console.error("Lỗi khi tải danh sách bãi xe:", err);
        }
      };
      fetchFirstLot();
    }
  }, [user]);

  useEffect(() => {
    const fetchGates = async () => {
      if (!selectedParkingLotId) return;
      setGatesLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/parking-lots/${selectedParkingLotId}/gates`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });
        if (res.ok) {
          const result = await res.json();
          const gatesData = result.data || [];
          setGates(Array.isArray(gatesData) ? gatesData : []);

          const savedGate = localStorage.getItem(`gate_config_${selectedParkingLotId}`);
          if (savedGate) {
            setSelectedGateId(savedGate);
          } else if (Array.isArray(gatesData) && gatesData.length > 0) {
            setSelectedGateId(gatesData[0].id.toString());
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách cổng:", error);
        setGates([]);
      } finally {
        setGatesLoading(false);
      }
    };
    fetchGates();
  }, [selectedParkingLotId, accessToken]);

  const fetchHistory = useCallback(async () => {
    if (!selectedParkingLotId || !accessToken) return;
    setHistoryLoading(true);
    try {
      const url = `${API_BASE_URL}/booking/live-history/${selectedParkingLotId}?page=${currentPage}&limit=${pageSize}&range=${timeRange}`;
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const result = await res.json();
        setScanHistory(Array.isArray(result.data) ? result.data : []);
        setTotalCount(result.count || 0);
      }
    } catch (error) {
      console.error("Lỗi khi tải lịch sử quét:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedParkingLotId, accessToken, currentPage, pageSize, timeRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const startCamera = async () => {
    if (isInitializing.current) return;
    isInitializing.current = true;
    console.log("[Camera] Khởi tạo camera duy nhất...");

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 20,
          qrbox: { width: 280, height: 280 },
          // Remove aspectRatio to prevent image distortion
        },
        (text) => {
          console.log("[QR] Success:", text);
          toast.success("Đã quét được mã QR!", { duration: 2000 });
          setQrContent(text);
        },
        () => { }
      );

      // Mirror the stream to the plate scanner video to avoid hardware conflict
      setTimeout(() => {
        const qrVideo = document.querySelector("#qr-reader video") as HTMLVideoElement;
        if (qrVideo && plateVideoRef.current) {
          plateVideoRef.current.srcObject = qrVideo.srcObject;
          plateVideoRef.current.play().catch(console.warn);
        }
      }, 1500);
    } catch (err) {
      console.error("[Camera] Lỗi:", err);
      toast.error("Không thể truy cập camera. Vui lòng cấp quyền.");
    } finally {
      isInitializing.current = false;
    }
  };

  useEffect(() => {
    isMounted.current = true;
    startCamera();

    const initWorker = async () => {
      try {
        const worker = await Tesseract.createWorker("eng", 1, {
          logger: () => { }
        });
        await worker.setParameters({
          tessedit_char_whitelist: "0123456789ABCDEFGHKLMNPSTUVXYZ",
          tessedit_pageseg_mode: "6" as any,
        });
        if (isMounted.current) {
          tesseractWorkerRef.current = worker;
        } else {
          await worker.terminate();
        }
      } catch (e) {
        console.error("OCR Worker Init Error:", e);
      }
    };
    initWorker();

    return () => {
      isMounted.current = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => { });
        } else {
          scannerRef.current.clear();
        }
      }
      if (tesseractWorkerRef.current) {
        const worker = tesseractWorkerRef.current;
        tesseractWorkerRef.current = null;
        worker.terminate().catch(() => { });
      }
    };
  }, []);

  const handleResetScanner = () => {
    setQrContent("");
    setSelectedFile(null);
    setPreview(null);
    setDetectedPlate("");
    setLastPenaltyScan(null);
  };

  const runOCR = useCallback(async () => {
    const video = document.querySelector("#qr-reader video") as HTMLVideoElement;
    if (!video || video.readyState < 2 || isScanningPlate || isOcrRunning.current || isVerifying.current || !tesseractWorkerRef.current || !isMounted.current) return;

    isOcrRunning.current = true;
    setIsScanningPlate(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const cropWidth = video.videoWidth * 0.9;
      const cropHeight = video.videoHeight * 0.5;
      const startX = (video.videoWidth - cropWidth) / 2;
      const startY = (video.videoHeight - cropHeight) / 2;

      // 1. Capture clean image for Server (No upscaling, high quality)
      const serverCanvas = document.createElement("canvas");
      serverCanvas.width = cropWidth;
      serverCanvas.height = cropHeight;
      const sCtx = serverCanvas.getContext("2d");
      sCtx?.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      const colorBlob = await new Promise<Blob | null>(resolve => serverCanvas.toBlob(resolve, "image/jpeg", 0.95));

      // 2. Upscale for LOCAL OCR only
      const scale = 1.5;
      canvas.width = cropWidth * scale;
      canvas.height = cropHeight * scale;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

      const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const colorPreview = canvas.toDataURL("image/jpeg");

      // Expanded thresholding with noise reduction simulation
      const thresholds = [128, 100, 150, 70, 180, 210];
      let plate = null;

      for (const threshold of thresholds) {
        if (!isMounted.current || !tesseractWorkerRef.current) break;

        const imageData = new ImageData(new Uint8ClampedArray(originalImageData.data), originalImageData.width, originalImageData.height);
        const data = imageData.data;

        // Luminance-based grayscale + Thresholding
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const val = gray > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = val;
        }

        ctx.putImageData(imageData, 0, 0);

        try {
          const result = await tesseractWorkerRef.current.recognize(canvas);
          const found = findPlate(result?.data?.text || "");

          if (found) {
            // Consistency Check: Require the same plate twice to confirm
            if (found === lastDetectedPlateRef.current) {
              detectionConsistencyRef.current += 1;
            } else {
              lastDetectedPlateRef.current = found;
              detectionConsistencyRef.current = 1;
            }

            if (detectionConsistencyRef.current >= 2) {
              plate = found;
              console.log(`[OCR] Confirmed plate:`, found);
              toast.success(`Đã nhận diện: ${found}`, {
                duration: 2000,
                icon: "🚗"
              });
              detectionConsistencyRef.current = 0; // Reset
              break;
            }
          }
        } catch (err) { }
      }

      if (plate && isMounted.current) {
        setDetectedPlate(plate);
        setPreview(colorPreview);
        if (colorBlob) setSelectedFile(new File([colorBlob], "plate.jpg", { type: "image/jpeg" }));
      }
    } catch (error) {
      console.error("OCR Error:", error);
    } finally {
      if (isMounted.current) setIsScanningPlate(false);
      isOcrRunning.current = false;
    }
  }, [isScanningPlate]);

  const findPlate = (text: string) => {
    if (!text || typeof text !== "string") return null;

    // Clean text but keep it as close as possible to raw for initial match
    const cleanText = text.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Broad Vietnamese plate regex (Matches 2 digits + 1-3 chars + 4-5 digits)
    const plateRegex = /\d{2}[A-Z0-9]{1,3}\d{4,5}/;
    const match = cleanText.match(plateRegex);

    if (match) return match[0];

    // Fallback: If no match, try common character swaps for OCR errors
    // E.g. '8' misread as 'B', '0' as 'O', '1' as 'I'
    const fuzzyText = cleanText
      .replace(/B/g, "8")
      .replace(/O/g, "0")
      .replace(/D/g, "0")
      .replace(/I/g, "1")
      .replace(/S/g, "5");

    const fuzzyMatch = fuzzyText.match(plateRegex);
    return fuzzyMatch ? fuzzyMatch[0] : null;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedFile) runOCR();
    }, 600);
    return () => clearInterval(interval);
  }, [runOCR, selectedFile]);

  useEffect(() => {
    if (qrContent && selectedFile && !isVerifying.current) {
      handleVerifyAll();
    }
  }, [qrContent, selectedFile]);

  const handleGateChange = (id: string) => {
    setSelectedGateId(id);
    localStorage.setItem(`gate_config_${selectedParkingLotId}`, id);
    setQrContent("");
    setSelectedFile(null);
    setPreview(null);
  };

  const handleVerifyAll = async () => {
    if (isVerifying.current) return;
    isVerifying.current = true;
    setLoading(true);

    const formData = new FormData();
    formData.append("content", qrContent);
    formData.append("image", selectedFile!);
    formData.append("gateId", selectedGateId);

    try {
      const res = await fetch(`${API_BASE_URL}/booking/scan`, {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        // Backend uses TransformInterceptor, so the real data is in data.data
        const actualData = data.data || data;
        const msg = (data.message || actualData.message || "").toLowerCase();
        const extensionFeeValue = actualData.extensionFee || actualData.extension_fee || 0;
        
        // 1. Trường hợp có phí phạt quá hạn (ưu tiên xử lý thanh toán mặt)
        if (actualData.penalty?.isLate && actualData.penalty?.penaltyFee > 0) {
          setLastExtensionScan({
            type: 'penalty',
            fee: actualData.penalty.penaltyFee,
            plate: actualData.penalty.plate || detectedPlate || "???",
            bookingId: actualData.bookingId,
            gateId: selectedGateId,
            content: qrContent,
            imageUrl: actualData.imageUrl,
            lateMinutes: actualData.penalty.lateMinutes
          });
          setLastPenaltyScan(null);
        } 
        // 2. Trường hợp có phí gia hạn chưa thanh toán
        else if (Number(extensionFeeValue) > 0 || msg.includes("gia hạn")) {
          setLastExtensionScan({
            type: 'extension',
            fee: Number(extensionFeeValue),
            plate: actualData.plate || detectedPlate || "???",
            bookingId: actualData.bookingId,
            gateId: selectedGateId,
            content: qrContent,
            imageUrl: actualData.imageUrl
          });
          setLastPenaltyScan(null);
        } 
        // 3. Trường hợp checkout bình thường (có thể có penalty nhưng đã trả hoặc không có phí)
        else if (actualData.penalty?.isLate) {
          setLastPenaltyScan(actualData.penalty);
          setLastExtensionScan(null);
        } else {
          const successMsg = data.message || actualData.message || "Xác thực thành công!";
          toast.success(successMsg);
          alert(successMsg);
          setLastPenaltyScan(null);
          setLastExtensionScan(null);
        }

        setQrContent("");
        setSelectedFile(null);
        setPreview(null);
        setDetectedPlate("");
        fetchHistory();
      } else {
        // Map server error messages to user-friendly ones
        let errorMsg = data.message || "Xác thực thất bại!";
        const lowerMsg = errorMsg.toLowerCase();

        if (lowerMsg.includes("biển số") || lowerMsg.includes("plate")) {
          // If server provides a detailed comparison, show it
          if (errorMsg.includes("!") || errorMsg.includes("vs") || errorMsg.includes("đối chiếu")) {
            toast.error(errorMsg, { duration: 6000 });
            alert(errorMsg);
          } else {
            toast.error("Sai biển số xe!", { duration: 4000 });
            alert("Sai biển số xe!");
          }
        } else {
          // Show the actual error message from server (e.g., "Mã QR đã sử dụng", "Quá hạn", etc.)
          toast.error(errorMsg, { duration: 5000 });
          alert(errorMsg);
        }

        setQrContent("");
        setSelectedFile(null);
        setPreview(null);
        setDetectedPlate("");
      }
    } catch (error) {
      toast.error("Lỗi kết nối Backend!");
      setQrContent("");
      setSelectedFile(null);
      setPreview(null);
    } finally {
      setLoading(false);
      isVerifying.current = false;
    }
  };

  const handleConfirmExtensionPayment = async () => {
    if (!lastExtensionScan || loading) return;
    setLoading(true);

    try {
      const payload: any = {
        bookingId: lastExtensionScan.bookingId,
        gateId: Number(lastExtensionScan.gateId),
        content: lastExtensionScan.content,
        imageUrl: lastExtensionScan.imageUrl
      };

      // Nếu là phí phạt, truyền thêm penaltyFee để backend tạo invoice PAID
      if (lastExtensionScan.type === 'penalty') {
        payload.penaltyFee = lastExtensionScan.fee;
      }

      const res = await fetch(`${API_BASE_URL}/booking/confirm-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Đã xác nhận thanh toán và hoàn tất check-out!");
        setLastExtensionScan(null);
        fetchHistory();
      } else {
        const error = await res.json();
        toast.error(error.message || "Lỗi khi xác nhận thanh toán!");
      }
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 md:p-8 font-roboto transition-all duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner shrink-0">
              <IconBuildingStore size={28} className="md:size-[36px]" stroke={2} />
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 animate-pulse text-[10px] px-2 py-0">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 mr-1"></div>
                  Trực tuyến
                </Badge>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest hidden sm:block">Management System</p>
              </div>
              <h1 className="text-xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight uppercase leading-tight">
                {gates.find(g => g.id.toString() === selectedGateId)?.parkingLot?.name || "BÃI ĐỖ XE GOPARK"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Separator orientation="vertical" className="hidden md:block h-12" />
            <div className="flex flex-col items-end">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Thời gian thực</p>
              <div className="flex items-center gap-2 text-2xl font-bold text-primary tabular-nums">
                <IconClock size={20} />
                {currentTime.toLocaleTimeString('vi-VN', { hour12: false })}
              </div>
            </div>
          </div>
        </div>

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden group hover:border-primary/50 transition-all">
            <CardContent className="p-4 md:p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
                <IconCalendarEvent size={24} />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-0.5">Ngày làm việc</p>
                <p className="text-lg md:text-xl font-bold tracking-tight">
                  {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden group hover:border-primary/50 transition-all">
            <CardContent className="p-4 md:p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                <IconMapPin size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-0.5">Điểm quét</p>
                <p className="text-lg md:text-xl font-bold tracking-tight truncate uppercase">
                  {gates.find(g => g.id.toString() === selectedGateId)?.name || "Đang chọn..."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden group hover:border-primary/50 transition-all sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 md:p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform shrink-0">
                <IconCircleCheck size={24} />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-0.5">Lượt quét hôm nay</p>
                <p className="text-lg md:text-xl font-bold tracking-tight">
                  {gates.find(g => g.id.toString() === selectedGateId)?.count?.toLocaleString() || 0} lượt
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* PENALTY PERSISTENT BANNER */}
        {lastPenaltyScan && (
          <div className={`p-6 rounded-[2.5rem] border-4 animate-in slide-in-from-top-4 duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden ${lastPenaltyScan.paymentStatus === 'success'
            ? 'bg-white border-emerald-500 text-emerald-900 dark:bg-zinc-900 dark:border-emerald-500 dark:text-emerald-400'
            : 'bg-white border-red-500 text-red-900 dark:bg-zinc-900 dark:border-red-500 dark:text-red-400'
            }`}>
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 ${lastPenaltyScan.paymentStatus === 'success' ? 'bg-emerald-500' : 'bg-red-500'
              }`}></div>

            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${lastPenaltyScan.paymentStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white animate-pulse'
                }`}>
                <IconAlertCircle size={36} stroke={2.5} />
              </div>

              <div className="flex-1 text-center md:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h4 className="text-2xl font-black uppercase tracking-tighter">
                    {lastPenaltyScan.paymentStatus === 'success' ? 'Phí phạt quá hạn' : 'Cảnh báo thu tiền mặt'}
                  </h4>
                  <Badge variant={lastPenaltyScan.paymentStatus === 'success' ? 'default' : 'destructive'} className="px-3 py-0.5 text-xs font-black uppercase tracking-widest border-2 border-white/20 shadow-sm">
                    {lastPenaltyScan.paymentStatus === 'success' ? 'Đã trừ ví' : 'CHƯA THANH TOÁN'}
                  </Badge>
                </div>
                <p className="font-bold text-lg opacity-80 leading-tight">
                  Biển số <span className="underline decoration-2 underline-offset-4">{detectedPlate || lastPenaltyScan.plate || "???"}</span> ra muộn <span className="text-primary dark:text-primary-foreground font-black">{lastPenaltyScan.lateMinutes} phút</span>.
                  {lastPenaltyScan.paymentStatus === 'success'
                    ? ` Hệ thống đã khấu trừ ${lastPenaltyScan.penaltyFee?.toLocaleString()}đ thành công.`
                    : ` Vui lòng thu trực tiếp ${lastPenaltyScan.penaltyFee?.toLocaleString()}đ trước khi mở cổng.`
                  }
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button
                  onClick={() => setLastPenaltyScan(null)}
                  variant="outline"
                  className={`flex-1 md:flex-none h-14 rounded-2xl border-2 font-black uppercase tracking-widest transition-all ${lastPenaltyScan.paymentStatus === 'success'
                    ? 'border-emerald-500/20 text-emerald-600 hover:bg-emerald-50'
                    : 'border-red-500/20 text-red-600 hover:bg-red-50'
                    }`}
                >
                  <IconRefresh className="mr-2" size={18} /> Bỏ qua
                </Button>
                <Button
                  onClick={() => setLastPenaltyScan({ ...lastPenaltyScan })} // Re-trigger modal by updating state reference
                  className={`flex-1 md:flex-none h-14 px-8 rounded-2xl font-black uppercase tracking-widest shadow-lg ${lastPenaltyScan.paymentStatus === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                    }`}
                >
                  Chi tiết
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN SCANNING SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* QR SCANNER */}
          <Card className="bg-zinc-950 border-zinc-800 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl relative">
            <CardHeader className="border-b border-white/5 bg-zinc-900/50 flex flex-row items-center justify-between p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-1.5 md:p-2 bg-emerald-500/10 rounded-lg">
                  <IconQrcode className="text-emerald-500 size-5 md:size-6" />
                </div>
                <div>
                  <CardTitle className="text-xs md:text-sm font-black text-white tracking-widest uppercase">MÁY QUÉT QR</CardTitle>
                  <CardDescription className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold">Primary QR Code Reader</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shadow-[0_0_8px_#10b981]"></div>
                  SCANNING ACTIVE
                </Badge>
              </div>
            </CardHeader>
            <div className="relative aspect-video bg-black overflow-hidden">
              <div id="qr-reader" className="w-full h-full border-0"></div>
              <style>{`
                #qr-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; opacity: 0.7; }
                #qr-reader { border: none !important; }
              `}</style>

              {/* Scan Overlay UI - Matched with 280px qrbox */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[280px] h-[280px] relative">
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>

                  {/* Scanning Animation Line */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/50 shadow-[0_0_15px_#10b981] animate-scan-line"></div>

                  {!qrContent && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 md:w-24 md:h-24 border border-emerald-500/20 rounded-full animate-ping"></div>
                      <div className="w-2 md:w-3 h-2 md:h-3 bg-emerald-500 rounded-full shadow-[0_0_15px_#10b981]"></div>
                    </div>
                  )}
                </div>
              </div>

              {qrContent && (
                <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center z-20 p-4 md:p-8 animate-in fade-in duration-300">
                  <div className="text-center space-y-6 md:space-y-8 max-w-[280px] md:max-w-sm">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 scale-110 md:scale-125">
                      <IconQrcode className="text-emerald-500" size={32} />
                    </div>
                    <div className="space-y-2">
                      <p className="font-black text-white text-base md:text-xl tracking-widest uppercase">MÃ QR ĐÃ QUÉT</p>
                      <div className="p-3 md:p-4 bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl font-mono text-emerald-400 break-all text-xs md:text-sm shadow-inner">
                        {qrContent}
                      </div>
                    </div>
                    <Button
                      onClick={handleResetScanner}
                      variant="outline"
                      className="w-full h-14 rounded-2xl border-zinc-700 text-white hover:bg-zinc-800 font-bold uppercase tracking-widest"
                    >
                      <IconRefresh className="mr-2" size={16} /> Quét lại mã khác
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* PLATE SCANNER */}
          <Card className="bg-zinc-950 border-zinc-800 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl relative">
            <CardHeader className="border-b border-white/5 bg-zinc-900/50 flex flex-row items-center justify-between p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg">
                  <IconCamera className="text-blue-500 size-5 md:size-6" />
                </div>
                <div>
                  <CardTitle className="text-xs md:text-sm font-black text-white tracking-widest uppercase">NHẬN DIỆN BIỂN SỐ</CardTitle>
                  <CardDescription className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold">AI Powered OCR Recognition</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 shadow-[0_0_8px_#3b82f6]"></div>
                  AI ANALYZING
                </Badge>
              </div>
            </CardHeader>
            <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
              <video
                ref={plateVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover opacity-70"
              />
              <canvas ref={canvasRef} className="hidden" />

              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[85%] h-[40%] border-2 border-white/20 rounded-xl md:rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 md:h-1 bg-blue-500 shadow-[0_0_20px_#3b82f6] animate-scan-line"></div>
                </div>
              </div>

              {detectedPlate && (
                <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center z-30 animate-in fade-in duration-300">
                  <div className="text-center space-y-4 md:space-y-6 max-w-[280px] md:max-w-sm w-full px-4 md:px-6">
                    <p className="text-[9px] md:text-[10px] text-blue-400 font-black tracking-[0.3em] uppercase">DETECTED PLATE</p>
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                      <div className="relative bg-white text-zinc-900 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 md:border-4 border-zinc-300 shadow-2xl">
                        <span className="text-3xl md:text-5xl font-black tracking-[0.1em] font-mono leading-none">
                          {detectedPlate}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => { setDetectedPlate(""); setSelectedFile(null); }}
                        className="flex-1 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest"
                      >
                        <IconRefresh size={16} className="mr-2" /> Thử lại
                      </Button>
                      {qrContent && (
                        <Button
                          onClick={handleVerifyAll}
                          disabled={loading}
                          className="flex-1 h-10 md:h-12 rounded-lg md:rounded-xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-xs"
                        >
                          {loading ? <IconLoader2 className="animate-spin" /> : "Xác nhận"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* GATES SELECTION SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg md:text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Cổng ra/vào</h3>
            <Badge variant="secondary" className="font-bold text-[10px]">
              {gates.length} Cổng khả dụng
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {gatesLoading ? (
              [1, 2, 3].map(i => (
                <Card key={i} className="rounded-2xl border-zinc-200 dark:border-zinc-800 p-4 md:p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-xl" />
                      <Skeleton className="w-16 h-5 md:w-20 md:h-6 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <div className="pt-4 border-t border-dashed">
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                </Card>
              ))
            ) : gates.map((gate) => {
              const isActive = selectedGateId === gate.id.toString();
              return (
                <Card
                  key={gate.id}
                  onClick={() => handleGateChange(gate.id.toString())}
                  className={`cursor-pointer rounded-2xl transition-all duration-300 relative border-2 
                    ${isActive
                      ? 'border-primary bg-primary/[0.02] shadow-lg shadow-primary/5 scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                    }
                  `}
                >
                  <CardContent className="p-4 md:p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-colors
                        ${isActive ? 'bg-primary text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}
                      `}>
                        <IconBuildingStore size={20} className="md:size-6" />
                      </div>
                      <Badge
                        variant={gate.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={`text-[9px] ${gate.status === 'ACTIVE' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                      >
                        {gate.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'BẢO TRÌ'}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight uppercase line-clamp-1">{gate.name}</h4>
                      <p className="text-zinc-500 text-[11px] font-medium line-clamp-1 leading-relaxed">
                        {gate.desc || "Hệ thống kiểm soát phương tiện tự động"}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">TỔNG LƯỢT QUÉT</span>
                      <span className="text-lg font-black tabular-nums">{gate.count?.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* RECENT HISTORY SECTION */}
        <Card className="rounded-2xl md:rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 md:p-8 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                  <IconHistory size={20} className="md:size-6" />
                </div>
                <div>
                  <CardTitle className="text-lg md:text-2xl font-black tracking-tight uppercase">Lịch sử quét</CardTitle>
                  <CardDescription className="text-xs font-medium">Theo dõi thời gian thực các lượt xe ra vào</CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={timeRange} onValueChange={(val: any) => { setTimeRange(val); setCurrentPage(1); }}>
                  <SelectTrigger className="flex-1 md:w-[160px] h-10 rounded-xl bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-bold text-xs">
                    <SelectValue placeholder="Khoảng thời gian" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="24H">24 giờ qua</SelectItem>
                    <SelectItem value="7D">7 ngày qua</SelectItem>
                    <SelectItem value="MONTH">Tháng này</SelectItem>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-xl border-zinc-200 dark:border-zinc-700"
                  onClick={fetchHistory}
                >
                  <IconRefresh size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>

          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                  <TableHead className="px-4 md:px-8 py-4 text-[10px] font-black uppercase tracking-widest">Phương tiện</TableHead>
                  <TableHead className="px-4 md:px-8 py-4 text-[10px] font-black uppercase tracking-widest">Thời điểm</TableHead>
                  <TableHead className="px-4 md:px-8 py-4 text-[10px] font-black uppercase tracking-widest">Thao tác</TableHead>
                  <TableHead className="px-4 md:px-8 py-4 text-[10px] font-black uppercase tracking-widest hidden sm:table-cell">Cổng</TableHead>
                  <TableHead className="px-4 md:px-8 py-4 text-[10px] font-black uppercase tracking-widest">Trạng thái</TableHead>
                  <TableHead className="px-4 md:px-8 py-4 text-[10px] font-black uppercase tracking-widest text-center">Snapshot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-50 dark:border-zinc-800">
                      <TableCell colSpan={6} className="p-4">
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : scanHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
                        <IconAlertCircle size={32} stroke={1} />
                        <p className="font-bold uppercase tracking-widest text-[10px]">Chưa có dữ liệu</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  scanHistory.map((log) => {
                    const isIn = log.check_status === 'in';
                    const logTime = new Date(log.time);
                    return (
                      <TableRow key={log.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors border-zinc-50 dark:border-zinc-800">
                        <TableCell className="px-4 md:px-8 py-4">
                          <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 inline-flex items-center">
                            <span className="text-sm md:text-base font-black tracking-widest font-mono whitespace-nowrap">
                              {log.booking?.vehicle?.plate_number || "---"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 md:px-8 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold tabular-nums">
                              {logTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              {logTime.toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-6">
                          <Badge
                            variant="secondary"
                            className={`h-8 px-4 font-black tracking-widest text-[10px]
                              ${isIn
                                ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                : 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
                              }
                            `}
                          >
                            {isIn ? <IconArrowRight size={12} className="mr-1" /> : <IconArrowLeft size={12} className="mr-1" />}
                            {isIn ? 'VÀO' : 'RA'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 md:px-8 py-4 hidden sm:table-cell">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                            {log.gate?.name || "---"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 md:px-8 py-4">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                            Xong
                          </div>
                        </TableCell>
                        <TableCell className="px-4 md:px-8 py-4 text-center">
                          {log.image_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="group/thumb p-0.5 h-9 w-14 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white hover:bg-zinc-50 shrink-0"
                              onClick={() => {
                                const origin = new URL(API_BASE_URL).origin;
                                setSelectedSnapshot(`${origin}${log.image_url}`);
                              }}
                            >
                              <img
                                src={`${new URL(API_BASE_URL).origin}${log.image_url}`}
                                className="w-full h-full object-cover rounded-lg group-hover/thumb:scale-110 transition-transform"
                                alt="snapshot"
                              />
                            </Button>
                          ) : (
                            <div className="inline-flex h-9 w-14 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-dashed border-zinc-200 dark:border-zinc-700">
                              <IconAlertCircle size={14} className="text-zinc-300" />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION */}
          {totalCount > pageSize && (
            <div className="p-4 md:p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                <span className="text-zinc-900 dark:text-white font-black">{scanHistory.length}</span> / {totalCount} kết quả
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl h-9 w-9 shadow-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <IconArrowLeft size={16} />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                    {currentPage}
                  </div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase">/ {Math.ceil(totalCount / pageSize)}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl h-9 w-9 shadow-sm"
                  disabled={currentPage * pageSize >= totalCount}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  <IconArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* SNAPSHOT DIALOG */}
      <Dialog open={!!selectedSnapshot} onOpenChange={() => setSelectedSnapshot(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
          <div className="relative w-full aspect-video bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <DialogHeader className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <IconCamera className="text-primary" size={20} />
                  </div>
                  <DialogTitle className="text-white font-black tracking-widest uppercase">CHI TIẾT ẢNH CHỤP</DialogTitle>
                </div>
              </div>
            </DialogHeader>
            {selectedSnapshot && (
              <img
                src={selectedSnapshot}
                className="w-full h-full object-contain"
                alt="full-snapshot"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* GLOBAL LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300 p-4">
          <Card className="bg-white dark:bg-zinc-900 border-none shadow-2xl p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] flex flex-col items-center gap-4 md:gap-6 max-w-xs w-full">
            <div className="relative">
              <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <IconQrcode className="absolute inset-0 m-auto text-primary animate-pulse" size={20} />
            </div>
            <div className="text-center">
              <p className="font-black tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs uppercase text-zinc-900 dark:text-white">Processing</p>
              <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Đang xác thực thông tin...</p>
            </div>
          </Card>
        </div>
      )}
      {/* PENALTY MODAL (Prominent Overlay - Moved to bottom for global visibility) */}
      <Dialog open={!!lastPenaltyScan} onOpenChange={(open) => !open && setLastPenaltyScan(null)}>
        <DialogContent className="sm:max-w-[440px] w-[95vw] max-h-[96vh] overflow-y-auto rounded-[1.5rem] md:rounded-[2rem] border-none p-0 shadow-[0_0_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl bg-white/95 dark:bg-zinc-900/95 animate-in fade-in zoom-in duration-300">
          <div className={`p-5 md:p-6 ${lastPenaltyScan?.paymentStatus === 'success'
            ? 'bg-emerald-500/10'
            : 'bg-red-500/10'
            }`}>
            <div className="flex flex-col items-center text-center space-y-4 md:space-y-5">
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-xl ${lastPenaltyScan?.paymentStatus === 'success'
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-red-500 text-white shadow-red-500/20 animate-pulse'
                }`}>
                <IconAlertCircle className="size-8 md:size-10" stroke={2.5} />
              </div>

              <div className="space-y-1.5">
                <h2 className={`text-lg md:text-xl font-black uppercase tracking-tight leading-tight ${lastPenaltyScan?.paymentStatus === 'success' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                  {lastPenaltyScan?.paymentStatus === 'success' ? 'Thanh Toán Phạt' : 'Yêu Cầu Tiền Mặt'}
                </h2>
                <div className="flex justify-center">
                  <Badge variant={lastPenaltyScan?.paymentStatus === 'success' ? 'default' : 'destructive'} className="px-3 md:px-4 py-0.5 md:py-1 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-full border-2 border-white/20">
                    {lastPenaltyScan?.paymentStatus === 'success' ? 'VÍ ĐÃ TRỪ TIỀN' : 'CHƯA THANH TOÁN'}
                  </Badge>
                </div>
              </div>

              <div className="w-full space-y-3 bg-zinc-100/50 dark:bg-black/40 p-4 md:p-5 rounded-2xl border border-zinc-200/50 dark:border-white/5 shadow-inner">
                <div className="flex justify-between items-center border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-2 md:pb-3">
                  <span className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Thời gian quá hạn</span>
                  <span className="text-base md:text-lg font-black text-zinc-900 dark:text-white underline decoration-primary decoration-2 underline-offset-4">
                    {lastPenaltyScan?.lateMinutes} PHÚT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Số tiền cần thu</span>
                  <span className={`text-2xl md:text-3xl font-black tracking-tighter ${lastPenaltyScan?.paymentStatus === 'success' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                    {lastPenaltyScan?.penaltyFee?.toLocaleString()}đ
                  </span>
                </div>
              </div>

              <div className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-3 md:p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <p className="text-[11px] md:text-xs font-bold text-zinc-700 dark:text-zinc-300 leading-tight uppercase">
                  {lastPenaltyScan?.paymentStatus === 'success'
                    ? "Hệ thống đã tự động khấu trừ tiền phạt."
                    : "Ví khách không đủ tiền. Thu tiền mặt trước khi mở cổng."
                  }
                </p>
              </div>

              <Button
                onClick={() => setLastPenaltyScan(null)}
                className={`w-full h-11 md:h-12 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-95 ${lastPenaltyScan?.paymentStatus === 'success'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
              >
                Xác nhận & Hoàn tất
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EXTENSION FEE MODAL */}
      <Dialog open={!!lastExtensionScan} onOpenChange={(open) => !open && setLastExtensionScan(null)}>
        <DialogContent className="sm:max-w-[440px] w-[95vw] max-h-[96vh] overflow-y-auto rounded-[1.5rem] md:rounded-[2rem] border-none p-0 shadow-[0_0_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl bg-white/95 dark:bg-zinc-900/95 animate-in fade-in zoom-in duration-300">
          <div className="p-5 md:p-6 bg-emerald-500/10">
            <div className="flex flex-col items-center text-center space-y-4 md:space-y-5">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
                <IconClock className="size-8 md:size-10" stroke={2.5} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight leading-tight text-emerald-600">
                  {lastExtensionScan?.type === 'penalty' ? 'Thanh Toán Phí Phạt' : 'Thanh Toán Gia Hạn'}
                </h2>
                <div className="flex justify-center">
                  <Badge variant="outline" className="px-3 md:px-4 py-0.5 md:py-1 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-full border-2 border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                    PHÍ PHÁT SINH
                  </Badge>
                </div>
              </div>

              <div className="w-full space-y-3 bg-zinc-100/50 dark:bg-black/40 p-4 md:p-5 rounded-2xl border border-zinc-200/50 dark:border-white/5 shadow-inner">
                <div className="flex justify-between items-center border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-2 md:pb-3">
                  <span className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Loại phí</span>
                  <span className="text-sm md:text-base font-black text-zinc-900 dark:text-white uppercase">
                    {lastExtensionScan?.type === 'penalty' ? 'Phí phạt quá hạn' : 'Gia hạn thêm giờ'}
                  </span>
                </div>
                
                {lastExtensionScan?.type === 'penalty' && (
                  <div className="flex justify-between items-center border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-2 md:pb-3">
                    <span className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Thời gian trễ</span>
                    <span className="text-sm md:text-base font-black text-red-500 uppercase">
                      {lastExtensionScan?.lateMinutes} phút
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Số tiền cần thu</span>
                  <span className="text-2xl md:text-3xl font-black tracking-tighter text-emerald-600">
                    {lastExtensionScan?.fee?.toLocaleString()}đ
                  </span>
                </div>
              </div>

              <div className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-3 md:p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <p className="text-[11px] md:text-xs font-bold text-zinc-700 dark:text-zinc-300 leading-tight uppercase">
                  {lastExtensionScan?.type === 'penalty' 
                    ? "Khách quá thời gian đỗ xe." 
                    : "Khách có phí gia hạn chưa trả."
                  } Biển số: <span className="text-emerald-600 font-black">{lastExtensionScan?.plate}</span>
                </p>
                <p className="text-[9px] md:text-[10px] text-zinc-500 font-medium mt-1 italic">
                  * Thu tiền mặt trước khi xác nhận.
                </p>
              </div>

              <div className="flex gap-2 md:gap-3 w-full">
                <Button
                  onClick={() => setLastExtensionScan(null)}
                  variant="outline"
                  className="flex-1 h-10 md:h-12 rounded-xl border-2 border-zinc-200 font-black uppercase tracking-wider text-zinc-500 hover:bg-zinc-50 text-[10px] md:text-xs"
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={handleConfirmExtensionPayment}
                  disabled={loading}
                  className="flex-[2] h-10 md:h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-black uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? <IconLoader2 className="animate-spin" /> : "Xác nhận"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
