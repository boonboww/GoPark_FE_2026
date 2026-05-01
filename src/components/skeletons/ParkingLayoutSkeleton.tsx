import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ParkingLayoutSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-pulse">
      <Skeleton className="h-8 w-64 mb-6" />
      
      <div className="flex justify-center gap-6 mb-8">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="flex flex-col gap-10 items-center">
          {[1, 2].map((i) => (
            <div key={i} className="w-full space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-200"></div>
                <Skeleton className="h-8 w-20 rounded-full" />
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>
              <div className="flex justify-center gap-6">
                <Skeleton className="h-6 w-20" />
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="w-12 h-16 rounded-md" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
