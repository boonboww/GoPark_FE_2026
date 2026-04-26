"use client";
import { useAuthStore } from "@/stores";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useState, useRef } from "react";

export  function StaffDashboard() {
  const [qrContent, setQrContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGateId, setSelectedGateId] = useState<string>("1");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isInitializing = useRef(false); // Chống khởi tạo kép
  const { accessToken } = useAuthStore();

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

  const handleResetScanner = () => {
    // Không cần khởi động lại camera vì camera chưa bao giờ bị stop
    setQrContent("");
    setSelectedFile(null);
    setPreview(null);
  };

  useEffect(() => {
    if (qrContent && selectedFile && !isProcessing.current) {
      handleVerifyAll();
    }
  }, [qrContent, selectedFile]);

  const handleGateChange = (id: string) => {
    setSelectedGateId(id);
    localStorage.setItem("gate_config", id);
    setQrContent("");
    setSelectedFile(null);
    setPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      // Fix lỗi "không tải ảnh được": reset input để cho phép tải lại cùng 1 file ảnh
      e.target.value = '';
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
        headers: {
        "Authorization": `Bearer ${accessToken}`, 
      },
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) {
         window.location.reload();
      } else {
         // Nếu lỗi logic (ví dụ đã check-in nhưng lại báo sai, v.v)
         // ta sẽ dọn dẹp biến để người dùng có thể đổi cổng và quét lại ngay!
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
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* MAIN INTEGRATED SCANNER UNIT */}
        {/* MAIN INTEGRATED SCANNER UNIT */}
        <div className="bg-white p-4 md:p-8 rounded-[2.5rem] border border-zinc-200 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 blur-[120px] pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 blur-[120px] pointer-events-none"></div>

          {/* 1. SCANNER CONTROL INTERFACE (HEADER) */}
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 relative z-10 border-b border-zinc-100 pb-8">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                <span className="text-[10px] text-emerald-400 font-bold tracking-[0.3em] uppercase">System Online // Neural Core Active</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-zinc-900 leading-[0.95] tracking-tighter uppercase">
                Scanner Control<br/>Interface
              </h2>
            </div>

            <div className="flex bg-zinc-50 border border-zinc-100 rounded-2xl p-5 gap-10 min-w-[320px] shadow-sm">
               <div className="flex flex-col gap-1 border-l-4 border-emerald-500 pl-5 pr-2">
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Telemetry Timestamp</span>
                  <div className="text-zinc-600 font-mono text-sm leading-none tracking-tighter">
                    Date:2023.10.24 
                  </div>
                  <div className="text-zinc-600 font-mono text-sm leading-none tracking-tighter">
                    Time:19:49:00 
                  </div>
               </div>
               <div className="flex flex-col justify-center gap-1 border-l border-zinc-100 pl-3 ">
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Node Location</span>
                  <div className="text-emerald-400 font-black text-lg uppercase tracking-tighter leading-none">
                    {selectedGateId ? mockGates.find(g => g.id.toString() === selectedGateId)?.name.replace(/\s+/g, '-') : 'ZONE-A / MAIN'}
                  </div>
                  <div className="text-emerald-400 font-black text-lg uppercase tracking-tighter leading-none mt-1">GATE</div>
               </div>
            </div>
          </div>

          {/* 2. CORE SCANNER MODULES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
              {/* Module 1: PRIMARY QR SCANNER */}
              <div className="bg-zinc-100 p-6 rounded-2xl border border-zinc-200 flex flex-col shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                       <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-1.5m0 0v-1.5m0 1.5v1.5m-6-1.5h1.5m0 0v1.5m0-1.5v-1.5m1.5-6h1.5m0 0V4m0 11v1m-6-1v-1m0 1H4" /></svg>
                       <h3 className="font-bold text-zinc-900 text-sm tracking-widest uppercase">Primary QR Scanner</h3>
                    </div>
                    <div className="px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-mono rounded-md tracking-wider uppercase">STBM_AB_EX_QR_001</div>
                 </div>
                 
                 <div className="w-full h-72 bg-zinc-100 rounded-xl overflow-hidden relative border border-zinc-200 shadow-inner">
                    <div id="qr-reader" className="w-full h-full border-0"></div>
                    <style>{`
                      #qr-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
                      #qr-reader { border: none !important; }
                    `}</style>
                    
                    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
                        <div className="flex justify-between">
                            <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
                            <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
                        </div>
                        <div className="flex justify-between">
                            <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
                            <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
                        </div>
                    </div>
                    
                    {qrContent ? (
                       <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-20 backdrop-blur-sm p-4">
                          <div className="text-white text-center">
                             <p className="text-4xl mb-2">✅</p>
                             <p className="font-bold uppercase tracking-widest text-sm mb-2 text-emerald-400">Signal Acquired</p>
                             <p className="text-emerald-300 font-mono text-xs bg-emerald-900/50 border border-emerald-500/50 px-4 py-2 rounded break-all">{qrContent}</p>
                             <div className="mt-6 pointer-events-auto">
                               <button onClick={handleResetScanner} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-black transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(52,211,153,0.5)] active:scale-95">RE-CALIBRATE UNIT</button>
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                          <div className="w-14 h-14 border border-emerald-500/30 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                             <div className="w-10 h-10 border border-emerald-500/50 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.9)]"></div>
                             </div>
                          </div>
                          <p className="text-zinc-900 font-black text-xs tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(0,0,0,0.1)]">Mã QR: Đang chờ...</p>
                          <p className="text-zinc-400 text-[8px] mt-2 tracking-widest uppercase">Awaiting physical token presentment</p>
                       </div>
                    )}
                 </div>

                 <div className="mt-6 flex items-center gap-4">
                     <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 w-[88%] shadow-[0_0_12px_rgba(52,211,153,0.3)]"></div>
                     </div>
                     <span className="text-zinc-500 text-[10px] font-mono tracking-widest uppercase font-bold">BUFFER: 88%</span>
                 </div>
              </div>

              {/* Module 2: LICENSE PLATE ANALYTICS */}
              <div className="flex flex-col gap-4">
                  <div className="bg-zinc-100 p-6 rounded-2xl border border-zinc-200 flex-1 flex flex-col shadow-sm">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                              <h3 className="font-bold text-zinc-900 text-sm tracking-widest uppercase">License Plate Analytics</h3>
                           </div>
                           <p className="text-zinc-600 text-[10px] font-medium uppercase tracking-tight">High-precision optical character recognition module.</p>
                        </div>
                        <div className="px-3 py-1 bg-blue-100 border border-blue-200 text-blue-700 text-[9px] font-mono rounded-md uppercase tracking-wider">V-OCR-BETA-04</div>
                     </div>

                     <div className="flex-1 w-full border border-dashed border-zinc-300 rounded-xl bg-zinc-50 flex flex-col items-center justify-center relative transition-all overflow-hidden py-8 mb-6 group hover:border-blue-500/50 shadow-inner">
                        {preview ? (
                            <img src={preview} className="w-full h-full object-contain p-2" alt="Preview" />
                        ) : (
                            <div className="text-center">
                                <svg className="w-12 h-12 text-zinc-300 mb-4 mx-auto group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                <p className="text-sm text-zinc-900 font-bold tracking-widest uppercase group-hover:text-blue-600 transition-colors">Vui lòng tải ảnh lên</p>
                                <p className="text-[9px] text-zinc-500 mt-2 tracking-widest uppercase">Support: JPG, PNG, RAW | Max 10MB</p>
                            </div>
                        )}
                     </div>
                     
                      <label 
                        htmlFor="plate-upload" 
                        className={`
                          w-full py-4 rounded-xl font-black text-sm cursor-pointer transition-all shadow-xl 
                          flex items-center justify-center gap-3 tracking-[0.2em] uppercase active:scale-[0.98]
                          ${preview 
                            ? "bg-green-600 text-white hover:bg-green-700 shadow-green-200/50" 
                            : "bg-green-600 text-white hover:bg-green-700 shadow-green-200/50"}
                        `}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        {preview ? "THAY ĐỔI ẢNH" : "INITIATE PLATE SCAN"}
                      </label>
                     <input type="file" id="plate-upload" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>

                  <div className="bg-zinc-100 rounded-2xl p-5 border border-zinc-200 flex items-center justify-between cursor-pointer hover:bg-zinc-200 transition-all group shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white text-orange-600 flex items-center justify-center border border-orange-200 group-hover:border-orange-500 transition-colors shadow-sm">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        </div>
                        <div>
                           <h5 className="text-[10px] text-orange-600 font-black uppercase tracking-widest mb-1">Alert History</h5>
                           <p className="text-xs text-zinc-900 font-bold leading-tight">3 Unresolved Discrepancies</p>
                        </div>
                     </div>
                     <svg className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-all transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                  </div>
              </div>
          </div>

          {/* 3. GATE STATUS MONITORING CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 pt-4">
            {mockGates.map((gate) => {
              const isActive = selectedGateId === gate.id.toString();
              const theme = gate.id === 1 ? { color: "emerald" } : gate.id === 2 ? { color: "orange" } : { color: "blue" };
              
              return (
                <div
                  key={gate.id}
                  onClick={() => handleGateChange(gate.id.toString())}
                  className={`cursor-pointer bg-zinc-100 p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${isActive ? `border-${theme.color}-500 bg-white shadow-lg scale-[1.02]` : 'border-zinc-200 hover:border-zinc-300'}`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isActive ? `bg-${theme.color}-500 shadow-[0_0_15px_currentColor]` : 'bg-transparent'}`}></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-zinc-900 font-black text-xl tracking-tighter uppercase mb-1 leading-none">{gate.name.split(' - ')[0]}</h4>
                      <div className="flex items-center gap-2">
                         <span className={`w-2 h-2 rounded-full ${isActive ? `bg-${theme.color}-500 animate-pulse shadow-[0_0_10px_currentColor]` : 'bg-zinc-300'}`}></span>
                         <span className={`text-[10px] font-black tracking-widest uppercase ${isActive ? `text-${theme.color}-600` : 'text-zinc-500'}`}>
                           STATUS: {isActive ? 'ACTIVE' : gate.id === 2 ? 'DISCONNECTED' : 'STANDBY'}
                         </span>
                      </div>
                    </div>
                    <div className={`${isActive ? `text-${theme.color}-500` : 'text-zinc-700'} transition-colors`}>
                      {gate.id === 1 ? (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      ) : gate.id === 2 ? (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                      ) : (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center opacity-70 group-hover:opacity-100 transition-opacity">
                     <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                        <div className={`h-full bg-${theme.color}-500/30 w-1/3 animate-[shimmer_4s_infinite]`}></div>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. SYSTEM FOOTER STATUS */}
          <div className="bg-zinc-100 border border-zinc-200 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-y-4 relative z-10 shadow-sm">
             <div className="flex items-center gap-8">
                <span className="text-[10px] text-emerald-600 font-black tracking-[0.25em] uppercase">SYSTEM OPERATIONAL V2.4.0-STABLE</span>
                <div className="h-4 w-px bg-zinc-300 hidden sm:block"></div>
                <div className="hidden lg:flex gap-8">
                  {['System Health', 'Technical Support', 'Audit Log'].map(item => (
                    <span key={item} className="text-[10px] text-zinc-600 font-black tracking-widest uppercase cursor-pointer hover:text-zinc-900 transition-colors">{item}</span>
                  ))}
                </div>
             </div>
             <div className="flex items-center gap-8">
                <span className="text-[10px] text-zinc-600 font-black tracking-widest uppercase">CORE TEMP: <span className="text-zinc-900">42°C</span></span>
                <span className="text-[11px] text-emerald-600 font-black tracking-[0.15em] uppercase flex items-center gap-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"></span>
                  ENCRYPTED CONNECTION ESTABLISHED
                </span>
             </div>
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white border border-gray-100 text-blue-900 px-8 py-5 rounded-2xl shadow-xl flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="font-bold tracking-wide text-sm uppercase">Hệ thống đang xử lý...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

}