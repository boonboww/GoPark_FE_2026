import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Upload, X, Loader2 } from "lucide-react";
import { post } from "@/lib/api";
import { toast } from "sonner";

interface RateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  lotName: string;
  onSuccess: () => void;
}

const RateBookingModal: React.FC<RateBookingModalProps> = ({ isOpen, onClose, bookingId, lotName, onSuccess }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const allowedFiles = newFiles.slice(0, 5 - selectedFiles.length); // Max 5 images
      
      setSelectedFiles((prev) => [...prev, ...allowedFiles]);
      
      // Generate previews
      const newPreviews = allowedFiles.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    if (!comment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Upload each image separately (like chat module pattern)
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const res: any = await post("/reviews/upload", formData);
        const url = res?.data?.fileUrl ?? res?.fileUrl;
        if (url) uploadedUrls.push(url);
      }

      // Step 2: Submit review as JSON with image URLs
      await post(`/reviews/booking/${bookingId}`, {
        rating,
        comment,
        images: uploadedUrls,
      });
      toast.success("Đánh giá thành công!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Có lỗi xảy ra khi đánh giá");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card rounded-[32px] p-6 border-none shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-black text-center text-foreground tracking-tight">
            Đánh giá bãi đỗ xe
          </DialogTitle>
          <p className="text-center text-muted-foreground mt-2 font-medium">
            Chia sẻ trải nghiệm của bạn tại <span className="font-bold text-foreground">{lotName}</span>
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-10 h-10 cursor-pointer transition-all ${
                  (hoverRating || rating) >= star
                    ? "fill-yellow-400 text-yellow-400 scale-110"
                    : "text-muted fill-transparent hover:scale-110"
                }`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              />
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              Nội dung đánh giá
            </label>
            <Textarea
              placeholder="Bạn cảm thấy bãi đỗ xe này thế nào?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none h-32 rounded-2xl bg-muted/50 border-border focus:ring-emerald-500/20"
            />
          </div>

          {/* Upload ảnh */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Thêm hình ảnh (tối đa 5 ảnh)</label>
            <div className="flex flex-wrap gap-2 mb-2">
               {previews.map((src, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                     <img src={src} alt="preview" className="w-full h-full object-cover" />
                     <button 
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                        <X className="w-3 h-3" />
                     </button>
                  </div>
               ))}
               {selectedFiles.length < 5 && (
                  <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 border-border transition-all">
                     <Upload className="w-6 h-6 text-muted-foreground" />
                     <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                  </label>
               )}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-3 sm:gap-0 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-2xl h-12 px-6 font-bold w-full sm:w-auto"
            disabled={loading}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSubmit}
            className="rounded-2xl h-12 px-8 font-bold w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            Gửi đánh giá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RateBookingModal;
