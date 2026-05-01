"use client";

import React, { useEffect, useState } from "react";
import { get } from "@/lib/api";
import { Star, MapPin, Search, ChevronLeft, ChevronRight, Calendar, Clock, FileText, RotateCcw, Loader2, CheckCircle2, Eye } from "lucide-react";
import Header from "@/components/layout/Header";
import DetailHistoryBooking from "./detailHistoryBooking";
import RateBookingModal from "./rateBookingModal";
import ViewReviewModal from "./viewReviewModal";
import { useAuthStore } from "@/stores";
import { mapBookingData } from "@/lib/booking-until";
import { Roboto } from "next/font/google";
import dayjs from "dayjs";

// Shadcn UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence, Variants } from "framer-motion";

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const statusMap: Record<string, string> = {
  "Đã xác nhận": "CONFIRMED",
  "Đang hoạt động": "ONGOING",
  "Đã hoàn thành": "COMPLETED"
};

interface BookingItem {
  id: string;
  name: string;
  address: string;
  code: string;
  start_date: string;
  start_date_iso: string;
  end_date: string;
  end_date_iso: string;
  start_timestamp: number;
  start_time: string;
  end_time: string;
  statusRaw: string;
  status: string;
  total_price: number;
  end_time_raw: string;
  qrCode_content: string;
}

