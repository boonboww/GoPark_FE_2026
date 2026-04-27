"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  X,
  PlayCircle,
  Layout,
  Flag,
  ChevronRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTourStore, TourType } from "@/store/tourStore";
import { useRouter, usePathname } from "next/navigation";

export function UserGuide() {
  const [showOptions, setShowOptions] = useState(false);
  const { startTour, isTourActive } = useTourStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleStartFullTour = () => {
    setShowOptions(false);
    
    const steps = [
      {
        targetId: "header-avatar-btn",
        title: "Tài khoản cá nhân",
        content: "Bấm vào ảnh đại diện để mở menu tài khoản.",
        placement: "bottom" as const
      },
      {
        targetId: "header-profile-link",
        title: "Trang cá nhân",
        content: "Chọn 'Thông tin cá nhân' để quản lý hồ sơ và phương tiện.",
        placement: "left" as const
      },
      {
        targetId: "profile-info-card",
        title: "Thông tin của bạn",
        content: "Đây là nơi bạn cập nhật tên, số điện thoại và quản lý số dư ví.",
        placement: "right" as const
      },
      {
        targetId: "add-vehicle-btn",
        title: "Đăng ký phương tiện",
        content: "Bạn cần đăng ký ít nhất một chiếc xe ô tô để có thể đặt chỗ đỗ.",
        placement: "top" as const
      },
      {
        targetId: "find-parking-nav-link",
        title: "Tìm bãi đỗ",
        content: "Sau khi đăng ký xe, hãy vào đây để tìm và đặt chỗ đỗ xe nhé!",
        placement: "bottom" as const
      }
    ];

    startTour("full", steps);
  };

  const handleStartBookingTour = () => {
    setShowOptions(false);

    const navigateAndStart = () => {
      const steps = [
        {
          targetId: "top-search-input",
          title: "Tìm kiếm",
          content: "Bạn có thể nhập địa chỉ bãi đỗ tại đây.",
          placement: "bottom" as const
        },
        {
          targetId: "near-me-btn",
          title: "Gần tôi",
          content: "Hoặc bấm vào đây để hệ thống tự động tìm bãi đỗ quanh vị trí của bạn.",
          placement: "bottom" as const
        },
        {
          targetId: "near-me-radius-select",
          title: "Phạm vi tìm kiếm",
          content: "Chọn bán kính (km) để mở rộng hoặc thu hẹp vùng tìm kiếm.",
          placement: "bottom" as const
        },
        {
          targetId: "[id^='parking-marker-']",
          title: "Chọn bãi đỗ",
          content: "Bấm vào một biểu tượng bãi đỗ trên bản đồ để xem nhanh thông tin.",
          placement: "top" as const
        },
        {
          targetId: "parking-detail-btn",
          title: "Xem chi tiết",
          content: "Bấm 'Chi tiết' để xem đầy đủ thông tin bãi đỗ. Hướng dẫn sẽ tiếp tục ở trang sau.",
          placement: "top" as const
        },
        {
          targetId: "detail-book-now-btn",
          title: "Đặt chỗ ngay",
          content: "Tại đây, bạn kiểm tra bảng giá và nhấn 'Đặt ngay' để hoàn tất quá trình giữ chỗ.",
          placement: "top" as const
        }
      ];
      startTour("booking", steps);
    };

    if (pathname !== "/users/findParking") {
      router.push("/users/findParking");
      setTimeout(navigateAndStart, 1000);
    } else {
      navigateAndStart();
    }
  };

  const handleStartPageTour = () => {
    setShowOptions(false);
    const steps = [
      {
        targetId: "home-nav-link",
        title: "Khám phá trang",
        content: "Bạn đang ở trang " + (pathname === "/" ? "Trang chủ" : pathname) + ". Tại đây bạn có thể sử dụng các tính năng chính của hệ thống.",
        placement: "bottom" as const
      }
    ];
    startTour("page", steps);
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 z-[10001]">
        <div className="relative flex flex-col items-end">
          <AnimatePresence>
            {showOptions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="mb-4 p-4 bg-white dark:bg-stone-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-stone-800 w-72"
              >
                <div className="flex justify-between items-center mb-4 px-2">
                  <h4 className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-tighter">Bạn cần giúp gì?</h4>
                  <button onClick={() => setShowOptions(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <OptionButton
                    icon={PlayCircle}
                    title="Quy trình đặt chỗ"
                    onClick={handleStartBookingTour}
                    color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  />
                  <OptionButton
                    icon={Layout}
                    title="Hướng dẫn trang này"
                    onClick={handleStartPageTour}
                    color="text-orange-600 bg-orange-50 dark:bg-orange-900/20"
                  />
                  <OptionButton
                    icon={Flag}
                    title="Toàn bộ quy trình"
                    onClick={handleStartFullTour}
                    color="text-green-600 bg-green-50 dark:bg-green-900/20"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-white dark:bg-stone-900 border border-gray-200 dark:border-stone-800 shadow-xl hover:shadow-green-500/20 transition-all duration-300"
          >
            <HelpCircle className={`w-5 h-5 ${showOptions ? 'text-green-600' : 'text-gray-500'}`} />
            <span className="font-black text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Hướng dẫn</span>
          </motion.button>
        </div>
      </div>
    </>
  );
}

const OptionButton = ({ icon: Icon, title, onClick, color }: { icon: any, title: string, onClick: () => void, color: string }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group"
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{title}</span>
    </div>
    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
  </button>
);
