"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Car,
  Settings,
  Edit3,
  ArrowRight,
  Clock,
  Calendar,
  Users,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParkingLotType } from "@/types/owner";
import { cn } from "@/lib/utils";

interface ModernParkingLotCardProps {
  lot: ParkingLotType;
  onClick: () => void;
  onManageSlots: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  isFirst?: boolean;
}

export function ModernParkingLotCard({
  lot,
  onClick,
  onManageSlots,
  onEdit,
  isFirst,
}: ModernParkingLotCardProps) {
  // Helper định dạng giờ từ ISO string
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return null;
    try {
      if (timeStr.includes("T")) {
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return timeStr;
        const hours = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      }
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  // Helper định dạng ngày hoạt động đồng bộ
  const formatOperatingDays = (daysStr?: string) => {
    if (!daysStr) return "Hàng ngày (Thứ 2 - CN)";

    const dayMap: Record<string, string> = {
      monday: "Thứ 2",
      tuesday: "Thứ 3",
      wednesday: "Thứ 4",
      thursday: "Thứ 5",
      friday: "Thứ 6",
      saturday: "Thứ 7",
      sunday: "Chủ nhật",
      mon: "Thứ 2",
      tue: "Thứ 3",
      wed: "Thứ 4",
      thu: "Thứ 5",
      fri: "Thứ 6",
      sat: "Thứ 7",
      sun: "Chủ nhật",
      "thứ 2": "Thứ 2",
      "thứ 3": "Thứ 3",
      "thứ 4": "Thứ 4",
      "thứ 5": "Thứ 5",
      "thứ 6": "Thứ 6",
      "thứ 7": "Thứ 7",
      "chủ nhật": "Chủ nhật",
      "cn": "Chủ nhật"
    };

    const clean = daysStr.toLowerCase().trim();

    // Xử lý dạng range: "monday-sunday" hoặc "thứ 2-cn"
    if (clean.includes("-")) {
      const parts = clean.split("-").map(p => p.trim());
      const start = dayMap[parts[0]] || parts[0];
      const end = dayMap[parts[1]] || parts[1];
      return `${start} - ${end}`;
    }

    // Xử lý dạng list: "monday, tuesday, wednesday"
    if (clean.includes(",")) {
      return clean
        .split(",")
        .map(p => {
          const key = p.trim();
          return dayMap[key] || key;
        })
        .join(", ");
    }

    // Xử lý từ đơn hoặc các trường hợp khác
    return dayMap[clean] || daysStr;
  };

  // Tính toán số liệu thực tế
  const totalSlots = lot.totalSlots || 0;
  const availableSlots = lot.availableSlots || 0;
  const occupiedSlots = totalSlots - availableSlots;
  const occupancyPercent = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;
  const isHigh = occupancyPercent > 80;

  const imageUrl =
    lot.image?.thumbnail ||
    `https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=2070&auto=format&fit=crop`;

  const openTime = formatTime(lot.open_time);
  const closeTime = formatTime(lot.close_time);
  const operatingDays = formatOperatingDays(lot.operating_days);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="group relative bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer flex flex-col h-full"
    >
      {/* Banner / Image Section */}
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
        <img
          src={imageUrl}
          alt={lot.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
        />

        {/* Quick Info Overlay */}
        <div className="absolute bottom-4 left-5 right-5 z-20">
          <div className="text-white space-y-0.5">
            <h3 className="text-lg font-black tracking-tight leading-tight">
              {lot.name}
            </h3>
            <div className="flex items-center gap-1 text-white/80">
              <MapPin className="w-3 h-3" />
              <span className="text-[10px] font-bold line-clamp-1">
                {lot.address}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-3.5 border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <LayoutGrid className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase tracking-[0.15em]">
                  Tổng ô đỗ
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {totalSlots}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-3.5 border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Users className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase tracking-[0.15em]">
                  Tỉ lệ lấp đầy
                </span>
              </div>
              <div
                className={cn(
                  "text-xl font-black",
                  isHigh ? "text-orange-500" : "text-emerald-600",
                )}
              >
                {occupiedSlots}/{totalSlots}
              </div>
            </div>
          </div>

          {/* Operating Info Section */}
          <div className="bg-slate-50/50 dark:bg-zinc-900/30 rounded-2xl p-3.5 border border-slate-100 dark:border-zinc-800/50 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-blue-600">
                <Clock size={14} />
              </div>
              <div className="flex-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Giờ hoạt động</p>
                <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                  {openTime && closeTime ? `${openTime} - ${closeTime}` : "Liên tục 24/7"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-blue-600">
                <Calendar size={14} />
              </div>
              <div className="flex-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ngày hoạt động</p>
                <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                  {operatingDays}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            id={isFirst ? "lot-manage-btn" : undefined}
            variant="outline"
            size="sm"
            onClick={onManageSlots}
            className="flex-1 h-10 rounded-xl border-slate-200 dark:border-zinc-800 font-black text-[10px] gap-2 hover:bg-slate-900 hover:text-white transition-all duration-300"
          >
            <Settings className="w-3.5 h-3.5" />
            Quản lý sơ đồ
          </Button>
          <Button
            id={isFirst ? "lot-edit-btn" : undefined}
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Hover Arrow Decoration */}
      <div className="absolute top-3.5 left-3.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-7 h-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.div>
  );
}
