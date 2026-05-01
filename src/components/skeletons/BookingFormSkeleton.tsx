import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const BookingFormSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-200 dark:bg-gray-700"></div>
    
    {/* Title Skeleton */}
    <div className="flex items-center gap-2 mb-6">
      <Skeleton className="w-5 h-5 rounded-full animate-pulse" />
      <Skeleton className="h-7 w-40 animate-pulse" />
    </div>

    <div className="space-y-6">
      {/* Vehicle Selection Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-40 animate-pulse" />
        <Skeleton className="h-11 w-full rounded-lg animate-pulse" />
      </div>

      {/* Time Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20 animate-pulse" />
            <Skeleton className="h-14 w-full rounded-[20px] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Summary Skeleton */}
      <Skeleton className="h-32 w-full rounded-[24px] animate-pulse" />

      {/* Location Skeleton */}
      <Skeleton className="h-12 w-full rounded-lg animate-pulse" />

      {/* Payment Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-40 animate-pulse" />
        <Skeleton className="h-11 w-full rounded-lg animate-pulse" />
      </div>

      {/* Pricing Skeleton */}
      <div className="pt-5 border-t border-gray-100 dark:border-gray-700 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32 animate-pulse" />
          <Skeleton className="h-4 w-24 animate-pulse" />
        </div>
        <div className="flex justify-between items-end">
          <Skeleton className="h-6 w-32 animate-pulse" />
          <Skeleton className="h-10 w-40 animate-pulse" />
        </div>
        <Skeleton className="h-14 w-full rounded-lg animate-pulse mt-4" />
      </div>
    </div>
  </div>
);
