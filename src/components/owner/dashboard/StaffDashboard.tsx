"use client";
import { useAuthStore } from "@/stores";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";

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
  const [parkingLots, setParkingLots] = useState<any[]>([]);
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
  const isInitializing = useRef(false); // Chống khởi tạo kép
  const { accessToken, user } = useAuthStore();

  const isProcessing = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    // Tự động nhận diện bãi đỗ từ email nhân viên
    const parts = user?.email?.split('.');
    if (parts && parts[0] === 'staff' && parts[1]) {
      setSelectedParkingLotId(parts[1]);
    } else {
      // Nếu không phải staff, có thể fetch bãi đầu tiên để tránh lỗi (dành cho admin/test)
      const fetchFirstLot = async () => {
        try {
          const res = await fetch("http://localhost:8000/api/v1/parking-lots/all");
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
        const res = await fetch(`http://localhost:8000/api/v1/parking-lots/${selectedParkingLotId}/gates`, {
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
      // API lấy lịch sử check-in/check-out thực tế với phân trang và lọc
      const url = `http://localhost:8000/api/v1/booking/live-history/${selectedParkingLotId}?page=${currentPage}&limit=${pageSize}&range=${timeRange}`;
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const result = await res.json();
        // result.data là mảng (do TransformInterceptor unwrapped)
        // result.count là tổng số bản ghi
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

  // Hàm khởi động Camera an toàn
  const startCamera = async () => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    try {
      // 1. Nếu chưa có instance thì tạo mới
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      // 2. Nếu đang scanning thì dừng lại trước khi start cái mới
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      // 3. Start camera
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10, // Giảm fps một chút để camera hoạt động ổn định hơn, tránh quá tải
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (text) => {
          setQrContent((prev) => {
            // Chỉ cập nhật nội dung quét nếu chưa quét trước đó.
            // KHÔNG GỌI stop() để camera luôn sẵn sàng chạy ngầm.
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

    // Khởi tạo Tesseract Worker một lần duy nhất
    const initWorker = async () => {
      const worker = await Tesseract.createWorker("eng", 1, {
        logger: () => { } // Tắt logger để tối ưu CPU
      });
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789ABCDEFGHKLMNPSTUVXYZ",
      });
      tesseractWorkerRef.current = worker;
    };
    initWorker();

    return () => {
      // Cleanup kỹ lưỡng khi unmount
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

  // Logic tiền xử lý ảnh và nhận diện OCR
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

      // --- CẮT ẢNH (ROI CROP) ĐỂ TẬP TRUNG VÀO VÙNG TRUNG TÂM ---
      const cropWidth = img.width * 0.7;
      const cropHeight = img.height * 0.5;
      const startX = (img.width - cropWidth) / 2;
      const startY = (img.height - cropHeight) / 2;

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.drawImage(img, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      // --- LƯU ẢNH MÀU GỐC ĐỂ GỬI LÊN SERVER ---
      const colorBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg"));
      const colorPreview = canvas.toDataURL("image/jpeg");

      // --- TIỀN XỬ LÝ ẢNH (Grayscale + High Contrast) ---
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

      if (!plate && tesseractWorkerRef.current && isMounted.current) {
        applyThreshold(160);
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
      const res = await fetch("http://localhost:8000/api/v1/booking/scan", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) {
        setQrContent("");
        setSelectedFile(null);
        setPreview(null);
        setDetectedPlate("");
        fetchHistory();
      } else {
        setQrContent("");
        setSelectedFile(null);
        setPreview(null);
      }
    } catch (error) {
      alert("Lỗi kết nối Backend!");
      setQrContent("");
      setSelectedFile(null);
      setPreview(null);
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 0. PARKING LOT NAME HEADER */}
        <div className="bg-white dark:bg-zinc-900 px-8 py-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-all">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div>
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] mb-1">HỆ THỐNG QUẢN LÝ BÃI XE</p>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight uppercase leading-tight">
                BÃI ĐỖ XE QUẬN 1
              </h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Hệ thống trực tuyến</span>
          </div>
        </div>

        {/* 1. TOP BAR - HEADER STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-5 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-0.5">NGÀY HỆ THỐNG</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tighter">
                {currentTime.toLocaleDateString('vi-VN').split('/').reverse().join('.')}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-5 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-0.5">THỜI GIAN THỰC</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tighter">
                {currentTime.toLocaleTimeString('vi-VN', { hour12: false })}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-5 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-0.5">VỊ TRÍ ĐIỂM QUÉT</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tighter truncate uppercase">
                {Array.isArray(gates) && gates.find(g => g.id.toString() === selectedGateId)?.name || "CHƯA XÁC ĐỊNH"}
              </p>
            </div>
          </div>
        </div>

        {/* 2. MAIN SCANNING AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl relative border border-zinc-800">
            <div className="p-4 px-6 flex justify-between items-center border-b border-white/5 bg-emerald-950/30 dark:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-1.5m0 0v-1.5m0 1.5v1.5m-6-1.5h1.5m0 0v1.5m0-1.5v-1.5m1.5-6h1.5m0 0V4m0 11v1m-6-1v-1m0 1H4" /></svg>
                <h3 className="font-bold text-white text-sm tracking-widest uppercase">MÁY QUÉT QR CHÍNH</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase">LIVE FEED</span>
              </div>
            </div>

            <div className="relative aspect-[4/3] bg-black">
              <div id="qr-reader" className="w-full h-full border-0"></div>
              <style>{`
                #qr-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; object-position: center !important; opacity: 0.8; }
                #qr-reader { border: none !important; }
              `}</style>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 relative">
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl shadow-[0_0_20px_#10b981]"></div>
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl shadow-[0_0_20px_#10b981]"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl shadow-[0_0_20px_#10b981]"></div>
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl shadow-[0_0_20px_#10b981]"></div>
                  {!qrContent && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 border border-emerald-500/20 rounded-full animate-ping opacity-30"></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_15px_#10b981]"></div>
                    </div>
                  )}
                </div>
              </div>
              {qrContent && (
                <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex items-center justify-center z-20 p-8">
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
                      <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <p className="font-black text-white text-xl tracking-[0.2em] uppercase mb-2">ĐÃ NHẬN TÍN HIỆU</p>
                      <p className="text-emerald-400 font-mono text-sm bg-black/40 px-4 py-3 rounded-xl border border-white/10 break-all">
                        {qrContent}
                      </p>
                    </div>
                    <button onClick={handleResetScanner} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl transition-all uppercase tracking-widest shadow-xl active:scale-95">
                      CĂN CHỈNH LẠI
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl relative border border-zinc-800">
            <div className="p-4 px-6 flex justify-between items-center border-b border-white/5 dark:border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <h3 className="font-bold text-white text-sm tracking-widest uppercase">PHÂN TÍCH BIỂN SỐ XE</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-blue-400 font-black tracking-widest uppercase">AI PROCESSING</span>
              </div>
            </div>

            <div className="relative aspect-[4/3] bg-black">
              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover " />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-4/5 h-2/5 border-2 border-white/20 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_15px_#60a5fa] animate-scan-line"></div>
                  {detectedPlate && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/80 backdrop-blur-md z-30 pointer-events-auto">
                      <p className="text-[10px] text-blue-300 font-black tracking-widest uppercase mb-1">BIỂN SỐ ĐÃ NHẬN</p>
                      <span className="text-white font-black text-4xl tracking-[0.2em]">{detectedPlate}</span>
                      <button onClick={() => { setDetectedPlate(""); setSelectedFile(null); }} className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-black rounded-full uppercase tracking-widest active:scale-95">Quét lại</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>


        {/* 3. BOTTOM MONITORING AREA - GATE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
          {gatesLoading ? (
            <div className="col-span-full py-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 transition-colors">
              <div className="w-8 h-8 border-4 border-zinc-100 dark:border-zinc-800 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-black tracking-widest uppercase">Đang tải danh sách cổng...</p>
            </div>
          ) : Array.isArray(gates) && gates.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 transition-colors">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-black tracking-widest uppercase">Không tìm thấy cổng nào được gán cho bãi xe này.</p>
            </div>
          ) : (
            Array.isArray(gates) && gates.map((gate) => {
              const isActive = selectedGateId === gate.id.toString();
              return (
                <div
                  key={gate.id}
                  onClick={() => handleGateChange(gate.id.toString())}
                  className={`p-6 rounded-[1.5rem] border transition-all duration-300 relative group cursor-pointer
                    ${isActive
                      ? 'bg-white dark:bg-zinc-900 border-emerald-500 shadow-xl scale-[1.02]'
                      : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm'}
                  `}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-colors
                      ${gate.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                        : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800'}
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full ${gate.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-orange-500 shadow-[0_0_8px_#f97316]'}`}></span>
                      {gate.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'BẢO TRÌ'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tighter uppercase">{gate.name}</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium leading-tight line-clamp-2">
                      {gate.desc || "Không có mô tả"}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-700 flex justify-between items-center transition-colors">
                    <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Lượt quét</span>
                    <span className="text-xl font-bold text-zinc-900 dark:text-white">{gate.count.toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. RECENT HISTORY SECTION */}
        <div className="space-y-6 pb-12 font-['Roboto',sans-serif]">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center text-emerald-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">LỊCH SỬ QUÉT GẦN ĐÂY</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Danh sách các phương tiện vừa ra vào hệ thống</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <select
                  value={timeRange}
                  onChange={(e) => {
                    setTimeRange(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="appearance-none px-6 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm outline-none cursor-pointer pr-10"
                >
                  <option value="24H">24h qua</option>
                  <option value="7D">7 ngày qua</option>
                  <option value="MONTH">Tháng này</option>
                  <option value="CUSTOM">Tùy chỉnh</option>
                  <option value="ALL">Tất cả lịch sử</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-sm font-bold text-[#000000] dark:text-white uppercase tracking-widest">
              Đang hiển thị lượt quét trong {timeRange === '24H' ? '24h qua' : timeRange === '7D' ? '7 ngày qua' : timeRange === 'MONTH' ? 'tháng này' : timeRange === 'ALL' ? 'toàn bộ lịch sử' : 'khoảng thời gian tùy chỉnh'}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <th className="px-8 py-6 text-[13px] font-black text-black dark:text-zinc-300 uppercase tracking-[0.2em]">
                      <span className="pl-5">Biển số xe</span>
                    </th>
                    <th className="px-8 py-6 text-[13px] font-black text-black dark:text-zinc-300 uppercase tracking-[0.2em]">Thời gian</th>
                    <th className="px-8 py-6 text-[13px] font-black text-black dark:text-zinc-300 uppercase tracking-[0.2em]">Thao tác</th>
                    <th className="px-8 py-6 text-[13px] font-black text-black dark:text-zinc-300 uppercase tracking-[0.2em]">Cổng</th>
                    <th className="px-8 py-6 text-[13px] font-black text-black dark:text-zinc-300 uppercase tracking-[0.2em]">Trạng thái</th>
                    <th className="px-8 py-6 text-[13px] font-black text-black dark:text-zinc-300 uppercase tracking-[0.2em] text-center">Snapshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-zinc-400">Đang tải dữ liệu...</td>
                    </tr>
                  ) : scanHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-zinc-400">Chưa có lịch sử quét nào</td>
                    </tr>
                  ) : (
                    scanHistory.map((log, idx) => {
                      const isIn = log.check_status === 'in';
                      const logTime = new Date(log.time);

                      return (
                        <tr key={log.id || idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                          <td className="px-8 py-6">
                            <span className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-base font-black text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 tracking-wider">
                              {log.booking?.vehicle?.plate_number || "KHÔNG RÕ"}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-base font-bold text-zinc-900 dark:text-white leading-none mb-1">
                                {logTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                {logTime.toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest
                              ${isIn
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50'
                                : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800/50'}
                            `}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={isIn ? "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" : "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"} /></svg>
                              {isIn ? 'VÀO' : 'RA'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-base font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-tight">
                              {log.gate?.name || "CỔNG CHUNG"}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-500`}>
                              <span className={`w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]`}></span>
                              THÀNH CÔNG
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-center gap-2">
                              {log.image_url ? (
                                <button
                                  onClick={() => setSelectedSnapshot(`http://localhost:8000${log.image_url}`)}
                                  className="group/btn relative w-14 h-9 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 transition-all shadow-sm"
                                >
                                  <img
                                    src={`http://localhost:8000${log.image_url}`}
                                    alt="snapshot"
                                    className="w-full h-full object-cover group-hover/btn:scale-110 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/btn:opacity-100 flex items-center justify-center transition-opacity">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </div>
                                </button>
                              ) : (
                                <div className="w-14 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700">
                                  <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-tighter">NO IMG</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalCount > pageSize && (
              <div className="p-8 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
                <p className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">
                  HIỂN THỊ <span className="text-zinc-900 dark:text-white">{scanHistory.length}</span> / {totalCount} LƯỢT QUÉT
                </p>
                <div className="flex items-center gap-3">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Trang</span>
                    <span className="text-sm font-black text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 w-10 h-10 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-sm">{currentPage}</span>
                  </div>
                  <button
                    disabled={currentPage * pageSize >= totalCount}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Xem Ảnh Snapshot */}
      {selectedSnapshot && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-8 transition-all"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex flex-center animate-in fade-in zoom-in duration-300">
            <button
              className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-2 font-black tracking-widest uppercase text-xs"
              onClick={() => setSelectedSnapshot(null)}
            >
              ĐÓNG <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div
              className="w-full h-full bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedSnapshot}
                alt="snapshot-large"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md z-50 flex items-center justify-center transition-colors">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white px-10 py-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6 transition-colors">
            <div className="w-12 h-12 border-[6px] border-zinc-100 dark:border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="font-black tracking-[0.2em] text-xs uppercase">Hệ thống đang xử lý...</p>
          </div>
        </div>
      )}
    </div>
  );
}