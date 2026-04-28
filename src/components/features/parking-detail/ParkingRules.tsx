import React from "react";
import { AlertCircle, ShieldCheck, Clock3, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ParkingRules() {
  return (
    <Card className="border-gray-100 dark:border-gray-800 shadow-sm font-sans">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          Quy định & Chính sách
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Clock3 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-gray-900 dark:text-gray-100">Thời gian giữ chỗ</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Hệ thống sẽ giữ chỗ của bạn trong <span className="font-bold text-gray-900 dark:text-gray-200">30 phút</span> kể từ giờ vào dự kiến. Quá thời gian này, vé có thể bị tự động hủy.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Ban className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-gray-900 dark:text-gray-100">Chính sách hủy vé</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Được phép hủy vé miễn phí trước <span className="font-bold text-gray-900 dark:text-gray-200">1 giờ</span> so với giờ vào dự kiến.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-gray-900 dark:text-gray-100">Lưu ý an toàn</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Không để các vật dụng có giá trị cao hoặc chất dễ cháy nổ trên xe. Bãi đỗ không chịu trách nhiệm cho tài sản cá nhân trong xe.
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
          <p className="text-xs text-blue-700 dark:text-blue-300 text-center font-bold">
            Hotline hỗ trợ khẩn cấp: 1900 1234
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
