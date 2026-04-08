"use client";

import { BookingForm } from '@/components/features/parking-detail/BookingForm'
import { ParkingLayout } from '@/components/features/parking-detail/ParkingLayout'
import React from 'react'
import { ChevronRight, Home, ShieldAlert } from 'lucide-react'
import ParkingProvider from '@/components/features/parking-detail/ProviderContext';

const MyBooking = () => {
  return (
    <ParkingProvider>
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-900/50 pb-16 font-sans">
      
      {/* 1. Tiêu đề & Breadcrumb - Định hướng rõ ràng người dùng đang ở bước cuối */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* Tiêu đề gọn gàng, tập trung vào hành động */}
        <div className="mt-6 mb-2">
           <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Chọn vị trí đỗ xe
           </h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">
              Vui lòng chọn vị trí trên sơ đồ và xác nhận thông tin thanh toán.
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
                    Bạn sẽ không bị trừ tiền cho đến khi check-in tại cổng. Vui lòng kiểm tra kỹ <b>biển số xe</b> để quy trình mở barie tự động bằng Camera AI diễn ra trơn tru nhất.
                  </p>
               </div>
            </div>
          </div>
          
          {/* CỘT PHẢI: Form Đặt Chỗ (Tự động trượt dọc theo màn hình) */}
          <div className="w-full lg:w-1/3 sticky top-6 z-10">
            {/* Component Form Của Bạn */}
            <BookingForm />
          </div>
          
        </div>
      </div>
    </div>
    </ParkingProvider>
  )
}

export default MyBooking


