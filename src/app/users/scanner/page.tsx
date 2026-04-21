"use client";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useState, useRef } from "react";

export default function ScanPage() {
  const [qrContent, setQrContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGateId, setSelectedGateId] = useState<string>("1");
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isInitializing = useRef(false); // Chống khởi tạo kép

  const mockGates = [
    { id: 1, name: "Cổng Chính - Lối Vào", type: "IN" },
    { id: 2, name: "Cổng Phụ - Lối Ra", type: "OUT" },
    { id: 3, name: "Cổng Nội Bộ - Hầm B1", type: "BOTH" }
  ];

  const isProcessing = useRef(false);

  useEffect(() => {
    const savedGate = localStorage.getItem("gate_config");
    if (savedGate) setSelectedGateId(savedGate);
  }, []);

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
          fps: 20,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (text) => {
          setQrContent(text);
          // Dừng camera ngay khi có mã
          scannerRef.current?.stop().catch(console.error);
        },
        (err) => {}
      );
    } catch (err) {
      console.error("Camera error:", err);
    } finally {
      isInitializing.current = false;
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      // Cleanup kỹ lưỡng khi unmount
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(console.error);
        } else {
          scannerRef.current.clear();
        }
      }
    };
  }, []);

  const handleResetScanner = async () => {
    setQrContent("");
    // Đợi một chút để đảm bảo trạng thái camera đã ổn định
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  useEffect(() => {
    if (qrContent && selectedFile && !isProcessing.current) {
      handleVerifyAll();
    }
  }, [qrContent, selectedFile]);

  const handleGateChange = (id: string) => {
    setSelectedGateId(id);
    localStorage.setItem("gate_config", id);
    handleResetScanner();
    setSelectedFile(null);
    setPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
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
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) window.location.reload();
    } catch (error) {
      alert("Lỗi kết nối Backend!");
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* HEADER & CHỌN CỔNG */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-900">GoPark <span className="text-blue-500">Scanner</span></h1>
          <div className="flex gap-2">
            {mockGates.map((gate) => (
              <button
                key={gate.id}
                onClick={() => handleGateChange(gate.id.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-2 ${
                  selectedGateId === gate.id.toString()
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  gate.type === 'IN' ? 'bg-green-400' : gate.type === 'OUT' ? 'bg-red-400' : 'bg-yellow-400'
                }`}></span>
                {gate.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-center font-bold mb-3 text-sm text-blue-900 uppercase">1. QUÉT MÃ QR</h3>
            <div id="qr-reader" className="w-full h-72 bg-black rounded-xl overflow-hidden border border-gray-100 relative shadow-inner">
               <style>{`
                 #qr-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
               `}</style>
               {qrContent && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
                   <div className="text-white text-center">
                      <p className="text-4xl mb-2">✅</p>
                      <p className="font-bold uppercase tracking-widest">Đã nhận tín hiệu</p>
                   </div>
                 </div>
               )}
            </div>
            
            <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
               <div className="text-[10px] truncate text-gray-500 flex-1 mr-2 italic">
                  Mã QR: <span className="text-blue-600 font-bold not-italic">{qrContent || "Đang chờ..."}</span>
               </div>
               {qrContent && (
                 <button 
                   onClick={handleResetScanner}
                   className="text-[10px] bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 transition-all font-bold shadow-sm"
                 >
                   QUÉT LẠI
                 </button>
               )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-center font-bold mb-3 text-sm text-green-700 uppercase">2. GỬI ẢNH BIỂN SỐ</h3>
            <div className="flex-1 min-h-[18rem] bg-gray-50 rounded-xl relative border border-gray-100 flex items-center justify-center overflow-hidden">
              {preview ? (
                <img src={preview} className="w-full h-full object-contain" alt="Preview" />
              ) : (
                <div className="text-center text-gray-300">
                   <p className="text-4xl mb-2">📷</p>
                   <p className="text-[10px] italic font-medium uppercase">Vui lòng tải ảnh lên</p>
                </div>
              )}
            </div>
            <input type="file" id="plate-upload" accept="image/*" className="hidden" onChange={handleFileChange} />
            <label htmlFor="plate-upload" className="mt-3 bg-green-600 text-white py-3 rounded-xl font-bold text-center cursor-pointer hover:bg-green-700 active:scale-95 transition-all text-sm shadow-sm">
               {preview ? "THAY ĐỔI ẢNH" : "CHỌN FILE / CHỤP ẢNH"}
            </label>
          </div>
        </div>

        <div className="flex justify-center pb-4">
          {loading ? (
            <div className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-sm shadow-md flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              HỆ THỐNG ĐANG XỬ LÝ...
            </div>
          ) : (
            <div className="text-[11px] text-gray-400 bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
              Trạm trực: <span className="text-blue-900 font-bold uppercase">{mockGates.find(g => g.id.toString() === selectedGateId)?.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}