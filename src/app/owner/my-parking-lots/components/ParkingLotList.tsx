"use client";

import React from "react";
import { ParkingLotType } from "@/types/owner";
import { ModernParkingLotCard } from "./ModernParkingLotCard";

interface ParkingLotListProps {
  parkingLots: ParkingLotType[];
  isLoading: boolean;
  onManage?: (lotId: number) => void;
  onEdit?: (lot: ParkingLotType) => void;
}

export default function ParkingLotList({
  parkingLots,
  isLoading,
  onManage,
  onEdit,
}: ParkingLotListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[450px] rounded-[32px] bg-slate-50 animate-pulse border border-slate-100"
          ></div>
        ))}
      </div>
    );
  }

  if (parkingLots.length === 0) {
    return (
      <div className="py-20 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            ></path>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800">Không tìm thấy bãi đỗ xe nào</h3>
        <p className="text-slate-500 font-medium mt-2 max-w-xs">
          Bãi đỗ của bạn sẽ xuất hiện tại đây sau khi bạn thêm chúng vào hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {parkingLots.map((lot, index) => (
        <ModernParkingLotCard
          key={lot.id}
          lot={lot}
          isFirst={index === 0}
          onClick={() => onManage?.(lot.id)}
          onManageSlots={(e) => {
            e.stopPropagation();
            onManage?.(lot.id);
          }}
          onEdit={(e) => {
            e.stopPropagation();
            onEdit?.(lot);
          }}
        />
      ))}
    </div>
  );
}
