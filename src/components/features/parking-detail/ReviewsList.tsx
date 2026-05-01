"use client"

import React, { useContext, useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { ParkingContext } from "./ParkingContext";
import { get } from "@/lib/api";
import { StarRating } from "./StarRating";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores";
import { Textarea } from "@/components/ui/textarea";
import { post } from "@/lib/api";
import { toast } from "sonner";

export function ReviewsList() {
  const [rate, setRate] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Thêm state cho bộ lọc
  const [filterStar, setFilterStar] = useState<number | null>(null);
  const [filterImage, setFilterImage] = useState<boolean>(false);

  const context = useContext(ParkingContext);
  if (!context) return null;
  const { dataLot } = context;
  const lotId = dataLot?.id;
  const { user } = useAuthStore();
  const isOwner = user?.role === 'OWNER' && dataLot?.owner?.id === user?.id;

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (lotId) {
      setLoading(true);
      console.log(`[ReviewsList] Fetching reviews for lotId: ${lotId}`);
      get(`/reviews/parking-lot/${lotId}`)
        .then((res: any) => {
          console.log(`[ReviewsList] API Response for lot ${lotId}:`, res);
          // Extract data array from verschiedene possible response formats
          let data: any[] = [];
          if (Array.isArray(res)) {
            data = res;
          } else if (res && Array.isArray(res.data)) {
            data = res.data;
          } else if (res && res.result && Array.isArray(res.result)) {
            data = res.result;
          }
          
          console.log(`[ReviewsList] Extracted ${data.length} reviews`);
          
          // Normalize images field: could be null, a real array, or a JSON string
          const normalized = data.map((r) => {
            let imgs = r.images;
            if (!imgs) {
              imgs = [];
            } else if (typeof imgs === 'string') {
              try { imgs = JSON.parse(imgs); } catch { imgs = []; }
            }
            if (!Array.isArray(imgs)) imgs = [];
            return { ...r, images: imgs };
          });
          setRate(normalized);
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => setLoading(false));
    }
  }, [lotId])

  function ConvertDay(time: string) {
    return new Date(time).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour12: false
    })
  }

  const totalReview = rate.length;
  let total = 0;
  rate.forEach((r) => {
    total = total + r.rating;
  })
  const averageRating = totalReview > 0 ? (total / totalReview).toFixed(1) : "0.0";

  const handleReplySubmit = async (reviewId: number) => {
    if (!replyContent.trim()) {
      toast.error("Vui lòng nhập nội dung trả lời");
      return;
    }

    try {
      setSubmittingReply(true);
      await post(`/reviews/${reviewId}/reply`, { reply: replyContent });
      toast.success("Trả lời thành công!");
      
      // Update local state
      setRate(rate.map(r => 
        r.id === reviewId ? { ...r, owner_reply: replyContent, owner_reply_at: new Date().toISOString() } : r
      ));
      
      setReplyingTo(null);
      setReplyContent("");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi trả lời đánh giá");
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredRates = rate.filter((r) => {
    if (filterStar !== null && r.rating !== filterStar) return false;
    if (filterImage && (!r.images || r.images.length === 0)) return false;
    return true;
  });

  return (
    <Card className="border-gray-100 dark:border-gray-800 shadow-sm font-sans">
      <CardHeader className="flex flex-col gap-6 pb-6 border-b border-border/50 space-y-0">
        <div className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-1 min-w-0">
            <MessageSquare className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="truncate">Đánh giá từ khách hàng</span>
          </CardTitle>
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{averageRating}</span>
              <StarRating rating={Number(averageRating)} size={18} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Dựa trên {totalReview} đánh giá</span>
          </div>
        </div>

        {/* Bộ lọc đánh giá */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filterStar === null && !filterImage ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilterStar(null); setFilterImage(false); }}
            className={`rounded-full text-xs h-8 ${filterStar === null && !filterImage ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}
          >
            Tất cả
          </Button>
          {[5, 4, 3, 2, 1].map(star => (
            <Button
              key={star}
              variant={filterStar === star ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStar(star)}
              className={`rounded-full flex items-center gap-1.5 text-xs h-8 ${filterStar === star ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}
            >
              {star} <Star className={`w-3.5 h-3.5 ${filterStar === star ? "fill-white text-white" : "fill-yellow-500 text-yellow-500"}`} />
            </Button>
          ))}
          <Button
            variant={filterImage ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterImage(!filterImage)}
            className={`rounded-full text-xs h-8 ${filterImage ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}
          >
            Có hình ảnh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-8">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))
          ) : filteredRates.length > 0 ? (
            filteredRates.map((r: any) => (
              <div key={r.id} className="group relative">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 border border-gray-100 dark:border-gray-800">
                    <AvatarImage src={r.user?.avatar_url || ""} className="object-cover" />
                    <AvatarFallback className="font-bold text-xs">{r.user?.first_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                        {r.user?.first_name} {r.user?.last_name}
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{ConvertDay(r.created_at)}</span>
                    </div>
                    <div className="flex text-yellow-500 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < Number(r.rating) ? "fill-current" : "text-gray-200 dark:text-gray-700"}`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed pt-1">
                      {r.comment}
                    </p>

                    {/* Hiển thị hình ảnh nếu có */}
                    {r.images && r.images.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {r.images.map((img: string, idx: number) => (
                          <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                            <img src={img} alt="review image" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hiển thị câu trả lời của chủ bãi */}
                    {r.owner_reply && (
                      <div className="mt-3 bg-muted/50 p-4 rounded-2xl border border-border/50 relative">
                        <div className="absolute top-0 left-6 w-3 h-3 bg-muted/50 border-t border-l border-border/50 rotate-45 -translate-y-1/2"></div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-emerald-600 text-xs">Phản hồi từ chủ bãi</span>
                          <span className="text-[10px] text-muted-foreground">{ConvertDay(r.owner_reply_at)}</span>
                        </div>
                        <p className="text-sm text-foreground/80">{r.owner_reply}</p>
                      </div>
                    )}

                    {/* Nút trả lời cho owner */}
                    {isOwner && !r.owner_reply && replyingTo !== r.id && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 text-xs h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => {
                          setReplyingTo(r.id);
                          setReplyContent("");
                        }}
                      >
                        Trả lời
                      </Button>
                    )}

                    {/* Form trả lời */}
                    {replyingTo === r.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea 
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Nhập phản hồi của bạn..."
                          className="min-h-20 text-sm bg-background border-border focus:ring-emerald-500/20"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 text-xs rounded-lg"
                            onClick={() => setReplyingTo(null)}
                            disabled={submittingReply}
                          >
                            Hủy
                          </Button>
                          <Button 
                            size="sm"
                            className="h-8 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleReplySubmit(r.id)}
                            disabled={submittingReply}
                          >
                            Gửi phản hồi
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
               <MessageSquare className="w-10 h-10 text-gray-200 dark:text-gray-800 mx-auto mb-3" />
               <p className="text-sm text-gray-400 font-medium">Chưa có đánh giá nào cho bãi đỗ này.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
