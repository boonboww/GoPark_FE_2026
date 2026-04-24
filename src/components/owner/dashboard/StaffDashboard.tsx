"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/button"; // Wait, Card is from card.tsx
import { 
  Search, 
  Car, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  LayoutDashboard,
  CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Note: I'm using placeholder components for UI demonstration as requested
const CardMock = ({ title, children, description, icon: Icon }: any) => (
  <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
    <div className="flex flex-col space-y-1.5 p-6 pb-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    <div className="p-6 pt-0">{children}</div>
  </div>
);

export function StaffDashboard() {
  return (
    <div className="space-y-6">
      {/* Search Bar section */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Tìm kiếm nhanh (Biển số / Mã đặt chỗ)</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="VD: 30A-12345 hoặc #GP123..." 
              className="pl-10 h-11 bg-background"
            />
          </div>
        </div>
        <Button className="h-11 px-8">Kiểm tra</Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardMock title="Dự kiến hôm nay" icon={Clock}>
          <div className="text-2xl font-bold">42</div>
          <p className="text-xs text-muted-foreground mt-1">Lượt đặt chỗ chuẩn bị tới</p>
        </CardMock>
        <CardMock title="Đã vào bãi" icon={ArrowDownLeft}>
          <div className="text-2xl font-bold text-blue-500">28</div>
          <p className="text-xs text-muted-foreground mt-1">+12 so với giờ trước</p>
        </CardMock>
        <CardMock title="Đã rời bãi" icon={ArrowUpRight}>
          <div className="text-2xl font-bold text-orange-500">15</div>
          <p className="text-xs text-muted-foreground mt-1">Hoàn thành thanh toán</p>
        </CardMock>
        <CardMock title="Hiện tại trong bãi" icon={Car}>
          <div className="text-2xl font-bold text-green-500">85%</div>
          <p className="text-xs text-muted-foreground mt-1">170/200 chỗ đang sử dụng</p>
        </CardMock>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Upcoming arrivals */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Xe sắp đến bãi
          </h3>
          <div className="rounded-xl border bg-card/50 overflow-hidden">
             <table className="w-full text-sm">
               <thead className="bg-muted/50 border-b">
                 <tr>
                   <th className="px-4 py-3 text-left font-medium">Biển số</th>
                   <th className="px-4 py-3 text-left font-medium">Khách hàng</th>
                   <th className="px-4 py-3 text-left font-medium">Giờ dự kiến</th>
                   <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                 </tr>
               </thead>
               <tbody className="divide-y">
                 {[1, 2, 3, 4, 5].map((i) => (
                   <tr key={i} className="hover:bg-muted/30 transition-colors">
                     <td className="px-4 py-3 font-mono font-bold">30A-987.6{i}</td>
                     <td className="px-4 py-3">Nguyễn Văn {String.fromCharCode(65 + i)}</td>
                     <td className="px-4 py-3 text-muted-foreground">09:{15 + i*5}</td>
                     <td className="px-4 py-3 text-right">
                       <Button variant="outline" size="sm" className="h-8">Check-in</Button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>

        {/* Right column: Quick info/Actions */}
        <div className="space-y-6">
           <CardMock title="Hoạt động gần đây" icon={LayoutDashboard}>
              <div className="space-y-4 mt-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0" />
                    <div>
                      <p className="font-medium">Xe 29B-456.{i} vào bãi</p>
                      <p className="text-xs text-muted-foreground">3 phút trước</p>
                    </div>
                  </div>
                ))}
              </div>
           </CardMock>

           <CardMock title="Trạng thái bãi xe" icon={CheckCircle2}>
              <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                    <span>Khu A (Tầng 1)</span>
                    <span className="font-bold text-orange-500">95%</span>
                 </div>
                 <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 w-[95%]" />
                 </div>
                 
                 <div className="flex justify-between text-sm pt-2">
                    <span>Khu B (Tầng 2)</span>
                    <span className="font-bold text-green-500">40%</span>
                 </div>
                 <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[40%]" />
                 </div>
              </div>
           </CardMock>
        </div>
      </div>
    </div>
  );
}
