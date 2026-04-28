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
        content: "Bấm vào nút này để mở khung đăng ký xe ô tô của bạn. (Vui lòng bấm để bước sau hiện ra trên khung)",
        placement: "left" as const
      },
      {
        targetId: "vehicle-ocr-btn",
        title: "Quét giấy tờ xe",
        content: "Bạn có thể tải ảnh giấy đăng ký xe lên, hệ thống sẽ tự động nhận diện thông tin giúp bạn.",
        placement: "bottom" as const
      },
      {
        targetId: "plate",
        title: "Biển số xe",
        content: "Nhập biển số xe của bạn (ví dụ: 30F-123.45). Đây là thông tin bắt buộc.",
        placement: "top" as const
      },
      {
        targetId: "vehicle-type-select",
        title: "Loại phương tiện",
        content: "Chọn loại xe tương ứng để hệ thống áp dụng bảng giá chính xác khi đặt chỗ.",
        placement: "top" as const
      },
      {
        targetId: "vehicle-save-btn",
        title: "Hoàn tất đăng ký",
        content: "Sau khi điền đủ thông tin, nhấn Lưu để hoàn tất quá trình đăng ký xe.",
        placement: "top" as const
      },
      {
        targetId: "header-logo-link",
        title: "Về trang chủ",
        content: "Bây giờ bạn đã có xe, hãy quay lại trang chủ để bắt đầu trải nghiệm nhé!",
        placement: "bottom" as const
      },
      {
        targetId: "find-parking-nav-link",
        title: "Tìm bãi đỗ xe",
        content: "Bấm vào đây để đến trang bản đồ và bắt đầu tìm kiếm bãi đỗ xe phù hợp nhất!",
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
    let steps: any[] = [];

    if (pathname === "/") {
      steps = [
        {
          targetId: "home-nav-link",
          title: "Trang chủ",
          content: "Quay lại màn hình chính bất cứ lúc nào để xem các bãi đỗ mới nhất.",
          placement: "bottom"
        },
        {
          targetId: "find-parking-nav-link",
          title: "Tìm bãi đỗ",
          content: "Công cụ tìm kiếm mạnh mẽ giúp bạn tìm chỗ đỗ xe theo địa chỉ hoặc quanh vị trí hiện tại.",
          placement: "bottom"
        },
        {
          targetId: "header-promotions-link",
          title: "Ưu đãi hấp dẫn",
          content: "Đừng bỏ lỡ các mã giảm giá và chương trình khuyến mãi đặc biệt từ GoPark.",
          placement: "bottom"
        },
        {
          targetId: "header-history-link",
          title: "Lịch sử đặt chỗ",
          content: "Xem lại các giao dịch, trạng thái đặt chỗ và vé QR của bạn tại đây.",
          placement: "bottom"
        },
        {
          targetId: "header-notification-btn",
          title: "Trung tâm thông báo",
          content: "Cập nhật nhanh nhất các thông báo về trạng thái đơn hàng và hệ thống.",
          placement: "bottom"
        },
        {
          targetId: "header-avatar-btn",
          title: "Quản lý tài khoản",
          content: "Truy cập hồ sơ cá nhân, nạp tiền vào ví và cài đặt tài khoản của bạn.",
          placement: "bottom"
        },
        {
          targetId: "header-profile-link",
          title: "Thông tin cá nhân",
          content: "Cập nhật thông tin cá nhân, số điện thoại và ảnh đại diện của bạn.",
          placement: "left"
        },
        {
          targetId: "header-wallet-link",
          title: "Ví điện tử GoPark",
          content: "Quản lý số dư, nạp tiền và kiểm tra lịch sử giao dịch thanh toán.",
          placement: "left"
        },
        {
          targetId: "header-chat-link",
          title: "Trò chuyện trực tuyến",
          content: "Liên hệ trực tiếp với chủ bãi đỗ xe để được hỗ trợ nhanh nhất.",
          placement: "left"
        },
        {
          targetId: "header-report-link",
          title: "Báo cáo & Khiếu nại",
          content: "Gửi phản hồi hoặc báo cáo các vấn đề gặp phải trong quá trình sử dụng dịch vụ.",
          placement: "left"
        },
        {
          targetId: "nearby-tab-btn",
          title: "Bãi đỗ gần đây",
          content: "Khám phá nhanh các bãi đỗ xe quanh vị trí của bạn ngay trên trang chủ.",
          placement: "bottom"
        },
        {
          targetId: "hero-booking-btn",
          title: "Đặt nhanh ngay",
          content: "Bạn có thể nhấn đặt chỗ ngay từ màn hình chính để tiết kiệm thời gian.",
          placement: "right"
        }
      ];
    } else if (pathname === "/users/findParking") {
      steps = [
        {
          targetId: "top-search-input",
          title: "Tìm kiếm thông minh",
          content: "Nhập tên bãi đỗ hoặc địa chỉ để tìm kiếm vị trí đỗ xe mong muốn.",
          placement: "bottom"
        },
        {
          targetId: "near-me-btn",
          title: "Định vị bãi đỗ",
          content: "Hệ thống sẽ gợi ý các bãi đỗ trong bán kính bạn chọn.",
          placement: "bottom"
        },
        {
          targetId: "parking-list-sidebar",
          title: "Danh sách kết quả",
          content: "Tất cả các bãi đỗ xe phù hợp sẽ được liệt kê chi tiết tại đây.",
          placement: "right"
        },
        {
          targetId: "get-directions-btn",
          title: "Chỉ đường thông minh",
          content: "Bấm vào đây để hệ thống tính toán lộ trình từ vị trí của bạn đến bãi đỗ.",
          placement: "right"
        },
        {
          targetId: "[id^='parking-marker-']",
          title: "Bản đồ trực quan",
          content: "Bạn cũng có thể chọn bãi đỗ trực tiếp bằng cách nhấn vào các biểu tượng trên bản đồ.",
          placement: "left"
        },
        {
          targetId: "parking-book-now-btn",
          title: "Sẵn sàng đặt chỗ",
          content: "Sau khi đã tìm được vị trí ưng ý, hãy nhấn 'Đặt ngay' để giữ chỗ cho phương tiện của mình.",
          placement: "top"
        }
      ];
    } else if (pathname === "/users/profile") {
      steps = [
        {
          targetId: "profile-info-card",
          title: "Thông tin cá nhân",
          content: "Đây là nơi hiển thị các thông tin cơ bản như Họ tên, Email và Số điện thoại của bạn.",
          placement: "right"
        },
        {
          targetId: "profile-edit-btn",
          title: "Chỉnh sửa hồ sơ",
          content: "Nhấn vào biểu tượng này để cập nhật thông tin cá nhân hoặc thay đổi ảnh đại diện.",
          placement: "left"
        },
        {
          targetId: "profile-wallet-card",
          title: "Ví của tôi",
          content: "Theo dõi số dư khả dụng của bạn để thực hiện thanh toán đặt chỗ nhanh chóng.",
          placement: "right"
        },
        {
          targetId: "wallet-deposit-btn",
          title: "Nạp tiền vào ví",
          content: "Bạn có thể nạp thêm tiền vào ví thông qua các cổng thanh toán tích hợp.",
          placement: "bottom"
        },
        {
          targetId: "vehicle-list-card",
          title: "Quản lý phương tiện",
          content: "Danh sách các xe ô tô bạn đã đăng ký sẽ được hiển thị và quản lý tại đây.",
          placement: "left"
        },
        {
          targetId: "add-vehicle-btn",
          title: "Thêm xe mới",
          content: "Bấm vào đây để mở khung đăng ký phương tiện mới.",
          placement: "left"
        },
        {
          targetId: "vehicle-ocr-btn",
          title: "Quét thông tin tự động",
          content: "Tải lên ảnh giấy đăng ký xe để hệ thống tự động điền các thông tin cần thiết.",
          placement: "bottom"
        },
        {
          targetId: "plate",
          title: "Biển số xe",
          content: "Đảm bảo biển số xe được nhập chính xác để có thể ra/vào bãi đỗ.",
          placement: "top"
        },
        {
          targetId: "vehicle-save-btn",
          title: "Lưu phương tiện",
          content: "Cuối cùng, nhấn Lưu để ghi nhận xe vào hệ thống của bạn.",
          placement: "top"
        }
      ];
    } else if (pathname === "/users/setting") {
      steps = [
        {
          targetId: "setting-tabs-list",
          title: "Trung tâm cài đặt",
          content: "Tất cả các tùy chỉnh về tài khoản, ứng dụng và bảo mật đều tập trung tại đây.",
          placement: "bottom"
        },
        {
          targetId: "setting-app-tab",
          title: "Cấu hình ứng dụng",
          content: "Hãy chuyển sang tab này để cài đặt các tính năng hệ thống như Vị trí và Thông báo.",
          placement: "bottom"
        },
        {
          targetId: "setting-location-switch",
          title: "Dịch vụ vị trí",
          content: "Bật định vị để hệ thống tự động tìm bãi đỗ xe gần bạn nhất một cách chính xác.",
          placement: "left"
        },
        {
          targetId: "setting-notif-switch",
          title: "Thông báo đẩy",
          content: "Đừng bỏ lỡ các thông báo quan trọng về lịch đặt chỗ và các chương trình ưu đãi.",
          placement: "left"
        },
        {
          targetId: "setting-theme-switch",
          title: "Chế độ hiển thị",
          content: "Bạn có thể chuyển đổi giữa giao diện Sáng và Tối tùy theo sở thích cá nhân.",
          placement: "left"
        }
      ];
    } else if (pathname?.startsWith("/users/detailParking/")) {
      steps = [
        {
          targetId: "parking-gallery-main",
          title: "Hình ảnh bãi đỗ",
          content: "Xem hình ảnh thực tế của bãi đỗ xe tại đây.",
          placement: "bottom"
        },
        {
          targetId: "parking-amenities-section",
          title: "Tiện ích & Dịch vụ",
          content: "Kiểm tra các dịch vụ đi kèm như camera, mái che, cứu hộ...",
          placement: "top"
        },
        {
          targetId: "parking-price-selector",
          title: "Bảng giá chi tiết",
          content: "Chọn loại phương tiện để xem mức giá áp dụng chính xác.",
          placement: "left"
        },
        {
          targetId: "detail-book-now-btn",
          title: "Tiến hành đặt chỗ",
          content: "Nhấn nút này để bắt đầu quy trình đặt chỗ đỗ xe.",
          placement: "top"
        }
      ];
    } else {
      steps = [
        {
          targetId: "home-nav-link",
          title: "Khám phá trang",
          content: "Chào mừng bạn đến với " + (pathname === "/" ? "Trang chủ" : pathname) + ". Hãy khám phá các tính năng tại đây.",
          placement: "bottom"
        }
      ];
    }

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
