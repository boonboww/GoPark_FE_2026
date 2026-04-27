"use client";

import React, { useContext, useState } from "react";
import { MapPin, Clock, Info, User, Phone, Mail, CheckCircle, ShieldCheck, Calendar, MessageCircle, Camera, Tent } from "lucide-react";
import { ParkingContext } from "./ParkingContext";
import { MapLocationPicker } from "@/components/ui/map-location-picker";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export function ParkingInfo() {

  const context = useContext(ParkingContext);
  const router = useRouter();
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(-1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!context) return null;
  const { dataLot, loadingLot } = context;

  if (loadingLot) {
    return (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <div>
          <Skeleton className="h-6 w-24 mb-3 rounded-full" />
          <Skeleton className="h-10 w-2/3 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 h-[400px]">
          <Skeleton className="col-span-2 h-full rounded-2xl" />
          <div className="grid grid-rows-3 gap-4 h-full">
            <Skeleton className="rounded-2xl" />
            <Skeleton className="rounded-2xl" />
            <Skeleton className="rounded-2xl" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  const thumbImg = dataLot?.image?.thumbnail || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=800&auto=format&fit=crop";
  const gal2 = dataLot?.image?.gallery?.[1] || "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?q=80&w=300&auto=format&fit=crop";
  const gal1 = dataLot?.image?.gallery?.[0] || "https://images.unsplash.com/photo-1604063155776-081e7e45fcc3?q=80&w=300&auto=format&fit=crop";
  const currentMainImage = activeImageIndex === 0 ? gal1 : activeImageIndex === 1 ? gal2 : thumbImg;

  const pricingRules = Array.isArray(dataLot?.pricingRules) ? dataLot.pricingRules : [];
  const validIndex = selectedAreaIndex < pricingRules.length ? selectedAreaIndex : 0;
  const selectedRule = pricingRules[validIndex] || null;

  const formatVnd = (n?: number) => n ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : '';
  function formatTime(startTime: string, endTime: string, days: string) {
    if (!startTime || !endTime || !days) return "Chưa cập nhật";

    const opendate = new Date(startTime);
    const closedate = new Date(endTime);

    const openTime = opendate.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const closeTime = closedate.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return `${openTime}-${closeTime}`;
  }

  const handleBooking = () => {
    router.push(`/users/myBooking/${dataLot.id}`);
  };

  const allImages = [dataLot?.image?.thumbnail, ...(dataLot?.image?.gallery || [])].filter(Boolean);
  
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="w-full bg-transparent transition-colors">
      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
        {/* Left Column */}
        <div className="w-full lg:w-2/3 space-y-8">
          
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span 
                className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: '#69f0ae', color: '#004d40' }}
              >
                {dataLot.status}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">{dataLot.name}</h1>
            </div>
            <div className="flex items-start gap-2 text-gray-800 dark:text-gray-300 font-semibold">
              <MapPin className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#1d4ed8' }} />
              <p className="text-sm md:text-base">{dataLot.address}</p>
            </div>
          </div>

          {/* Images Grid */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 h-[300px] md:h-[400px]">
            <div className="col-span-2 h-full min-h-0 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
              <img
                src={currentMainImage}
                alt="Parking Main"
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>
            
            {/* 3 Small Images */}
            <div className="col-span-1 grid grid-rows-3 gap-3 md:gap-4 h-full min-h-0">
              <div 
                className={`h-full min-h-0 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 cursor-pointer border-2 transition-all ${activeImageIndex === -1 ? 'border-blue-500' : 'border-transparent hover:border-blue-300'}`}
                onClick={() => setActiveImageIndex(-1)}
              >
                <img src={thumbImg} className="w-full h-full object-cover" alt="Thumb" />
              </div>

              <div 
                className={`h-full min-h-0 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 cursor-pointer border-2 transition-all ${activeImageIndex === 0 ? 'border-blue-500' : 'border-transparent hover:border-blue-300'}`}
                onClick={() => setActiveImageIndex(0)}
              >
                <img src={thumbImg} className="w-full h-full object-cover" alt="Gallery 1" />
              </div>

              <div 
                className={`h-full min-h-0 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 relative cursor-pointer border-2 transition-all ${activeImageIndex === 1 ? 'border-blue-500' : 'border-transparent hover:border-blue-300'}`}
                onClick={() => setActiveImageIndex(1)}
              >
                <img src={gal2} className="w-full h-full object-cover" alt="Gallery 2" />
                {dataLot?.image?.gallery?.length > 2 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors backdrop-blur-[2px]">
                    <span className="text-white text-3xl md:text-4xl font-extrabold">
                      +{dataLot.image.gallery.length - 2}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              className="border rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm"
              style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}
            >
              <span className="text-2xl font-black" style={{ color: '#1d4ed8' }}>{dataLot.total_slots ?? '...'}</span>
              <span className="text-[12px] text-gray-800 dark:text-gray-300 font-bold uppercase mt-1 tracking-wider">Tổng chỗ</span>
            </div>
            <div 
              className="border rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm"
              style={{ backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' }}
            >
              <span className="text-2xl font-black" style={{ color: '#047857' }}>{dataLot.available_slots ?? '...'}</span>
              <span className="text-[12px] text-gray-800 dark:text-gray-300 font-bold uppercase mt-1 tracking-wider">Còn trống</span>
            </div>
            <div 
              className="border rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm"
              style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}
            >
              <Calendar className="w-6 h-6 mb-2" style={{ color: '#1d4ed8' }} />
              <span className="text-sm md:text-base font-black" style={{ color: '#1d4ed8' }}>{dataLot.operating_days || '...'}</span>
              <span className="text-[12px] text-gray-800 dark:text-gray-300 font-bold uppercase mt-1 tracking-wider">Ngày hoạt động</span>
            </div>
            <div 
              className="border rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm"
              style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}
            >
              <ShieldCheck className="w-6 h-6 mb-2" style={{ color: '#1d4ed8' }} />
              <span className="text-[12px] text-gray-800 dark:text-gray-300 font-bold uppercase mt-1 tracking-wider">Đã xác thực</span>
            </div>
          </div>

          {/* Tiện ích bãi xe */}
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 mb-4">Tiện ích bãi xe</h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 shadow-sm">
                <Camera className="w-5 h-5" style={{ color: '#1d4ed8' }} />
                <span className="text-sm font-bold text-gray-900 dark:text-gray-200">Camera 24/7</span>
              </div>
              <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 shadow-sm">
                <Tent className="w-5 h-5" style={{ color: '#1d4ed8' }} />
                <span className="text-sm font-bold text-gray-900 dark:text-gray-200">Có mái che</span>
              </div>
            </div>
          </div>

          {/* Mô tả */}
          <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 mb-3">Mô tả</h3>
            <p className="text-gray-800 dark:text-gray-300 text-sm md:text-base leading-relaxed text-justify font-medium">
              {dataLot.description}
            </p>
          </div>
          
          {/* Bản đồ */}
          <div className="pt-8 border-t border-gray-200 dark:border-gray-700 pb-10">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 mb-3">Vị trí</h3>
            <div className="rounded-2xl overflow-hidden h-[300px] border border-gray-300 dark:border-gray-600 shadow-sm">
              <MapLocationPicker
                location={dataLot.lat && dataLot.lng ? { lat: Number(dataLot.lat), lng: Number(dataLot.lng) } : null}
                onChange={() => {}} 
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>

        {/* Right Column (Sticky) */}
        <div className="w-full lg:w-1/3">
          <div className="sticky top-6 space-y-4">
            
            {/* Booking Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              
              {/* Pricing Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[12px] font-bold text-gray-700 dark:text-gray-300 tracking-widest uppercase">Bảng giá</h3>
                {pricingRules.length > 0 && (
                  <select 
                    className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block px-3 py-1.5 outline-none font-bold text-gray-900 dark:text-gray-200 cursor-pointer shadow-sm"
                    value={validIndex}
                    onChange={(e) => setSelectedAreaIndex(Number(e.target.value))}
                  >
                    {pricingRules.map((rule: any, idx: number) => (
                      <option key={rule.id} value={idx}>
                        {rule.floor_name}-{rule.zone_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Pricing Rows */}
              {pricingRules.length > 0 && selectedRule ? (
                <div className="space-y-3 mb-6">
                  <div 
                    className="flex justify-between items-center rounded-xl p-3.5 border border-blue-200 shadow-sm"
                    style={{ backgroundColor: '#eff6ff' }}
                  >
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-300">Theo giờ</span>
                    <span className="text-lg font-black" style={{ color: '#1d4ed8' }}>{formatVnd(selectedRule.price_per_hour)}/H</span>
                  </div>
                  <div 
                    className="flex justify-between items-center rounded-xl p-3.5 border border-green-200 shadow-sm"
                    style={{ backgroundColor: '#ecfdf5' }}
                  >
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-300">Theo ngày</span>
                    <span className="text-lg font-black" style={{ color: '#047857' }}>{formatVnd(selectedRule.price_per_day || selectedRule.day)}/D</span>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-xl text-center border border-dashed border-gray-400 dark:border-gray-600">
                  <span className="text-sm text-gray-700 font-bold">Chưa cập nhật bảng giá</span>
                </div>
              )}

              {/* THỜI GIAN HOẠT ĐỘNG */}
              <div className="mb-6">
                <h3 className="text-[12px] font-bold text-gray-700 dark:text-gray-300 tracking-widest uppercase mb-3">Thời gian hoạt động</h3>
                <div className="border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 shadow-sm">
                  <Clock className="w-5 h-5 text-gray-700 dark:text-gray-400" />
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatTime(dataLot.open_time, dataLot.close_time, dataLot.operating_days)}
                  </span>
                </div>
              </div>

              {/* Alert */}
              <div 
                className="rounded-xl p-3.5 flex items-start gap-3 mb-6 border border-green-200 shadow-sm"
                style={{ backgroundColor: '#ecfdf5' }}
              >
                <div 
                  className="rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: '#059669' }}
                >
                  <Info className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs md:text-sm font-bold leading-snug" style={{ color: '#065f46' }}>
                  Hiện còn {dataLot.available_slots ?? 0} chỗ trống. Bạn có thể đặt ngay để giữ chỗ!
                </p>
              </div>

              {/* Buttons */}

              <button
                id="detail-book-now-btn"
                onClick={handleBooking}
                className="group relative overflow-hidden cursor-pointer w-full text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center mb-3 text-sm md:text-base border-0"
                style={{ background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' }}
              >
                <span className="relative z-10 transition-transform duration-300 group-hover:scale-110 inline-block">
                  Đặt ngay
                </span>
              </button>

              <button
                onClick={() => {
                  const query = new URLSearchParams({
                    parkingId: dataLot.id,
                    parkingName: dataLot.name,
                    parkingAddress: dataLot.address || '',
                    parkingImage: dataLot?.image?.thumbnail || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=800&auto=format&fit=crop"
                  }).toString();
                  
                  if (!dataLot.owner?.id) {
                    alert("Không thể nhắn tin: Không tìm thấy ID chủ bãi.");
                    return;
                  }
                  router.push(`/users/chat/${dataLot.owner.id}?${query}`);
                }}
                className="group relative overflow-hidden cursor-pointer w-full text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center text-sm md:text-base border-0"
                style={{ backgroundColor: '#0052cc' }}
              >
                <div className="relative z-10 flex items-center gap-2 transition-transform duration-300 group-hover:scale-110">
                  <MessageCircle className="w-5 h-5" />
                  <span>Chat với Chủ Bãi</span>
                </div>
              </button>


              <p className="text-center text-[12px] md:text-sm text-gray-600 dark:text-gray-400 mt-4 font-bold">
                Bạn sẽ không bị trừ tiền cho đến khi nhận chỗ
              </p>
            </div>

            {/* Thông tin chủ quản lý */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-700 shrink-0" />
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100 text-sm md:text-base">Thông tin chủ bãi</h4>
              </div>
              <div className="space-y-3">
                <p className="font-black text-gray-900 dark:text-white text-base">{dataLot?.owner?.profile?.name || dataLot?.owner?.email || 'Chưa cập nhật'}</p>
                <div className="flex flex-col space-y-2 text-sm text-gray-800 dark:text-gray-300 font-semibold">
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-600 dark:text-gray-400" /> 
                    {dataLot?.owner?.profile?.phone || 'Chưa cập nhật'}
                  </span>
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" /> 
                    {dataLot?.owner?.email || 'Chưa cập nhật'} 
                  </span>
                </div>
              </div>
            </div>

            {/* ParkFlow Guarantee */}
            <div 
              className="rounded-2xl p-5 border flex items-start gap-3 shadow-sm"
              style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}
            >
              <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5" style={{ color: '#1d4ed8' }} />
              <div>
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100 text-sm mb-1">ParkFlow Bảo vệ</h4>
                <p className="text-[12px] md:text-xs text-gray-800 dark:text-gray-300 leading-relaxed font-bold">
                  Chúng tôi đảm bảo quyền lợi của bạn khi đặt qua hệ thống. Hoàn tiền 100% nếu bãi hết chỗ.
                </p>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