const HistoryCardSkeleton = () => (
  <Card className="overflow-hidden border-2 border-border/50 rounded-[32px] bg-card/50 mb-6 animate-pulse">
    <div className="p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <Skeleton className="h-10 w-3/4 mb-3" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
        <div className="flex flex-wrap lg:flex-nowrap gap-3">
          <Skeleton className="h-14 w-32 rounded-2xl" />
          <Skeleton className="h-14 w-32 rounded-2xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-6 bg-muted/30 p-6 rounded-[28px] border border-border/50">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-16 mb-3" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
        <div className="w-full sm:w-1/2">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-14 w-40 rounded-2xl" />
      </div>
    </div>
  </Card>
);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  }
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
  exit: {
    y: -20,
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

function historyBooking() {
  const [booking, setBooking] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);
  
  const [ratingBooking, setRatingBooking] = useState<any>(null);
  const [openRateModal, setOpenRateModal] = useState(false);
  const [ratedBookings, setRatedBookings] = useState<Set<string>>(new Set());

  // State for viewing existing review
  const [viewingReviewBooking, setViewingReviewBooking] = useState<any>(null);
  const [openViewReviewModal, setOpenViewReviewModal] = useState(false);

  const [currentTime, setCurrentTime] = useState("");
  const [listDropdown, setListDropdown] = useState(false);
  const userId = useAuthStore((state) => state.user)
  useEffect(() => {

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    get(`/booking/user/${userId?.id}`)
      .then((res: any) => {
        const mapData = res.data.map((item: any) => mapBookingData(item));
        setBooking(mapData);

        // Check which COMPLETED bookings already have a review
        const completedIds = mapData
          .filter((b: any) => b.statusRaw === "COMPLETED")
          .map((b: any) => b.id);

        // Load reviews in parallel
        Promise.allSettled(
          completedIds.map((id: string) =>
            get(`/reviews/booking/${id}/review`).then((r: any) => {
              const reviewData = r?.data ?? r;
              return { id, hasReview: !!reviewData && !!reviewData.id };
            })
          )
        ).then((results) => {
          const reviewedSet = new Set<string>();
          results.forEach((r) => {
            if (r.status === 'fulfilled' && r.value.hasReview) {
              reviewedSet.add(r.value.id);
            }
          });
          setRatedBookings(reviewedSet);
        });
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const statusOptions = [
    "Tất cả",
    "Đã xác nhận",
    "Đang hoạt động",
    "Đã hoàn thành"
  ];


  const filteredBooking = booking
    .filter((b) => ["CONFIRMED", "ONGOING", "COMPLETED"].includes(b.statusRaw))
    .filter((b) => (filterStatus === "Tất cả" ? true : b.statusRaw === statusMap[filterStatus]))
    .filter((b) => {
      if (!selectedDate) return true;
      return b.start_date_iso === selectedDate;
    })
    .filter((b) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.start_timestamp - a.start_timestamp);

  const totalPages = Math.ceil(filteredBooking.length / itemsPerPage);

  const currentItems = filteredBooking.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const parkingOptions = Array.from(new Set(booking.map((b) => b.name)));
  const filteredOptions = parkingOptions.filter((name) =>
    name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className={`${roboto.className} min-h-screen bg-background text-foreground pb-16`}>
      <Header />

      <main className="max-w-[1200px] mx-auto px-6 mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-10">
            <h2 className="text-4xl font-black tracking-tight mb-2 text-foreground">
              Lịch sử đặt chỗ
            </h2>
            <p className="text-foreground font-semibold text-base">
              Xem và quản lý lịch sử đỗ xe của bạn một cách tiện lợi
            </p>
          </div>

        {/* CONTAINER TÌM KIẾM */}
        <Card className="relative z-30 bg-card/80 backdrop-blur-xl rounded-[32px] border-border/50 mb-10 transition-all hover:shadow-xl hover:shadow-primary/5">
          <CardContent className="p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center shadow-inner">
                <Search className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                Tìm kiếm chuyến đi
              </h3>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-end gap-6 lg:gap-4">
              {/* 1. Date Range Picker */}
              <div className="w-full lg:w-[280px]">
                <label className="block text-[11px] font-black text-foreground uppercase tracking-[0.2em] mb-3 ml-1">
                  Khoảng thời gian
                </label>
                <div className="relative w-full">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground z-10">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-muted/50 border-border rounded-2xl pl-12 pr-4 py-6 text-base font-bold text-foreground outline-none focus:ring-emerald-500/10 transition-all hover:bg-card"
                  />
                </div>
              </div>

            {/* 2. Phần Tìm Kiếm */}
            <div className="w-full lg:w-[350px] lg:mx-auto">
              <label className="block text-[11px] font-black text-foreground uppercase tracking-[0.2em] mb-3 ml-1">
                Từ khoá tìm kiếm
              </label>
              <div className="relative w-full">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground z-10">
                  <Search className="w-5 h-5" />
                </div>
                <Input
                  type="text"
                  placeholder="Tên bãi đỗ, địa chỉ..."
                  value={searchQuery}
                  onFocus={() => setListDropdown(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setListDropdown(true);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-muted/50 border-border rounded-2xl pl-12 pr-4 py-6 text-base font-bold text-foreground outline-none focus:ring-emerald-500/10 transition-all hover:bg-card placeholder:text-foreground/50"
                />

                {/* DROPDOWN - Custom styling */}
                {listDropdown && filteredOptions.length > 0 && (
                  <Card className="absolute top-[calc(100%+8px)] left-0 w-full bg-card border-border rounded-2xl shadow-xl z-50 max-h-60 overflow-auto p-2">
                    {filteredOptions.map((name, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setSearchQuery(name);
                          setListDropdown(false);
                          setCurrentPage(1);
                        }}
                        className="px-4 py-3 hover:bg-accent rounded-xl cursor-pointer font-bold text-foreground transition-colors"
                      >
                        {name}
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            </div>

            {/* 3. Quick Time Suggestions */}
            <div className="w-full lg:w-auto lg:border-l border-border lg:pl-8 flex flex-col items-start lg:items-end">
              <label className="block text-[11px] font-black text-foreground uppercase tracking-[0.2em] mb-3 ml-1">
                Gợi ý nhanh
              </label>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    const today = new Date().toISOString().split("T")[0];
                    setSelectedDate(today);
                    setCurrentPage(1);
                  }}
                  className="h-14 px-8 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Hôm nay
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDate("");
                    setSearchQuery("");
                    setFilterStatus("Tất cả");
                    setCurrentPage(1);
                  }}
                  className="h-14 px-8 rounded-2xl font-black text-sm transition-all active:scale-95 whitespace-nowrap flex items-center gap-2 border-border text-foreground"
                >
                  <RotateCcw className="w-4 h-4" />
                  Đặt lại
                </Button>
              </div>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* CÁC TABS PHÂN LỌC VÀ HIỂN THỊ TỔNG CỘNG */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-8 gap-5 px-1 w-full">
          {/* Tabs Bên Trái */}
          <div className="flex items-center bg-card/60 backdrop-blur rounded-3xl p-1.5 shadow-sm border border-border/50 overflow-x-auto w-full lg:w-auto shrink-0 z-10 scrollbar-hide">
            {statusOptions.map((status) => {
              const isActive = filterStatus === status;

              return (
                <Button
                  key={status}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => {
                    setFilterStatus(status);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2.5 whitespace-nowrap h-12 px-6 rounded-2xl text-[14px] font-black transition-all ${isActive
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                    : "text-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                    }`}
                >
                  {status}
                </Button>
              );
            })}
          </div>

          <div className="flex bg-card/60 text-foreground text-sm font-black px-6 py-3 rounded-2xl items-center justify-center gap-4 shadow-xl w-full lg:w-auto h-[56px] shrink-0 border border-border/50 backdrop-blur-md">
            <span className="uppercase tracking-[0.15em] text-foreground text-[11px]">
              {filterStatus === "Tất cả" ? "Tổng chuyến đi" : filterStatus}
            </span>
            <span className="bg-emerald-600 px-3.5 py-1 rounded-xl shadow-lg shadow-emerald-500/20 text-xl text-white min-w-[40px] text-center leading-none flex items-center justify-center">
              {filteredBooking.length}
            </span>
          </div>

          <div className="flex justify-end w-full lg:w-auto shrink-0 z-10">
            <Button variant="outline" className="flex items-center gap-3 h-12 px-6 bg-card text-foreground border-border rounded-full text-base font-black shadow-sm hover:bg-accent transition-all w-36 justify-center">
              <Clock className="w-5 h-5" strokeWidth={2.5} />
              {currentTime || "--:--"}
            </Button>
          </div>
        </div>

        {/* Spinner Loading (Facebook Style) */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-center items-center py-6 overflow-hidden"
            >
              <div className="bg-card/50 backdrop-blur-sm p-3 rounded-full border border-border shadow-sm">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" strokeWidth={2.5} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Danh sách Booking Items */}
        <div className="space-y-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {[1, 2, 3].map((i) => (
                  <HistoryCardSkeleton key={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key={`real-list-${filterStatus}-${currentPage}-${searchQuery}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
              >
                {currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <motion.div key={item.id} variants={itemVariants} className="w-full">
                      <Card className="bg-card rounded-[40px] p-6 shadow-sm border-border flex flex-col lg:flex-row gap-8 items-stretch transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5 group">
                        <div className="w-full lg:w-[320px] h-[240px] rounded-[32px] overflow-hidden shrink-0 border border-border shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
                          <img
                            src="/xedep.jpg"
                            alt="Bãi đỗ xe"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-2 pr-2">
                          <div>
                            <div className="flex justify-between items-start mb-6">
                              <div className="space-y-1.5">
                                <h3 className="text-2xl font-black text-foreground tracking-tight line-clamp-1 mb-1">
                                  {item.name}
                                </h3>
                                <div className="flex items-center gap-2 text-foreground text-[15px] font-bold">
                                  <MapPin className="w-5 h-5 text-foreground" />
                                  <span>{item.address}</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <Badge
                                  className={`text-[11px] font-black tracking-[0.15em] px-5 py-2.5 rounded-2xl uppercase text-white shadow-xl transition-all flex items-center gap-2.5 border-none
                                    ${item.statusRaw === "CONFIRMED"
                                      ? "bg-blue-600 shadow-blue-500/30 ring-4 ring-blue-500/10"
                                      : item.statusRaw === "ONGOING"
                                        ? "bg-emerald-600 shadow-emerald-500/30 ring-4 ring-emerald-500/10"
                                        : item.statusRaw === "COMPLETED"
                                          ? "bg-red-600 shadow-red-600/30 ring-4 ring-red-500/10"
                                          : item.statusRaw === "PENDING"
                                            ? "bg-amber-500 shadow-amber-500/30 ring-4 ring-amber-500/10"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                  {(item.statusRaw === "ONGOING" || item.statusRaw === "CONFIRMED") && (
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                  )}
                                  {item.status}
                                </Badge>

                                {item.statusRaw === "ONGOING" && item.end_time_raw && (() => {
                                  const minutesLeft = dayjs(item.end_time_raw).diff(dayjs(), 'minute');
                                  if (minutesLeft > 0 && minutesLeft <= 10) {
                                    return (
                                      <Badge variant="destructive" className="text-[10px] font-black animate-pulse px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border-none bg-red-600">
                                        <Clock className="w-3.5 h-3.5" />
                                        Hết hạn
                                      </Badge>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-4 bg-emerald-500/5 p-6 rounded-[28px] border border-emerald-500/10">
                              <div>
                                <p className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                                  Giờ vào
                                </p>
                                <div className="flex flex-col gap-1">
                                  <span className="font-black text-foreground text-xl leading-tight">
                                    {item.start_time}
                                  </span>
                                  <span className="font-bold text-foreground text-xs">
                                    {item.start_date}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                                  Giờ ra
                                </p>
                                <div className="flex flex-col gap-1">
                                  <span className="font-black text-foreground text-xl leading-tight">
                                    {item.end_time}
                                  </span>
                                  <span className="font-bold text-foreground text-xs">
                                    {item.end_date}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <p className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-2">
                                  Vị trí xe
                                </p>
                                <div className="flex flex-col gap-1 mt-0.5">
                                  <span className="font-black text-foreground text-xl leading-tight bg-muted w-fit px-4 py-2 rounded-xl border border-border shadow-sm">
                                    {item.code}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mt-4 gap-4">
                            <div className="flex flex-col gap-1 px-2 w-full sm:w-1/2">
                              <p className="text-[11px] font-black text-foreground uppercase tracking-[0.2em]">
                                Thanh toán
                              </p>
                              <span className="font-black text-red-600 text-3xl leading-none">
                                {item.total_price
                                  ? new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                    maximumFractionDigits: 0,
                                  }).format(item.total_price)
                                  : "0 ₫"}
                              </span>
                            </div>

                            <div className="flex justify-end gap-3 w-full sm:w-1/2">
                              {item.statusRaw === "COMPLETED" && (
                                ratedBookings.has(item.id) ? (
                                  // Already reviewed: badge + separate view button
                                  <>
                                    <div className="flex items-center gap-2 h-14 px-4 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-black text-sm shrink-0">
                                      <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                                      Đã đánh giá
                                    </div>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setViewingReviewBooking(item);
                                        setOpenViewReviewModal(true);
                                      }}
                                      className="h-14 px-5 rounded-2xl shadow-sm transition-all hover:-translate-y-1 active:scale-95 text-[14px] flex items-center gap-2 border-border text-foreground hover:bg-accent w-full sm:w-auto justify-center font-black"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Xem chi tiết
                                    </Button>
                                  </>
                                ) : (
                                  // Not yet reviewed
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setRatingBooking(item);
                                      setOpenRateModal(true);
                                    }}
                                    className="h-14 px-6 rounded-2xl shadow-sm transition-all hover:-translate-y-1 active:scale-95 text-[15px] flex items-center gap-2 group border-emerald-600 text-emerald-600 hover:bg-emerald-50 w-full sm:w-auto justify-center font-black"
                                  >
                                    <Star className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    Đánh giá ngay
                                  </Button>
                                )
                              )}
                              <Button
                                onClick={() => {
                                  setSelectedBooking(item);
                                  setOpenModal(true);
                                }}
                                className="h-14 px-10 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-1 active:scale-95 text-[15px] flex items-center gap-3 group w-full sm:w-auto justify-center font-black bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <FileText className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                Chi tiết vé
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <motion.div variants={itemVariants}>
                    <Card className="py-24 text-center bg-card border-border shadow-xl shadow-primary/5 rounded-[40px]">
                      <div className="w-24 h-24 bg-emerald-500/10 text-emerald-600 flex items-center justify-center rounded-3xl mx-auto mb-8 shadow-inner rotate-3">
                        <Search className="w-12 h-12" />
                      </div>
                      <h4 className="text-2xl font-black text-foreground mb-3 tracking-tight">
                        Không tìm thấy chuyến nào !
                      </h4>
                      <p className="text-foreground font-bold text-base max-w-[300px] mx-auto">
                        Bạn thử chọn ngày khác hoặc từ khóa khác xem sao .
                      </p>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nút phân trang */}
        {totalPages > 0 && !loading && (
          <div className="flex items-center justify-center gap-3 mt-16 pb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="w-14 h-14 rounded-2xl bg-card text-emerald-600 border-border hover:bg-emerald-500/10 disabled:opacity-50 transition-all shadow-sm"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={3} />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-14 h-14 rounded-2xl font-black text-lg transition-all ${currentPage === i + 1
                  ? "bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 -translate-y-1"
                  : "bg-card text-foreground border-border hover:bg-emerald-500/10"
                  }`}
              >
                {i + 1}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-14 h-14 rounded-2xl bg-card text-emerald-600 border-border hover:bg-emerald-500/10 disabled:opacity-50 transition-all shadow-sm"
            >
              <ChevronRight className="w-6 h-6" strokeWidth={3} />
            </Button>
          </div>
        )}
        </motion.div>
      </main>

      <DetailHistoryBooking
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        booking={selectedBooking}
      />
      
      {ratingBooking && (
        <RateBookingModal
          isOpen={openRateModal}
          onClose={() => setOpenRateModal(false)}
          bookingId={parseInt(ratingBooking.id)}
          lotName={ratingBooking.name}
          onSuccess={() => {
            setRatedBookings(prev => new Set([...prev, ratingBooking.id]));
          }}
        />
      )}

      {viewingReviewBooking && (
        <ViewReviewModal
          isOpen={openViewReviewModal}
          onClose={() => setOpenViewReviewModal(false)}
          bookingId={parseInt(viewingReviewBooking.id)}
          lotName={viewingReviewBooking.name}
        />
      )}
    </div>
  );
}
export default historyBooking;
