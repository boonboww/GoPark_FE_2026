"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Car,
  Settings,
  Edit3,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
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
  // Tính toán công suất thực tế từ API
  const occupiedSlots = (lot.totalSlots || 0) - (lot.availableSlots || 0);
  const occupancy =
    lot.totalSlots > 0 ? Math.round((occupiedSlots / lot.totalSlots) * 100) : 0;

  const isHigh = occupancy > 80;

  const imageUrl =
    lot.image?.thumbnail ||
    `https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=2070&auto=format&fit=crop`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="group relative bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer"
    >
      {/* Banner / Image Section */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <img
          src={imageUrl}
          alt={lot.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />

        {/* Quick Stats Overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end">
          <div className="text-white">
            <h3 className="text-xl font-black tracking-tight leading-tight mb-1">
              {lot.name}
            </h3>
            <div className="flex items-center gap-1 opacity-90">
              <MapPin className="w-3 h-3" />
              <span className="text-[11px] font-medium line-clamp-1">
                {lot.address}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Car className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Tổng ô đỗ
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {lot.totalSlots}
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Công suất
              </span>
            </div>
            <div
              className={cn(
                "text-2xl font-black",
                isHigh ? "text-orange-500" : "text-emerald-600",
              )}
            >
              {occupancy}%
            </div>
          </div>
        </div>

        {/* Occupancy Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <span>Tỉ lệ lấp đầy</span>
            <span>
              {occupiedSlots}/{lot.totalSlots}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${occupancy}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={cn(
                "h-full rounded-full",
                isHigh ? "bg-orange-500" : "bg-emerald-500",
              )}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            id={isFirst ? "lot-manage-btn" : undefined}
            variant="outline"
            size="sm"
            onClick={onManageSlots}
            className="flex-1 h-11 rounded-xl border-slate-200 font-bold text-xs gap-2 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <Settings className="w-4 h-4" />
            Quản lý sơ đồ
          </Button>
          <Button
            id={isFirst ? "lot-edit-btn" : undefined}
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-11 w-11 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Decorative Arrow (appears on hover) */}
      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
