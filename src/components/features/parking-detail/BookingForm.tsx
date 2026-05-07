"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Car,
  Clock,
  ShieldCheck,
  MapPin,
  Search,
  CreditCard,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { ParkingContext } from "./ParkingContext";
import { post } from "@/lib/api";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

import { motion, AnimatePresence } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import { BookingFormSkeleton } from "@/components/skeletons/BookingFormSkeleton";

const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

const MINUTES = ["00", "15", "30", "45"];

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

  const [selectedPlate, setSelectedPlate] = useState<string>(
    defaultVehicle || "",
  );

  const [startTime, setStartTime] = useState<string>(defaultStart || "");

  const [endTime, setEndTime] = useState<string>(defaultEnd || "");

  const [paymentMethod, setPaymentMethod] = useState(defaultPayment || "vnpay");

  const today = dayjs().format("YYYY-MM-DD");

  const context = useContext(ParkingContext);

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

    // Auto setup time
    if (!startTime) {
      const now = dayjs();

      const currentMinute = now.minute();

      let roundedMinute = 0;

      if (currentMinute < 15) roundedMinute = 15;
      else if (currentMinute < 30) roundedMinute = 30;
      else if (currentMinute < 45) roundedMinute = 45;
      else roundedMinute = 60;

      let start;

      if (roundedMinute === 60) {
        start = now.add(1, "hour").minute(0).second(0);
      } else {
        start = now.minute(roundedMinute).second(0);
      }

      const end = start.add(1, "hour");

      setStartTime(start.format("YYYY-MM-DDTHH:mm"));
      setEndTime(end.format("YYYY-MM-DDTHH:mm"));
    }
  }, [
    dataLot,
    defaultStart,
    defaultEnd,
    defaultVehicle,
    defaultPayment,
    selectedPlate,
    startTime,
  ]);

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

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!startTime || !endTime) return 0;

    const start = dayjs(startTime);
    const end = dayjs(endTime);

    if (
      !start.isValid() ||
      !end.isValid() ||
      end.isBefore(start) ||
      end.isSame(start)
    ) {
      return 0;
    }

    const totalMinutes = end.diff(start, "minute");

    const pricePerHour = bookingDetails.priceHourly || 0;

    const priceDay = bookingDetails.priceDayly || 0;

    const priceMin = pricePerHour / 60;

    const days = Math.floor(totalMinutes / 1440);

    const remainingMinutes = totalMinutes % 1440;

    return days * priceDay + remainingMinutes * priceMin;
  }, [startTime, endTime, bookingDetails]);

  async function handBooking(e: any) {
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

    if (end.isBefore(start) || end.isSame(start)) {
      alert("Thời gian ra phải sau thời gian vào");
      return;
    }

    if (!selectedSpot) {
      alert("Vui lòng chọn vị trí đỗ");
      return;
    }

    const vehicle = bookingDetails.vehicle;

    const auth = useAuthStore.getState();

    const currentUserId = auth?.user?.id;

    if (!vehicle) {
      alert("Vui lòng chọn xe ô tô");
      return;
    }

    const bookingData = {
      user_id: String(currentUserId || vehicle?.user?.id),

      vehicle_id: vehicle.id,

      slot_id: selectedSpot?.slot.id,

      parking_lot_id: dataLot.id,

      start_time: dayjs(startTime).toISOString(),

      end_time: dayjs(endTime).toISOString(),

      status: paymentMethod === "cash" ? "PENDING" : "PENDING_PAYMENT",
    };

    try {
      const saved: any = await post("/booking", bookingData);

      const bookingId = saved?.id || saved?.data?.id;

      const amount = Math.round(totalPrice || 0);

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

        const msg =
          res?.message || res?.data?.message || "Không thể tạo link VNPAY";

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
    }
  }

  return (
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

            {/* Time */}
            <motion.div
              id="booking-time-select"
              variants={itemVariants}
              className="grid grid-cols-2 gap-4"
            >
              {/* START DATE */}
              <div>
                <label className="text-xs font-bold">NGÀY VÀO</label>

                <input
                  type="date"
                  min={today}
                  value={startTime ? startTime.split("T")[0] : ""}
                  onChange={(e) => {
                    const date = e.target.value;

                    const time = startTime.split("T")[1] || "00:00";

                    setStartTime(`${date}T${time}`);
                  }}
                  className="w-full h-14 px-4 border rounded-2xl"
                />
              </div>

              {/* END DATE */}
              <div>
                <label className="text-xs font-bold">NGÀY RA</label>

                <input
                  type="date"
                  min={today}
                  value={endTime ? endTime.split("T")[0] : ""}
                  onChange={(e) => {
                    const date = e.target.value;

                    const time = endTime.split("T")[1] || "00:00";

                    setEndTime(`${date}T${time}`);
                  }}
                  className="w-full h-14 px-4 border rounded-2xl"
                />
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
            <motion.div variants={itemVariants} className="border-t pt-5">
              <div className="flex justify-between mb-3">
                <span className="text-sm">Đơn giá</span>

                <span>
                  {bookingDetails.priceHourly.toLocaleString()}
                  đ/giờ
                </span>
              </div>

              <div className="flex justify-between items-end mb-6" id="booking-total-price">
                <span className="font-bold">Tổng tạm tính</span>

                <span className="text-2xl font-black text-green-600">
                  {Math.round(totalPrice).toLocaleString()}đ
                </span>
              </div>

                <button
                type="button"
                id="summit-booking-btn"
                onClick={handBooking}
                className="w-full bg-green-800 hover:bg-green-700 text-white font-bold py-3.5 rounded-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Xác nhận Đặt Chỗ
                </span>
              </button>
            </motion.div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
