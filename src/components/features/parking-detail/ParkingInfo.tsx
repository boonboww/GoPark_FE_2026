"use client";

import React, { useContext, useState } from "react";
import { MapPin, Clock, Info, User, Phone, Mail, CheckCircle, ShieldCheck, Calendar, MessageCircle, Camera, Tent, Grid, ChevronRight, X } from "lucide-react";
import { ParkingContext } from "./ParkingContext";
import { MapLocationPicker } from "@/components/ui/map-location-picker";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatOperatingDays, fixVietnameseMojibake } from "@/lib/utils";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ParkingInfo() {
  const context = useContext(ParkingContext);
  const router = useRouter();
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(-1);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedPreviewImg, setSelectedPreviewImg] = useState<string | null>(null);

  if (!context) return null;
  const { dataLot, loadingLot } = context;

  if (loadingLot) {
    return (
      <div className="w-full space-y-8 animate-in fade-in duration-500 font-sans">
        <div>
          <Skeleton className="h-6 w-24 mb-3 rounded-full" />
          <Skeleton className="h-10 w-2/3 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 h-[350px]">
          <Skeleton className="col-span-3 h-full rounded-2xl" />
          <div className="grid grid-rows-2 gap-4 h-full">
            <Skeleton className="rounded-2xl" />
            <Skeleton className="rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const thumbImg = dataLot?.image?.thumbnail || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=800&auto=format&fit=crop";
  const gallery = dataLot?.image?.gallery || [];
  const allImages = [thumbImg, ...gallery].filter(Boolean);

  // Gallery Logic: 1 Large (3/4) + 3 Small (1/4)
  const mainImage = activeImageIndex === -1 ? thumbImg : allImages[activeImageIndex];
  const sideImages = allImages.slice(1, 4); // Show up to 3 side images
  const hasMore = allImages.length > 4;
  const remainingCount = allImages.length - 4;

  const pricingRules = Array.isArray(dataLot?.pricingRules) ? dataLot.pricingRules : [];
  const validIndex = selectedAreaIndex < pricingRules.length ? selectedAreaIndex : 0;
  const selectedRule = pricingRules[validIndex] || null;

  const formatVnd = (n?: number) => n ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : '';

  function formatTime(startTime: string, endTime: string, days: string) {
    if (!startTime || !endTime || !days) return "Chưa cập nhật";
    try {
      if (startTime.includes(':') && endTime.includes(':')) {
        const startParts = startTime.split(':');
        const endParts = endTime.split(':');
        return `${startParts[0].padStart(2, '0')}:${startParts[1].padStart(2, '0')} - ${endParts[0].padStart(2, '0')}:${endParts[1].padStart(2, '0')}`;
      }
      const opendate = dayjs(startTime);
      const closedate = dayjs(endTime);
      if (!opendate.isValid() || !closedate.isValid()) return "Chưa cập nhật";
      return `${opendate.format("HH:mm")} - ${closedate.format("HH:mm")}`;
    } catch {
      return "Chưa cập nhật";
    }
  }

  const handleBooking = () => {
    router.push(`/users/myBooking/${dataLot.id}`);
  };

  return (
    <div className="w-full bg-transparent transition-colors font-sans">
      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
        {/* Left Column (Main Content) */}
        <div className="w-full lg:w-2/3 space-y-6">

          {/* Header Info */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {dataLot.status}
              </Badge>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{fixVietnameseMojibake(dataLot.name)}</h1>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <MapPin className="w-4 h-4 shrink-0 text-blue-600" />
              <p className="text-xs md:text-sm font-medium">{fixVietnameseMojibake(dataLot.address)}</p>
            </div>
          </div>

          {/* Balanced Image Gallery: 1 Large (Left) + 3 Small (Right) */}
          <div className="flex flex-col md:flex-row gap-3 h-auto md:h-[420px]">
            {/* Main Image (3/4 width) */}
            <div id="parking-gallery-main" className="w-full md:w-3/4 h-[250px] md:h-full relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 shadow-sm group">
              <img
                src={mainImage}
                alt="Parking Main"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-4 right-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-none text-[10px] font-bold h-8 px-3 rounded-lg shadow-lg"
                onClick={() => setIsGalleryOpen(true)}
              >
                <Grid className="w-3 h-3 mr-1.5" /> Xem tất cả ảnh
              </Button>
            </div>

            {/* Side Images (1/4 width) - Always 3 frames with equal height */}
            <div className="grid grid-cols-3 md:grid-cols-1 md:grid-rows-3 md:w-1/4 gap-3">
              {[0, 1, 2].map((idx) => {
                const img = sideImages[idx];
                const isLast = idx === 2 && hasMore;
                const actualIndex = idx + 1;

                if (img) {
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "relative h-24 md:h-full rounded-xl overflow-hidden cursor-pointer border-2 transition-all group",
                        activeImageIndex === actualIndex ? "border-blue-500" : "border-transparent hover:border-blue-300"
                      )}
                      onClick={() => setActiveImageIndex(actualIndex)}
                    >
                      <img src={img} className="w-full h-full object-cover" alt={`Side ${idx}`} />
                      {isLast && (
                        <div
                          className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center text-white cursor-pointer hover:bg-black/60 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsGalleryOpen(true);
                          }}
                        >
                          <span className="text-xl font-black">+{remainingCount}</span>
                          <span className="text-[9px] font-bold uppercase tracking-tighter">Ảnh khác</span>
                        </div>
                      )}
                    </div>
                  );
                }

                // Placeholder for empty frames
                return (
                  <div key={idx} className="h-24 md:h-full rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-gray-300 dark:text-gray-700" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats Cards - Compact & Aligned */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20 shadow-none rounded-xl">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{dataLot.total_slots ?? '...'}</span>
                <span className="text-[9px] font-bold text-blue-800/60 dark:text-blue-300/60 uppercase mt-0.5 tracking-widest">Tổng chỗ</span>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20 shadow-none rounded-xl">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{dataLot.available_slots ?? '...'}</span>
                <span className="text-[9px] font-bold text-emerald-800/60 dark:text-emerald-300/60 uppercase mt-0.5 tracking-widest">Còn trống</span>
              </CardContent>
            </Card>
            <Card className="bg-slate-50/30 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-none rounded-xl">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center h-full min-w-0">
                <Calendar className="w-4 h-4 mb-1 text-slate-400 shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-full" title={dataLot.operating_days}>
                  {formatOperatingDays(dataLot.operating_days)}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest shrink-0">Hoạt động</span>
              </CardContent>
            </Card>
            <Card className="bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20 shadow-none rounded-xl">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-4 h-4 mb-1 text-indigo-500" />
                <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Đã xác thực</span>
              </CardContent>
            </Card>
          </div>

          {/* Dashed Separator */}
          <div className="border-t border-dashed border-gray-200 dark:border-gray-800 my-6" />

          {/* Amenities Section */}
          <div id="parking-amenities-section" className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Grid className="w-4 h-4 text-blue-600" /> Tiện ích bãi xe
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="px-3 py-1.5 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex items-center gap-2 text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                <Camera className="w-3.5 h-3.5 text-blue-500" /> Camera 24/7
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex items-center gap-2 text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                <Tent className="w-3.5 h-3.5 text-blue-500" /> Có mái che
              </Badge>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-t border-dashed border-gray-200 dark:border-gray-800 my-6" />

          {/* Description Section */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Mô tả</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm leading-relaxed text-justify">
              {fixVietnameseMojibake(dataLot.description)}
            </p>
          </div>

          {/* Dashed Separator */}
          <div className="border-t border-dashed border-gray-200 dark:border-gray-800 my-6" />

          {/* Map Section */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Vị trí bản đồ</h3>
            <Card className="overflow-hidden border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl">
              <div className="h-[250px]">
                <MapLocationPicker
                  location={dataLot.lat && dataLot.lng ? { lat: Number(dataLot.lat), lng: Number(dataLot.lng) } : null}
                  onChange={() => { }}
                  className="w-full h-full"
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="w-full lg:w-1/3">
          <div className="sticky top-6 space-y-6">

            {/* Action Card */}
            <Card className="shadow-2xl shadow-gray-200/50 dark:shadow-none border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-6">

                {/* Pricing Header & Selector */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Bảng giá theo khu vực</h3>
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-none px-2">Giá tốt</Badge>
                  </div>

                  {pricingRules.length > 0 ? (
                    <div className="space-y-3">
                      <select
                        id="parking-price-selector"
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-xs rounded-xl block p-3 outline-none font-bold text-gray-900 dark:text-gray-100 cursor-pointer focus:ring-2 ring-blue-500/20"
                        value={validIndex}
                        onChange={(e) => setSelectedAreaIndex(Number(e.target.value))}
                      >
                        {pricingRules.map((rule: any, idx: number) => (
                          <option key={rule.id} value={idx}>
                            {rule.floor_name} - {rule.zone_name}
                          </option>
                        ))}
                      </select>

                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex justify-between items-center rounded-xl p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                          <span className="text-xs font-bold text-blue-900/60 dark:text-blue-300/60 uppercase">Theo giờ</span>
                          <span className="text-xl font-black text-blue-600 dark:text-blue-400">{formatVnd(selectedRule?.price_per_hour)}/H</span>
                        </div>
                        <div className="flex justify-between items-center rounded-xl p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                          <span className="text-xs font-bold text-emerald-900/60 dark:text-emerald-300/60 uppercase">Theo ngày</span>
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatVnd(selectedRule?.price_per_day || selectedRule?.day)}/D</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl text-center border border-dashed border-gray-200 dark:border-gray-800">
                      <span className="text-xs text-gray-400 font-medium">Chưa cập nhật bảng giá</span>
                    </div>
                  )}
                </div>

                {/* Availability Info */}
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] md:text-xs font-bold text-amber-800 dark:text-amber-400 leading-snug">
                    Hiện còn {dataLot.available_slots ?? 0} chỗ trống. Hãy đặt ngay để đảm bảo có vị trí tốt nhất!
                  </p>
                </div>

                {/* Booking Button */}
                <div className="pt-2">
                  <Button
                    id="detail-book-now-btn"
                    onClick={handleBooking}
                    className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-600 text-white font-bold text-base shadow-xl shadow-blue-600/20 transition-all active:scale-95 group"
                  >
                    Đặt chỗ ngay <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>

                {/* Contact Options */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const query = new URLSearchParams({
                        parkingId: dataLot.id,
                        parkingName: dataLot.name,
                        parkingAddress: dataLot.address || '',
                        parkingImage: thumbImg
                      }).toString();
                      if (!dataLot.owner?.id) return;
                      router.push(`/users/chat/${dataLot.owner.id}?${query}`);
                    }}
                    className="flex-1 h-11 rounded-xl border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 text-sm gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Nhắn tin
                  </Button>
                  <Button variant="secondary" className="w-11 h-11 rounded-xl p-0 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100">
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                  Không thu phí đặt chỗ • Thanh toán tại bãi
                </p>
              </CardContent>
            </Card>

            {/* Manager & Operating Details */}
            <Card className="border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 border-b border-gray-50 dark:border-gray-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center overflow-hidden shrink-0">
                    {dataLot?.owner?.profile?.image ? (
                      <img src={dataLot.owner.profile.image} className="w-full h-full object-cover" alt="Owner" />
                    ) : (
                      <User className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{dataLot?.owner?.profile?.name || 'Quản lý bãi đỗ'}</h4>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Chủ bãi đỗ • {dataLot?.owner?.profile?.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Giờ mở cửa</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                        {formatTime(dataLot.open_time, dataLot.close_time, dataLot.operating_days)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Email hỗ trợ</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{dataLot?.owner?.email || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guarantee Badge */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600/5 to-indigo-600/5 dark:from-blue-600/10 dark:to-indigo-600/10 border border-blue-600/10 flex gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                <ShieldCheck className="w-16 h-16" />
              </div>
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-stone-900 shadow-sm flex items-center justify-center shrink-0 border border-gray-100 dark:border-stone-800">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm">ParkFlow Guarantee</h4>
                <p className="text-[10px] text-blue-700/60 dark:text-blue-400/60 leading-relaxed font-bold">
                  Đảm bảo quyền lợi khi đặt qua hệ thống. Hoàn tiền 100% nếu bãi hết chỗ hoặc có sự cố kỹ thuật.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[85vh] overflow-y-auto font-sans p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold">Bộ sưu tập hình ảnh</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allImages.map((img, idx) => (
              <div
                key={idx}
                className="aspect-video rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:ring-2 ring-blue-500 transition-all cursor-zoom-in"
                onClick={() => setSelectedPreviewImg(img)}
              >
                <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview (Full Screen) */}
      <Dialog open={!!selectedPreviewImg} onOpenChange={(open) => !open && setSelectedPreviewImg(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl w-full bg-black/95 border-none p-0 flex items-center justify-center overflow-hidden h-auto max-h-[90vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Xem ảnh chi tiết</DialogTitle>
          </DialogHeader>
          {selectedPreviewImg && (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={selectedPreviewImg}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                alt="Preview"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
