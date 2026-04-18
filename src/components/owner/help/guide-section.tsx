"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  IconRocket, 
  IconParkingCircle, 
  IconSettings, 
  IconChartBar 
} from "@tabler/icons-react";

const guides = [
  {
    title: "Bắt đầu nhanh",
    description: "Tìm hiểu các bước cơ bản để thiết lập bãi đỗ xe của bạn trong vòng 5 phút.",
    icon: IconRocket,
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    title: "Quản lý bãi đỗ",
    description: "Hướng dẫn chi tiết cách quản lý chỗ trống, kiểm tra xe và vận hành hàng ngày.",
    icon: IconParkingCircle,
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    title: "Thiết lập giá vé",
    description: "Cách cấu hình giá vé linh hoạt theo thời gian, ngày lễ và các gói ưu đãi.",
    icon: IconSettings,
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    title: "Hướng dẫn phân tích",
    description: "Hiểu sâu hơn về các chỉ số kinh doanh và tối ưu hóa doanh thu từ báo cáo.",
    icon: IconChartBar,
    color: "bg-rose-500/10 text-rose-600",
  },
];

export function GuideSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
      {guides.map((guide, index) => (
        <Card key={index} className="group hover:border-primary/50 transition-all cursor-pointer shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className={`p-3 rounded-xl ${guide.color}`}>
              <guide.icon size={24} />
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {guide.title}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm leading-relaxed">
              {guide.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
