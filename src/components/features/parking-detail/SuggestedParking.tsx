"use client"

import React, { useContext, useEffect, useState } from "react";
import { Star, MapPin, Navigation, ArrowRight } from "lucide-react";
import { get } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ParkingContext } from "./ParkingContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SuggestedParking() {
  const [nearLots, setNearLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const param = useParams();
  const router = useRouter();
  const nearbyParkingLot = param.id;

  const context = useContext(ParkingContext);
  if (!context) return null
  const { dataLot } = context;

  useEffect(() => {
    if (nearbyParkingLot && dataLot?.lat && dataLot?.lng) {
      setLoading(true);
      const { lat, lng } = dataLot;
      get(`/parking-lots/nearby/${nearbyParkingLot}?lat=${lat}&lng=${lng}`)
        .then((res: any) => {
          setNearLots(res.data);
        }).catch((error: any) => {
          console.log(error);
        })
        .finally(() => setLoading(false));
    }
  }, [nearbyParkingLot, dataLot])

  return (
    <div className="mt-16 pb-12 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Các bãi đỗ gợi ý gần đây</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dựa trên vị trí hiện tại của bạn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
           [1, 2, 3, 4].map((i) => (
             <Card key={i} className="border-gray-100 dark:border-gray-800 shadow-sm rounded-3xl overflow-hidden">
               <CardContent className="p-3">
                 <Skeleton className="aspect-[4/3] w-full rounded-2xl mb-4" />
                 <div className="space-y-3 px-1">
                   <Skeleton className="h-6 w-full" />
                   <Skeleton className="h-4 w-2/3" />
                   <Skeleton className="h-9 w-full rounded-xl mt-2" />
                 </div>
               </CardContent>
             </Card>
           ))
        ) : nearLots.length > 0 ? (
          nearLots.map((lot: any) => (
          <Card
            key={lot.id}
            className="group border-gray-100 dark:border-gray-800 bg-white dark:bg-stone-900/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <CardContent className="p-3">
              {/* Image Section */}
              <div className="relative aspect-[4/3] w-full bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden mb-4">
                <img
                  src={lot.image?.thumbnail || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=800&auto=format&fit=crop"}
                  alt={lot.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Rating Badge */}
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 dark:text-white flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  {Number(lot.avgRating || 0).toFixed(1)}
                </div>

                {/* Distance Badge */}
                <Badge variant="secondary" className="absolute bottom-3 left-3 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-none text-[10px] font-bold h-7 px-2.5 rounded-lg shadow-sm gap-1.5 text-gray-700 dark:text-gray-200">
                  <Navigation className="w-3 h-3 text-blue-600 fill-blue-600 rotate-45" />
                  {lot.distance ? (lot.distance < 1 ? `${(lot.distance * 1000).toFixed(0)}m` : `${Number(lot.distance).toFixed(1)}km`) : "0.0km"}
                </Badge>
              </div>

              {/* Content Section */}
              <div className="px-1 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1 leading-tight flex-1">
                    {lot.name}
                  </h3>
                  <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full text-[9px] font-bold whitespace-nowrap">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Sẵn sàng
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="text-xs font-medium line-clamp-1">{lot.address || "Chưa có địa chỉ"}</span>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => router.push(`/users/detailParking/${lot.id}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 mt-2 text-xs gap-2 group/btn shadow-md shadow-blue-600/10"
                >
                  Xem chi tiết
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
        ) : (
          <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-stone-900/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 font-medium">Không tìm thấy bãi đỗ nào lân cận</p>
          </div>
        )}
      </div>
    </div>
  );
}
