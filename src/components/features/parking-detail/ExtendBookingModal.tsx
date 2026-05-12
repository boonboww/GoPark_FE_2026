"use client";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { patch } from "@/lib/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  [key: string]: any;
}

interface ExtendBookingModalProps {
  isOpen: boolean;
  booking: Booking | null;
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
    operatingHours: { open: null, close: null } as { open: string | null; close: string | null }
  });





  useEffect(() => {
    if (!isOpen || !booking) return;

    if (!newEndTime) {
      const initialTime = dayjs(booking.end_time).add(1, 'hour').format("YYYY-MM-DDTHH:mm");
      setNewEndTime(initialTime);
    }

    const fetchPreviewPrice = async () => {
      const isValidTime = newEndTime && dayjs(newEndTime).isAfter(dayjs(booking.end_time));

      if (isValidTime) {
        setLoadingPrice(true);
        try {
          const res = (await patch(`/booking/${booking.id}/extend`, {
            new_end_time: dayjs(newEndTime).toISOString(),
            isPreview: true
          })) as any;

          if (res?.data) {
            setExtraAmount(res.data.extraAmount || 0);
            setPricingInfo({
              pricePerHour: res.data.pricePerHour || 0,
              priceDay: res.data.priceDay || 0,
              zoneName: res.data.zoneName || "Khu vực",
              operatingHours: res.data.operatingHours || { open: null, close: null }
            });
          }




        } catch (error) {
          console.error("Lỗi fetch giá:", error);
          setExtraAmount(0);
        } finally {
          setLoadingPrice(false);
        }
      } else {
        setExtraAmount(0);
      }
    };

    const timer = setTimeout(fetchPreviewPrice, 300);
    return () => clearTimeout(timer);

  }, [newEndTime, booking, isOpen]);

  const getHH = (timeStr: string) => timeStr ? dayjs(timeStr).format("HH") : "00";
  const getMM = (timeStr: string) => timeStr ? dayjs(timeStr).format("mm") : "00";

  const handleExtend = async () => {
    if (isSubmitting || !booking) return;
    setIsSubmitting(true);
    try {
      await patch(`/booking/${booking.id}/extend`, {
        new_end_time: dayjs(newEndTime).toISOString(),
        isPreview: false
      });
      alert("Gia hạn thành công!");
      onClose();
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Lỗi gia hạn");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking) return null;
  const oldEndTimeDate = dayjs(booking.end_time).format("YYYY-MM-DD");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] p-0 rounded-3xl overflow-hidden border border-gray-300 shadow-2xl bg-white max-h-[95vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-gray-800">Gia hạn thời gian đỗ</DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-0 space-y-4">
          {/* Section 1: Pricing Info */}
          <div className="bg-blue-50 p-4 rounded-2xl flex items-center gap-4 border border-blue-100">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-blue-600 font-black text-lg">P</span>
            </div>
            <div>
              <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-0.5">
                ĐƠN GIÁ KHU VỰC: {pricingInfo.zoneName || "..."}
              </p>
              <p className="text-gray-800 text-base font-medium">
                Giá giờ/ngày: {pricingInfo.pricePerHour.toLocaleString()}đ / {pricingInfo.priceDay.toLocaleString()}đ
              </p>
            </div>
          </div>



          {/* Section 2: Current Times */}
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 grid grid-cols-2 gap-4 bg-white">
            <div>
              <p className="text-xs text-gray-700 font-bold uppercase mb-0.5">GIỜ VÀO</p>
              <p className="font-bold text-gray-900 text-base">
                {dayjs(booking.start_time).format("HH:mm - DD/MM")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-700 font-bold uppercase mb-0.5">GIỜ RA CŨ</p>
              <p className="font-bold text-gray-900 text-base">
                {dayjs(booking.end_time).format("HH:mm - DD/MM")}
              </p>
            </div>
          </div>

          {/* Section 3 & 4: Date & Time Input (Fixed Grid 2:1:1) */}
          <div className="grid grid-cols-4 gap-4 items-end">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wide ml-1 text-left block">NGÀY RA MỚI</label>
              <input
                type="date"
                min={oldEndTimeDate}
                value={newEndTime ? newEndTime.split('T')[0] : ""}
                onChange={(e) => setNewEndTime(`${e.target.value}T${getHH(newEndTime)}:${getMM(newEndTime)}`)}
                className="w-full h-11 px-3 bg-white border border-gray-400 rounded-2xl font-bold text-gray-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all cursor-pointer text-base"
              />
            </div>

            <div className="col-span-1 space-y-1.5">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wide ml-1 text-left block">GIỜ</label>
              <Select
                value={getHH(newEndTime)}
                onValueChange={(val) => setNewEndTime(`${newEndTime.split('T')[0]}T${val}:${getMM(newEndTime)}`)}
              >
                <SelectTrigger className="h-11 rounded-2xl font-bold border-gray-400 text-gray-900 focus:ring-4 focus:ring-blue-100 text-base bg-white px-3 flex justify-between shadow-sm">
                  <SelectValue placeholder="Giờ" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl border-2 border-gray-300 shadow-xl z-[9999] opacity-100 !bg-opacity-100">
                  {HOURS.map((h) => (
                    <SelectItem
                      key={h}
                      value={h}
                      disabled={dayjs(`${newEndTime.split('T')[0]}T${h}:${getMM(newEndTime)}`).isBefore(dayjs(booking.end_time))}
                      className="font-bold text-gray-900 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"
                    >
                      {h}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 space-y-1.5">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wide ml-1 text-left block">PHÚT</label>
              <Select
                value={getMM(newEndTime)}
                onValueChange={(val) => setNewEndTime(`${newEndTime.split('T')[0]}T${getHH(newEndTime)}:${val}`)}
              >
                <SelectTrigger className="h-11 rounded-2xl font-bold border-gray-400 text-gray-900 focus:ring-4 focus:ring-blue-100 text-base bg-white px-3 flex justify-between shadow-sm">
                  <SelectValue placeholder="Phút" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl border-2 border-gray-300 shadow-xl z-[9999] opacity-100 !bg-opacity-100">
                  {MINUTES.map((m) => (
                    <SelectItem
                      key={m}
                      value={m}
                      disabled={dayjs(`${newEndTime.split('T')[0]}T${getHH(newEndTime)}:${m}`).isBefore(dayjs(booking.end_time))}
                      className="font-bold text-gray-900 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"
                    >
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {pricingInfo.operatingHours.open && (
            <p className="text-red-500 text-[11px] font-bold uppercase tracking-wider mt-1 ml-1">
              Giờ hoạt động: {pricingInfo.operatingHours.open} - {pricingInfo.operatingHours.close}
            </p>
          )}





          {/* Section 5: Summary Card */}
          <div className="bg-blue-50 p-4 rounded-3xl space-y-3 border border-blue-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-800 font-semibold">Thời gian thêm:</span>
              <span className="font-bold text-gray-900">
                {newEndTime && dayjs(newEndTime).isAfter(dayjs(booking.end_time))
                  ? `${dayjs(newEndTime).diff(dayjs(booking.end_time), 'minute')} phút`
                  : "0 phút"}
              </span>
            </div>

            <div className="h-[1px] bg-gray-300 w-full" />

            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">KẾT THÚC MỚI</span>
              <span className="font-bold text-blue-700 text-lg">
                {newEndTime ? dayjs(newEndTime).format("HH:mm - DD/MM/YYYY") : "Chưa chọn"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">TIỀN CỘNG THÊM</span>
              <span className="font-bold text-amber-700 text-2xl">
                {loadingPrice ? "..." : `+${extraAmount.toLocaleString()}đ`}
              </span>
            </div>
          </div>

          {/* Section 6: Footer Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3.5 rounded-2xl font-bold hover:bg-gray-300 transition-colors active:scale-95 text-base"
            >
              Hủy
            </button>
            <button
              onClick={handleExtend}
              disabled={
                loadingPrice || 
                isSubmitting || 
                !newEndTime || 
                dayjs(newEndTime).isBefore(dayjs(booking.end_time)) ||
                (() => {
                  if (!pricingInfo.operatingHours.open || !pricingInfo.operatingHours.close) return false;
                  const open = pricingInfo.operatingHours.open;
                  const close = pricingInfo.operatingHours.close;
                  const current = dayjs(newEndTime).format("HH:mm");
                  
                  if (open < close) {
                    return current < open || current > close;
                  } else {
                    return current < open && current > close;
                  }
                })()
              }
              className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-blue-300 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
            >

              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "Xác nhận gia hạn"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}