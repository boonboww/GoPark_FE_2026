"use client";

import React, { useEffect, useState } from "react";
import {
  Car,
  Users,
  Clock,
  MapPin,
  ChevronRight,
  Home,
  Ticket,
  Route,
  User as UserIcon,
  Bell,
  ArrowRight,
  Monitor,
  Loader2
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence, Variants } from "framer-motion";

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
      };
    };
  };
  qrCode?: {
    content: string;
  };
}

const VehicleListSkeleton = () => (
  <div className="space-y-6 w-full animate-pulse">
    <Skeleton className="h-4 w-40 rounded-full" />
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4 rounded-[24px] border-none bg-card/50">
          <div className="flex items-center gap-5">
            <Skeleton className="w-24 h-16 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const QRCardSkeleton = () => (
  <div className="w-full space-y-6 animate-pulse">
    <Card className="rounded-[32px] border border-border/40 bg-card/50 overflow-hidden">
      <div className="p-6 flex flex-col items-center border-b border-dashed border-border">
        <Skeleton className="w-64 h-64 rounded-[2rem]" />
        <Skeleton className="h-4 w-48 mt-6 rounded-full" />
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-border flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </Card>
    <Skeleton className="h-20 w-full rounded-[28px]" />
  </div>
);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function VeQRPage() {
  const [dataVehicles, setDataVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const { user } = useAuthStore();

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

  return (
    <div className={`min-h-screen bg-background text-foreground pb-20 ${roboto.className}`}>
      <Header />

      <main className="max-w-[1200px] mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row gap-12 items-start"
        >
          {/* CỘT TRÁI: LỰA CHỌN */}
          <div className="flex-1 space-y-10 w-full">
            <header className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight text-foreground">VÉ QR CỦA TÔI</h1>
              <p className="text-muted-foreground font-medium text-lg">
                Sử dụng mã QR để check-in & check-out tại cổng
              </p>
            </header>

            {/* Facebook-style Loading Spinner */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-center items-center py-4 overflow-hidden"
                >
                  <div className="bg-card/50 backdrop-blur-sm p-3 rounded-full border border-border shadow-sm">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" strokeWidth={2.5} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="skeleton-left"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-10"
                >
                  <VehicleListSkeleton />
                  <section className="space-y-4">
                    <Card className="bg-primary/5 border-primary/10 rounded-[28px] overflow-hidden">
                      <CardContent className="p-8">
                        <Skeleton className="h-4 w-40 mb-6" />
                        <div className="flex items-center gap-12">
                          {[1, 2].map(i => <Skeleton key={i} className="w-10 h-10 rounded-full" />)}
                        </div>
                      </CardContent>
                    </Card>
                  </section>
                </motion.div>
              ) : (
                <motion.div
                  key="content-left"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-10"
                >
                  <section className="space-y-6">
                    <h2 className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                      Phương tiện của bạn ({dataVehicles.length})
                    </h2>
                    <div className="space-y-4">
                      {dataVehicles.map((v) => {
                        const isOperating = allBookings.some(b =>
                          b.vehicle?.id === v.id &&
                          (b.status === "CONFIRMED" || b.status === "ONGOING")
                        );
                        const isSelected = selectedVehicle?.id === v.id;

                        return (
                          <motion.div key={v.id} variants={itemVariants}>
                            <Card
                              onClick={() => setSelectedVehicle(v)}
                              className={`group cursor-pointer rounded-[24px] border-2 transition-all duration-500 overflow-hidden relative
                                ${isSelected
                                  ? "bg-card border-primary shadow-lg ring-4 ring-primary/5"
                                  : "bg-card/50 border-transparent hover:border-border shadow-sm"
                                }
                                ${isOperating ? "ring-2 ring-emerald-500/50 border-emerald-500/20 shadow-emerald-500/10" : ""}
                              `}
                            >
                              <CardContent className="p-4 flex items-center gap-5">
                                {isOperating && (
                                  <div className="absolute top-0 right-0 p-2">
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-none hover:bg-emerald-500/20 transition-colors">
                                      <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                                      <span className="text-[8px] font-black uppercase tracking-tight">Đang hoạt động</span>
                                    </Badge>
                                  </div>
                                )}

                                <div className={`w-24 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-muted group-hover:bg-accent border transition-all duration-500
                                  ${isOperating ? "border-emerald-500/20 ring-2 ring-emerald-500/5" : "border-border/50"}
                                `}>
                                  {v.image ? (
                                    <img src={v.image} alt={v.brand} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase">No Image</div>
                                  )}
                                </div>

                                <div className="flex-1">
                                  <h3 className="text-xl font-black text-foreground">{v.brand || "Chưa xác định"}</h3>
                                  <p className="text-muted-foreground font-medium text-sm">{v.type || "Phương tiện cá nhân"}</p>
                                </div>

                                <div className="text-right">
                                  <span className={`text-xl font-bold uppercase tracking-wider transition-colors
                                    ${isOperating ? "text-emerald-600" : "text-foreground"}
                                  `}>
                                    {v.plate_number}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>

                  <motion.section variants={itemVariants} className="space-y-4">
                    <Card className="bg-primary/5 border-primary/10 rounded-[28px] overflow-hidden">
                      <CardContent className="p-8 flex items-center justify-between">
                        <div className="space-y-1 w-full">
                          <h2 className="text-[12px] font-black text-primary uppercase tracking-[0.2em]">Trạng thái hoạt động</h2>
                          <div className="flex items-center gap-12 mt-6">
                            {dataVehicles.map((v, index) => {
                              const isOperating = allBookings.some(b =>
                                b.vehicle?.id === v.id &&
                                (b.status === "CONFIRMED" || b.status === "ONGOING")
                              );
                              return (
                                <React.Fragment key={v.id}>
                                  <div className="flex flex-col items-center gap-2">
                                    <div
                                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 
                                        ${isOperating
                                          ? "bg-emerald-500 ring-8 ring-emerald-500/10 shadow-lg shadow-emerald-500/20"
                                          : "bg-muted ring-0 shadow-none"
                                        }`}
                                    >
                                      <Car className={`w-5 h-5 ${isOperating ? "text-white" : "text-muted-foreground"}`} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isOperating ? "text-emerald-600" : "text-muted-foreground"}`}>
                                      Xe {index + 1}
                                    </span>
                                  </div>
                                  {index < dataVehicles.length - 1 && (
                                    <div className="flex-1 h-[2px] bg-border relative -mt-5">
                                      <div className={`absolute inset-0 bg-emerald-500 transition-all duration-1000 ${isOperating && allBookings.some(b => b.vehicle?.id === dataVehicles[index + 1]?.id && (b.status === "CONFIRMED" || b.status === "ONGOING")) ? "w-full" : "w-0"}`}></div>
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                        <Badge className="bg-primary text-primary-foreground text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-primary/20 whitespace-nowrap self-start border-none">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                          Live Track
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CỘT PHẢI: VÉ */}
          <div className="w-full lg:w-[420px] space-y-4 lg:sticky lg:top-28">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="skeleton-right" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <QRCardSkeleton />
                </motion.div>
              ) : (
                <motion.div key="content-right" variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="rounded-[32px] shadow-xl shadow-primary/5 overflow-hidden border border-border/40 bg-card">
                    <CardContent className="p-0">
                      {/* Phần trên QR */}
                      <div className="p-6 flex flex-col items-center border-b-2 border-dashed border-border/50 relative">
                        <div className="bg-background p-4 rounded-[2rem] shadow-xl shadow-primary/5 border border-border/50 mb-3 relative group">
                          <div className={`rounded-xl p-3 transition-transform group-hover:scale-105 duration-500 border-[3px] 
                            ${(activeBooking?.status === "ONGOING" || activeBooking?.status === "CONFIRMED")
                              ? "border-emerald-600 shadow-emerald-500/10"
                              : "border-muted shadow-muted/10"
                            }`}
                          >
                            <div className="bg-white p-1.5 rounded-lg">
                              {activeBooking ? (
                                <QRCodeSVG
                                  value={activeBooking.qrCode?.content || activeBooking.id}
                                  size={140}
                                  level="H"
                                  fgColor={(activeBooking?.status === "ONGOING" || activeBooking?.status === "CONFIRMED") ? "#064e3b" : "#000000"}
                                  includeMargin={false}
                                />
                              ) : (
                                <div className="w-[140px] h-[140px] flex items-center justify-center text-muted-foreground/30 font-black text-center text-xs">
                                  NO QR CODE AVAILABLE
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] whitespace-nowrap">
                            Scan at Turnstile
                          </div>
                        </div>

                        <div className="text-center px-4 mt-2">
                          <p className={`text-[11px] font-bold leading-relaxed transition-colors
                            ${(activeBooking?.status === "ONGOING" || activeBooking?.status === "CONFIRMED") ? "text-emerald-600" : "text-muted-foreground"}`}>
                            {activeBooking
                              ? ((activeBooking?.status === "ONGOING" || activeBooking?.status === "CONFIRMED")
                                ? "Vui lòng quét mã này tại máy quét ở cổng để thực hiện Check-in hoặc Check-out."
                                : "Vé này đã hoàn thành và không còn hiệu lực ra vào.")
                              : "Chọn phương tiện để xem mã QR của bạn."}
                          </p>
                          {activeBooking && (activeBooking?.status === "ONGOING" || activeBooking?.status === "CONFIRMED") && (
                            <Badge className="mt-2 bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[9px] font-black uppercase tracking-[0.1em] px-3 py-1 rounded-full border shadow-none">
                              Mã QR này đang trong thời gian hiệu lực.
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        {activeBooking ? (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-0.5">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Tầng</span>
                                <div className="text-2xl font-bold text-foreground">
                                  {activeBooking.slot?.parkingZone?.parkingFloor?.floor_name || "N/A"}
                                </div>
                              </div>
                              <div className="space-y-0.5 text-right">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Khu vực</span>
                                <div className="text-2xl font-bold text-foreground">
                                  {activeBooking.slot?.parkingZone?.zone_name || "N/A"}
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Vị trí</span>
                                <div className="text-2xl font-bold text-foreground">
                                  {activeBooking.slot?.code || "N/A"}
                                </div>
                              </div>
                              <div className="space-y-0.5 text-right">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Trạng thái</span>
                                <div className="text-sm font-bold text-emerald-600 uppercase">
                                  {activeBooking.status}
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-border flex items-center justify-between">
                              <div className="space-y-0.5">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Giờ vào</span>
                                <div className="text-xl font-semibold text-foreground">
                                  {dayjs(activeBooking.start_time).format("HH:mm")}
                                </div>
                              </div>
                              <div className="flex-1 flex justify-center">
                                <ArrowRight className="w-5 h-5 text-muted-foreground/30" />
                              </div>
                              <div className="space-y-0.5 text-right">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Giờ ra</span>
                                <div className="text-xl font-semibold text-foreground">
                                  {dayjs(activeBooking.end_time).format("HH:mm")}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="py-10 text-center border-2 border-dashed border-border rounded-3xl">
                            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest leading-relaxed">
                              Phương tiện này hiện<br />không có lịch đặt chỗ
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Button 
                    onClick={() => activeBooking && handleOpenExtend(activeBooking)}
                    disabled={!activeBooking || (activeBooking.status !== "ONGOING" && activeBooking.status !== "CONFIRMED")}
                    className={`w-full py-8 rounded-[28px] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 group mt-4
                      ${activeBooking && (activeBooking.status === "ONGOING" || activeBooking.status === "CONFIRMED")
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 hover:-translate-y-1 active:scale-95"
                        : "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                      }`}
                  >
                    <Ticket className="w-6 h-6 transition-transform group-hover:rotate-12" />
                    GIA HẠN THÊM
                  </Button>

                  <p className="text-[11px] text-muted-foreground font-medium text-center px-8 leading-relaxed mt-4">
                    By confirming, you agree to our terms of service and dynamic pricing policy for peak hours.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      <ExtendBookingModal
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        booking={bookingToExtend}
      />

      <div className="h-24"></div>
    </div>
  );
}
