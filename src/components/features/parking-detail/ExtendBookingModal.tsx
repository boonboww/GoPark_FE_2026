"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { patch } from "@/lib/api";
import { toast } from "sonner";
import { parseParkingTime } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, AlertCircle } from "lucide-react";

interface ExtendBookingModalProps {
  isOpen: boolean;
  booking: any;
  onClose: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

export function ExtendBookingModal({ isOpen, booking, onClose }: ExtendBookingModalProps) {
  const [newEndTime, setNewEndTime] = useState("");
  const [extraAmount, setExtraAmount] = useState(0);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pricingInfo, setPricingInfo] = useState({
    pricePerHour: 0,
    priceDay: 0,
    zoneName: "",
    isValid: true,
    message: "" as string | null,
    operatingHours: { open: null, close: null } as { open: string | null; close: string | null }
  });

  const fetchPreview = async (endTime: string) => {
    if (!booking) return;
    setLoadingPrice(true);
    try {
      const res: any = await patch(`/booking/${booking.id}/extend`, {
        new_end_time: endTime,
        isPreview: true
      });

      if (res.data) {
        setExtraAmount(res.data.extraAmount || 0);
        setPricingInfo({
          pricePerHour: res.data.pricePerHour || 0,
          priceDay: res.data.priceDay || 0,
          zoneName: res.data.zoneName || "Khu vực",
          isValid: res.data.isValid ?? true,
          message: res.data.message || null,
          operatingHours: {
            open: parseParkingTime(res.data.operatingHours?.open, "00:00"),
            close: parseParkingTime(res.data.operatingHours?.close, "23:59")
          }
        });
      }
    } catch (error) {
      console.error("Lỗi preview gia hạn:", error);
    } finally {
      setLoadingPrice(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !booking) return;

    if (!newEndTime) {
      const initialTime = dayjs(booking.end_time).add(1, 'hour').format("YYYY-MM-DDTHH:mm");
      setNewEndTime(initialTime);
    }

    const timer = setTimeout(() => {
      if (newEndTime && dayjs(newEndTime).isAfter(dayjs(booking.end_time))) {
        fetchPreview(dayjs(newEndTime).toISOString());
      } else {
        setExtraAmount(0);
        setPricingInfo(prev => ({ ...prev, isValid: true, message: null }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [newEndTime, booking, isOpen]);

  const getHH = (timeStr: string) => timeStr ? dayjs(timeStr).format("HH") : "00";
  const getMM = (timeStr: string) => timeStr ? dayjs(timeStr).format("mm") : "00";

  const handleExtend = async () => {
    if (isSubmitting || !booking || !pricingInfo.isValid) return;
    setIsSubmitting(true);
    try {
      await patch(`/booking/${booking.id}/extend`, {
        new_end_time: dayjs(newEndTime).toISOString(),
        isPreview: false
      });
      alert("Gia hạn thành công. Quý khách vui lòng tiếp tục sử dụng mã QR cũ. Mọi chi phí phát sinh sẽ được thanh toán trực tiếp tại quầy khi quý khách rời bãi.!");
      onClose();
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Lỗi gia hạn");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] p-0 rounded-3xl overflow-hidden border border-gray-300 shadow-2xl bg-white max-h-[95vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-gray-800">Gia hạn thời gian đỗ</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6">
          {/* Section 1: Info Card */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-start gap-4">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <span className="text-blue-600 font-bold text-lg">P</span>
            </div>
            <div>
              <p className="text-blue-700 font-bold text-sm uppercase tracking-wide">
                Đơn giá khu vực: {pricingInfo.zoneName}
              </p>
              <p className="text-gray-600 text-sm font-medium mt-0.5">
                Giá giờ/ngày: {pricingInfo.pricePerHour?.toLocaleString()}đ / {pricingInfo.priceDay?.toLocaleString()}đ
              </p>
            </div>
          </div>

          {/* Section 2: Current Times */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 border-dashed">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Giờ vào</p>
              <p className="text-sm font-bold text-slate-700">
                {dayjs(booking.start_time).format("HH:mm - DD/MM")}
              </p>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Giờ ra cũ</p>
              <p className="text-sm font-bold text-slate-700">
                {dayjs(booking.end_time).format("HH:mm - DD/MM")}
              </p>
            </div>
          </div>

          {/* Section 3: New End Time Pickers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-tight">Ngày ra mới</label>
              <div className="relative flex-1 max-w-[200px] ml-4">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="date"
                  value={dayjs(newEndTime).format("YYYY-MM-DD")}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const hh = getHH(newEndTime);
                    const mm = getMM(newEndTime);
                    setNewEndTime(`${newDate}T${hh}:${mm}`);
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm font-bold text-gray-700 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Giờ</label>
                <Select
                  value={getHH(newEndTime)}
                  onValueChange={(h) => {
                    const dateStr = dayjs(newEndTime).format("YYYY-MM-DD");
                    setNewEndTime(`${dateStr}T${h}:${getMM(newEndTime)}`);
                  }}
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 border-slate-200 font-bold bg-slate-50">
                    <SelectValue placeholder="Giờ" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-xl border-2 border-gray-300 shadow-xl z-[9999]">
                    {HOURS.map((h) => (
                      <SelectItem
                        key={h}
                        value={h}
                        disabled={dayjs(`${dayjs(newEndTime).format("YYYY-MM-DD")}T${h}:${getMM(newEndTime)}`).isBefore(dayjs(booking.end_time))}
                        className="font-bold text-gray-900 focus:bg-blue-50 focus:text-blue-700"
                      >
                        {h}h
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Phút</label>
                <Select
                  value={getMM(newEndTime)}
                  onValueChange={(m) => {
                    const dateStr = dayjs(newEndTime).format("YYYY-MM-DD");
                    setNewEndTime(`${dateStr}T${getHH(newEndTime)}:${m}`);
                  }}
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 border-slate-200 font-bold bg-slate-50">
                    <SelectValue placeholder="Phút" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-xl border-2 border-gray-300 shadow-xl z-[9999]">
                    {MINUTES.map((m) => (
                      <SelectItem
                        key={m}
                        value={m}
                        disabled={dayjs(`${dayjs(newEndTime).format("YYYY-MM-DD")}T${getHH(newEndTime)}:${m}`).isBefore(dayjs(booking.end_time))}
                        className="font-bold text-gray-900 focus:bg-blue-50 focus:text-blue-700"
                      >
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 4: Operating Hours Display */}
          <div className="flex items-center justify-center gap-2 py-1">
            <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest">
              Giờ hoạt động: {pricingInfo.operatingHours.open} - {pricingInfo.operatingHours.close}
            </p>
          </div>

          {/* Section 5: Summary */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Thời gian thêm:</span>
              <span className="text-slate-800">{dayjs(newEndTime).diff(dayjs(booking.end_time), 'minute')} phút</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-sm font-bold text-blue-600 uppercase">Kết thúc mới</span>
              <span className="text-sm font-bold text-blue-600">
                {dayjs(newEndTime).format("HH:mm - DD/MM/YYYY")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-orange-600 uppercase">Tiền cộng thêm</span>
              <span className="text-lg font-bold text-orange-600">
                +{extraAmount.toLocaleString()}đ
              </span>
            </div>
          </div>

          {/* Section 5.5: Validation Message */}
          {pricingInfo.message && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-2xl flex items-center gap-2">
              <AlertCircle className="size-4 text-red-600 shrink-0" />
              <p className="text-red-600 text-xs font-bold leading-relaxed italic">
                {pricingInfo.message}
              </p>
            </div>
          )}

          {/* Section 6: Footer Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 py-6 rounded-2xl font-bold border-2 border-slate-200 hover:bg-slate-50 text-slate-500"
            >
              Hủy
            </Button>
            <Button
              onClick={handleExtend}
              disabled={
                loadingPrice ||
                isSubmitting ||
                !newEndTime ||
                !pricingInfo.isValid ||
                dayjs(newEndTime).isBefore(dayjs(booking.end_time))
              }
              className="flex-1 bg-blue-600 text-white py-6 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-blue-300 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
            >
              {loadingPrice ? "Đang tính giá..." : "Xác nhận gia hạn"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}