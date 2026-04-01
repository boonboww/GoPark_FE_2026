"use client";

import React, { useContext } from "react";
import { MapPin, Clock, Star, Banknote, Info, User, Phone, Mail, Car, Bike } from "lucide-react";
import { ParkingContext } from "./ParkingContext";

export function ParkingInfo() {

  const context = useContext(ParkingContext);
  if(!context) return null;
  const {dataLot,loadingLot} = context;
  console.log("ParkingInfo Component - Data from Context:", dataLot, "Loading:", loadingLot);

    const formatVnd = (n?: number) => n ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : '';
    const getRuleByType = (type: string) => {
      if(!dataLot?.pricingRule) return undefined;
      return dataLot.pricingRule.find((r: any) => {
        const vt = String(r.vehicle_type || '').toLowerCase();
        return vt.includes(type.toLowerCase());
      });
    }
    const carRule = getRuleByType('car');
    const motorRule = getRuleByType('motor');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6 transition-colors">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Hình ảnh và Quản lý */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="space-y-4">
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
              <img 
                src="https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=800&auto=format&fit=crop" 
                alt="Parking" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <div className="w-1/3 aspect-video rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1604063155776-081e7e45fcc3?q=80&w=300&auto=format&fit=crop" className="w-full h-full object-cover" />
              </div>
              <div className="w-1/3 aspect-video rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?q=80&w=300&auto=format&fit=crop" className="w-full h-full object-cover" />
              </div>
              <div className="w-1/3 aspect-video rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                +3
              </div>
            </div>
          </div>

          {/* Thông tin chủ quản lý & Đặt ngay */}
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-500 shrink-0" />
              <p className="font-semibold text-gray-900 dark:text-gray-200">Thông tin chủ quản lý</p>
            </div>
            <div className="space-y-3">
              <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">Công ty CP bãi đỗ An Tâm</p>
              <div className="flex flex-col space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> 0909 123 456</span>
                <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> contact@antam.com</span>
              </div>
            </div>

            <button 
              type="button" 
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              Đặt ngay
            </button>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="w-full md:w-2/3 flex flex-col">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{dataLot.name}</h1>
              <div className="flex items-center text-yellow-500 mt-1">
                <Star className="w-5 h-5 fill-current" />
                <span className="ml-1 font-semibold text-gray-800 dark:text-gray-200">4.8</span>
                <span className="ml-1 text-gray-500 dark:text-gray-400 text-sm">(124 đánh giá)</span>
              </div>
            </div>
            {/* Nhãn Đang hoạt động */}
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
              Đang hoạt động
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-200">Địa chỉ</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{dataLot.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-200">Giờ hoạt động</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">06:00 - 23:00 (Thứ 2 - Chủ Nhật)</p>
              </div>
            </div>
          </div>

          {/* Bảng giá vé */}
          <div className="mt-6 border-t border-gray-100 dark:border-gray-700/50 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <Banknote className="w-5 h-5 text-gray-400" />
              <p className="font-medium text-gray-900 dark:text-gray-200">Bảng giá vé</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card Ô tô */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-md">
                    <Car className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Giá đỗ Ô tô</h4>
                </div>
                {carRule ? (
                   <ul className="space-y-2 mt-2 pt-2 border-t border-gray-50 dark:border-gray-700/50">
                     <li className="flex justify-between items-center">
                       <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">THEO GIỜ</span>
                       <span className="font-bold text-blue-600 dark:text-blue-400 text-sm whitespace-nowrap">{formatVnd(carRule.price_per_hour)}<span className="text-[10px] font-normal text-gray-500 ml-1">/h</span></span>
                     </li>
                     <li className="flex justify-between items-center">
                       <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">THEO NGÀY</span>
                       <span className="font-bold text-blue-600 dark:text-blue-400 text-sm whitespace-nowrap">{formatVnd(carRule.price_per_day)}<span className="text-[10px] font-normal text-gray-500 ml-1">/ngày</span></span>
                     </li>
                   </ul>
                ) : (
                   <p className="text-xs text-gray-400 italic mt-2 border-t border-gray-50 dark:border-gray-700/50 pt-2 text-center">Chưa cập nhật giá</p>
                )}
              </div>

              {/* Card Xe máy */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-md">
                    <Bike className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Giá đỗ Xe máy</h4>
                </div>
                {motorRule ? (
                   <ul className="space-y-2 mt-2 pt-2 border-t border-gray-50 dark:border-gray-700/50">
                     <li className="flex justify-between items-center">
                       <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">THEO GIỜ</span>
                       <span className="font-bold text-green-600 dark:text-green-400 text-sm whitespace-nowrap">{formatVnd(motorRule.price_per_hour)}<span className="text-[10px] font-normal text-gray-500 ml-1">/h</span></span>
                     </li>
                     <li className="flex justify-between items-center">
                       <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">THEO NGÀY</span>
                       <span className="font-bold text-green-600 dark:text-green-400 text-sm whitespace-nowrap">{formatVnd(motorRule.day)}<span className="text-[10px] font-normal text-gray-500 ml-1">/ngày</span></span>
                     </li>
                   </ul>
                ) : (
                   <p className="text-xs text-gray-400 italic mt-2 border-t border-gray-50 dark:border-gray-700/50 pt-2 text-center">Chưa cập nhật giá</p>
                )}
              </div>
            </div>
          </div>

          {/* Tiện ích */}
          <div className="mt-6 border-t border-gray-100 dark:border-gray-700/50 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-gray-400 shrink-0" />
              <p className="font-medium text-gray-900 dark:text-gray-200">Tiện ích</p>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed pl-7">Camera 24/7, Có mái che, Rửa xe</p>
          </div>

          {/* Mô tả */}
          <div className="mt-6 border-t border-gray-100 dark:border-gray-700/50 pt-5 h-full">
            <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Mô tả</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed text-justify">
              {dataLot.description}
            </p>
          </div>
        </div>
      </div>

      {/* Bản đồ */}
      <div className="mt-6 rounded-lg overflow-hidden h-[300px] border border-gray-200 dark:border-gray-700">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.513364273523!2d106.699042215334!3d10.7719363923241!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f40a3b49e59%3A0xa1bd14e483a602db!2sCh%E1%BB%A3%20B%E1%BA%BFn%20Th%C3%A0nh!5e0!3m2!1svi!2s!4v1655000000000!5m2!1svi!2s" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen={true} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Bản đồ vị trí bãi đỗ xe"
          className="dark:opacity-80"
        ></iframe>
      </div>
    </div>
  );
}
