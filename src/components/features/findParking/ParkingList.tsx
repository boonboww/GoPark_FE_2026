"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Maximize2, Minimize2, ChevronRight } from "lucide-react"

const MOCK_PARKING_LOTS = [
  { id: 1, name: "Bãi đỗ xe Vincom", address: "72 Lê Thánh Tôn, Q.1", distance: "1.2 km", available: 15, price: "20.000đ/giờ" },
  { id: 2, name: "Nhà xe Hầm Bitexco", address: "2 Hải Triều, Q.1", distance: "2.5 km", available: 5, price: "25.000đ/giờ" },
  { id: 3, name: "Bãi xe ngoài trời", address: "Nguyễn Huệ, Q.1", distance: "3.0 km", available: 0, price: "15.000đ/giờ" },
]

export function ParkingList() {
  const [isOpen, setIsOpen] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!isOpen) {
    return (
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-1/2 -translate-y-1/2 left-4 z-[999] shadow-md rounded-full bg-white dark:bg-[#064e3b] dark:text-white dark:hover:bg-[#10b981]"
        onClick={() => setIsOpen(true)}
        title="Mở danh sách"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className={`
      bg-background dark:bg-black border-r dark:border-white/10 h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out z-40 relative
      ${isFullScreen ? "w-full absolute inset-0 z-50" : "w-[350px] lg:w-[400px] shrink-0"}
    `}>
      <div className="p-4 border-b dark:border-white/10 flex items-center justify-between">
        <div className="font-medium text-lg dark:text-white">
          Kết quả tìm kiếm ({MOCK_PARKING_LOTS.length})
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full dark:text-white dark:hover:bg-[#059669]"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? "Thu nhỏ" : "Phóng to"}
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full dark:text-white dark:hover:bg-[#059669]"
            onClick={() => {
              setIsOpen(false);
              setIsFullScreen(false);
            }}
            title="Đóng danh sách"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {MOCK_PARKING_LOTS.map((lot) => (
          <Card key={lot.id} className="cursor-pointer hover:border-primary transition-colors dark:bg-zinc-900 dark:border-white/10 dark:hover:border-[#10b981]">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold line-clamp-1 dark:text-white">{lot.name}</h3>
                <Badge variant={lot.available > 0 ? "default" : "destructive"} className={lot.available > 0 ? "dark:bg-[#10b981] dark:text-white" : ""}>
                  {lot.available > 0 ? `Còn ${lot.available} chỗ` : 'Hết chỗ'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground dark:text-white/60 mb-3">{lot.address}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-primary dark:text-[#10b981]">{lot.price}</span>
                <span className="text-muted-foreground dark:text-white/60">{lot.distance}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
