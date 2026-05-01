import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export const HistoryCardSkeleton = () => (
  <Card className="overflow-hidden border-2 border-border/50 rounded-[32px] bg-card/50 mb-6 animate-pulse">
    <div className="p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <Skeleton className="h-10 w-3/4 mb-3" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
        <div className="flex flex-wrap lg:flex-nowrap gap-3">
          <Skeleton className="h-14 w-32 rounded-2xl" />
          <Skeleton className="h-14 w-32 rounded-2xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-6 bg-muted/30 p-6 rounded-[28px] border border-border/50">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-16 mb-3" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
        <div className="w-full sm:w-1/2">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-14 w-40 rounded-2xl" />
      </div>
    </div>
  </Card>
);

export const HistoryListSkeleton = ({ count = 3 }: { count?: number }) => (
  <motion.div
    key="skeleton-list"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="space-y-6"
  >
    {Array.from({ length: count }).map((_, i) => (
      <HistoryCardSkeleton key={i} />
    ))}
  </motion.div>
);
