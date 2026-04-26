"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ParkingInfo } from "@/components/features/parking-detail/ParkingInfo";
import { ParkingLayout } from "@/components/features/parking-detail/ParkingLayout";
import { BookingForm } from "@/components/features/parking-detail/BookingForm";
import { ParkingRules } from "@/components/features/parking-detail/ParkingRules";
import { ReviewsList } from "@/components/features/parking-detail/ReviewsList";
import { SuggestedParking } from "@/components/features/parking-detail/SuggestedParking";
import ParkingProvider from "@/components/features/parking-detail/ProviderContext";
import BreadcrumbTitle from "@/components/features/parking-detail/BreadcrumbTitle";
import Header from "@/components/layout/Header";

export default function DetailParkingPage() {
  const router = useRouter();

  return (
    <>
    <Header/>

    <ParkingProvider>
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 py-6 transition-colors">
        <div className="container max-w-7xl mx-auto px-4 space-y-6">
          {/* Nút Quay lại */}
          <button 
            onClick={() => router.push('/?tab=nearby')}
            className="group flex items-center gap-2.5 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md px-4 py-2.5 rounded-full border border-gray-200/50 dark:border-stone-700/50 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-stone-600 transition-all text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer w-fit"
          >
            <div className="bg-gray-100 dark:bg-stone-800 rounded-full p-1.5 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            </div>
            Quay lại bãi đỗ
          </button>

          {/* Khung Thông tin chi tiết */}
          <ParkingInfo />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Cột trái (Chiếm 2/3): Sơ đồ & Đánh giá */}
            <div className="lg:col-span-2 space-y-6">
              {/* Khung Sơ đồ vị trí đỗ */}
              {/* <ParkingLayout /> */}

              {/* Khung Đánh giá của khách hàng */}
              <ReviewsList />
            </div>

            {/* Cột phải (Chiếm 1/3) */}
            <div className="lg:col-span-1 space-y-6">
              {/* <BookingForm /> */}
              <ParkingRules />
            </div>
          </div>

          {/* Khung Các bãi đỗ xe gợi ý */}
          <div className="pt-4">
            <SuggestedParking />
          </div>
        </div>
      </div>
    </ParkingProvider>
    </>
  );
}
