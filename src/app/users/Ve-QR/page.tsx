"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Car,
  Users,
  Clock,
  MapPin,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Home,
  Ticket,
  Route,
  User as UserIcon,
  Bell,
  ArrowRight,
  Monitor,
  Loader2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  RefreshCcw,
  Settings,
  History,
  LayoutDashboard,
  Lock
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Roboto } from "next/font/google";
import Header from "@/components/layout/Header";
import { QRCodeSVG } from "qrcode.react";
import { useAuthStore } from "@/stores/auth.store";
import { get } from "@/lib/api";
import { ExtendBookingModal } from "@/components/features/parking-detail/ExtendBookingModal";
import dayjs from "dayjs";

// Shadcn UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import { QRCardSkeleton, VehicleListSkeleton, LiveTrackSkeleton } from "@/components/skeletons/QRCodeSkeleton";

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

interface Vehicle {
  id: number;
  brand: string;
  type: string;
  plate_number: string;
  image?: string;
}

interface Booking {
  id: string;
  status: string;
  start_time: string;
  end_time: string;
  vehicle?: Vehicle;
  slot?: {
    code: string;
    parkingZone?: {
      zone_name: string;
      parkingFloor?: {
        floor_name: string;
        parkingLot?: {
          name: string;
        };
      };
    };
  };
  qrCode?: {
    content: string;
  };
}


