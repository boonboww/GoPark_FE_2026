"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ParkingLotType } from "@/types/owner";
import { parkingService } from "@/services/parking.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { X, ImagePlus, Loader2, MapPin, Clock, Globe } from "lucide-react";
import { MapLocationPicker } from "@/components/ui/map-location-picker";

const formSchema = z.object({
  name: z.string().min(1, "Tên bãi đỗ xe không được để trống"),
  address: z.string().min(1, "Địa chỉ không được để trống"),
  lat: z.number(),
  lng: z.number(),
  description: z.string().optional(),
  open_time: z.string().min(1, "Giờ mở cửa là bắt buộc"),
  close_time: z.string().min(1, "Giờ đóng cửa là bắt buộc"),
  operating_days: z.array(z.string()).min(1, "Chọn ít nhất 1 ngày hoạt động"),
}).refine((data) => {
  if (!data.open_time || !data.close_time) return true;
  const [openH, openM] = data.open_time.split(":").map(Number);
  const [closeH, closeM] = data.close_time.split(":").map(Number);
  return (closeH * 60 + closeM) > (openH * 60 + openM);
}, {
  message: "Giờ đóng cửa phải sau giờ mở cửa",
  path: ["close_time"],
});

type FormValues = z.infer<typeof formSchema>;

interface EditParkingLotDialogProps {
  parkingLot: ParkingLotType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const extractTime = (isoString?: string, fallback = "06:00") => {
  if (!isoString) return fallback;
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return fallback;
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } catch {
    return fallback;
  }
};

