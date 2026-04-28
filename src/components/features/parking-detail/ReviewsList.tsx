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

export function ReviewsList() {
  const [rate, setRate] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const context = useContext(ParkingContext);
  if (!context) return null;
  const { dataLot } = context;
  const lotId = dataLot.id;

  useEffect(() => {
    if (lotId) {
      setLoading(true);
      get(`/parking-lots/comment/${lotId}`)
        .then((res: any) => {
          setRate(res.data);
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
  rate.forEach((rate) => {
    total = total + rate.rating;
  })
  const averageRating = totalReview > 0 ? (total / totalReview).toFixed(1) : "0.0";

  return (
    <Card className="border-gray-100 dark:border-gray-800 shadow-sm font-sans">
      <CardHeader className="flex flex-row items-center justify-between pb-6 space-y-0">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Đánh giá từ khách hàng
        </CardTitle>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{averageRating}</span>
            <StarRating rating={Number(averageRating)} size={18} />
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Dựa trên {totalReview} đánh giá</span>
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
          ) : rate.length > 0 ? (
            rate?.slice(0, 3).map((r: any) => (
              <div key={r.id} className="group relative">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 border border-gray-100 dark:border-gray-800">
                    <AvatarImage src={r.user.profile.image} className="object-cover" />
                    <AvatarFallback className="font-bold text-xs">{r.user.profile.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{r.user.profile.name}</h4>
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

        {totalReview > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800 text-center">
            <Button variant="ghost" className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/10">
              Xem tất cả đánh giá
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
