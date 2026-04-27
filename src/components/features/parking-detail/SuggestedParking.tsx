"use client"

import React, { useContext, useEffect, useState } from "react";
import { Star, MapPin, Navigation, ArrowRight } from "lucide-react";
import { get } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ParkingContext } from "./ParkingContext";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="mt-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Các bãi đỗ xe gợi ý gần đây</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {loading ? (
           [1, 2, 3, 4].map((i) => (
             <div key={i} className="bg-white dark:bg-gray-900 rounded-[28px] p-3 shadow-sm border border-gray-300 dark:border-gray-600">
               <Skeleton className="aspect-[4/3] w-full rounded-[20px] mb-4" />
               <div className="px-1 space-y-3">
                 <Skeleton className="h-6 w-full" />
                 <Skeleton className="h-4 w-2/3" />
                 <Skeleton className="h-10 w-full rounded-[20px] mt-4" />
               </div>
             </div>
           ))
        ) : nearLots.map((lot: any) => (
          <div
            key={lot.id}
            className="group bg-white dark:bg-gray-900 rounded-[28px] p-3 shadow-sm border border-gray-300 dark:border-gray-600 hover:shadow-xl transition-all duration-300"
          >
            {/* Image Section with Overlays */}
            <div className="relative aspect-[4/3] w-full bg-gray-100 dark:bg-gray-800 rounded-[20px] overflow-hidden mb-4">
              <img
                src={lot.image?.thumbnail || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=800&auto=format&fit=crop"}
                alt={lot.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />

              {/* Rating Badge - Top Right */}
              <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                {Number(lot.avgRating).toFixed(1)}
              </div>

              {/* Distance Badge - Bottom Left */}
              <div
                style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '9999px', position: 'absolute', bottom: '12px', left: '12px', zIndex: 20, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #f3f4f6' }}
              >
                <Navigation style={{ width: '14px', height: '14px', fill: '#2563eb', color: '#2563eb', transform: 'rotate(45deg)' }} />
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                  Cách {lot.distance ? (lot.distance < 1 ? `${(lot.distance * 1000).toFixed(0)}m` : `${Number(lot.distance).toFixed(1)}km`) : "0.0km"}
                </span>
              </div>
            </div>

            {/* Content Section */}
            <div className="px-1 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl font-extrabold !text-gray-900 line-clamp-1 leading-tight flex-1">
                  {lot.name}
                </h3>
                <div className="flex items-center gap-1.5 bg-emerald-50 !text-emerald-600 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Còn chỗ
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-5 h-5 !text-gray-600 shrink-0" />
                <span className="text-sm font-medium line-clamp-1 !text-gray-600">{lot.address || "Chưa có địa chỉ"}</span>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => router.push(`/users/detailParking/${lot.id}`)}
                style={{ backgroundColor: '#003580', color: 'white' }}
                className="w-full py-3.5 cursor-pointer rounded-[20px] font-bold flex items-center justify-center gap-2 mt-4 transition-all hover:opacity-90 active:scale-95 shadow-lg"
              >
                Chi tiết <ArrowRight style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
