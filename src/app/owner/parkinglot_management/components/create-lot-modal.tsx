"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { parkingService } from "@/services/parking.service";
import { toast } from "sonner";
import { MapLocationPicker } from "@/components/ui/map-location-picker";
import { Loader2, Plus, X, Upload, MapPin, Info, Home, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(1, "Tên bãi đỗ là bắt buộc"),
  address: z.string().min(1, "Địa chỉ là bắt buộc"),
  lat: z.preprocess((v) => Number(v), z.number()),
  lng: z.preprocess((v) => Number(v), z.number()),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateLotModal({ isOpen, onClose, onSuccess }: CreateLotModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      lat: 16.0544,
      lng: 108.2022,
      description: "",
    },
  });

  // Watch for address changes to update map search
  const watchedAddress = form.watch("address");
  const watchedLat = form.watch("lat");
  const watchedLng = form.watch("lng");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedImages((prev) => [...prev, ...files]);
      
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previews[index]);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      await parkingService.createParkingLot({
        ...values,
        images: selectedImages,
      });
      toast.success("Đã gửi yêu cầu tạo bãi đỗ thành công. Vui lòng chờ Admin phê duyệt.");
      form.reset();
      setSelectedImages([]);
      setPreviews([]);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Create lot error:", error);
      toast.error(error.message || "Không thể tạo bãi đỗ xe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] w-[95vw] max-h-[90vh] overflow-y-auto bg-white border-slate-200 shadow-2xl rounded-3xl p-0">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Side: Form */}
          <div className="flex-1 p-6 lg:p-10 border-r border-slate-100 overflow-y-auto">
            <DialogHeader className="space-y-3 pb-6 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Thêm Bãi đỗ mới</DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium text-xs">Yêu cầu tạo bãi sẽ được gửi cho Admin phê duyệt.</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tên bãi */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <Info className="w-3 h-3" /> Tên bãi đỗ
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="VD: GoPark Central" 
                            {...field} 
                            className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Địa chỉ */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> Địa chỉ
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="VD: 123 Lê Lợi, Đà Nẵng" 
                            {...field} 
                            className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Vĩ độ */}
                  <FormField
                    control={form.control}
                    name="lat"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vĩ độ (Lat)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any"
                            {...field} 
                            className="h-11 bg-slate-50 border-slate-200 font-mono font-bold"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Kinh độ */}
                  <FormField
                    control={form.control}
                    name="lng"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kinh độ (Lng)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any"
                            {...field} 
                            className="h-11 bg-slate-50 border-slate-200 font-mono font-bold"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Mô tả */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mô tả (Không bắt buộc)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Mô tả sơ qua về bãi đỗ của bạn..." 
                          className="min-h-[100px] bg-slate-50 border-slate-200 resize-none font-medium"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Ảnh */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Upload className="w-3 h-3" /> Hình ảnh bãi đỗ
                  </label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {previews.map((preview, index) => (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          key={preview}
                          className="relative aspect-square rounded-xl overflow-hidden group shadow-md"
                        >
                          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1.5 right-1.5 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all">
                      <Plus className="w-6 h-6 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Thêm ảnh</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="font-bold">Hủy</Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="min-w-[150px] shadow-lg shadow-primary/25 rounded-xl font-bold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      "Gửi yêu cầu"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Right Side: Map */}
          <div className="flex-1 bg-slate-50 min-h-[400px] lg:min-h-full relative flex flex-col">
            <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-slate-100 z-10">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Vị trí thực tế</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Chọn vị trí trên bản đồ để tự động lấy tọa độ và địa chỉ.</p>
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