export default function VeQRPage() {
  const [dataVehicles, setDataVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const { user } = useAuthStore();
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [bookingToExtend, setBookingToExtend] = useState<Booking | null>(null);

  const handleOpenExtend = (booking: Booking) => {
    console.log("Dữ liệu chuẩn bị gán vào state:", booking);
    setBookingToExtend(booking);
    setIsExtendModalOpen(true);
  };

  const getListBookingMyQR = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const vRes: any = await get('/vehicles');
      const vehicles = Array.isArray(vRes) ? vRes : (vRes?.data || []);
      setDataVehicles(vehicles);

      const bRes: any = await get(`/booking/user/${user.id}`);
      const bookings = Array.isArray(bRes) ? bRes : (bRes?.data || []);
      setAllBookings(bookings);

      let vehicleToSelect = vehicles.length > 0 ? vehicles[0] : null;
      const latestActive = bookings.find((b: any) => b.status === "CONFIRMED" || b.status === "ONGOING");
      if (latestActive && latestActive.vehicle) {
        const bookedVehicle = vehicles.find((v: any) => v.id === latestActive.vehicle.id);
        if (bookedVehicle) vehicleToSelect = bookedVehicle;
      } else if (bookings.length > 0 && bookings[0].vehicle) {
        const lastVehicle = vehicles.find((v: any) => v.id === bookings[0].vehicle.id);
        if (lastVehicle) vehicleToSelect = lastVehicle;
      }

      if (vehicleToSelect) setSelectedVehicle(vehicleToSelect);
    } catch (err) {
      console.log("Lỗi fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getListBookingMyQR();
  }, [user]);

  // Màu sắc chủ đạo theo yêu cầu
  const BRAND_GREEN = "#00A74D";

  const fetchActiveBooking = async (vehicleId: number) => {
    try {
      const res: any = await get(`/booking/active-by-vehicle/${vehicleId}`);
      if (res) {
        const bookingData = res.data || res;
        setActiveBooking(bookingData);
      } else {
        setActiveBooking(null);
      }
    } catch (err) {
      console.error("Lỗi lấy booking:", err);
      setActiveBooking(null);
    }
  };

  useEffect(() => {
    if (selectedVehicle?.id) {
      fetchActiveBooking(selectedVehicle.id);
    }
  }, [selectedVehicle]);

  const isExpired = useMemo(() => {
    if (!activeBooking?.end_time) return false;
    return dayjs(activeBooking.end_time).isBefore(dayjs());
  }, [activeBooking]);

  const isSelectedOperating = useMemo(() => {
    if (!selectedVehicle) return false;
    return allBookings.some(b =>
      b.vehicle?.id === selectedVehicle.id &&
      (b.status === "CONFIRMED" || b.status === "ONGOING")
    );
  }, [selectedVehicle, allBookings]);

  // Lọc lịch sử trong 30 ngày gần nhất
  const recentHistory = allBookings.filter(booking => {
    if (!booking.start_time) return false;
    const bookingDate = dayjs(booking.start_time);
    const thirtyDaysAgo = dayjs().subtract(30, 'day');
    return bookingDate.isAfter(thirtyDaysAgo);
  });

  const displayedHistory = isHistoryExpanded ? recentHistory : recentHistory.slice(0, 5);

  return (
    <div className={`min-h-screen transition-colors duration-300 bg-white dark:bg-[#121212] text-[#000000] dark:text-[#F3F4F6] pb-20 ${roboto.className}`}>
      <Header />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-12">

        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight uppercase">
              VÉ QR CỦA TÔI
            </h1>
            <p className="font-semibold text-lg text-zinc-600 dark:text-zinc-400">
              Sử dụng mã QR để check-in & check-out tại cổng
            </p>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* LEFT SIDEBAR: VEHICLE LIST */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <VehicleListSkeleton />
            ) : (
              dataVehicles.map((v) => {
                const isSelected = selectedVehicle?.id === v.id;
                const isOperating = allBookings.some(b =>
                  b.vehicle?.id === v.id &&
                  (b.status === "CONFIRMED" || b.status === "ONGOING")
                );

                return (
                  <Card
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={`group cursor-pointer rounded-[2rem] border-2 transition-all duration-300 overflow-hidden relative
                      ${isSelected
                        ? `border-[#00A74D] ring-4 ring-[#00A74D]/10 bg-[#F9F9F9] dark:bg-[#1E1E1E]`
                        : "border-[#E5E7EB] dark:border-[#374151] hover:border-[#00A74D]/50 bg-white dark:bg-[#1E1E1E]/50 shadow-sm"
                      }
                    `}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`w-16 h-12 rounded-xl transition-all duration-500 overflow-hidden border 
                          ${isSelected ? 'border-[#00A74D]' : 'border-[#E5E7EB] dark:border-[#374151]'}
                        `}>
                          {v.image ? (
                            <img src={v.image} alt={v.brand} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center ${isOperating ? 'text-white' : 'bg-[#F9F9F9] dark:bg-[#121212] text-zinc-400'}`} style={{ backgroundColor: isOperating ? BRAND_GREEN : undefined }}>
                              <Car className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <Badge
                          style={{
                            backgroundColor: isOperating ? BRAND_GREEN : undefined,
                            boxShadow: isOperating ? `0 0 15px ${BRAND_GREEN}60` : 'none'
                          }}
                          className={`rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-none transition-all duration-500 ${isOperating ? 'text-white' : 'bg-[#E5E7EB] dark:bg-[#374151] text-zinc-500'}`}
                        >
                          {isOperating ? 'ĐANG HOẠT ĐỘNG' : 'ĐANG TRỐNG'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black tracking-tighter text-[#000000] dark:text-[#F3F4F6]">{v.plate_number}</h3>
                        <p className="text-sm font-semibold opacity-70 text-[#000000] dark:text-zinc-400">{v.brand} • {v.type || "White"}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* CENTER: QR & DETAILS */}
          <div className="lg:col-span-9">
            {loading ? (
              <QRCardSkeleton />
            ) : (
              <Card className="rounded-[2.5rem] border-2 border-[#E5E7EB] dark:border-[#374151] bg-white/60 dark:bg-stone-900/60 backdrop-blur-2xl shadow-xl overflow-hidden min-h-[550px] transition-all duration-500">
                <CardContent className="p-8 md:p-12">
                  <div className="mb-10 pb-8 border-b border-dashed border-[#E5E7EB] dark:border-[#374151] flex flex-col items-center lg:items-start">
                    <h1 className="text-2xl md:text-3xl font-black text-[#000000] dark:text-[#F3F4F6] tracking-tighter">
                      {isSelectedOperating ? (activeBooking?.slot?.parkingZone?.parkingFloor?.parkingLot?.name || "N/A") : "CHƯA CÓ LƯỢT ĐỖ"}
                    </h1>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* QR FRAME */}
                    <div className="space-y-8 flex flex-col items-center">
                      <div className="relative aspect-square w-full max-w-[360px] group">
                        <div className={`absolute inset-0 border-2 rounded-[3rem] p-6 flex items-center justify-center transition-all duration-700
                          ${isSelectedOperating ? 'border-[#00A74D]' : 'border-[#E5E7EB] dark:border-[#374151]'}
                        `}>
                          <div className={`bg-white p-6 rounded-[2.5rem] relative w-full h-full flex items-center justify-center overflow-hidden transition-all duration-500`}>
                            {/* Inner scanner markers */}
                            <div
                              style={{ borderColor: isSelectedOperating ? BRAND_GREEN : "#E5E7EB" }}
                              className={`absolute inset-6 border-2 border-dashed rounded-3xl pointer-events-none z-10 transition-opacity duration-700 ${selectedVehicle ? 'opacity-30' : 'opacity-0'}`}
                            ></div>

                            <div className={`transition-all duration-500 flex flex-col items-center gap-4 ${!isSelectedOperating ? 'opacity-20' : 'opacity-100'}`}>
                              {selectedVehicle ? (
                                <QRCodeSVG
                                  value={activeBooking?.qrCode?.content || String(selectedVehicle.id)}
                                  size={220}
                                  level="H"
                                  fgColor="#000000"
                                  includeMargin={false}
                                  className="relative z-0"
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-4 text-zinc-400">
                                  <Lock className="w-12 h-12 opacity-20" />
                                  <div className="text-[10px] font-black text-center tracking-[0.2em] uppercase px-8 opacity-40">
                                    CHỌN PHƯƠNG TIỆN
                                  </div>
                                </div>
                              )}
                            </div>

                            {!isSelectedOperating && selectedVehicle && (
                              <div className="absolute bottom-10 left-0 right-0 text-center animate-bounce">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 bg-white/80 backdrop-blur-sm py-1">
                                  Mã đã hết hạn
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-center space-y-4">
                        <p className="font-black tracking-[0.25em] uppercase text-xs">
                          QUÉT MÃ TẠI CỔNG
                        </p>
                      </div>
                    </div>

                    {/* DETAILS SECTION */}
  
                    <div className="flex flex-col justify-between py-2">
                      <div className="space-y-10">
                        <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#F3F4F6]">Chi tiết lượt đỗ</h2>
                          {activeBooking && (
                            <Badge
                              style={{ color: BRAND_GREEN, borderColor: `${BRAND_GREEN}40`, backgroundColor: `${BRAND_GREEN}10` }}
                              className="rounded-full px-5 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-none border"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                              {activeBooking.status}
                            </Badge>
                          )}
                        </div>

                        {selectedVehicle ? (
                          <div className="grid grid-cols-2 gap-y-10 gap-x-12">
                            

                            <div className="space-y-1.5">
                              <p className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.15em]">TẦNG</p>
                              <p className="text-2xl font-black text-[#000000] dark:text-[#F3F4F6]">
                                {isSelectedOperating ? (activeBooking?.slot?.parkingZone?.parkingFloor?.floor_name || "N/A") : "--"}
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.15em]">KHU VỰC</p>
                              <p className="text-2xl font-black text-[#000000] dark:text-[#F3F4F6]">
                                {isSelectedOperating ? (activeBooking?.slot?.parkingZone?.zone_name || "N/A") : "--"}
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.15em]">VỊ TRÍ</p>
                              <p
                                style={{ color: isSelectedOperating ? BRAND_GREEN : "#000000" }}
                                className="text-4xl font-black tracking-tighter"
                              >
                                {isSelectedOperating ? (activeBooking?.slot?.code || "N/A") : "--"}
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.15em]">THỜI GIAN VÀO</p>
                              <p className="text-2xl font-black text-[#000000] dark:text-[#F3F4F6]">
                                {isSelectedOperating ? dayjs(activeBooking?.start_time).format("HH:mm") : "--"}
                              </p>
                            </div>

                            <div className="col-span-2 pt-6 border-t border-dashed border-[#E5E7EB] dark:border-[#374151]">
                              <p className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.15em] mb-2">THỜI GIAN HẾT HẠN (DỰ KIẾN)</p>
                              <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-black tracking-tighter text-[#000000] dark:text-[#F3F4F6]">
                                  {isSelectedOperating ? dayjs(activeBooking?.end_time).format("HH:mm") : "--:--"}
                                </span>
                                {isSelectedOperating && (() => {
                                  const diff = dayjs(activeBooking?.end_time).diff(dayjs(), 'minute');
                                  return (
                                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                                      ({diff} phút nữa)
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-12 px-8 border-2 border-dashed border-[#E5E7EB] dark:border-[#374151] rounded-3xl text-center bg-black/5 dark:bg-white/5">
                            <Ticket className="w-10 h-10 text-zinc-400 mx-auto mb-4" />
                            <p className="text-[12px] font-black uppercase tracking-widest leading-relaxed opacity-60">
                              Vui lòng chọn phương tiện<br />để xem chi tiết
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => activeBooking && handleOpenExtend(activeBooking)}
                        disabled={!activeBooking || (activeBooking.status !== "ONGOING" && activeBooking.status !== "CONFIRMED")}
                        style={{
                          backgroundColor: (activeBooking && (activeBooking.status === "ONGOING" || activeBooking.status === "CONFIRMED")) ? `${BRAND_GREEN}10` : undefined,
                          color: (activeBooking && (activeBooking.status === "ONGOING" || activeBooking.status === "CONFIRMED")) ? BRAND_GREEN : undefined,
                          borderColor: (activeBooking && (activeBooking.status === "ONGOING" || activeBooking.status === "CONFIRMED")) ? `${BRAND_GREEN}50` : "transparent"
                        }}
                        className={`w-full mt-12 py-9 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all flex items-center justify-center gap-4 group border-2
                          ${activeBooking && (activeBooking.status === "ONGOING" || activeBooking.status === "CONFIRMED")
                            ? "hover:opacity-80 shadow-lg hover:-translate-y-1 active:scale-[0.98]"
                            : "bg-[#E5E7EB] dark:bg-[#374151] text-zinc-400 shadow-none cursor-not-allowed"
                          }`}
                      >
                        <Plus className={`w-6 h-6 transition-transform ${activeBooking ? "group-hover:rotate-90" : ""}`} />
                        GIA HẠN THÊM
                      </Button>
                    </div>
                  </div>

                  {/* FOOTER OF CENTER SECTION */}
                  <div className="mt-12 pt-8 border-t border-[#E5E7EB] dark:border-[#374151] flex flex-col md:flex-row justify-between items-center gap-6 opacity-70">
                    <div className="flex items-center gap-4 text-[12px] font-bold uppercase tracking-widest">
                      <div
                        style={{ color: BRAND_GREEN, borderColor: "#E5E7EB" }}
                        className="p-2 bg-[#F9F9F9] dark:bg-[#121212] rounded-xl border"
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      Mã QR đã được mã hóa an toàn cao cấp
                    </div>
                    <div className="text-[12px] font-mono font-bold uppercase tracking-widest bg-[#F9F9F9] dark:bg-[#121212] px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-[#374151]">
                      ID: {activeBooking?.id ? String(activeBooking.id).slice(0, 8).toUpperCase() : "FF-QR-99023"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* --- ACTIVITY TIMELINE --- */}
        <section className="bg-white/60 dark:bg-stone-900/60 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 border-2 border-[#E5E7EB] dark:border-[#374151] shadow-xl relative overflow-hidden transition-all duration-500">
          <div className="flex justify-between items-center mb-16 relative z-10">
            <h2 className="text-[14px] font-black opacity-60 uppercase tracking-[0.25em]">TRẠNG THÁI HOẠT ĐỘNG</h2>
            <Badge
              style={{ color: BRAND_GREEN, borderColor: `${BRAND_GREEN}30`, backgroundColor: `${BRAND_GREEN}10` }}
              className="rounded-full px-6 py-2.5 text-[12px] font-black uppercase tracking-widest border"
            >
              <span
                style={{ backgroundColor: BRAND_GREEN, boxShadow: `0 0 10px ${BRAND_GREEN}cc` }}
                className="w-2.5 h-2.5 rounded-full mr-3 animate-pulse"
              ></span>
              LIVE TRACK
            </Badge>
          </div>

          <div className="relative px-12 md:px-24">
            {/* Timeline Line */}
            {(() => {
              const activeIndices = dataVehicles.slice(0, 3).map((v, idx) => {
                const isOperating = allBookings.some(b =>
                  b.vehicle?.id === v.id &&
                  (b.status === "CONFIRMED" || b.status === "ONGOING")
                );
                return isOperating ? idx : -1;
              });
              const lastActiveIndex = Math.max(...activeIndices);
              const progressWidth = lastActiveIndex > 0 ? lastActiveIndex * 50 : 0;

              return (
                <div className="absolute top-1/2 left-12 right-12 md:left-24 md:right-24 h-1.5 bg-[#E5E7EB] dark:bg-[#374151] -translate-y-1/2 overflow-hidden rounded-full z-0">
                  <div
                    style={{
                      backgroundColor: BRAND_GREEN,
                      boxShadow: `0 0 15px ${BRAND_GREEN}66`,
                      width: `${progressWidth}%`
                    }}
                    className="h-full transition-all duration-700"
                  ></div>
                </div>
              );
            })()}

            <div className="relative flex justify-between items-center z-10">
              {dataVehicles.slice(0, 3).map((v, idx) => {
                const isOperating = allBookings.some(b =>
                  b.vehicle?.id === v.id &&
                  (b.status === "CONFIRMED" || b.status === "ONGOING")
                );
                return (
                  <div key={v.id} className="flex flex-col items-center gap-5 relative group">
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center border-[6px] transition-all duration-700 overflow-hidden relative
                        ${isOperating ? 'scale-110' : 'scale-100'}
                        bg-[#F9F9F9] dark:bg-[#1E1E1E]
                      `}
                      style={{
                        boxShadow: isOperating ? `0 0 20px ${BRAND_GREEN}80, 0 0 40px ${BRAND_GREEN}40, inset 0 0 20px ${BRAND_GREEN}20` : 'none',
                        borderColor: isOperating ? BRAND_GREEN : 'transparent'
                      }}
                    >
                      <div className={`w-full h-full p-1 transition-all duration-500 ${isOperating ? '' : ''}`}>
                        {v.image ? (
                          <img src={v.image} alt={v.brand} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center rounded-full ${isOperating ? 'text-white' : 'bg-[#E5E7EB] dark:bg-[#374151] text-zinc-500'}`}
                            style={{ backgroundColor: isOperating ? BRAND_GREEN : undefined }}
                          >
                            <Car className="w-10 h-10" />
                          </div>
                        )}
                      </div>

                      {/* Pulsing ring for active only */}
                      {isOperating && (
                        <div className="absolute inset-0 rounded-full border-4 border-[#00A74D] animate-ping opacity-20"></div>
                      )}
                    </div>
                    <span
                      className={`text-[14px] font-black uppercase tracking-[0.15em] transition-all duration-500 text-[#000000] dark:text-[#F3F4F6] ${isOperating ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,167,77,0.6)]' : 'opacity-40'}`}
                    >
                      XE {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- HISTORY TABLE --- */}
        <section className="bg-white/60 dark:bg-stone-900/60 backdrop-blur-2xl rounded-[2.5rem] border-2 border-[#E5E7EB] dark:border-[#374151] shadow-xl overflow-hidden transition-all duration-500">
          <div className="p-8 md:p-10 border-b border-[#E5E7EB] dark:border-[#374151] flex justify-between items-center bg-[#F9F9F9] dark:bg-[#121212]/50">
            <h2 className="text-xl font-bold tracking-tight uppercase">LỊCH SỬ CHECK-IN/CHECK-OUT</h2>
            <Badge variant="secondary" className="rounded-full px-5 py-1.5 bg-[#E5E7EB] dark:bg-[#374151] text-zinc-500 text-[10px] font-black uppercase tracking-widest border-none">
              Gần đây
            </Badge>
          </div>

          <div className="overflow-x-auto p-4 md:p-8">
            <Table className="border-collapse border border-[#E5E7EB] dark:border-[#374151] w-full">
              <TableHeader className="bg-[#F9F9F9] dark:bg-[#121212]">
                <TableRow className="border-b border-[#E5E7EB] dark:border-[#374151] hover:bg-transparent">
                  <TableHead className="text-[18px] font-black uppercase tracking-tight px-8 py-6 border border-[#E5E7EB] dark:border-[#374151] h-auto">PHƯƠNG TIỆN</TableHead>
                  <TableHead className="text-[18px] font-black uppercase tracking-tight px-8 py-6 border border-[#E5E7EB] dark:border-[#374151] h-auto">THỜI GIAN (VÀO - RA)</TableHead>
                  <TableHead className="text-[18px] font-black uppercase tracking-tight px-8 py-6 border border-[#E5E7EB] dark:border-[#374151] h-auto">ĐỊA ĐIỂM</TableHead>
                  <TableHead className="text-[18px] font-black uppercase tracking-tight px-8 py-6 border border-[#E5E7EB] dark:border-[#374151] h-auto text-center">TRẠNG THÁI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentHistory.length > 0 ? (
                  displayedHistory.map((booking, idx) => (
                    <TableRow
                      key={booking.id}
                      className="border-b border-[#E5E7EB] dark:border-[#374151] hover:bg-[#F9F9F9] dark:hover:bg-white/5 transition-colors dark:even:bg-white/[0.02]"
                    >
                      <TableCell className="px-8 py-6 border border-[#E5E7EB] dark:border-[#374151]">
                        <div className="flex flex-col">
                          <span className="font-bold text-[17px] tracking-tight">{booking.vehicle?.plate_number}</span>
                          <span className="text-[14px] opacity-60 font-semibold uppercase tracking-tight">{booking.vehicle?.brand}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-6 border border-[#E5E7EB] dark:border-[#374151]">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              style={{ backgroundColor: `${BRAND_GREEN}15`, color: BRAND_GREEN }}
                              className="text-[11px] font-black px-2 py-0.5 rounded uppercase"
                            >
                              Vào
                            </span>
                            <span className="text-[16px] font-semibold">{dayjs(booking.start_time).format("HH:mm, DD/MM/YYYY")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black bg-red-500/10 text-red-500 px-2 py-0.5 rounded uppercase">Ra</span>
                            <span className="text-[16px] font-semibold">{dayjs(booking.end_time).format("HH:mm, DD/MM/YYYY")}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-6 border border-[#E5E7EB] dark:border-[#374151]">
                        <span className="text-[17px] font-semibold">
                          {booking.slot?.parkingZone?.parkingFloor?.floor_name}, {booking.slot?.code}
                        </span>
                      </TableCell>
                      <TableCell className="px-8 py-6 border border-[#E5E7EB] dark:border-[#374151]">
                        <div className="flex flex-col items-center gap-3">
                          <Badge className={`rounded-md px-4 py-2 text-[13px] font-black uppercase tracking-widest border shadow-none
                          ${booking.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                              booking.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                'bg-blue-500/10 text-blue-500 border-blue-500/30'}
                        `}>
                            {booking.status}
                          </Badge>
                          <span className="text-[11px] font-black opacity-60 uppercase tracking-widest">
                            {booking.status === 'COMPLETED' ? 'CHECK-OUT' :
                              booking.status === 'CONFIRMED' ? 'CHƯA CHECK-IN' : 'CHECK-IN'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-20 text-center text-zinc-500 font-bold uppercase tracking-widest">
                      Không có lịch sử trong 30 ngày qua
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {recentHistory.length > 5 && (
            <div className="p-8 bg-[#F9F9F9] dark:bg-[#121212]/50 text-center border-t border-[#E5E7EB] dark:border-[#374151]">
              <Button
                variant="link"
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                style={{ color: BRAND_GREEN }}
                className="font-black text-xs uppercase tracking-[0.2em] hover:no-underline opacity-80 hover:opacity-100 group flex items-center justify-center mx-auto"
              >
                {isHistoryExpanded ? (
                  <>
                    Thu gọn
                    <ChevronUp className="w-5 h-5 ml-2 transition-transform" />
                  </>
                ) : (
                  <>
                    Xem thêm hoạt động trong tháng
                    <ChevronDown className="w-5 h-5 ml-2 transition-transform group-hover:translate-y-1" />
                  </>
                )}
              </Button>
            </div>
          )}
        </section>
      </main>

      <ExtendBookingModal
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        booking={bookingToExtend}
      />
    </div>
  );
}
