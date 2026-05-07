import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: any;
  change?: string;
  changeType?: "positive" | "negative";
  description?: string;
  iconGradient: string;
  bgTint: string;
  borderColor: string;
}

export function AdminStatCard({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  description,
  iconGradient,
  bgTint,
  borderColor,
}: AdminStatCardProps) {
  return (
    <Card className={`bg-gradient-to-br ${bgTint} ${borderColor} border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${iconGradient} opacity-[0.04] rounded-full -translate-y-10 translate-x-10`} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 truncate">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground mb-2 truncate">
              {value}
            </p>
            {(change || description) && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {change && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                      changeType === "negative"
                        ? "text-red-700 bg-red-100 dark:bg-red-950/50 dark:text-red-400"
                        : "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400"
                    }`}
                  >
                    {change}
                  </span>
                )}
                {description && (
                  <span className="text-[11px] text-muted-foreground line-clamp-1">
                    {description}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-lg shadow-black/10 shrink-0`}>
            {Icon && <Icon className="w-5 h-5 text-white" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
