"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

export function FormAddCustomer() {
  return (
    <div className="grid gap-6 py-6 px-4 md:px-6">
      <div className="grid gap-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Tên khách hàng
        </Label>
        <div className="relative">
          <Input id="name" placeholder="Nhập tên khách hàng" className="h-10" />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone" className="text-sm font-medium">
          Số điện thoại
        </Label>
        <div className="relative">
          <Input id="phone" placeholder="Nhập số điện thoại" className="h-10" />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="licensePlate" className="text-sm font-medium">
          Biển số xe
        </Label>
        <div className="relative">
          <Input
            id="licensePlate"
            placeholder="Nhập biển số xe (VD: 30A-123.45)"
            className="h-10"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="vehicleImage" className="text-sm font-medium">
          Ảnh xe
        </Label>
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="vehicleImage"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Nhấn để tải ảnh</span> hoặc kéo
                thả
              </p>
              <p className="text-xs text-muted-foreground">
                SVG, PNG, JPG (MAX. 800x400px)
              </p>
            </div>
            <Input id="vehicleImage" type="file" className="hidden" />
          </label>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-10 mt-2 text-base font-semibold"
      >
        Thêm khách hàng
      </Button>
    </div>
  );
}