export default function EditParkingLotDialog({
  parkingLot,
  open,
  onOpenChange,
}: EditParkingLotDialogProps) {
  const queryClient = useQueryClient();
  const ownerId = useAuthStore((s) => s.user?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      lat: 16.0544,
      lng: 108.2022,
      description: "",
      open_time: "06:00",
      close_time: "22:00",
      operating_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
  });

  const watchedAddress = form.watch("address");
  const watchedLat = form.watch("lat");
  const watchedLng = form.watch("lng");

  // Cập nhật form values khi parkingLot thay đổi
  React.useEffect(() => {
    if (parkingLot && open) {
      form.reset({
        name: parkingLot.name || "",
        address: parkingLot.address || "",
        lat: Number(parkingLot.lat) || 16.0544,
        lng: Number(parkingLot.lng) || 108.2022,
        description: parkingLot.description || "",
        open_time: extractTime(parkingLot.open_time, "06:00"),
        close_time: extractTime(parkingLot.close_time, "22:00"),
        operating_days: parkingLot.operating_days ? parkingLot.operating_days.split(",") : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      });
      setSelectedFiles([]);
      // Clear old previews
      previews.forEach(p => URL.revokeObjectURL(p));
      setPreviews([]);

      const imgs: string[] = [];
      if (parkingLot.image?.thumbnail) imgs.push(parkingLot.image.thumbnail);
      if (parkingLot.image?.gallery) imgs.push(...parkingLot.image.gallery);
      setExistingImages(imgs);
      setDeletedImages([]);
    }
  }, [parkingLot, open, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...selectedFiles, ...files];
      setSelectedFiles(newFiles);

      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const removeExistingImage = (index: number) => {
    const url = existingImages[index];
    setDeletedImages([...deletedImages, url]);

    const newExisting = [...existingImages];
    newExisting.splice(index, 1);
    setExistingImages(newExisting);
  };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // 1. Xóa các ảnh cũ đã đánh dấu
      if (deletedImages.length > 0) {
        await Promise.all(
          deletedImages.map((url) =>
            parkingService.deleteParkingLotImage(parkingLot!.id, url)
          )
        );
      }

      // 2. Cập nhật thông tin & thêm ảnh mới
      return parkingService.updateParkingLot(parkingLot!.id, {
        ...values,
        open_time: new Date(`1970-01-01T${values.open_time}:00`).toISOString(),
        close_time: new Date(`1970-01-01T${values.close_time}:00`).toISOString(),
        operating_days: values.operating_days.join(","),
        images: selectedFiles.length > 0 ? selectedFiles : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parkingLots", ownerId] });
      toast.success("Cập nhật bãi đỗ xe thành công");
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Lỗi khi cập nhật bãi đỗ xe:", error);
      toast.error(error?.message || "Đã có lỗi xảy ra khi cập nhật bãi đỗ xe");
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] w-[95vw] h-[90vh] overflow-hidden bg-white border-slate-200 shadow-2xl rounded-3xl p-0 flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Left Side: Form */}
          <div className="flex-1 p-6 lg:p-8 border-r border-slate-100 overflow-y-auto custom-scrollbar">
            <DialogHeader className="space-y-2 pb-4 border-b border-slate-100 mb-6">
              <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
                Chỉnh sửa bãi đỗ xe
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                Cập nhật thông tin, vị trí và thời gian hoạt động của bãi đỗ.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tên bãi đỗ xe</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="VD: Bãi đỗ xe trung tâm"
                            className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Địa chỉ</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="VD: 123 Lê Lợi, Đà Nẵng"
                            className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Giờ hoạt động */}
                <div className="grid grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="open_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> Giờ mở cửa
                        </FormLabel>
                        <FormControl>
                          <Input type="time" className="h-11 bg-slate-50 font-bold" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="close_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> Giờ đóng cửa
                        </FormLabel>
                        <FormControl>
                          <Input type="time" className="h-11 bg-slate-50 font-bold" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Ngày hoạt động */}
                <FormField
                  control={form.control}
                  name="operating_days"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày hoạt động</FormLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                          const isSelected = field.value?.includes(day);
                          const dayLabels: Record<string, string> = {
                            Monday: "T2", Tuesday: "T3", Wednesday: "T4", Thursday: "T5", Friday: "T6", Saturday: "T7", Sunday: "CN",
                          };
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const newVal = isSelected
                                  ? field.value.filter((d) => d !== day)
                                  : [...(field.value || []), day];
                                field.onChange(newVal);
                              }}
                              className={`w-9 h-9 rounded-lg border-2 transition-all font-bold text-xs flex items-center justify-center ${isSelected ? "bg-black border-black text-white" : "bg-slate-50 border-slate-200 text-slate-400"
                                }`}
                            >
                              {dayLabels[day]}
                            </button>
                          );
                        })}
                      </div>
                    </FormItem>
                  )}
                />

                {/* Ảnh */}
                <div className="space-y-3">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Hình ảnh bãi đỗ xe
                  </FormLabel>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {existingImages.map((url, index) => (
                      <div key={`existing-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 group shadow-sm">
                        <img src={url} alt="Lot" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {previews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 group shadow-sm">
                        <img src={preview} alt="New" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl hover:border-primary hover:bg-slate-50 transition-all text-slate-400 gap-1"
                    >
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[9px] font-bold uppercase">Thêm ảnh</span>
                    </button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mô tả chi tiết</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Nhập mô tả về bãi đỗ xe của bạn..."
                          className="resize-none bg-slate-50 border-slate-200 focus:bg-white min-h-[100px] font-medium"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={mutation.isPending} className="font-bold">Hủy</Button>
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="bg-black hover:bg-slate-800 text-white min-w-[120px] rounded-xl font-bold shadow-lg shadow-black/10"
                  >
                    {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu thay đổi"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>

          {/* Right Side: Map */}
          <div className="flex-1 bg-slate-50 relative flex flex-col min-h-[300px] lg:min-h-full">
            <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-slate-100 z-10">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Vị trí thực tế</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Ghim lại vị trí bãi đỗ nếu có thay đổi.</p>
            </div>

            <div className="flex-1 relative">
              <MapLocationPicker
                location={{ lat: watchedLat, lng: watchedLng }}
                onChange={(loc) => {
                  form.setValue("lat", loc.lat);
                  form.setValue("lng", loc.lng);
                }}
                addressSearch={watchedAddress}
                onAddressSelect={(addr) => form.setValue("address", addr)}
                className="h-full border-0 rounded-0"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
