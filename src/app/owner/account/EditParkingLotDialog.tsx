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
import { X, ImagePlus, Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Tên bãi đỗ xe không được để trống"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditParkingLotDialogProps {
  parkingLot: ParkingLotType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Cập nhật form values khi parkingLot thay đổi
  React.useEffect(() => {
    if (parkingLot && open) {
      form.reset({
        name: parkingLot.name || "",
        description: parkingLot.description || "",
      });
      setSelectedFiles([]);
      // Clear old previews
      previews.forEach(p => URL.revokeObjectURL(p));
      setPreviews([]);
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
    // Reset input value to allow selecting same file again
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

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      parkingService.updateParkingLot(parkingLot!.id, {
        ...values,
        images: selectedFiles,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parkingLots", ownerId] });
      toast.success("Cập nhật bãi đỗ xe thành công");
      onOpenChange(false);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <DialogContent className="sm:max-w-[600px] border-border bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Chỉnh sửa bãi đỗ xe
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Cập nhật thông tin và tải lên các hình ảnh mới cho bãi đỗ xe.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-foreground">
                      Tên bãi đỗ xe
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: Bãi đỗ xe trung tâm"
                        className="bg-background border-border focus:ring-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel className="font-semibold text-foreground block">
                  Hình ảnh bãi đỗ xe
                </FormLabel>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {/* Hiển thị ảnh đang chọn để tải lên */}
                  {previews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-border group animate-in fade-in zoom-in duration-200">
                      <img 
                        src={preview} 
                        alt={`Preview ${index}`} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1.5 right-1.5 bg-destructive text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-muted/50 transition-all text-muted-foreground hover:text-primary gap-2 group"
                  >
                    <div className="bg-muted group-hover:bg-primary/10 p-2 rounded-full transition-colors">
                      <ImagePlus className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-medium">Thêm ảnh</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <p className="text-[12px] text-muted-foreground italic">
                  * Bạn có thể chọn nhiều ảnh từ máy tính để cập nhật.
                </p>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-foreground">
                      Mô tả chi tiết
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nhập mô tả về bãi đỗ xe của bạn..."
                        className="resize-none bg-background border-border focus:ring-primary min-h-[140px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-6 border-t border-border flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
                className="border-border hover:bg-muted text-foreground"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px] shadow-sm"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
