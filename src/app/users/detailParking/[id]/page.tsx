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
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

export default function DetailParkingPage() {
  const router = useRouter();

  return (
    <>
    <Header/>

    <ParkingProvider>
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 py-6 transition-colors font-sans">
        <div className="container max-w-7xl mx-auto px-4 space-y-6">
          {/* Nút Quay lại sử dụng Shadcn Button */}
          <Button 
            variant="outline"
            onClick={() => router.push('/?tab=nearby')}
            className="group rounded-full bg-white/70 dark:bg-stone-900/70 backdrop-blur-md border-gray-200/50 dark:border-stone-700/50 shadow-sm hover:shadow-md transition-all font-bold text-gray-700 dark:text-gray-200 h-10 px-5"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Quay lại bãi đỗ
          </Button>

          {/* Khung Thông tin chi tiết */}
          <ParkingInfo />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Cột trái (Chiếm 2/3): Sơ đồ & Đánh giá */}
            <div className="lg:col-span-2 space-y-6">
              {/* Khung Đánh giá của khách hàng */}
              <ReviewsList />
            </div>

            {/* Cột phải (Chiếm 1/3) */}
            <div className="lg:col-span-1 space-y-6">
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
