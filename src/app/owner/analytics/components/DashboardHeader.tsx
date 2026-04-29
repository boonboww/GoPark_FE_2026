import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DateRange } from "react-day-picker";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface DashboardHeaderProps {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  onExport: () => void;
}

export function DashboardHeader({
  dateRange,
  setDateRange,
  onExport,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Thống kê</h1>
        <p className="text-muted-foreground mt-1">
          Theo dõi hiệu suất và doanh thu bãi đỗ xe của bạn.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Date Range Picker */}
        <DatePickerWithRange
          date={dateRange}
          setDate={setDateRange}
          className="w-full sm:w-auto sm:min-w-[260px]"
        />

        <Button 
          variant="outline" 
          className="gap-2 border-primary/20 hover:bg-primary/5"
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>
    </div>
  );
}
