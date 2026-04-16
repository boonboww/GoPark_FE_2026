"use client";

import React, { useEffect, useState } from "react";
import { get } from "@/lib/api";
import {
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";
import Header from "@/components/layout/Header";
import DetailHistoryBooking from "./detailHistoryBooking";
import { useAuthStore } from "@/stores";
import { any } from "zod";
import { mapBookingData } from "@/lib/booking-until";
// import { any } from "zod";
// import { mapDataBooking } from "../shareBooking/page";
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
}

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
        console.log(res.data);
        const mapData = res.data.map((item: any) => mapBookingData(item));
        console.log(mapData);
        setBooking(mapData);
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
    // 1. Lọc trạng thái ngay từ đầu
    .filter((b) => ["CONFIRMED", "ONGOING", "COMPLETED"].includes(b.statusRaw))

    // 2. Lọc theo Tab người dùng chọn
    .filter((b) => (filterStatus === "Tất cả" ? true : b.status === filterStatus))

    // 3. Lọc theo ngày
    .filter((b) => {
      if (!selectedDate) return true;
      return b.start_date_iso === selectedDate;
    })

    // 4. Lọc theo search
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/20 text-slate-900 font-sans pb-16">
      <Header />

      <main className="max-w-[1200px] mx-auto px-6 mt-12">
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-4xl font-black tracking-tight mb-2 text-slate-900">
            Lịch sử đặt chỗ
          </h2>
          <p className="text-emerald-700/70 font-semibold text-base">
            Xem và quản lý lịch sử đỗ xe của bạn một cách tiện lợi
          </p>
        </div>

        {/* CONTAINER TÌM KIẾM */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 lg:p-8 shadow-xl shadow-emerald-900/5 border border-emerald-100/50 mb-10 transition-all hover:shadow-emerald-900/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner">
              <Search className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Tìm kiếm chuyến đi
            </h3>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-end gap-6 lg:gap-4">
            {/* 1. Date Range Picker */}
            <div className="w-full lg:w-[280px]">
              <label className="block text-[11px] font-black text-emerald-700/60 uppercase tracking-[0.2em] mb-3 ml-1">
                Khoảng thời gian
              </label>
              <div className="relative w-full">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600/50">
                  <Calendar className="w-5 h-5" />
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-base font-bold text-slate-800 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all hover:bg-white"
                />
              </div>
            </div>

            {/* 2. Phần Tìm Kiếm */}
            <div className="w-full lg:w-[350px] lg:mx-auto">
              <label className="block text-[11px] font-black text-emerald-700/60 uppercase tracking-[0.2em] mb-3 ml-1">
                Từ khoá tìm kiếm
              </label>
              <div className="relative w-full">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600/50">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Tên bãi đỗ, địa chỉ..."
                  value={searchQuery}
                  onFocus={() => setListDropdown(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setListDropdown(true);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-base font-bold text-slate-800 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all hover:bg-white placeholder:text-slate-400"
                />

                {/* DROPDOWN - Custom styling */}
                {listDropdown && filteredOptions.length > 0 && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-emerald-100 rounded-2xl shadow-xl z-50 max-h-60 overflow-auto p-2">
                    {filteredOptions.map((name, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setSearchQuery(name);
                          setListDropdown(false);
                          setCurrentPage(1);
                        }}
                        className="px-4 py-3 hover:bg-emerald-50 rounded-xl cursor-pointer font-bold text-slate-700 transition-colors"
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Quick Time Suggestions */}
            <div className="w-full lg:w-auto lg:border-l border-emerald-100 lg:pl-8 flex flex-col items-start lg:items-end">
              <label className="block text-[11px] font-black text-emerald-700/60 uppercase tracking-[0.2em] mb-3 ml-1">
                Gợi ý nhanh
              </label>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  setSelectedDate(today);
                  setCurrentPage(1);
                }}
                className="w-fit bg-emerald-600 text-white font-black text-sm py-4 px-8 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 whitespace-nowrap"
              >
                Hôm nay
              </button>
            </div>
          </div>
        </div>

        {/* CÁC TABS PHÂN LỌC VÀ HIỂN THỊ TỔNG CỘNG */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-8 gap-5 px-1 w-full">
          {/* Tabs Bên Trái */}
          <div className="flex items-center bg-white/60 backdrop-blur rounded-3xl p-1.5 shadow-sm border border-emerald-100/50 overflow-x-auto w-full lg:w-auto shrink-0 z-10 scrollbar-hide">
            {statusOptions.map((status) => {
              const isActive = filterStatus === status;

              return (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2.5 whitespace-nowrap px-6 py-3 rounded-2xl text-[14px] font-black transition-all ${isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                      : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                    }`}
                >
                  {status}
                  
                </button>
              );
            })}
          </div>

          <div className="flex bg-slate-900 text-white text-sm font-black px-6 py-3 rounded-2xl items-center justify-center gap-4 shadow-xl w-full lg:w-auto h-[56px] shrink-0 border border-slate-800">
            <span className="uppercase tracking-[0.15em] text-slate-700 text-[11px]">
              {filterStatus === "Tất cả" ? "Tổng chuyến đi" : filterStatus}
            </span>
            <span className="bg-emerald-600 px-3.5 py-1 rounded-xl shadow-lg shadow-emerald-600/20 text-xl text-white min-w-[40px] text-center leading-none flex items-center justify-center">
              {filteredBooking.length}
            </span>
          </div>

          <div className="flex justify-end w-full lg:w-auto shrink-0 z-10">
            <button className="flex items-center gap-3 px-6 py-3 bg-white text-emerald-700 border border-emerald-100 rounded-full text-base font-black shadow-sm hover:bg-emerald-50 transition-all w-36 justify-center">
              <Clock className="w-5 h-5" strokeWidth={2.5} />
              {currentTime || "--:--"}
            </button>
          </div>
        </div>

        {/* Danh sách Booking Items */}
        <div className="space-y-8">
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-[40px] p-6 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-8 items-stretch hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 cursor-default"
              >
                <div className="w-full lg:w-[320px] h-[240px] rounded-[32px] overflow-hidden shrink-0 border border-slate-100 shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
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
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-500 text-[15px] font-bold">
                          <MapPin className="w-5 h-5 text-emerald-500" />
                          <span>{item.address}</span>
                        </div>
                      </div>

                      <div
                        className={`text-[11px] font-black tracking-[0.15em] px-5 py-2.5 rounded-2xl uppercase text-white shadow-xl transition-all 
                          ${item.statusRaw === "CONFIRMED"
                            ? "bg-blue-400 shadow-sky-500/30 ring-4 ring-sky-500/10"
                            : item.statusRaw === "ONGOING"
                              ? "bg-emerald-500 shadow-emerald-500/30 ring-4 ring-emerald-500/10"
                              : item.statusRaw === "COMPLETED"
                              ? "bg-red-500 shadow-red-500/30 ring-4 ring-red-500/10" // COMPLETED as Red
                              : item.statusRaw === "PENDING"
                              ? "bg-amber-500 shadow-amber-500/30 ring-4 ring-amber-500/10"
                              : "bg-gray-400"
                          }`}
                      >
                        {item.status}
                      </div>
                    </div>

                    {/* Lưới phân chia */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-4 bg-emerald-50/40 p-6 rounded-[28px] border border-emerald-100/30">
                      <div>
                        <p className="text-[10px] font-black text-emerald-800/50 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                          Giờ vào
                        </p>
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-slate-900 text-xl leading-tight">
                            {item.start_time}
                          </span>
                          <span className="font-bold text-emerald-700/60 text-xs">
                            {item.start_date}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-800/50 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                          Giờ ra
                        </p>
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-slate-900 text-xl leading-tight">
                            {item.end_time}
                          </span>
                          <span className="font-bold text-emerald-700/60 text-xs">
                            {item.end_date}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[10px] font-black text-emerald-800/50 uppercase tracking-[0.2em] mb-2">
                          Vị trí xe
                        </p>
                        <div className="flex flex-col gap-1 mt-0.5">
                          <span className="font-black text-emerald-700 text-xl leading-tight bg-white w-fit px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                            {item.code}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <div className="flex flex-col gap-1 px-2">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
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

                    <button
                      onClick={() => {
                        setSelectedBooking(item);
                        setOpenModal(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-1 active:scale-95 text-[15px] flex items-center gap-3 group"
                    >
                      <FileText className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      Chi tiết vé
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-emerald-900/5">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-400 flex items-center justify-center rounded-3xl mx-auto mb-8 shadow-inner rotate-3">
                <Search className="w-12 h-12" />
              </div>
              <h4 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
                Hổng tìm thấy chuyến nào hết trơn!
              </h4>
              <p className="text-emerald-700/50 font-bold text-base max-w-[300px] mx-auto">
                Bạn thử chọn ngày khác hoặc từ khóa khác xem sao nha.
              </p>
            </div>
          )}
        </div>

        {/* Nút phân trang */}
        {totalPages > 0 && (
          <div className="flex items-center justify-center gap-3 mt-16 pb-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={3} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-14 h-14 flex items-center justify-center rounded-2xl font-black text-lg transition-all ${currentPage === i + 1
                    ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 -translate-y-1"
                    : "bg-white text-slate-600 border border-emerald-100 hover:bg-emerald-50"
                  }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight className="w-6 h-6" strokeWidth={3} />
            </button>
          </div>
        )}
      </main>

      <DetailHistoryBooking
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        booking={selectedBooking}
      />
    </div>
  );
}
export default historyBooking;
