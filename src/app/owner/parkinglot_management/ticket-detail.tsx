"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { parkingService } from "@/services/parking.service";
import { ocrService } from "@/services/ocr.service";
import { useCustomerStore } from "@/stores/customer.store";
import { toast } from "sonner";
import {
  Clock,
  Info,
  User,
  MapPin,
  Car,
  ChevronRight,
  Loader2,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ArrowRight,
  Plus,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/booking.service";

export interface TicketData {
  ticketCode: string;
  customerName: string;
  licensePlate: string;
  position: string;
  startTime: Date;
  endTime: Date;
  price: number;
}

interface TicketDetailProps {
  isOpen: boolean;
  onClose: () => void;
  data: TicketData | null;
  status: "occupied" | "reserved" | "available";
  slotId?: number | null;
  slotCode?: string;
  floorName?: string;
  zoneName?: string;
}

function SlotTimeline({ bookings }: { bookings: any[] }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  return (
    <div className="space-y-4 py-4 border-t border-slate-100 mt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Lịch trình trong ngày
        </h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
             <div className="w-2 h-2 rounded-full bg-slate-100 border border-slate-200" />
             <span className="text-[9px] font-bold text-slate-400">Trống</span>
          </div>
          <div className="flex items-center gap-1">
             <div className="w-2 h-2 rounded-full bg-slate-800" />
             <span className="text-[9px] font-bold text-slate-400">Có khách</span>
          </div>
        </div>
      </div>

      <div className="relative pt-6 pb-2">
        {/* Timeline Bar */}
        <div className="h-6 w-full bg-slate-100 rounded-lg relative overflow-hidden border border-slate-200">
          {bookings.map((b, idx) => {
            const start = new Date(b.startTime);
            const end = new Date(b.endTime);
            const startPos = (start.getHours() + start.getMinutes() / 60) * (100 / 24);
            const endPos = (end.getHours() + end.getMinutes() / 60) * (100 / 24);
            const width = endPos - startPos;

            return (
              <div
                key={idx}
                className="absolute top-0 h-full bg-slate-800 border-x border-slate-900/20"
                style={{ left: `${startPos}%`, width: `${width}%` }}
              />
            );
          })}
          
          {/* Current Time Indicator */}
          <div 
            className="absolute top-0 h-full w-0.5 bg-red-500 z-10 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            style={{ left: `${currentHour * (100 / 24)}%` }}
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-2 px-1">
          {[0, 6, 12, 18, 24].map((h) => (
            <span key={h} className="text-[9px] font-black text-slate-300">
              {h}h
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TicketDetail({
  isOpen,
  onClose,
  data,
  status,
  slotId,
  slotCode,
  floorName,
  zoneName,
}: TicketDetailProps) {
  const queryClient = useQueryClient();
  const { lotId } = useCustomerStore();

  const { data: slotBookings = [] } = useQuery({
    queryKey: ["slotBookings", lotId, slotId],
    queryFn: () =>
      bookingService.getBookingsByParkingLot({
        lotId: lotId!,
        startDate: format(new Date(), "yyyy-MM-dd") + "T00:00:00Z",
        endDate: format(new Date(), "yyyy-MM-dd") + "T23:59:59Z",
      }),
    enabled: !!lotId && !!slotId && isOpen,
    select: (list) => list.filter((b) => b.slotId === slotId?.toString()),
  });
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");

  // Booking Wizard State
  const [bookingStep, setBookingStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: "",
    phone: "",
    plate: "",
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setBookingStep(1);
      setBookingForm({
        name: "",
        phone: "",
        plate: "",
        startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      });
    }
  }, [isOpen]);

  // Progress timer for occupied slots
  useEffect(() => {
    if (!data || status !== "occupied") {
      setProgress(0);
      return;
    }

    const calculateProgress = () => {
      const now = new Date().getTime();
      const start = data.startTime.getTime();
      const end = data.endTime.getTime();
      const totalDuration = end - start;
      const elapsed = now - start;

      let percent = (elapsed / totalDuration) * 100;
      percent = Math.min(Math.max(percent, 0), 100);
      setProgress(percent);

      const remaining = end - now;
      if (remaining <= 0) {
        setTimeLeft("Đã hết hạn");
      } else {
        const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((remaining / (1000 * 60)) % 60);
        setTimeLeft(`Còn lại ${hours}h ${minutes}m`);
      }
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 1000 * 60);
    return () => clearInterval(interval);
  }, [data, status]);

  const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    const promise = ocrService
      .recognizeLicensePlate(file)
      .then((result) => {
        setBookingForm((prev) => ({ ...prev, plate: result }));
        return result;
      })
      .finally(() => {
        setIsOcrLoading(false);
        e.target.value = "";
      });

    toast.promise(promise, {
      loading: "Đang nhận diện biển số...",
      success: "Nhận diện biển số thành công!",
      error: (err) =>
        err instanceof Error ? err.message : "Nhận diện biển số thất bại",
    });
  };

  const handleBookingSubmit = async () => {
    if (!lotId || !slotId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: bookingForm.name,
        phoneNumber: bookingForm.phone,
        licensePlate: bookingForm.plate,
        slotId: slotId,
        startTime: new Date(bookingForm.startTime).toISOString(),
      };

      await parkingService.manualBooking(lotId, payload);

      toast.success("Đặt chỗ thành công!");
      queryClient.invalidateQueries({ queryKey: ["zoneSlots"] });
      queryClient.invalidateQueries({ queryKey: ["parkingLotSummary"] });
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Lỗi khi đặt chỗ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = {
    occupied: {
      label: "Đang đỗ",
      color: "bg-muted text-muted-foreground border-border",
    },
    reserved: {
      label: "Đã đặt trước",
      color: "bg-amber-100 text-amber-700 border-amber-200",
    },
    available: {
      label: "Chỗ trống",
      color: "bg-primary/10 text-primary border-primary/20",
    },
  };

  const isAvailable = status === "available";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] p-0 overflow-hidden border border-slate-200 shadow-xl rounded-2xl flex flex-col bg-white">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-400" />
                Vị trí {slotCode}
              </DialogTitle>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span>{floorName}</span>
                <ChevronRight className="w-3 h-3" />
                <span>{zoneName}</span>
              </div>
            </div>
            <span
              className={`text-[11px] font-bold px-3 py-2 rounded-full border mr-4 ${statusConfig[status].color}`}
            >
              {statusConfig[status].label}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
          {/* ===== AVAILABLE: Booking Form ===== */}
          {isAvailable && (
            <div className="space-y-5">
              {bookingStep === 1 ? (
                <>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-0.5">
                      Thông tin khách hàng
                    </p>
                    <p className="text-xs text-slate-400">
                      Nhập thông tin để tạo lệnh check-in tại chỗ
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500">
                        Họ tên khách hàng
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <Input
                          value={bookingForm.name}
                          onChange={(e) =>
                            setBookingForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Nguyễn Văn A"
                          className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-lg text-sm font-medium placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500">
                        Số điện thoại
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <Input
                          value={bookingForm.phone}
                          onChange={(e) =>
                            setBookingForm((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="09xx xxx xxx"
                          className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-lg text-sm font-medium placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    {/* License Plate */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-500">
                          Biển số xe
                        </Label>
                        <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
                          <Camera className="w-3.5 h-3.5" />
                          Quét ảnh
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleOcrUpload}
                            disabled={isOcrLoading}
                          />
                        </label>
                      </div>
                      <div className="relative">
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <Input
                          value={bookingForm.plate}
                          onChange={(e) =>
                            setBookingForm((prev) => ({
                              ...prev,
                              plate: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="51A-123.45"
                          className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-lg text-sm font-bold uppercase tracking-wide placeholder:text-slate-300 placeholder:normal-case placeholder:font-medium"
                          disabled={isOcrLoading}
                        />
                        {isOcrLoading && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                        )}
                      </div>
                    </div>
                    {/* Start Time */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500">
                        Thời gian bắt đầu
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                        <Input
                          type="datetime-local"
                          value={bookingForm.startTime}
                          onChange={(e) =>
                            setBookingForm((prev) => ({
                              ...prev,
                              startTime: e.target.value,
                            }))
                          }
                          className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-lg text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Step 2: Confirm */
                <div className="space-y-5">
                  <div className="flex flex-col items-center text-center gap-2 py-2">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Xác nhận đặt chỗ
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Kiểm tra thông tin trước khi xác nhận
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-slate-500 font-medium">
                        Vị trí đỗ
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">
                          {slotCode}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {floorName} — {zoneName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-slate-500 font-medium">
                        Khách hàng
                      </span>
                      <p className="text-sm font-bold text-slate-800">
                        {bookingForm.name || "—"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-slate-500 font-medium">
                        Điện thoại
                      </span>
                      <p className="text-sm font-medium text-slate-700">
                        {bookingForm.phone || "—"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-slate-500 font-medium">
                        Biển số xe
                      </span>
                      <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {bookingForm.plate || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-slate-500 font-medium">
                        Bắt đầu từ
                      </span>
                      <p className="text-sm font-bold text-slate-800">
                        {bookingForm.startTime
                          ? format(
                              new Date(bookingForm.startTime),
                              "HH:mm, dd/MM/yyyy",
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-xl p-3.5">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-primary leading-relaxed">
                      Sau khi xác nhận, vị trí <strong>{slotCode}</strong> sẽ
                      chuyển sang trạng thái <strong>Đang đỗ</strong> ngay lập
                      tức.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== OCCUPIED / RESERVED: Ticket Detail ===== */}
          {!isAvailable && data && (
            <div className="space-y-5">
              {/* Ticket Code & License Plate */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Mã vé
                  </Label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-sm font-semibold text-slate-700">
                    {data.ticketCode}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Biển số
                  </Label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-sm text-slate-800 uppercase tracking-wide">
                    {data.licensePlate}
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Khách hàng
                </Label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {data.customerName}
                  </p>
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      Vào lúc
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {format(data.startTime, "HH:mm, dd/MM")}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      Hết hạn
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {format(data.endTime, "HH:mm, dd/MM")}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <span className="text-xs font-semibold text-slate-500">
                  Tổng phí
                </span>
                <span className="text-base font-bold text-slate-800">
                  {data.price.toLocaleString("vi-VN")}đ
                </span>
              </div>

              {/* Progress bar for occupied */}
              {status === "occupied" && (
                <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Thời gian đỗ
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {timeLeft}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2 bg-slate-200" />
                  <div className="flex justify-between text-[10px] font-medium text-slate-400">
                    <span>Vào lúc {format(data.startTime, "HH:mm")}</span>
                    <span>{Math.round(progress)}%</span>
                    <span>Đến {format(data.endTime, "HH:mm")}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No data for non-available status */}
          {!isAvailable && !data && (
            <div className="py-10 text-center text-slate-400 text-sm">
              Không có dữ liệu vé.
            </div>
          )}

          {/* SLOT TIMELINE */}
          <SlotTimeline bookings={slotBookings} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
          {isAvailable ? (
            <>
              {bookingStep === 1 ? (
                <>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="h-10 px-4 text-sm font-medium border-slate-200 text-slate-600 hover:bg-white rounded-xl"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={() => setBookingStep(2)}
                    disabled={
                      !bookingForm.name ||
                      !bookingForm.phone ||
                      !bookingForm.plate ||
                      !bookingForm.startTime
                    }
                    className="flex-1 h-10 text-sm font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-xl gap-2"
                  >
                    Tiếp tục
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setBookingStep(1)}
                    variant="outline"
                    className="h-10 px-4 text-sm font-medium border-slate-200 text-slate-600 hover:bg-white rounded-xl gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleBookingSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-10 text-sm font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-xl gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Xác nhận đặt chỗ
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          ) : (
            <Button
              onClick={onClose}
              variant="outline"
              className="h-10 px-6 text-sm font-medium border-slate-200 text-slate-600 hover:bg-white rounded-xl ml-auto"
            >
              Đóng
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
