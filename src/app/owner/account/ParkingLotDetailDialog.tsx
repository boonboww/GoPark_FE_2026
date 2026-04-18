import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ParkingLotType } from "@/types/owner";
import { Edit, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ParkingLotDetailDialogProps {
  parkingLot: ParkingLotType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick: () => void;
}

export default function ParkingLotDetailDialog({
  parkingLot,
  open,
  onOpenChange,
  onEditClick,
}: ParkingLotDetailDialogProps) {
  if (!parkingLot) return null;

  const extractImages = (imgData: any): string[] => {
    if (!imgData) return [];
    let parsed = imgData;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) {
        if (parsed.startsWith("http") || parsed.startsWith("/")) return [parsed];
        return [];
      }
    }
    
    if (Array.isArray(parsed)) {
      return parsed.filter(item => typeof item === "string");
    }
    
    if (typeof parsed === "object" && parsed !== null) {
      let urls: string[] = [];
      Object.values(parsed).forEach(val => {
        if (typeof val === "string") urls.push(val);
        else if (Array.isArray(val)) {
          urls = urls.concat(val.filter(v => typeof v === "string"));
        }
      });
      return urls;
    }
    
    return [];
  };

  const images = extractImages(parkingLot.image);

  const formatImageUrl = (url: string) => {
    try {
      const cleanUrl = url.replace(/^"|"$/g, '').trim();
      if (cleanUrl.startsWith('http') || cleanUrl.startsWith('data:')) return cleanUrl;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL 
        ? new URL(process.env.NEXT_PUBLIC_API_URL).origin 
        : 'http://localhost:8000';
      return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
    } catch {
      return url;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] border-border bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mt-2">
            <DialogTitle className="text-2xl font-bold text-foreground pr-4">
              {parkingLot.name}
            </DialogTitle>
            <Badge variant={parkingLot.status === "ACTIVE" ? "default" : "secondary"}>
              {parkingLot.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Address */}
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
            <span className="text-sm">{parkingLot.address}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tổng số chỗ</p>
              <p className="text-lg font-semibold">{parkingLot.totalSlots}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
              <p className="text-lg font-semibold">{parkingLot.status}</p>
            </div>
          </div>

          {parkingLot.description && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Mô tả</h4>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {parkingLot.description}
              </p>
            </div>
          )}

          {images.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold mb-2">Hình ảnh bãi đỗ xe</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
                    <img 
                      src={formatImageUrl(img)} 
                      alt={`Hình ảnh ${idx + 1}`} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=L%E1%BB%97i+%E1%BA%A3nh";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border flex sm:justify-between items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border hover:bg-muted text-foreground"
          >
            Đóng
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onEditClick();
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 min-w-[140px] shadow-sm"
          >
            <Edit className="w-4 h-4" />
            Chỉnh sửa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
