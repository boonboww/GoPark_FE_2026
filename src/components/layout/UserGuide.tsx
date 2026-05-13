"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  HelpCircle,
  X,
  PlayCircle,
  Layout,
  Flag,
  ChevronRight,
  Info,
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTourStore, TourType } from "@/store/tourStore";
import { useRouter, usePathname } from "next/navigation";

export function UserGuide() {
  const [showOptions, setShowOptions] = useState(false);
  const pathname = usePathname();
  const { startTour, isTourActive, stopTour, tourType, steps, currentStep } = useTourStore();
  const router = useRouter();

  // Tự động dừng tour nếu là 'page tour' và chuyển sang trang khác
  React.useEffect(() => {
    if (isTourActive && tourType === "page") {
      stopTour();
    }
  }, [pathname]);

  // Xử lý chuyển trang tự động cho 'Toàn bộ quy trình' (Full Tour)
  React.useEffect(() => {
    if (isTourActive && tourType === "full") {
      // Khi đến bước 3 (index 2) là bắt đầu giới thiệu trong trang Profile
      if (currentStep === 2 && pathname !== "/users/profile") {
        router.push("/users/profile");
      }
      // Khi đến bước 9 (index 8) là quay về trang chủ để giới thiệu các menu khác
      if (currentStep === 8 && pathname !== "/") {
        router.push("/");
      }
    }

    if (isTourActive && tourType === "booking") {
      // Khi đến bước cuối cùng (Xem vé QR), tự động chuyển sang trang Vé-QR
      const isLastStep = currentStep === steps.length - 1;
      if (isLastStep && steps[currentStep]?.targetId === "header-qr-link" && pathname !== "/users/Ve-QR") {
        router.push("/users/Ve-QR");
      }
    }
  }, [currentStep, isTourActive, tourType, pathname, steps]);

  const handleStartFullTour = () => {
    setShowOptions(false);
    
    const steps = [
      {
        targetId: "header-avatar-btn",
        title: "Tài khoản cá nhân",
        content: "Bấm nút Tiếp theo để mở menu tài khoản.",
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
        content: "Bấm nút Tiếp theo để mở khung đăng ký xe và xem bước hướng dẫn mới.",
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
        targetId: "find-parking-nav-link",
        title: "Tìm bãi đỗ xe",
        content: "Bây giờ bạn đã có xe, hãy bấm vào đây để đến trang bản đồ và bắt đầu tìm kiếm bãi đỗ xe phù hợp nhất!",
        placement: "bottom" as const
      }
    ];

    startTour("full", steps);
  };

  const handleStartBookingTour = () => {
    setShowOptions(false);
    
    // Nếu đã ở trang tìm kiếm thì bắt đầu từ bước tìm kiếm luôn, bỏ qua bước click nav
    const isFindParkingPage = pathname === "/users/findParking";
    
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
        content: "HÃY CLICK VÀO NÚT NÀY để hệ thống tự động tìm bãi đỗ quanh vị trí của bạn trước khi tiếp tục.",
        placement: "bottom" as const
      },
      {
        targetId: "near-me-radius-select",
        title: "Phạm vi tìm kiếm",
        content: "HÃY CHỌN BÁN KÍNH (KM) tại đây để mở rộng hoặc thu hẹp vùng tìm kiếm.",
        placement: "bottom" as const
      },
      {
        targetId: "[id^='parking-card-']",
        title: "Danh sách bãi đỗ",
        content: "Bãi đỗ bạn chọn sẽ được làm nổi bật trong danh sách bên trái để bạn dễ dàng theo dõi.",
        placement: "right" as const
      },
      {
        targetId: "[id^='parking-marker-']",
        title: "Chọn bãi đỗ",
        content: "HÃY CLICK VÀO BIỂU TƯỢNG BÃI ĐỖ trên bản đồ để xem thông tin.",
        placement: "top" as const
      },
      {
        targetId: "parking-detail-btn",
        title: "Xem chi tiết",
        content: "Bấm 'Chi tiết' để xem đầy đủ thông tin bãi đỗ. Hướng dẫn sẽ tiếp tục ở trang sau.",
        placement: "top" as const
      },
      {
        targetId: "parking-gallery-main",
        title: "Hình ảnh bãi đỗ",
        content: "Bạn có thể xem hình ảnh thực tế của bãi đỗ tại đây.",
        placement: "bottom" as const
      },
      {
        targetId: "parking-price-selector",
        title: "Bảng giá",
        content: "Xem giá theo từng khu vực và tầng khác nhau.",
        placement: "top" as const
      },
      {
        targetId: "detail-book-now-btn",
        title: "Đặt chỗ ngay",
        content: "Tại đây, bạn kiểm tra bảng giá và nhấn 'Đặt ngay' để sang trang chọn vị trí cụ thể.",
        placement: "top" as const
      },
      {
        targetId: "parking-layout-container",
        title: "Sơ đồ bãi đỗ",
        content: "Chọn một vị trí (Slot) còn trống (màu trắng) trên sơ đồ để đặt.",
        placement: "top" as const
      },
      {
        targetId: "booking-vehicle-select",
        title: "Chọn phương tiện",
        content: "Chọn xe ô tô bạn sẽ sử dụng. Đảm bảo biển số xe chính xác để hệ thống nhận diện AI thuận tiện.",
        placement: "left" as const
      },
      {
        targetId: "booking-time-select",
        title: "Thời gian đặt chỗ",
        content: "Tùy chỉnh thời gian vào và ra mong muốn. Hệ thống sẽ tự động tính toán giá tiền dựa trên khung giờ này.",
        placement: "left" as const
      },
      {
        targetId: "booking-payment-method",
        title: "Thanh toán",
        content: "Lựa chọn phương thức thanh toán phù hợp (Ví GoPark hoặc VNPAY).",
        placement: "left" as const
      },
      {
        targetId: "booking-total-price",
        title: "Tổng tiền tạm tính",
        content: "Kiểm tra lại đơn giá và tổng số tiền trước khi xác nhận.",
        placement: "top" as const
      },
      {
        targetId: "summit-booking-btn",
        title: "Xác nhận đặt chỗ",
        content: "Cuối cùng, nhấn 'Xác nhận' để hoàn tất quy trình giữ chỗ.",
        placement: "top" as const
      },
      {
        targetId: "header-qr-link",
        title: "Xem vé QR",
        content: "Chúc mừng! Bạn đã đặt chỗ thành công. Hãy bấm vào đây để xem mã QR của bạn bất cứ lúc nào.",
        placement: "bottom" as const
      }
    ];

    if (!isFindParkingPage) {
      steps.unshift({
        targetId: "find-parking-nav-link",
        title: "Tìm bãi đỗ xe",
        content: "Bấm nút Tiếp theo để đến trang bản đồ và bắt đầu khám phá bãi đỗ xe quanh bạn!",
        placement: "bottom" as const
      });
    }

    startTour("booking", steps);
  };

  const handleStartPageTour = () => {
    setShowOptions(false);
    let steps: any[] = [];

    if (pathname === "/") {
      steps = [
        {
          targetId: "home-nav-link",
          title: "Trang chủ",
          content: "Chào mừng bạn đến với GoPark! Đây là nơi cập nhật các bãi đỗ mới nhất.",
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
          content: "Đừng bỏ lỡ các mã giảm giá và chương trình khuyến mãi đặc biệt.",
          placement: "bottom"
        },
        {
          targetId: "header-history-link",
          title: "Lịch sử đặt chỗ",
          content: "Xem lại các giao dịch và vé QR của bạn tại đây.",
          placement: "bottom"
        },
        {
          targetId: "header-notification-btn",
          title: "Trung tâm thông báo",
          content: "Cập nhật nhanh nhất trạng thái đơn hàng và hệ thống.",
          placement: "bottom"
        },
        {
          targetId: "header-avatar-btn",
          title: "Tài khoản của bạn",
          content: "Quản lý hồ sơ, ví tiền và cài đặt cá nhân.",
          placement: "bottom"
        },
        {
          targetId: "nearby-tab-btn",
          title: "Bãi đỗ gần đây",
          content: "Khám phá nhanh các bãi đỗ xe quanh vị trí của bạn.",
          placement: "bottom"
        },
        {
          targetId: "hero-booking-btn",
          title: "Đặt nhanh",
          content: "Bắt đầu đặt chỗ ngay lập tức với các bãi đỗ gợi ý.",
          placement: "right"
        }
      ];
    } else if (pathname === "/users/findParking") {
      steps = [
        {
          targetId: "top-search-input",
          title: "Tìm kiếm thông minh",
          content: "Nhập địa chỉ hoặc tên bãi đỗ để tìm vị trí mong muốn.",
          placement: "bottom"
        },
        {
          targetId: "near-me-btn",
          title: "Định vị bãi đỗ",
          content: "Tìm kiếm các bãi đỗ xung quanh vị trí hiện tại của bạn.",
          placement: "bottom"
        },
        {
          targetId: "parking-list-sidebar",
          title: "Danh sách kết quả",
          content: "Các bãi đỗ phù hợp sẽ được hiển thị chi tiết tại đây.",
          placement: "right"
        },
        {
          targetId: "get-directions-btn",
          title: "Chỉ đường",
          content: "Tính toán lộ trình ngắn nhất đến bãi đỗ đã chọn.",
          placement: "right"
        },
        {
          targetId: "parking-book-now-btn",
          title: "Đặt chỗ ngay",
          content: "Giữ chỗ cho phương tiện của mình sau khi tìm được vị trí ưng ý.",
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
    }

    if (steps.length === 0) {
      toast.info("Không có hướng dẫn cho trang này", {
        description: "Chúng tôi đang cập nhật hướng dẫn cho tính năng này. Vui lòng quay lại sau!",
        icon: <Info className="w-5 h-5 text-blue-500" />
      });
      return;
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
                  <div className="h-px w-full bg-gray-50 dark:bg-stone-800 my-2" />
                  <OptionButton
                    icon={MessageCircle}
                    title="Câu hỏi thường gặp"
                    onClick={() => { setShowOptions(false); router.push("/users/contact"); }}
                    color="text-purple-600 bg-purple-50 dark:bg-purple-900/20"
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
