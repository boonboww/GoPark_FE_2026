"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Car,
  Clock,
  ShieldCheck,
  MapPin,
  Search,
  CreditCard,
  Ticket,
  Tag,
  ChevronRight,
  X,
  CheckCircle2,
  Info,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { ParkingContext } from "./ParkingContext";
import { post, get } from "@/lib/api";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { VoucherModal } from "./VoucherModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { motion, AnimatePresence } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import { BookingFormSkeleton } from "@/components/skeletons/BookingFormSkeleton";

const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

const MINUTES = ["00", "15", "30", "45"];

//kiểm tra ngày trong tuần(ràn buộc thời gian với giờ hoạt động bãi đỗ)
const DAY_MAP: Record<string, number> = {
  "THỨ 2": 1, "T2": 1, "THỨ HAI": 1, "MONDAY": 1, "MON": 1,
  "THỨ 3": 2, "T3": 2, "THỨ BA": 2, "TUESDAY": 2, "TUE": 2,
  "THỨ 4": 3, "T4": 3, "THỨ TƯ": 3, "WEDNESDAY": 3, "WED": 3,
  "THỨ 5": 4, "T5": 4, "THỨ NĂM": 4, "THURSDAY": 4, "THU": 4,
  "THỨ 6": 5, "T6": 5, "THỨ SÁU": 5, "FRIDAY": 5, "FRI": 5,
  "THỨ 7": 6, "T7": 6, "THỨ BẢY": 6, "SATURDAY": 6, "SAT": 6,
  "CHỦ NHẬT": 0, "CN": 0, "SUNDAY": 0, "SUN": 0
};

const formatOperatingDays = (daysStr: string) => {
  if (!daysStr) return "Hàng ngày";

  const days = daysStr.split(",").map((s) => s.trim().toUpperCase());

  const isAllDays =
    days.length >= 7 ||
    daysStr.toLowerCase().includes("hàng ngày") ||
    daysStr.toLowerCase().includes("mỗi ngày") ||
    daysStr.toLowerCase().includes("tất cả");

  if (isAllDays) return "Hàng ngày";

  const mapping: Record<string, string> = {
    MONDAY: "T2",
    TUESDAY: "T3",
    WEDNESDAY: "T4",
    THURSDAY: "T5",
    FRIDAY: "T6",
    SATURDAY: "T7",
    SUNDAY: "CN",
    "THỨ 2": "T2",
    "THỨ 3": "T3",
    "THỨ 4": "T4",
    "THỨ 5": "T5",
    "THỨ 6": "T6",
    "THỨ 7": "T7",
    "CHỦ NHẬT": "CN",
  };

  const formattedDays = days.map((d) => {
    for (const [key, val] of Object.entries(mapping)) {
      if (d.includes(key)) return val;
    }
    return d;
  });

  if (formattedDays.length > 2 && !daysStr.includes("-") && !daysStr.includes("đến")) {
    // Check if consecutive
    return formattedDays.join(", ");
  }

  return daysStr.replace(/Monday/gi, "Thứ 2")
    .replace(/Tuesday/gi, "Thứ 3")
    .replace(/Wednesday/gi, "Thứ 4")
    .replace(/Thursday/gi, "Thứ 5")
    .replace(/Friday/gi, "Thứ 6")
    .replace(/Saturday/gi, "Thứ 7")
    .replace(/Sunday/gi, "Chủ Nhật");
};

// Kiểm tra xem một giờ có phải là quá khứ không
const checkIsPastHour = (h: string, selectedDate: string, today: string) => {
  const isToday = selectedDate === today;
  if (!isToday) return false;

  return parseInt(h) < dayjs().hour();
};

// Kiểm tra phút quá khứ
const checkIsPastMinute = (
  m: string,
  selectedDate: string,
  selectedHour: string,
  today: string,
) => {
  const isToday = selectedDate === today;
  const isCurrentHour = selectedHour === dayjs().format("HH");

  return isToday && isCurrentHour && parseInt(m) < dayjs().minute();
};

