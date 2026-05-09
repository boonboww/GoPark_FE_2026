"use client";

import { BookingForm } from "@/components/features/parking-detail/BookingForm";
import { ParkingLayout } from "@/components/features/parking-detail/ParkingLayout";
import React, { useContext } from "react";
import { ChevronRight, Home, ShieldAlert, ArrowLeft } from "lucide-react";
import ParkingProvider from "@/components/features/parking-detail/ProviderContext";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { useSearchParams } from "next/navigation";
import { ParkingContext } from "@/components/features/parking-detail/ParkingContext";

const MyBooking = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const searchParams = useSearchParams();
  const startTime = searchParams.get("start") ?? undefined;
  const endTime = searchParams.get("end") ?? undefined;
  const vehicleId = searchParams.get("vehicle") ?? undefined;
  const paymentMethod = searchParams.get("payment") ?? undefined;

  return (
    <>
      <Header />

      <ParkingProvider>
        <div className="min-h-screen bg-gray-50/80 dark:bg-gray-900/50 pb-16 font-sans">
          {/* 1. Tiêu đề & Breadcrumb - Định hướng rõ ràng người dùng đang ở bước cuối */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            {/* Nút quay lại & Tiêu đề gọn gàng, tập trung vào hành động */}
            <div className="mt-6 mb-2">
              {/* Nút Quay lại */}
              <button
                onClick={() => router.push(`/users/detailParking/${id}`)}
                className="group mb-5 flex items-center gap-2.5 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md px-4 py-2.5 rounded-full border border-gray-200/50 dark:border-stone-700/50 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-stone-600 transition-all text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer w-fit"
              >
                <div className="bg-gray-100 dark:bg-stone-800 rounded-full p-1.5 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                </div>
                Quay lại bãi đỗ
              </button>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Chọn vị trí đỗ xe
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Vui lòng chọn vị trí trên sơ đồ và xác nhận thông tin thanh
                toán.
              </p>
            </div>
          </div>

          {/* 2. Main Layout (Sơ đồ + Form) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* CỘT TRÁI: Sơ đồ đỗ xe & Box Trust */}
              <div className="w-full lg:w-2/3 flex flex-col gap-6">
                {/* Component Layout Của Bạn */}
                <ParkingLayout />

                {/* UX Tips: Một box thông báo an tâm nhỏ gọn, giúp cân bằng chiều cao với Form bên phải */}
                <div className="bg-blue-50/70 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40 rounded-xl p-5 flex gap-4 transition duration-300 hover:shadow-sm">
                  <div className="mt-0.5">
                    <ShieldAlert className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                      Giao dịch an toàn & Giữ chỗ 30 phút
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Bạn sẽ không bị trừ tiền cho đến khi check-in tại cổng.
                      Vui lòng kiểm tra kỹ <b>biển số xe</b> để quy trình mở
                      barie tự động bằng Camera AI diễn ra trơn tru nhất.
                    </p>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: Form Đặt Chỗ (Tự động trượt dọc theo màn hình) */}
              <div className="w-full lg:w-1/3 sticky top-6 z-10">
                {/* Component Form Của Bạn */}
                <BookingForm
                  defaultStart={startTime}
                  defaultEnd={endTime}
                  defaultVehicle={vehicleId}
                  defaultPayment={paymentMethod}
                />
              </div>
            </div>
          </div>
        </div>
      </ParkingProvider>
    </>
  );
};

export default MyBooking;
