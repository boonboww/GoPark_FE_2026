"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Upload, X, Loader2, Pencil, MessageSquare } from "lucide-react";
import { get, post, patch } from "@/lib/api";
import { toast } from "sonner";

interface ViewReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  lotName: string;
  onUpdated?: () => void;
}

const ViewReviewModal: React.FC<ViewReviewModalProps> = ({ isOpen, onClose, bookingId, lotName, onUpdated }) => {
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [keptImages, setKeptImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && bookingId) {
      setLoading(true);
      setIsEditing(false);
      get(`/reviews/booking/${bookingId}/review`)
        .then((res: any) => {
          // All BE responses are wrapped: { statusCode, message, data }
          const reviewData = res?.data ?? res;
          setReview(reviewData);
          if (reviewData) {
            setRating(reviewData.rating || 0);
            setComment(reviewData.comment || "");
            let imgs = reviewData.images || [];
            if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs); } catch { imgs = []; } }
            setKeptImages(Array.isArray(imgs) ? imgs : []);
          }
        })
        .catch(() => setReview(null))
        .finally(() => setLoading(false));
    }
  }, [isOpen, bookingId]);

  const handleNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const maxNew = 5 - keptImages.length - newFiles.length;
      const allowed = files.slice(0, maxNew);
      setNewFiles(prev => [...prev, ...allowed]);
      setNewPreviews(prev => [...prev, ...allowed.map(f => URL.createObjectURL(f))]);
    }
  };

  const removeKeptImage = (idx: number) => {
    setKeptImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeNewFile = (idx: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== idx));
    setNewPreviews(prev => {
      const arr = [...prev];
      URL.revokeObjectURL(arr[idx]);
      arr.splice(idx, 1);
      return arr;
    });
  };

  const handleSave = async () => {
    if (rating === 0) { toast.error("Vui lòng chọn số sao"); return; }
    if (!comment.trim()) { toast.error("Vui lòng nhập nội dung đánh giá"); return; }

    try {
      setSubmitting(true);

      // Step 1: Upload new images separately
      const newUrls: string[] = [];
      for (const file of newFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const res: any = await post("/reviews/upload", formData);
        const url = res?.data?.fileUrl ?? res?.fileUrl;
        if (url) newUrls.push(url);
      }

      // Step 2: PATCH review as JSON
      const allImages = [...keptImages, ...newUrls];
      await patch(`/reviews/${review.id}`, { rating, comment, images: allImages });

      toast.success("Cập nhật đánh giá thành công!");
      setIsEditing(false);
      const updatedRes: any = await get(`/reviews/booking/${bookingId}/review`);
      const updated = updatedRes?.data ?? updatedRes;
      setReview(updated);
      let imgs = updated?.images || [];
      if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs); } catch { imgs = []; } }
      setKeptImages(Array.isArray(imgs) ? imgs : []);
      setNewFiles([]);
      setNewPreviews([]);
      onUpdated?.();
    } catch {
      toast.error("Có lỗi xảy ra khi cập nhật đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  const allImages = [...keptImages, ...newPreviews];
  const totalImages = keptImages.length + newFiles.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] bg-card rounded-[32px] p-6 border-none shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-black text-center text-foreground tracking-tight">
            {isEditing ? "Chỉnh sửa đánh giá" : "Đánh giá của bạn"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mt-1 font-medium text-sm">
            <span className="font-bold text-foreground">{lotName}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : !review ? (
          <div className="text-center py-10 text-muted-foreground font-medium">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            Không tìm thấy đánh giá
          </div>
        ) : (
          <div className="flex flex-col gap-5 py-2">
            {/* Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-10 h-10 transition-all ${
                    (isEditing ? (hoverRating || rating) : rating) >= star
                      ? "fill-yellow-400 text-yellow-400 scale-110"
                      : "text-muted fill-transparent"
                  } ${isEditing ? "cursor-pointer hover:scale-110" : ""}`}
                  onMouseEnter={() => isEditing && setHoverRating(star)}
                  onMouseLeave={() => isEditing && setHoverRating(0)}
                  onClick={() => isEditing && setRating(star)}
                />
              ))}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Nội dung đánh giá</label>
              {isEditing ? (
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="resize-none h-28 rounded-2xl bg-muted/50"
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                />
              ) : (
                <p className="text-sm text-foreground/80 bg-muted/40 rounded-2xl px-4 py-3 leading-relaxed">{review.comment}</p>
              )}
            </div>

            {/* Images */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Hình ảnh {isEditing && `(${totalImages}/5)`}
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Kept images */}
                {keptImages.map((src, idx) => (
                  <div key={`kept-${idx}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {isEditing && (
                      <button onClick={() => removeKeptImage(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {/* New image previews (edit mode) */}
                {isEditing && newPreviews.map((src, idx) => (
                  <div key={`new-${idx}`} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-400 group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeNewFile(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {/* Add button in edit mode */}
                {isEditing && totalImages < 5 && (
                  <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 border-border transition-all">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">Thêm</span>
                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleNewFiles} />
                  </label>
                )}
                {!isEditing && keptImages.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Không có hình ảnh</p>
                )}
              </div>
            </div>

            {/* Owner reply */}
            {review.owner_reply && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
                <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Phản hồi từ chủ bãi</p>
                <p className="text-sm text-foreground/80">{review.owner_reply}</p>
              </div>
            )}

            {/* Timestamp */}
            {!isEditing && (
              <p className="text-xs text-muted-foreground text-center">
                Đã đánh giá lúc {new Date(review.created_at).toLocaleString("vi-VN")}
              </p>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 gap-3 sm:gap-0 sm:justify-between">
          {!loading && review && (
            <>
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => { setIsEditing(false); setRating(review.rating); setComment(review.comment); }} disabled={submitting} className="rounded-2xl h-12 px-6 font-bold">
                    Hủy
                  </Button>
                  <Button onClick={handleSave} disabled={submitting} className="rounded-2xl h-12 px-8 font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Lưu thay đổi
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={onClose} className="rounded-2xl h-12 px-6 font-bold">
                    Đóng
                  </Button>
                  <Button onClick={() => setIsEditing(true)} className="rounded-2xl h-12 px-8 font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    Chỉnh sửa
                  </Button>
                </>
              )}
            </>
          )}
          {!review && !loading && (
            <Button variant="outline" onClick={onClose} className="rounded-2xl h-12 px-6 font-bold w-full">Đóng</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewReviewModal;
