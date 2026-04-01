"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Car, Clock, ShieldCheck, MapPin, Search, CreditCard, Package } from "lucide-react";
import { get } from "@/lib/api";
import { any } from "zod";
import { useParams } from "next/navigation";
import { ParkingContext } from "./ParkingContext";
import { post } from "@/lib/api";
import dayjs from "dayjs";
import { useAuthStore } from '@/stores/auth.store';



export function BookingForm() {

  const [selectedPlate, setSelectedPlate] = useState<string>("");

  const [startTime,setStartTime] = useState<string>("");

  const [endTime,setEndTime] = useState<string>("");

  //const [servicePackage, setServicePackage] = useState("hourly");

  const [paymentMethod, setPaymentMethod] = useState("vnpay");

  //const [selectedVehicleId, setSelectedVehicleId] = useState<number | string>("");

  const context = useContext(ParkingContext);

  if (!context) return null;

  const { dataLot, loadingLot,selectedSpot } = context;

  console.log("Data Lot in BookingForm:", dataLot);

  console.log("Selected Spot in BookingForm:", selectedSpot);


  useEffect(()=>{

    if(dataLot?.userVehicles?.length > 0){

      setSelectedPlate(dataLot.userVehicles[0].plate_number);

    }

  },[dataLot])

  // 2. Tính toán các giá trị phụ thuộc (Sử dụng useMemo để tối ưu)

  const bookingDetails = useMemo(() => {

    const currentVehicle = dataLot?.userVehicles?.find(

      (v: any) => v.plate_number === selectedPlate

    );

    const pricing = currentVehicle

      ? dataLot?.pricingRule?.find((p: any) => p.vehicle_type === currentVehicle.type)

      : null;
    return {

      vehicle: currentVehicle,

      // Đảm bảo priceHourly luôn là số (mặc định 0) để không lỗi .toLocaleString()

      priceHourly: pricing?.price_per_hour || 0,

      priceDayly:pricing?.price_per_day || 0,

    };

  }, [dataLot, selectedPlate]);

  // 3. Logic tính tổng tiền tạm tính

  const totalPrice = useMemo(() => {
    console.log("--- Debug Time ---");

    console.log("Raw Start:", startTime);

    console.log("Raw End:", endTime);

    if (!startTime || !endTime) return 0;

    const start = dayjs(startTime);

    const end = dayjs(endTime);

    // 2. Kiểm tra nếu parse lỗi (Invalid Date)

    // Kiểm tra tính hợp lệ

    if (!start.isValid() || !end.isValid() || end.isBefore(start) || end.isSame(start)) {

      return 0;

    }

    // Tính tổng số phút chênh lệch

    const totalMinutes = end.diff(start, "minute");

    const pricePerHour = bookingDetails.priceHourly || 0;

    const priceDay = bookingDetails.priceDayly || 0;

    const priceMin = pricePerHour / 60;

    const days = Math.floor(totalMinutes / 1440);

    const remainingMinutes = totalMinutes % 1440;

    // Công thức: (Ngày * Giá ngày) + (Phút lẻ * Giá phút)

    return (days * priceDay) + (remainingMinutes * priceMin);

  }, [startTime, endTime, bookingDetails]); // Tiền sẽ tính lại khi 1 trong 3 cái này đổi

  if (loadingLot) return <div className="p-6 text-center">Đang tải thông tin...</div>;

  async function handBooking(e:any){

    e.preventDefault();

    if(!selectedPlate){

      alert("Vui lòng chọn biển số xe");

      return;

    }

    if(!startTime || !endTime){

      alert("Vui lòng chọn thời gian vào và ra");

      return;

    }

    if(!selectedSpot){

      alert("Vui lòng chọn vị trí đỗ");

      return;

    }

    if(dayjs(endTime).isBefore(dayjs(startTime))){

      alert("Thời gian ra phải sau thời gian vào - Vui lòng chọn lại");

      return;

    }

    const start = dayjs(startTime);

    const end = dayjs(endTime);

    if (end.isBefore(start) || end.isSame(start)) {

      alert("Lỗi: Thời gian ra phải sau thời gian vào!\n(Lưu ý: 12:00 AM là 00:00 sáng)");

      return; // Chặn gửi BE

    }

      const vehicle = bookingDetails.vehicle;

      const bookingData = {

        user_id : String(vehicle.user.id),

        vehicle_id : vehicle.id,

        slot_id : selectedSpot?.slot.id,

        parking_lot_id : dataLot.id,

        start_time : dayjs(startTime).toISOString(),

        end_time : dayjs(endTime).toISOString(),

        status : "PENDING"

      }

      console.log("Booking Data:", bookingData);

      try {

        // Gọi API để tạo booking

        const saved: any = await post("/booking",bookingData);

        // Lấy thông tin user hiện tại

        const auth = useAuthStore.getState();

        const currentUserId = auth?.user?.id;

        // Round tổng tiền lên đơn vị VND

        const amount = Math.round(totalPrice || 0);



        if (paymentMethod === 'vnpay') {

          // Tạo link VNPAY từ backend rồi chuyển hướng

          const res: any = await post('/payment/vnpay/create-url', { amount, userId: currentUserId });

          console.log('VNPay create-url response:', res);



          // Backend có thể trả về { success, url } hoặc { data: { success, url } }

          const ok = Boolean(res?.success || res?.data?.success);

          const redirectUrl = res?.url || res?.data?.url;



          if (ok && redirectUrl) {

            window.location.href = redirectUrl;

            return;

          } else {

            // Hiển thị thông điệp lỗi chi tiết từ backend nếu có

            const msg = res?.message || res?.data?.message || 'Không thể tạo link VNPAY. Vui lòng thử lại sau.';

            alert(window.location.host + ' cho biết\n\n' + msg);

            return;

          }

        }



        if (paymentMethod === 'wallet') {

          // Gọi endpoint ví để trừ tiền (sử dụng owner của bãi đỗ)

          const ownerId = dataLot?.owner?.id || dataLot?.owner_id;

          try {

            await post('/wallets/payment', {

              ownerId,

              amount,

              bookingId: saved.id,

              customerId: currentUserId,

            });

            alert('Thanh toán bằng Ví GoPark thành công');

            return;

          } catch (err:any) {

            console.error('Lỗi thanh toán ví:', err);

            alert(err?.message || 'Thanh toán bằng ví thất bại');

            return;

          }

        }



        // Nếu phương thức là cash hoặc khác

        alert('Đặt chỗ thành công! Vui lòng thanh toán khi đến bãi (tiền mặt).');

      } catch (error) {

        console.error("Lỗi khi đặt chỗ:", error);

        alert("Đặt chỗ thất bại. Vui lòng thử lại.");

      }
  }
  return (

    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition-colors relative overflow-hidden">

      {/* Decorative top border */}

      <div className="absolute top-0 left-0 w-full h-1.5 bg-green-800 dark:bg-green-700"></div>

     

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">

        <Car className="w-5 h-5 text-green-900 dark:text-green-700" />

        Đặt chỗ đỗ xe

      </h2>

     

      <form className="space-y-6">

       

        {/* Biển số xe */}

        <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">

              <Search className="w-4 h-4 text-gray-500" />

              Chọn xe ô tô của bạn

            </label>

            <div className="relative">

              <select

                value={selectedPlate}

                onChange={(e) => setSelectedPlate(e.target.value)}

                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all text-gray-900 dark:text-white font-medium appearance-none cursor-pointer"

              >

                {dataLot?.userVehicles?.length > 0 ? (

                    dataLot.userVehicles.map((v: any) => (

                      <option key={v.plate_number} value={v.plate_number}>

                        {v.plate_number} - {v.type}

                      </option>

                    ))

                  ) : (

                    <option disabled>Không có xe nào được đăng ký</option>

                )}

              </select>

              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

                <Car className="w-4 h-4 text-green-700 dark:text-green-700" />

              </div>

            </div>

        </div>



        {/* Gói dịch vụ */}

        {/* <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">

              <Package className="w-4 h-4 text-gray-500" />

              Gói dịch vụ

            </label>

            <div className="relative">

              <select

                value={servicePackage}

                onChange={(e) => setServicePackage(e.target.value)}

                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all text-gray-900 dark:text-white font-medium appearance-none cursor-pointer"

              >

                <option value="hourly">Theo giờ</option>

                <option value="dayly">Theo ngày</option>

              </select>

              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

                <Package className="w-4 h-4 text-green-700 dark:text-green-700" />

              </div>

            </div>

        </div> */}



        {/* Thời gian - Đã điều chỉnh để lấy toàn bộ chiều rộng (rộng hơn) */}

        <div className="flex flex-col gap-5">

            <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">

                  <Clock className="w-4 h-4 text-gray-500" />

                  Giờ vào

                </label>

               {/* Giờ vào */}

                <input

                  type="datetime-local"

                  value={startTime}

                  onChange={(e) => setStartTime(e.target.value)}

                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none text-base text-gray-900 dark:text-white transition-colors block"

                />

            </div>

            <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">

                  <Clock className="w-4 h-4 text-gray-500" />

                  Giờ ra

                </label>

               {/* Giờ ra */}

                <input

                  type="datetime-local"

                  value={endTime}

                  min={startTime}

                  onChange={(e) => setEndTime(e.target.value)}

                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none text-base text-gray-900 dark:text-white transition-colors block"

                />

            </div>

        </div>



        {/* Dòng ghi chú về thời gian theo yêu cầu của bạn */}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">

            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">

              <strong>💡 Lưu ý về thời gian:</strong>

              <br />

              - 12h <strong>AM</strong> tương ứng với <strong>00:00</strong> (nửa đêm giờ VN).

              <br />

              - 12h <strong>PM</strong> tương ứng với <strong>12:00</strong> (trưa giờ VN).

            </p>

          </div>



        {/* Vị trí đã chọn (mock) */}

        <div className="bg-green-50/50 dark:bg-green-900/10 p-3.5 rounded-lg border border-green-100 dark:border-green-800/40 transition-colors">

           <div className="flex justify-between items-center text-sm">

              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">

                <MapPin className="w-4 h-4 text-green-700 dark:text-green-700" />

                Vị trí đỗ:

              </span>

              <span className="font-bold text-green-700 dark:text-green-400 px-2 py-0.5 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-700/50 shadow-sm">

                {selectedSpot

                ? `${selectedSpot.floorNumber}-${selectedSpot.zoneName}-${selectedSpot.slot.code}`

                : "Chưa chọn"}

              </span>

           </div>

        </div>



        {/* Chọn hình thức thanh toán */}

        <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">

              <CreditCard className="w-4 h-4 text-gray-500" />

              Hình thức thanh toán

            </label>

            <div className="relative">

              <select

                value={paymentMethod}

                onChange={(e) => setPaymentMethod(e.target.value)}

                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all text-gray-900 dark:text-white font-medium appearance-none cursor-pointer"

              >

                <option value="vnpay">Chuyển khoản (VNPAY)</option>

                <option value="wallet">Ví GoPark</option>

                <option value="cash">Thanh toán trực tiếp</option>

              </select>

              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

                <CreditCard className="w-4 h-4 text-green-700 dark:text-green-700" />

              </div>

            </div>

        </div>



        {/* Tổng tiền */}

        <div className="border-t border-gray-100 dark:border-gray-700 pt-5 mt-2">

            <div className="flex justify-between items-center mb-3">

                <span className="text-gray-500 text-sm">

                  {/* Sử dụng bookingDetails.vehicle thay vì currentVehicles */}

                  Đơn giá ({bookingDetails.vehicle?.type || "Xe"})

                </span>

                <span className="font-medium text-sm text-gray-900 dark:text-white">

                  {/* Sử dụng bookingDetails.priceHourly */}

                  {bookingDetails.priceHourly.toLocaleString()}đ/giờ

                </span>

                <span className="font-medium text-sm text-gray-900 dark:text-white">

                  {/* Sử dụng bookingDetails.priceHourly */}

                  {bookingDetails.priceDayly.toLocaleString()}đ/ngày

                </span>

            </div>

           

            <div className="flex justify-between items-end mb-6">

                <span className="font-bold text-gray-900 dark:text-white">Tổng tạm tính</span>

                <span className="text-2xl font-black text-green-600 dark:text-green-500">

                  {/* Gọi hàm calculateTotal đã viết ở trên */}

                  {Math.round(totalPrice).toLocaleString()}đ

                </span>

            </div>

           

            <button

                type="button"

                onClick={(handBooking)}

                className="group relative w-full bg-green-800 hover:bg-green-700 cursor-pointer text-white font-bold py-3.5 px-4 rounded-lg transition-all shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] active:scale-[0.98] text-lg overflow-hidden"

            >

                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>

                <span className="flex items-center justify-center gap-2">

                  <ShieldCheck className="w-5 h-5" />

                  Xác nhận Đặt Chỗ

                </span>

            </button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4 px-4 leading-relaxed">

               Thanh toán an toàn. Bạn không bị trừ tiền cho đến khi check-in tại bãi đỗ.

            </p>

        </div>

      </form>

    </div>

  );

}
