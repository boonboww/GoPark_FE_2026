"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Phone, 
  Mail, 
  Trash2, 
  Shield, 
  MoreVertical,
  User,
  Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StaffCardProps {
  staff: any;
  onDelete: (id: string, name: string) => void;
}

export function StaffCard({ staff, onDelete }: StaffCardProps) {
  const name = staff.profile?.name || "N/A";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
    >
      <div className="flex justify-between items-start mb-6">
        <Avatar className="h-16 w-16 rounded-2xl border-2 border-slate-50 shadow-inner bg-slate-100">
          <AvatarFallback className="text-xl font-black text-slate-400 bg-slate-50">
            {initials}
          </AvatarFallback>
        </Avatar>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-900">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl p-2 border-slate-100 shadow-xl">
            <DropdownMenuItem 
              className="text-red-500 focus:text-red-500 focus:bg-red-50 rounded-xl cursor-pointer"
              onClick={() => onDelete(staff.id, name)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa tài khoản
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-emerald-900 transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-slate-400">
            <Shield className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Nhân viên vận hành</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-xs font-medium truncate">{staff.email}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-xs font-medium">{staff.profile?.phone || "N/A"}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hoạt động</span>
        </div>
        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900">
          Chi tiết
        </Button>
      </div>
    </motion.div>
  );
}
