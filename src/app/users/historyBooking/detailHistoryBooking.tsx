"use client";

import React from "react";
import { MapPin, X, FileText, Clock, ArrowRight, Car } from "lucide-react";
// Shadcn UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

function DetailHistoryBooking({ isOpen, onClose, booking }: Props) {
  if (!isOpen || !booking) return null;

  return (

    <div className="font-sans fixed inset-0 z-[100] flex items-center justify-center p-4">

      {/* Overlay Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Container Chính */}
      <div className="relative z-10 w-full max-w-[1000px] max-h-[90vh] overflow-y-auto bg-background rounded-[2rem] p-8 shadow-2xl border-4 border-border no-scrollbar">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <Badge className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4 text-white shadow-sm border-none ${booking.status === 'Đã hoàn thành'
              ? 'bg-red-600 shadow-red-600/30'
              : booking.status === 'Đang hoạt động'
                ? 'bg-emerald-600 shadow-emerald-600/30'
                : "bg-blue-600 shadow-blue-500/30 ring-4 ring-blue-500/10"
              }`}>
              {booking.status}
            </Badge>

            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{booking.name}</h2>

            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium mt-4 text-base">
              <MapPin className="w-5 h-5" />
              <span>{booking.address}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="w-12 h-12 bg-card border-2 border-border rounded-full flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            <X className="w-7 h-7 font-bold" />
          </Button>
        </div>

        {/* NỘI DUNG CHÍNH - Lưới 2x2 cân bằng */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

          {/* KHỐI 1: HÌNH ẢNH */}
          <div className="rounded-[1.5rem] overflow-hidden shadow-sm border-2 border-border h-full min-h-[270px]">
            <img
              src={booking.image || "/xedep.jpg"}
              className="w-full h-full object-cover"
              alt={booking.name}
            />
          </div>


          {/* KHỐI 2: CHI TIẾT VÉ ĐẶT */}
          <Card className="bg-card rounded-[1.5rem] p-6 lg:p-7 shadow-sm border-2 border-border h-full">
            <h4 className="text-[16px] font-black text-foreground mb-8 uppercase tracking-widest flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-foreground/40" />
              Chi tiết vé đặt
            </h4>

            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-black mb-2 uppercase tracking-widest">Mã vé (ID)</p>
                <p className="font-black text-foreground text-lg break-words leading-tight">{booking.id}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-black mb-2 uppercase tracking-widest">Vị trí đỗ</p>
                <p className="font-black text-foreground text-xl bg-muted w-fit px-5 py-2 rounded-xl border-2 border-border">{booking.code}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-black mb-2 uppercase tracking-widest">Khu vực</p>
                <p className="font-black text-foreground text-[21px]">{booking.floor_zone && booking.floor_zone !== "N/A" ? booking.floor_zone : "Không có"}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-black mb-2 uppercase tracking-widest">Tầng đỗ xe</p>
                <p className="font-black text-foreground text-[21px]">
                  {booking.floor_name && booking.floor_name !== "N/A"
                    ? booking.floor_name
                    : (booking.floor_number && booking.floor_number !== "N/A" ? `Tầng ${booking.floor_number}` : "Không có")}
                </p>
              </div>
            </div>
          </Card>

          {/* KHỐI 3: THỜI GIAN & THANH TOÁN */}
          <Card className="bg-card rounded-[1.5rem] p-6 lg:p-7 shadow-sm border-2 border-border h-full">
            <h4 className="text-[16px] font-black text-foreground mb-8 uppercase tracking-widest flex items-center gap-2.5">
              <Clock className="w-6 h-6 text-foreground/40" />
              Thời gian & Thanh toán
            </h4>

            <div className="space-y-6">
              {/* Hàng Thời gian */}
              <div className="flex items-center justify-between p-4 lg:p-6 rounded-2xl bg-muted border-2 border-border">
                <div className="flex-1">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-black mb-2 uppercase tracking-widest">Thời gian vào</p>
                  <p className="font-black text-foreground text-[26px] leading-tight mb-1">{booking.start_time}</p>
                  <p className="text-[17px] text-muted-foreground font-bold">{booking.start_date}</p>
                </div>

                <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center border-2 border-border shadow-md shrink-0 mx-4 pb-0.5">
                  <ArrowRight className="w-7 h-7 text-foreground/20 font-bold" />
                </div>

                <div className="flex-1 text-right">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-black mb-2 uppercase tracking-widest">Thời gian ra</p>
                  <p className="font-black text-foreground text-[26px] leading-tight mb-1">{booking.end_time}</p>
                  <p className="text-[17px] text-muted-foreground font-bold">{booking.end_date}</p>
                </div>
              </div>

              {/* Hàng Tổng tiền */}
              <div className="flex items-end justify-between pt-6 border-t-2 border-border pb-2">
                <p className="text-sm  dark:text-gray-400 font-black uppercase tracking-widest mb-2">Tổng tiền</p>
                <p className="font-black text-red-600 text-4xl tracking-tighter leading-none">
                  {booking.total_price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.total_price) : "0 ₫"}
                </p>
              </div>
            </div>
          </Card>

          {/* KHỐI 4: KHÁCH HÀNG & PHƯƠNG TIỆN */}
          <Card className="bg-card rounded-[1.5rem] p-6 lg:p-7 shadow-sm border-2 border-border h-full">
            <h4 className="text-[16px] font-black text-foreground mb-8 uppercase tracking-widest flex items-center gap-2.5">
              <Car className="w-6 h-6 text-foreground/40" />
              Khách hàng & Phương tiện
            </h4>

            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-black mb-2 uppercase tracking-widest">Khách hàng</p>
                <p className="font-black text-foreground text-xl leading-tight">
                  {booking.user_name || booking.userName || booking.customer_name || "Chưa cập nhật"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-black mb-2 uppercase tracking-widest">Hãng xe</p>
                <p className="font-black text-foreground text-xl leading-tight">
                  {booking.vehicle_brand || "Chưa cập nhật"}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-black mb-2 uppercase tracking-widest">Biển số xe</p>
                <p className="font-black text-foreground text-[24px] bg-muted w-fit px-6 py-3 rounded-xl border-2 border-border tracking-wider">
                  {booking.license_plate || booking.plate_number || "Chưa đánh biển số"}
                </p>
              </div>
            </div>
          </Card>

        </div>


        {/* NÚT ĐÓNG FOOTER */}
        <div className="flex justify-end mt-10 pt-8 border-t-2 border-border">
          <Button
            onClick={onClose}
            className="px-14 py-8 bg-foreground hover:bg-foreground/90 text-background rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 border-2 border-border cursor-pointer"
          >
            Đóng cửa sổ
          </Button>
        </div>

      </div>
    </div>
  );

}


export default DetailHistoryBooking;
