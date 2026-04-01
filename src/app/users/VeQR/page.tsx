"use client";

import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { get, post } from '@/lib/api';
import { mapDataBooking } from '../shareBooking/page';
import { useRouter } from 'next/navigation';

function BookingConfirmation() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  useEffect(() => {
    const rawData = localStorage.getItem('auth-storage');
    // console.log(userData);
    if(rawData){
      const userData = JSON.parse(rawData);
      const userId = userData.state.user.id;
    get(`/booking/user/${userId}`)
      .then((res: any) => {
        const mapData = res.data.map(mapDataBooking);
        if (mapData.length > 0) {
          setData(mapData[0]); 
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
      });
    }else{
      setLoading(false);
    }
  }, []);
  console.log(data);

  const handleSendEmail = async () => {
    console.log(data);
    try {
      await post(`/booking/${data.id}/send-qr-email`, {});
      alert("Đã gửi mã QR vào email của bạn thành công!");
      router.push('/');
      setData({});
    } catch (err) {
      alert("Gửi email thất bại.");
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2f6] flex justify-center items-center p-4 md:p-8 text-slate-800 font-sans">
      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-14 mx-auto transition-all duration-500">
        
        {/* Left Section: Information */}
        <div className="w-full lg:max-w-[340px] pt-4 lg:pt-[50px]">
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 font-semibold text-xs rounded-full mb-4 tracking-wide shadow-sm">
            CHECK-IN TỰ ĐỘNG
          </div>
          <h2 className="text-4xl md:text-[40px] font-black text-[#0f294d] mb-6 leading-[1.15] tracking-tight">
            Thông tin <br className="hidden lg:block"/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#09347a] to-[#2563eb]">đặt chỗ.</span>
          </h2>
          <p className="text-[15px] text-slate-600 mb-8 leading-relaxed max-w-[320px] font-medium">
            Vui lòng xuất trình mã QR này tại cổng vào bãi đỗ xe để hoàn tất thủ tục tự động mà không cần chờ đợi.
          </p>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100/80 border border-orange-200/60 rounded-[20px] p-5 flex gap-4 max-w-[320px] shadow-[0_8px_20px_rgba(249,115,22,0.06)] hover:shadow-[0_8px_25px_rgba(249,115,22,0.12)] transition-shadow duration-300">
            <div className="mt-0.5 flex-none">
              <div className="w-6 h-6 bg-gradient-to-br from-[#ea580c] to-[#c2410c] text-white rounded-full flex items-center justify-center font-bold text-[12px] italic shadow-md">
                i
              </div>
            </div>
            <div>
              <h4 className="font-bold text-[#9a3412] text-[15px] mb-1.5">Lưu ý quan trọng</h4>
              <p className="text-[13px] text-[#9a3412]/80 leading-relaxed pr-2 font-medium">
                Mã QR có hiệu lực <span className="font-bold">15 phút</span> trước giờ vào dự kiến.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Card & Actions */}
        <div className="w-full lg:flex-1 max-w-[750px]">
          {/* Main Card */}
          <div className="bg-white rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(15,41,77,0.08)] border border-slate-100 mb-6 w-full relative group">
            
            {/* Shimmer Effect */}
            <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 group-hover:animate-shimmer"></div>

            {/* Header */}
            <div className="bg-gradient-to-br from-[#09347a] via-[#0d47a1] to-[#1565c0] text-white px-8 md:px-10 pt-8 pb-[64px] relative overflow-hidden">
              {/* Decorative background shapes */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 opacity-10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
              
              <span className="relative z-10 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 shadow-sm border border-white/10">                
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Xác nhận đặt chỗ
              </span>
              <h1 className="relative z-10 text-[28px] md:text-[32px] font-bold mb-1.5 drop-shadow-sm">{data?.name || "Đang tải..."}</h1>
              <p className="relative z-10 text-[14px] text-blue-100 font-medium max-w-[80%]">{data?.address || "Vui lòng chờ trong giây lát"}</p>
              
              <div className="absolute top-8 right-8 md:right-10 w-14 h-14 bg-white/10 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.1)] rounded-2xl flex items-center justify-center border border-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <span className="text-[9px] font-black text-white tracking-widest text-center leading-tight">GO<br/>PARK</span>
              </div>
            </div>

            {/* Horizontal Body */}
            <div className="flex flex-col sm:flex-row px-8 md:px-10 pb-10 gap-8 md:gap-12 relative z-10 w-full">
              
              {/* Left Side: QR Code (Pulled up to overlap header) */}
              <div className="flex-none sm:w-[260px] -mt-14 mx-auto sm:mx-0 relative z-20">
                <div className="bg-gradient-to-b from-[#e0f0f8] to-[#f4f9fc] rounded-[28px] p-4 shadow-[0_12px_30px_rgba(9,52,122,0.12)] h-full w-full max-w-[280px] mx-auto sm:w-[260px] border-[1.5px] border-white backdrop-blur-sm">
                  <div className="bg-white rounded-[20px] p-3 shadow-inner h-full w-full">
                    <div className="bg-gradient-to-br from-[#0c1824] to-[#162738] p-6 pb-7 rounded-2xl flex flex-col justify-center items-center relative overflow-hidden shadow-md">
                      {/* Faux tech pattern background */}
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                      
                      {/* Main QR Container - fixed sizing here! */}
                      <div className="bg-[#155598]/60 backdrop-blur-md rounded-2xl px-5 py-5 w-full flex flex-col items-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/20 relative z-10 transition-transform hover:scale-[1.02] duration-300">
                        <div className="text-white text-3xl flex items-center justify-center w-12 h-12 rounded-full bg-white/10 font-black mb-4 tracking-tighter shadow-inner border border-white/5">P</div>
                        
                        <div className="bg-white p-3.5 rounded-xl mb-4 shadow-2xl flex justify-center items-center w-full aspect-square relative group">
                          {/* Glowing effect behind QR */}
                          <div className="absolute inset-0 bg-blue-400/20 blur-xl group-hover:bg-blue-400/40 transition-all rounded-full -z-10"></div>
                          
                          {loading ? (
                             <div className="w-full h-full flex items-center justify-center">
                               <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                             </div>
                          ) : (
                            <QRCodeCanvas 
                                value={data?.qrCodeContent || "placeholder_data"}
                                size={180} 
                                level={"H"}
                                includeMargin={false}
                                style={{ width: "100%", height: "100%" }}
                            />
                          )}
                        </div>
                        
                        <div className="flex flex-col items-center w-full mt-1 border-t border-white/10 pt-3">
                          <div className="text-white/95 text-[11px] font-bold tracking-[0.2em] mb-1.5 drop-shadow-sm">SAFE FI PARK</div>
                          <div className="bg-black/20 px-3 py-1 rounded-full text-blue-200/80 text-[10px] font-semibold tracking-widest text-center uppercase">
                            ID: {data?.code || "WAITING"}
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Details Grid */}
              <div className="flex-1 pt-4 sm:pt-6">
                <div className="grid grid-cols-[1fr_1fr] gap-y-7 gap-x-5">
                  {/* Row 1 */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      Người đặt
                    </div>
                    <div className="text-[15px] font-bold text-slate-800">{data?.user_name || "---"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      Trạng thái
                    </div>
                    <div className="inline-flex text-[13px] font-bold text-[#b55815] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">{data?.status || "---"}</div>
                  </div>

                  {/* Row 2 */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      Giờ vào
                    </div>
                    <div className="text-[15px] font-bold text-slate-800">{data?.start_time || "---"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      Giờ ra
                    </div>
                    <div className="text-[15px] font-bold text-slate-800">{data?.end_time || "---"}</div>
                  </div>

                  {/* Row 3 */}
                  <div className="col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tầng</div>
                      <div className="text-[15px] font-bold text-[#09347a]">{data?.floor_number || "---"}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Khu vực</div>
                      <div className="text-[15px] font-bold text-[#09347a]">{data?.floor_zone || "---"}</div>
                    </div>
                    <div className="col-span-2 lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-4">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Vị trí đỗ</div>
                      <div className="text-[18px] font-black text-[#0f4a8b]">
                        {data?.code || "---"}
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="my-6 border-slate-100" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100/50">
                  <div className="text-[12px] text-slate-500 font-semibold whitespace-nowrap flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    Mã QR gửi đến:
                  </div>
                  <div className="text-[14px] font-bold text-slate-700 truncate">{data?.email || "---"}</div>
                </div>
              </div>

            </div>
          </div>

          {/* Actions - Horizontal Row matching card width */}
          <div className="flex flex-col gap-5 w-full">
            <p className="text-[14px] text-center text-slate-600 font-medium">
              Vui lòng kiểm tra tin nhắn trong Email.
            </p>
            {/* Action Buttons Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full">
              <button onClick={handleSendEmail} className="group relative overflow-hidden flex items-center justify-center gap-3 bg-gradient-to-r from-[#09347a] to-[#1565c0] text-white py-4 px-6 rounded-[20px] xl:rounded-[24px] hover:shadow-[0_8px_20px_rgba(9,52,122,0.25)] transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute inset-0 w-full h-full bg-white/10 group-hover:bg-transparent transition-opacity"></div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-100 shrink-0 relative z-10">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <div className="flex items-center gap-1.5 relative z-10">
                  <span className="text-[12px] font-medium text-white/80 uppercase tracking-wider">Gửi qua</span>
                  <span className="text-[15px] font-bold tracking-wide">Email</span>
                </div>
              </button>

              <button className="group flex items-center justify-center gap-3 bg-white border-2 border-[#d3e7f1] text-[#09347a] py-4 px-6 rounded-[20px] xl:rounded-[24px] hover:bg-[#d3e7f1]/30 hover:border-[#1565c0]/30 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-100 shrink-0 text-[#1565c0]">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <line x1="9" y1="9" x2="15" y2="9"></line>
                  <line x1="9" y1="13" x2="13" y2="13"></line>
                </svg>
                <div className="flex items-center gap-1.5">
                  {/* <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider group-hover:text-[#09347a]/70">Quay lại</span> */}
                  <span className="text-[15px] font-bold tracking-wide">Quay lại</span>
                </div>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
export default BookingConfirmation;