// Kiểm tra giờ ra phải sau giờ vào nếu cùng ngày
const checkIsBeforeStartHour = (
  h: string,
  startDate: string,
  endDate: string,
  startHour: string,
) => {
  const isSameDay = startDate === endDate;

  return isSameDay && parseInt(h) < parseInt(startHour);
};

//tái sử dụng 
interface BookingFormProps {
  defaultStart?: string;
  defaultEnd?: string;
  defaultVehicle?: string;
  defaultPayment?: string;
}

export function BookingForm({
  defaultStart,
  defaultEnd,
  defaultVehicle,
  defaultPayment,
}: BookingFormProps) {
  const router = useRouter();

  //các state trạng thái cơ bản của form
  const [selectedPlate, setSelectedPlate] = useState<string>(
    defaultVehicle || "",
  );

  const [startTime, setStartTime] = useState<string>(defaultStart || "");

  const [endTime, setEndTime] = useState<string>(defaultEnd || "");

  const [paymentMethod, setPaymentMethod] = useState(defaultPayment || "vnpay");

  // Voucher states
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const today = dayjs().format("YYYY-MM-DD");

  const context = useContext(ParkingContext);
  const auth = useAuthStore();

  if (!context) return null;

  const { dataLot, loadingLot, selectedSpot } = context;

  // Helpers
  const getHH = (timeStr: string) =>
    timeStr ? timeStr.split("T")[1]?.split(":")[0] || "00" : "00";

  const getMM = (timeStr: string) =>
    timeStr
      ? timeStr.split("T")[1]?.split(":")[1]?.substring(0, 2) || "00"
      : "00";

  // Init data
  useEffect(() => {
    if (defaultStart) {
      setStartTime(defaultStart);
    }

    if (defaultEnd) {
      setEndTime(defaultEnd);
    }

    if (defaultVehicle) {
      setSelectedPlate(defaultVehicle);
    }

    if (defaultPayment) {
      setPaymentMethod(defaultPayment.toLowerCase());
    }

    // Auto select first vehicle
    if (dataLot?.userVehicles?.length > 0 && !selectedPlate) {
      setSelectedPlate(dataLot.userVehicles[0].plate_number);
    }
  }, [dataLot, defaultStart, defaultEnd, defaultVehicle, defaultPayment]);

  //giờ mở cửa
  const openTimeStr = useMemo(() => {
    if (!dataLot?.open_time) return "00:00";
    const d = dayjs(dataLot.open_time);
    return d.isValid() ? d.format("HH:mm") : "00:00";
  }, [dataLot]);

  //giờ đóng cửa
  const closeTimeStr = useMemo(() => {
    if (!dataLot?.close_time) return "23:59";
    const d = dayjs(dataLot.close_time);
    return d.isValid() ? d.format("HH:mm") : "23:59";
  }, [dataLot]);

  //kiểm tra giờ trong khoảng giờ hoạt động của bãi đỗ
  const isTimeInRange = (timeStr: string) => {
    if (closeTimeStr < openTimeStr) {
      // Overnight case: e.g., 22:00 to 06:00
      return timeStr >= openTimeStr || timeStr <= closeTimeStr;
    }
    return timeStr >= openTimeStr && timeStr <= closeTimeStr;
  };

  //kiểm tra ngày trong khoảng thời gian hoạt động
  const isOperatingDay = (date: dayjs.Dayjs) => {
    if (!dataLot?.operating_days) return true;
    const daysStr = dataLot.operating_days.toUpperCase();
    const dayOfWeek = date.day();

    // Check if it's a comma-separated list (e.g. "Monday,Tuesday,Wednesday")
    if (daysStr.includes(",")) {
      const dayList = daysStr.split(",").map((s: string) => s.trim());
      return dayList.some((d: string) => {
        for (const [name, val] of Object.entries(DAY_MAP)) {
          if (d === name || d.startsWith(name)) return val === dayOfWeek;
        }
        return false;
      });
    }

    // Handle range e.g. "Thứ 2 - Thứ 7"
    const parts = daysStr.split(/[-–—]|đến/i).map((s: string) => s.trim());
    if (parts.length === 2) {
      let startDay = 1;
      let endDay = 0;

      for (const [key, val] of Object.entries(DAY_MAP)) {
        if (parts[0].includes(key)) startDay = val;
        if (parts[1].includes(key)) endDay = val;
      }

      if (startDay <= endDay) {
        return dayOfWeek >= startDay && dayOfWeek <= endDay;
      } else {
        // Overnight week: e.g. Saturday (6) to Monday (1)
        return dayOfWeek >= startDay || dayOfWeek <= endDay;
      }
    }
    return true;
  };

  const getAvailableHours = () => {
    return HOURS.filter(h => {
      return MINUTES.some(m => isTimeInRange(`${h}:${m}`));
    });
  };

  const getAvailableMinutes = (selectedHour: string) => {
    return MINUTES.filter(m => isTimeInRange(`${selectedHour}:${m}`));
  };

  // Auto setup time(tự động thiết lập thời gian khi người dùng mở form)
  useEffect(() => {
    if (!startTime && dataLot) {
      const now = dayjs();
      let start = now.minute(Math.ceil(now.minute() / 15) * 15).second(0);

      // If current time is out of range, move to next hour or opening
      if (!isTimeInRange(start.format("HH:mm"))) {
        const h = parseInt(openTimeStr.split(":")[0]);
        const m = parseInt(openTimeStr.split(":")[1]);
        start = start.hour(h).minute(m);
        if (now.hour() >= parseInt(closeTimeStr.split(":")[0])) {
          start = start.add(1, "day");
        }
      }

      // Ensure start day is an operating day
      let attempts = 0;
      while (!isOperatingDay(start) && attempts < 7) {
        start = start.add(1, "day").hour(parseInt(openTimeStr.split(":")[0])).minute(parseInt(openTimeStr.split(":")[1]));
        attempts++;
      }

      const end = start.add(1, "hour");

      setStartTime(start.format("YYYY-MM-DDTHH:mm"));
      setEndTime(end.format("YYYY-MM-DDTHH:mm"));
    }
  }, [dataLot, startTime, openTimeStr, closeTimeStr]);
  // Booking details
  const bookingDetails = useMemo(() => {
    const currentVehicle = dataLot?.userVehicles?.find(
      (v: any) => v.plate_number === selectedPlate,
    );

    let selectedZone: any = null;

    if (selectedSpot) {
      dataLot?.parkingFloor?.forEach((floor: any) => {
        const zone = floor.parkingZones?.find(
          (z: any) => z.zone_name === selectedSpot.zoneName,
        );

        if (zone) {
          selectedZone = {
            ...zone,
            floor_name: floor.floor_name,
          };
        }
      });
    }

    const pricing = selectedZone
      ? dataLot?.pricingRules?.find(
        (p: any) =>
          p.zone_name === selectedZone.zone_name &&
          p.floor_name === selectedZone.floor_name,
      )
      : null;

    return {
      vehicle: currentVehicle,
      zone: selectedZone,
      priceHourly: pricing?.price_per_hour || 0,
      priceDayly: pricing?.price_per_day || 0,
    };
  }, [dataLot, selectedPlate, selectedSpot]);

  // Save booking context
  useEffect(() => {
    if (typeof window === "undefined") return;

    const vehicleId = bookingDetails.vehicle?.id
      ? String(bookingDetails.vehicle.id)
      : undefined;

    const normalizedPaymentMethod = paymentMethod
      ? paymentMethod.toUpperCase()
      : undefined;

    (window as any).goparkBookingContext = {
      parkingLotId: dataLot?.id ? String(dataLot.id) : undefined,

      startTime: startTime || undefined,

      endTime: endTime || undefined,

      vehicleId,

      paymentMethod: normalizedPaymentMethod,
    };
  }, [
    dataLot?.id,
    startTime,
    endTime,
    bookingDetails.vehicle?.id,
    paymentMethod,
  ]);

  // Fetch vouchers
  const fetchVouchers = async () => {
    try {
      setIsLoadingVouchers(true);
      const res: any = await get("/vouchers/all-with-eligibility");
      // Handle cases where API might wrap data in a 'data' property
      const voucherData = Array.isArray(res) ? res : res?.data || [];
      setVouchers(voucherData);
    } catch (error) {
      console.error("Failed to fetch vouchers:", error);
    } finally {
      setIsLoadingVouchers(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchVouchers();
    }
  }, [auth.isAuthenticated]);

  // Re-fetch when modal opens to get latest eligibility (used count, etc.)
  useEffect(() => {
    if (isVoucherModalOpen && auth.isAuthenticated) {
      fetchVouchers();
    }
  }, [isVoucherModalOpen, auth.isAuthenticated]);

  // Calculate pricing breakdown
  const pricingBreakdown = useMemo(() => {
    if (!startTime || !endTime) return { subTotal: 0, discount: 0, finalTotal: 0 };

    const start = dayjs(startTime);
    const end = dayjs(endTime);

    if (
      !start.isValid() ||
      !end.isValid() ||
      end.isBefore(start) ||
      end.isSame(start)
    ) {
      return { subTotal: 0, discount: 0, finalTotal: 0 };
    }

    const pricePerHour = bookingDetails.priceHourly || 0;
    const priceDay = bookingDetails.priceDayly || 0;

    const isSameDay = start.isSame(end, "day");
    const totalHours = end.diff(start, "hour", true);

    let subTotal = 0;
    if (isSameDay) {
      // 1. Trong cùng 1 ngày: Tính theo giờ, làm tròn lên
      subTotal = Math.ceil(totalHours) * pricePerHour;
    } else {
      // 2. Qua đêm hoặc nhiều ngày: Tính theo ngày
      const numberOfDays = Math.ceil(totalHours / 24);
      subTotal = numberOfDays * priceDay;
    }

    // Apply voucher discount
    let discount = 0;
    if (selectedVoucher) {
      const minVal = Number(selectedVoucher.min_booking_value || 0);
      const discountVal = Number(selectedVoucher.discount_value || 0);
      const maxDiscount = selectedVoucher.max_discount_amount
        ? Number(selectedVoucher.max_discount_amount)
        : Infinity;

      if (subTotal >= minVal) {
        if (selectedVoucher.discount_type === "PERCENTAGE") {
          discount = (subTotal * discountVal) / 100;
          if (discount > maxDiscount) {
            discount = maxDiscount;
          }
        } else if (selectedVoucher.discount_type === "FIXED_AMOUNT") {
          discount = discountVal;
          if (discount > maxDiscount) {
            discount = maxDiscount;
          }
        }
      }
    }

    return {
      subTotal,
      discount,
      finalTotal: Math.max(0, subTotal - discount),
    };
  }, [startTime, endTime, bookingDetails, selectedVoucher]);

  function handleBookingAttempt(e: any) {
    e.preventDefault();

    const start = dayjs(startTime);
    const end = dayjs(endTime);
    const now = dayjs();

    if (!selectedPlate) {
      alert("Vui lòng chọn biển số xe");
      return;
    }

    if (!startTime || !endTime) {
      alert("Vui lòng chọn thời gian");
      return;
    }

    if (start.isBefore(now, "minute")) {
      alert("Giờ vào không được nhỏ hơn hiện tại");
      return;
    }

    if (!isOperatingDay(start)) {
      alert(`Bãi đỗ không hoạt động vào thứ này. Lịch hoạt động: ${dataLot.operating_days}`);
      return;
    }

    if (!isOperatingDay(end)) {
      alert(`Bãi đỗ không hoạt động vào ngày kết thúc. Lịch hoạt động: ${dataLot.operating_days}`);
      return;
    }

    if (!isTimeInRange(start.format("HH:mm"))) {
      alert(`Giờ vào phải trong khoảng thời gian hoạt động: ${openTimeStr} - ${closeTimeStr}`);
      return;
    }

    if (!isTimeInRange(end.format("HH:mm"))) {
      alert(`Giờ ra phải trong khoảng thời gian hoạt động: ${openTimeStr} - ${closeTimeStr}`);
      return;
    }

    if (end.isBefore(start) || end.isSame(start)) {
      alert("Thời gian ra phải sau thời gian vào");
      return;
    }

    if (!selectedSpot) {
      alert("Vui lòng chọn vị trí đỗ");
      return;
    }

    if (!bookingDetails.vehicle) {
      alert("Vui lòng chọn xe ô tô");
      return;
    }

    // Nếu tất cả hợp lệ, hiện modal xác nhận
    setShowConfirmModal(true);
  }

  async function executeBooking() {
    if (isBooking) return;
    setShowConfirmModal(false);

    const vehicle = bookingDetails.vehicle;
    const currentUserId = auth?.user?.id;

    const bookingData = {
      user_id: String(currentUserId || vehicle?.user?.id),
      vehicle_id: vehicle?.id,
      slot_id: selectedSpot?.slot.id,
      parking_lot_id: dataLot.id,
      start_time: dayjs(startTime).toISOString(),
      end_time: dayjs(endTime).toISOString(),
      status: paymentMethod === "cash" ? "PENDING" : "PENDING_PAYMENT",
      voucher_code: selectedVoucher?.code || undefined,
      sub_total: Math.round(pricingBreakdown.subTotal),
    };

    try {
      setIsBooking(true);
      const saved: any = await post("/booking", bookingData);

      const bookingId = saved?.id || saved?.data?.id;
      const amount = Math.round(pricingBreakdown.finalTotal || 0);

      // VNPAY
      if (paymentMethod === "vnpay") {
        const res: any = await post("/payment/vnpay/create-url", {
          amount,
          userId: currentUserId,
          bookingId,
        });

        const ok = Boolean(res?.success || res?.data?.success);
        const redirectUrl = res?.url || res?.data?.url;

        if (ok && redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }

        const msg = res?.message || res?.data?.message || "Không thể tạo link VNPAY";
        alert(msg);
        return;
      }

      // Wallet
      if (paymentMethod === "wallet") {
        const ownerId = dataLot?.owner?.id || dataLot?.owner_id;

        try {
          await post("/wallets/payment", {
            ownerId,
            amount,
            bookingId,
            customerId: currentUserId,
          });

          toast.success(
            "Thanh toán thành công! Mã QR đã được gửi vào Email của bạn.",
            {
              position: "top-right",
              style: {
                padding: "16px",
                fontSize: "16px",
                width: "350px",
                fontWeight: "bold",
                marginTop: "20px",
              },
              duration: 3000,
            },
          );

          setTimeout(() => {
            router.push(`/users/invoice/${bookingId}`);
          }, 50);

          return;
        } catch (err: any) {
          alert(err?.message || "Thanh toán ví thất bại");
          return;
        }
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.message ||
        error?.message ||
        "Đặt chỗ thất bại";
      alert(errorMessage);
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {loadingLot ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <BookingFormSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="booking-form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition-colors relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-green-800 dark:bg-green-700"></div>

            <motion.h2
              variants={itemVariants}
              className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"
            >
              <Car className="w-5 h-5 text-green-900 dark:text-green-700" />
              Đặt chỗ đỗ xe
            </motion.h2>

            <form className="space-y-6" id="booking-form-container">
              {/* Vehicle */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-gray-500" />
                  Chọn xe ô tô của bạn
                </label>

                <div className="relative">
                  <select
                    id="booking-vehicle-select"
                    value={selectedPlate}
                    onChange={(e) => setSelectedPlate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    {dataLot?.userVehicles?.length > 0 ? (
                      dataLot.userVehicles.map((v: any) => (
                        <option key={v.plate_number} value={v.plate_number}>
                          {v.plate_number} - {v.type}
                        </option>
                      ))
                    ) : (
                      <option disabled>Không có xe nào</option>
                    )}
                  </select>

                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Car className="w-4 h-4 text-green-700" />
                  </div>
                </div>
              </motion.div>

              {/* Time Selection */}
              <motion.div
                id="booking-time-select"
                variants={itemVariants}
                className="space-y-4"
              >
                {/* ENTRY TIME */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thời gian vào</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="date"
                        min={today}
                        value={startTime ? startTime.split("T")[0] : ""}
                        onChange={(e) => {
                          const date = e.target.value;
                          const time = startTime.split("T")[1] || "00:00";
                          setStartTime(`${date}T${time}`);
                        }}
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-gray-50 font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="time"
                        min={openTimeStr}
                        max={closeTimeStr}
                        value={startTime ? startTime.split("T")[1] : ""}
                        onChange={(e) => {
                          const date = startTime.split("T")[0] || today;
                          const time = e.target.value;
                          setStartTime(`${date}T${time}`);
                        }}
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-gray-50 font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* EXIT TIME */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thời gian ra dự kiến</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="date"
                        min={startTime ? startTime.split("T")[0] : today}
                        value={endTime ? endTime.split("T")[0] : ""}
                        onChange={(e) => {
                          const date = e.target.value;
                          const time = endTime.split("T")[1] || "00:00";
                          setEndTime(`${date}T${time}`);
                        }}
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-gray-50 font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="time"
                        min={openTimeStr}
                        max={closeTimeStr}
                        value={endTime ? endTime.split("T")[1] : ""}
                        onChange={(e) => {
                          const date = endTime.split("T")[0] || today;
                          const time = e.target.value;
                          setEndTime(`${date}T${time}`);
                        }}
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-gray-50 font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Operating Info Note */}
                  <div className="mt-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-sm font-bold text-blue-900 uppercase tracking-tight">Thông tin hoạt động</p>
                      <p className="text-xs sm:text-sm text-blue-700 leading-relaxed break-words">
                        Bãi đỗ hoạt động từ <span className="font-bold">{openTimeStr} đến {closeTimeStr}</span> {formatOperatingDays(dataLot.operating_days) === "Hàng ngày" ? "" : "các ngày"} <span className="font-bold">{formatOperatingDays(dataLot.operating_days)}</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Selected Spot */}
              <motion.div
                variants={itemVariants}
                className="bg-green-50 p-3 rounded-lg border"
              >
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Vị trí đỗ:
                  </span>

                  <span className="font-bold">
                    {selectedSpot
                      ? `${selectedSpot.floorName}-${selectedSpot.zoneName}-${selectedSpot.slot.code}`
                      : "Chưa chọn"}
                  </span>
                </div>
              </motion.div>

              {/* Voucher Section */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label className="block text-sm font-medium flex items-center gap-1">
                  <Ticket className="w-4 h-4 text-orange-500" />
                  Voucher khuyến mãi
                </label>

                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 border-2 border-dashed border-orange-200 rounded-xl bg-orange-50/30 hover:bg-orange-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      {selectedVoucher ? (
                        <>
                          <p className="text-sm font-bold text-orange-700">
                            Mã: {selectedVoucher.code}
                          </p>
                          <p className="text-xs text-orange-600">
                            {selectedVoucher.discount_type === "PERCENTAGE"
                              ? `Giảm ${selectedVoucher.discount_value}%`
                              : `Giảm ${selectedVoucher.discount_value.toLocaleString()}đ`}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-gray-700">
                            Chọn hoặc nhập mã
                          </p>
                          <p className="text-xs text-gray-500">
                            {vouchers.length > 0
                              ? `Có ${vouchers.length} voucher khả dụng`
                              : "Khám phá các ưu đãi từ GoPark"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </button>
              </motion.div>

              {/* Payment */}
              <motion.div variants={itemVariants} id="booking-payment-method">
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <CreditCard className="w-4 h-4" />
                  Hình thức thanh toán
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 border rounded-lg"
                >
                  <option value="vnpay">Chuyển khoản (VNPAY)</option>

                  <option value="wallet">Ví GoPark</option>
                </select>
              </motion.div>

              {/* TOTAL */}
              <motion.div variants={itemVariants} className="border-t pt-5 space-y-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Đơn giá</span>
                  <span>
                    {bookingDetails.priceHourly.toLocaleString()}đ/giờ
                    {bookingDetails.priceDayly > 0 && ` - ${bookingDetails.priceDayly.toLocaleString()}đ/ngày`}
                  </span>
                </div>

                {pricingBreakdown.discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Tạm tính</span>
                      <span>{Math.round(pricingBreakdown.subTotal).toLocaleString()}đ</span>
                    </div>
                    <div className="flex justify-between text-sm text-orange-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Giảm giá
                      </span>
                      <span>-{Math.round(pricingBreakdown.discount).toLocaleString()}đ</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-end pt-2" id="booking-total-price">
                  <span className="font-bold text-gray-900">Tổng tiền</span>
                  <span className="text-2xl font-black text-green-600">
                    {Math.round(pricingBreakdown.finalTotal).toLocaleString()}đ
                  </span>
                </div>

                <button
                  type="button"
                  id="summit-booking-btn"
                  onClick={handleBookingAttempt}
                  disabled={isBooking}
                  className={`w-full font-bold py-3.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${isBooking
                    ? "bg-green-700/50 cursor-not-allowed text-white/70"
                    : "bg-green-800 hover:bg-green-700 text-white shadow-lg hover:shadow-green-900/20 active:scale-[0.98]"
                    }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Xác nhận Đặt Chỗ</span>
                </button>
              </motion.div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen Loading Overlay */}
      <AnimatePresence>
        {isBooking && (
          <motion.div
            key="booking-loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-green-100 dark:border-gray-700 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-green-700 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-gray-900 dark:text-white">Đang xử lý đặt chỗ</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vui lòng đợi trong giây lát...</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <VoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        vouchers={vouchers}
        onSelect={setSelectedVoucher}
        selectedVoucher={selectedVoucher}
        subTotal={pricingBreakdown.subTotal}
      />

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[400px] p-6 rounded-2xl border-none shadow-2xl bg-white dark:bg-gray-800">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-gray-900 dark:text-white">
              Xác nhận đặt chỗ
            </DialogTitle>
            <DialogDescription className="text-center text-gray-500 dark:text-gray-400 text-sm">
              Bạn có chắc chắn muốn đặt chỗ đỗ xe tại bãi này không?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 my-4 space-y-2 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Biển số xe:</span>
              <span className="font-bold text-gray-900 dark:text-white">{selectedPlate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Vị trí:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {selectedSpot ? `${selectedSpot.floorName}-${selectedSpot.zoneName}-${selectedSpot.slot.code}` : "-"}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <span className="font-bold text-gray-900 dark:text-white">Tổng cộng:</span>
              <span className="font-black text-green-600 text-lg">
                {Math.round(pricingBreakdown.finalTotal).toLocaleString()}đ
              </span>
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:gap-0">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={executeBooking}
              className="flex-1 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold shadow-lg shadow-green-900/20 transition-all active:scale-95"
            >
              Xác nhận
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


