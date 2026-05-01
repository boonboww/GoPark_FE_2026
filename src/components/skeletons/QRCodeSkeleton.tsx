import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const VehicleListSkeleton = () => (
  <div className="space-y-6 w-full animate-pulse">
    <Skeleton className="h-4 w-40 rounded-full" />
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4 rounded-[24px] border-none bg-card/50">
          <div className="flex items-center gap-5">
            <Skeleton className="w-24 h-16 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export const QRCardSkeleton = () => (
  <div className="w-full space-y-6 animate-pulse">
    <Card className="rounded-[32px] border border-border/40 bg-card/50 overflow-hidden">
      <div className="p-6 flex flex-col items-center border-b border-dashed border-border">
        <Skeleton className="w-64 h-64 rounded-[2rem]" />
        <Skeleton className="h-4 w-48 mt-6 rounded-full" />
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-border flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </Card>
    <Skeleton className="h-20 w-full rounded-[28px]" />
  </div>
);

export const LiveTrackSkeleton = () => (
  <section className="space-y-4">
    <Card className="bg-primary/5 border-primary/10 rounded-[28px] overflow-hidden">
      <CardContent className="p-8">
        <Skeleton className="h-4 w-40 mb-6" />
        <div className="flex items-center gap-12">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="w-10 h-10 rounded-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  </section>
);
