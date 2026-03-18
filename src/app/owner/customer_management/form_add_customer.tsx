"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Camera, Loader2 } from "lucide-react";
import { ocrService } from "@/services/ocr.service";
import { toast } from "sonner";

export function FormAddCustomer() {
  const [licensePlate, setLicensePlate] = useState("");
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [vehicleImages, setVehicleImages] = useState<File[]>([]);

  const handleMultipleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setVehicleImages([...vehicleImages, ...Array.from(e.target.files)]);
  };

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    try {
      const result = await ocrService.recognizeLicensePlate(file);
      setLicensePlate(result);
      toast.success("Nhận diện biển số thành công!");
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Nhận diện biển số thất bại";
      toast.error(errorMessage);
    } finally {
      setIsOcrLoading(false);
    }
  };

  return (
    <div className="grid gap-6 py-6 px-4 md:px-6">
      {/* Tên */}
      <div className="grid gap-2">
        <Label className="text-sm font-medium">Tên khách hàng</Label>
        <Input placeholder="Nhập tên khách hàng" className="h-10" />
      </div>

      {/* SĐT */}
      <div className="grid gap-2">
        <Label className="text-sm font-medium">Số điện thoại</Label>
        <Input placeholder="Nhập số điện thoại" className="h-10" />
      </div>

      {/* Biển số (READ ONLY display, but could be an Input if user wants to edit) */}
      <div className="grid gap-2">
        <Label className="text-sm font-medium">Biển số xe</Label>
        <div className="h-10 flex items-center px-3 rounded-md border bg-muted text-sm relative">
          {isOcrLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground italic">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang nhận diện...
            </div>
          ) : (
            <span>{licensePlate || "Chưa nhận diện"}</span>
          )}
        </div>
      </div>

      {/* Upload section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload biển số */}
        <div className="grid gap-2">
          <Label className="text-sm font-medium">Ảnh biển số</Label>

          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition relative overflow-hidden">
            {isOcrLoading ? (
              <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center z-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs mt-2 font-medium">Đang xử lý...</p>
              </div>
            ) : null}
            
            <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center px-2">
              Upload hoặc chụp ảnh biển số để tự động nhập
            </p>

            <Input 
              type="file" 
              accept="image/*"
              className="hidden" 
              onChange={handleOcrUpload}
              disabled={isOcrLoading}
            />

            {/* Nút chụp (Dành cho mobile) */}
            <div className="mt-2 flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 px-3 rounded-md text-xs font-medium transition-colors">
              <Camera className="w-4 h-4" /> 
              <span>Chụp ảnh</span>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleOcrUpload}
                disabled={isOcrLoading}
              />
            </div>
          </label>
        </div>

        {/* Upload ảnh xe */}
        <div className="grid gap-2">
          <Label className="text-sm font-medium">Ảnh xe</Label>

          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition relative">
            <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center px-2">
              Upload hoặc chụp nhiều ảnh xe
            </p>

            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleMultipleImages}
              className="hidden"
            />

            <div className="mt-2 flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 px-3 rounded-md text-xs font-medium transition-colors">
              <Camera className="w-4 h-4" /> 
              <span>Chụp ảnh</span>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                capture="environment" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleMultipleImages}
              />
            </div>
          </label>

          {/* Preview ảnh */}
          {vehicleImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {vehicleImages.map((file, index) => {
                const url = URL.createObjectURL(file);
                return (
                  <img
                    key={index}
                    src={url}
                    alt="vehicle"
                    className="w-16 h-16 object-cover rounded-md border"
                    onLoad={() => URL.revokeObjectURL(url)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <Button className="w-full h-10 mt-2 text-base font-semibold" disabled={isOcrLoading}>
        Thêm khách hàng
      </Button>
    </div>
  );
}
