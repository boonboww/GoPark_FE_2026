"use client";
import { useAuthStore } from "@/stores";
import { API_BASE_URL } from "@/lib/api";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
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
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tesseractWorkerRef = useRef<Tesseract.Worker | null>(null);
  const isInitializing = useRef(false);
  const { accessToken, user } = useAuthStore();

  const isProcessing = useRef(false);
  const isMounted = useRef(true);

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
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (text) => {
          setQrContent((prev) => {
            if (prev) return prev;
            return text;
          });
        },
        (err) => { }
      );
    } catch (err) {
      console.error("Camera error:", err);
    } finally {
      isInitializing.current = false;
    }
  };

  useEffect(() => {
    startCamera();

    const initWorker = async () => {
      const worker = await Tesseract.createWorker("eng", 1, {
        logger: () => { }
      });
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789ABCDEFGHKLMNPSTUVXYZ",
      });
      tesseractWorkerRef.current = worker;
    };
    initWorker();

    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(console.error);
        } else {
          scannerRef.current.clear();
        }
      }
      if (tesseractWorkerRef.current) {
        tesseractWorkerRef.current.terminate();
        tesseractWorkerRef.current = null;
      }
      isMounted.current = false;
    };
  }, []);

  const handleResetScanner = () => {
    setQrContent("");
    setSelectedFile(null);
    setPreview(null);
    setDetectedPlate("");
  };

  const runOCR = useCallback(async () => {
    if (!webcamRef.current || isScanningPlate || isProcessing.current || !tesseractWorkerRef.current || !isMounted.current) return;

    isProcessing.current = true;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsScanningPlate(true);

    try {
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const cropWidth = img.width * 0.7;
      const cropHeight = img.height * 0.5;
      const startX = (img.width - cropWidth) / 2;
      const startY = (img.height - cropHeight) / 2;

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.drawImage(img, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      const colorBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg"));
      const colorPreview = canvas.toDataURL("image/jpeg");

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const applyThreshold = (threshold: number) => {
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const val = avg > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = val;
        }
        ctx.putImageData(imageData, 0, 0);
      };

      applyThreshold(130);

      if (!tesseractWorkerRef.current || !isMounted.current) return;

      let result;
      try {
        result = await tesseractWorkerRef.current.recognize(canvas);
      } catch (err) {
        console.error("Tesseract recognize error:", err);
        return;
      }

      if (!isMounted.current) return;
      let plate = findPlate(result.data.text);

      if (!plate && tesseractWorkerRef.current && isMounted.current) {
        applyThreshold(100);
        try {
          result = await tesseractWorkerRef.current.recognize(canvas);
          plate = findPlate(result.data.text);
        } catch (e) { }
      }

      if (plate && isMounted.current) {
        setDetectedPlate(plate);
        setPreview(colorPreview);
        if (colorBlob) setSelectedFile(new File([colorBlob], "plate.jpg", { type: "image/jpeg" }));
      }
    } catch (error) {
      console.error("OCR Error:", error);
    } finally {
      if (isMounted.current) {
        setIsScanningPlate(false);
      }
      isProcessing.current = false;
    }
  }, [isScanningPlate]);

  const findPlate = (text: string) => {
    const cleanText = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const plateRegex = /[0-9]{2}[A-Z][0-9A-Z]?[0-9]{4,5}/;
    const match = cleanText.match(plateRegex);
    return match ? match[0] : null;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedFile) runOCR();
    }, 600);
    return () => clearInterval(interval);
  }, [runOCR, selectedFile]);

  useEffect(() => {
    if (qrContent && selectedFile && !isProcessing.current) {
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
    if (isProcessing.current) return;
    isProcessing.current = true;
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
        toast.success(data.message || "Xác thực thành công!");
        setQrContent("");
        setSelectedFile(null);
        setPreview(null);
        setDetectedPlate("");
        fetchHistory();
      } else {
        toast.error(data.message || "Xác thực thất bại!");
        setQrContent("");
        setSelectedFile(null);
        setPreview(null);
      }
    } catch (error) {
      toast.error("Lỗi kết nối Backend!");
      setQrContent("");
      setSelectedFile(null);
      setPreview(null);
    } finally {
      setLoading(false);
      isProcessing.current = false;
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
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-end border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800 pt-3 sm:pt-0">
            <Separator orientation="vertical" className="hidden sm:block h-10" />
            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0 w-full sm:w-auto justify-between">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Thời gian thực</p>
              <div className="flex items-center gap-1.5 text-lg md:text-2xl font-bold text-primary tabular-nums">
                <IconClock className="size-4 md:size-5" />
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
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-[9px] px-1.5 py-0">
                LIVE FEED
              </Badge>
            </CardHeader>
            <div className="relative aspect-video bg-black overflow-hidden">
              <div id="qr-reader" className="w-full h-full border-0"></div>
              <style>{`
                #qr-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; opacity: 0.7; }
                #qr-reader { border: none !important; }
              `}</style>
              
              {/* Scan Overlay UI */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-40 h-40 md:w-56 md:h-56 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 md:w-12 md:h-12 border-t-2 md:border-t-4 border-l-2 md:border-l-4 border-emerald-500 rounded-tl-xl md:rounded-tl-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 md:w-12 md:h-12 border-t-2 md:border-t-4 border-r-2 md:border-r-4 border-emerald-500 rounded-tr-xl md:rounded-tr-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 md:w-12 md:h-12 border-b-2 md:border-b-4 border-l-2 md:border-l-4 border-emerald-500 rounded-bl-xl md:rounded-bl-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 md:w-12 md:h-12 border-b-2 md:border-b-4 border-r-2 md:border-r-4 border-emerald-500 rounded-br-xl md:rounded-br-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>
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
                      className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl border-zinc-700 text-white hover:bg-zinc-800 font-bold uppercase tracking-widest text-xs"
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
              <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10 text-[9px] px-1.5 py-0">
                AI PROCESSING
              </Badge>
            </CardHeader>
            <div className="relative aspect-video bg-black overflow-hidden">
              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover opacity-70" />
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
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                      <Button 
                        onClick={() => { setDetectedPlate(""); setSelectedFile(null); }} 
                        className="flex-1 h-10 md:h-12 rounded-lg md:rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest text-xs"
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                  className="h-10 w-10 rounded-xl border-zinc-200 dark:border-zinc-700 shrink-0"
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
                        <TableCell className="px-4 md:px-8 py-4">
                          <Badge 
                            variant="secondary" 
                            className={`h-7 px-2.5 font-black tracking-widest text-[9px]
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
                                className="w-full h-full object-cover rounded-md group-hover/thumb:scale-110 transition-transform" 
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
            <img 
              src={selectedSnapshot || ""} 
              className="w-full h-full object-contain" 
              alt="full-snapshot"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* GLOBAL LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300">
          <Card className="bg-white dark:bg-zinc-900 border-none shadow-2xl p-10 rounded-[3rem] flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <IconQrcode className="absolute inset-0 m-auto text-primary animate-pulse" size={24} />
            </div>
            <div className="text-center">
              <p className="font-black tracking-[0.3em] text-xs uppercase text-zinc-900 dark:text-white">Processing</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Đang xác thực thông tin...</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}