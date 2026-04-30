"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  X,
  PlayCircle,
  Layout,
  Flag,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTourStore } from "@/store/tourStore";
import { useRouter, usePathname } from "next/navigation";

export function OwnerGuide() {
  const [showOptions, setShowOptions] = useState(false);
  const { startTour } = useTourStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleStartOverviewTour = () => {
    setShowOptions(false);
    
    const steps = [
      {
        targetId: "sidebar-item-dashboard",
        title: "Bảng điều khiển",
        content: "Nơi tổng hợp các chỉ số quan trọng như doanh thu, số lượng đặt chỗ và tỷ lệ lấp đầy của toàn bộ hệ thống.",
        placement: "right" as const
      },
      {
        targetId: "sidebar-item-my-parking-lots",
        title: "Danh sách bãi đỗ",
        content: "Quản lý danh sách các bãi đỗ xe bạn đang sở hữu. Bạn có thể thêm bãi đỗ mới hoặc chỉnh sửa thông tin tại đây.",
        placement: "right" as const
      },
      {
        targetId: "sidebar-item-parkinglot_management",
        title: "Vận hành thời gian thực",
        content: "Theo dõi trực quan sơ đồ bãi đỗ, xem trạng thái từng ô và xử lý check-in/out thủ công.",
        placement: "right" as const
      },
      {
        targetId: "sidebar-item-bookings",
        title: "Lịch sử đặt chỗ",
        content: "Theo dõi toàn bộ các lượt đặt chỗ, biển số xe khách hàng và trạng thái thanh toán.",
        placement: "right" as const
      },
      {
        targetId: "sidebar-item-analytics",
        title: "Thống kê chuyên sâu",
        content: "Phân tích biểu đồ doanh thu, lưu lượng xe và các báo cáo tài chính chi tiết.",
        placement: "right" as const
      },
       {
        targetId: "sidebar-item-staff-management",
        title: "Quản lý nhân sự",
        content: "Phân quyền và quản lý tài khoản nhân viên vận hành cho từng bãi đỗ xe.",
        placement: "right" as const
      }
    ];

    if (pathname !== "/owner") {
      router.push("/owner");
      setTimeout(() => startTour("full", steps, "/owner"), 500);
    } else {
      startTour("full", steps, pathname);
    }
  };

  const handleStartPageTour = () => {
    setShowOptions(false);
    let steps: any[] = [];

    if (pathname === "/owner") {
      steps = [
        {
          targetId: "dashboard-kpi-cards",
          title: "Chỉ số kinh doanh",
          content: "Theo dõi doanh thu, số lượt đặt chỗ và bãi đỗ đang hoạt động. Các chỉ số này giúp bạn đánh giá nhanh hiệu quả vận hành trong ngày.",
          placement: "bottom"
        },
        {
          targetId: "dashboard-revenue-chart",
          title: "Biểu đồ tăng trưởng",
          content: "Theo dõi xu hướng doanh thu theo ngày/tháng. Giúp bạn nhận diện các khung giờ hoặc ngày có lượng khách cao nhất.",
          placement: "top"
        },
        {
          targetId: "dashboard-occupancy-chart",
          title: "Công suất bãi đỗ",
          content: "So sánh tỷ lệ lấp đầy giữa các bãi đỗ. Bãi đỗ nào có tỷ lệ thấp cần được đẩy mạnh các chương trình ưu đãi.",
          placement: "left"
        },
        {
          targetId: "dashboard-recent-activity",
          title: "Dòng hoạt động",
          content: "Cập nhật liên tục các lượt xe vào, xe ra và thanh toán. Bạn có thể kiểm soát mọi biến động ngay tại đây.",
          placement: "top"
        }
      ];
    } else if (pathname === "/owner/my-parking-lots") {
      steps = [
        {
          targetId: "lot-manage-btn",
          title: "Quản lý bãi đỗ",
          content: "Đây là danh sách bãi đỗ của bạn. Nhấn vào nút 'Quản lý sơ đồ' để vào không gian vận hành thời gian thực.",
          placement: "bottom"
        },
        {
          targetId: "lot-edit-btn",
          title: "Chỉnh sửa thông tin",
          content: "Bạn có thể chỉnh sửa lại Tên, Địa chỉ, Tọa độ hoặc Hình ảnh của bãi đỗ bất kỳ lúc nào bằng nút này. Hãy thử ấn vào nút đó nhé.",
          placement: "bottom"
        },
        {
          targetId: "edit-lot-name",
          title: "Sửa tên bãi đỗ",
          content: "Thay đổi tên bãi đỗ xe nếu cần thiết.",
          placement: "bottom",
          triggerId: "lot-edit-btn"
        },
        {
          targetId: "edit-lot-desc",
          title: "Cập nhật mô tả",
          content: "Chỉnh sửa các thông tin chi tiết, lưu ý cho khách hàng.",
          placement: "top",
          triggerId: "lot-edit-btn"
        },
        {
          targetId: "edit-lot-images",
          title: "Hình ảnh bãi đỗ",
          content: "Thêm hình ảnh thực tế của bãi đỗ xe hoặc xóa các hình cũ để khách hàng dễ nhận diện hơn.",
          placement: "top",
          triggerId: "lot-edit-btn"
        },
        {
          targetId: "edit-lot-submit",
          title: "Lưu thay đổi",
          content: "Sau khi cập nhật xong, nhấn nút này để lưu lại. Hệ thống sẽ tự đóng bảng này ở bước tiếp theo.",
          placement: "top",
          triggerId: "lot-edit-btn"
        },
        {
          targetId: "add-parking-lot-btn",
          title: "Thêm bãi đỗ mới",
          content: "Khi muốn mở rộng kinh doanh, bạn có thể tạo thêm nhiều bãi đỗ xe khác bằng nút này. Tất cả dữ liệu đều được quản lý tập trung.",
          placement: "bottom",
          action: "close-dialog"
        },
        {
          targetId: "lot-name-input",
          title: "Tên bãi đỗ",
          content: "Nhập tên bãi đỗ dễ nhớ cho khách hàng (Ví dụ: GoPark Central).",
          placement: "bottom",
          triggerId: "add-parking-lot-btn"
        },
        {
          targetId: "lot-address-input",
          title: "Địa chỉ & Tọa độ",
          content: "Nhập địa chỉ chính xác. Bạn cũng có thể chọn vị trí trên bản đồ bên phải để hệ thống tự điền tọa độ.",
          placement: "bottom",
          triggerId: "add-parking-lot-btn"
        },
        {
          targetId: "lot-map-picker",
          title: "Chọn vị trí trên bản đồ",
          content: "Di chuyển bản đồ hoặc ghim để xác định chính xác tọa độ bãi đỗ của bạn.",
          placement: "left",
          triggerId: "add-parking-lot-btn"
        },
        {
          targetId: "lot-description-input",
          title: "Mô tả chi tiết",
          content: "Thêm các thông tin như giờ đóng/mở cửa hoặc các lưu ý đặc biệt dành cho khách hàng.",
          placement: "top",
          triggerId: "add-parking-lot-btn"
        },
        {
          targetId: "lot-images-input",
          title: "Hình ảnh bãi đỗ",
          content: "Tải lên các hình ảnh thực tế của bãi đỗ để khách hàng dễ dàng nhận diện và tin tưởng hơn.",
          placement: "top",
          triggerId: "add-parking-lot-btn"
        },
        {
          targetId: "lot-submit-btn",
          title: "Gửi phê duyệt",
          content: "Sau khi hoàn tất, nhấn Gửi yêu cầu. Admin sẽ phê duyệt bãi đỗ của bạn trong thời gian sớm nhất.",
          placement: "bottom",
          triggerId: "add-parking-lot-btn"
        }
      ];
    } else if (pathname === "/owner/parkinglot_management") {
      const hasSetupBtn = !!document.querySelector("#setup-first-grid-btn");
      
      steps = [
        {
          targetId: "lot-selector",
          title: "Chuyển đổi bãi đỗ",
          content: "Chọn bãi đỗ xe bạn muốn quản lý từ danh sách này.",
          placement: "bottom"
        },
        {
          targetId: "tour-mock-available-slot",
          title: "Mẫu: Chỗ trống",
          content: "Hệ thống đã tạo sẵn một ô mẫu màu trắng đại diện cho vị trí chưa có xe. Nhấn 'Tiếp theo' để xem cách đặt chỗ thủ công.",
          placement: "top"
        },
        {
          targetId: "booking-name-input",
          title: "Tên khách hàng",
          content: "Nhập tên khách hàng vãng lai để bắt đầu tạo lệnh check-in.",
          placement: "bottom",
          triggerId: "tour-mock-available-slot"
        },
        {
          targetId: "booking-phone-input",
          title: "Số điện thoại",
          content: "Nhập số điện thoại để liên lạc khi cần thiết.",
          placement: "bottom",
          triggerId: "tour-mock-available-slot"
        },
        {
          targetId: "booking-plate-input",
          title: "Nhận diện biển số",
          content: "Nhập biển số xe. Bạn có thể dùng nút 'Quét ảnh' để AI tự động đọc từ camera.",
          placement: "bottom",
          triggerId: "tour-mock-available-slot"
        },
        {
          targetId: "booking-time-input",
          title: "Thời gian bắt đầu",
          content: "Xác nhận thời gian khách bắt đầu gửi xe (mặc định là thời gian hiện tại).",
          placement: "bottom",
          triggerId: "tour-mock-available-slot"
        },
        {
          targetId: "booking-next-btn",
          title: "Xác nhận thông tin",
          content: "Sau khi điền đủ thông tin, nhấn Tiếp tục để kiểm tra lại. Hệ thống sẽ đóng bảng này và chuyển sang hướng dẫn vị trí có khách.",
          placement: "top",
          triggerId: "tour-mock-available-slot"
        },
        {
          targetId: "tour-mock-occupied-slot",
          title: "Mẫu: Xe đang đỗ",
          content: "Đây là mẫu ô có màu đại diện cho vị trí đã có xe đỗ. Khi khách ra về, hãy bấm vào ô này.",
          placement: "top",
          action: "close-dialog"
        },
        {
          targetId: "occupied-ticket-body",
          title: "Thông tin vé & Thanh toán",
          content: "Tại đây bạn có thể xem mã vé, thời gian check-in/out, tổng phí và tiến hành thanh toán trả xe cho khách. Nhấn Tiếp theo để đóng bảng này.",
          placement: "right",
          triggerId: "tour-mock-occupied-slot"
        },
        {
          targetId: "tour-mock-occupied-slot",
          title: "Hoàn tất hướng dẫn",
          content: "Hệ thống đã tự động đóng bảng thông tin vé. Bạn đã nắm được cách đặt chỗ và xem vé thành công!",
          placement: "bottom",
          action: "close-dialog"
        }
      ];

      if (hasSetupBtn) {
        steps.push({
          targetId: "setup-first-grid-btn",
          title: "Thiết lập sơ đồ đầu tiên",
          content: "Bạn chưa có sơ đồ nào. Nhấn vào đây để bắt đầu thiết lập cấu trúc bãi đỗ theo quy trình 3 bước.",
          placement: "bottom",
          action: "click"
        });
        steps.push({
          targetId: "setup-add-floor-btn",
          title: "Bước 1: Quản lý Tầng",
          content: "Bắt đầu bằng việc thêm các tầng vật lý (Ví dụ: Tầng hầm 1, Tầng 1) cho bãi đỗ của bạn.",
          placement: "top",
          triggerId: "setup-first-grid-btn"
        });
        steps.push({
          targetId: "setup-next-btn",
          title: "Tiếp tục cấu hình",
          content: "Sau khi đủ số tầng, nhấn 'Tiếp tục' để sang bước thiết lập Khu vực (Zone).",
          placement: "top",
          triggerId: "setup-first-grid-btn",
          action: "click"
        });
        steps.push({
          targetId: "setup-zone-name-0",
          title: "Bước 2: Chi tiết Khu vực",
          content: "Mỗi tầng có thể chia thành nhiều khu vực (Khu A, Khu VIP...). Hãy đặt tên gợi nhớ tại đây.",
          placement: "bottom",
          triggerId: "setup-first-grid-btn"
        });
        steps.push({
          targetId: "setup-zone-count-0",
          title: "Số lượng ô đỗ",
          content: "Nhập số lượng chỗ đỗ. Hệ thống sẽ tự động sinh ra sơ đồ ô đỗ tương ứng.",
          placement: "bottom",
          triggerId: "setup-first-grid-btn"
        });
        steps.push({
          targetId: "setup-zone-price-0",
          title: "Cấu hình Giá vé",
          content: "Thiết lập giá vé theo giờ và theo ngày cho khu vực này.",
          placement: "bottom",
          triggerId: "setup-first-grid-btn"
        });
        steps.push({
          targetId: "setup-next-btn",
          title: "Xem lại sơ đồ",
          content: "Nhấn 'Tiếp tục' để qua bước xác nhận cuối cùng trước khi khởi tạo.",
          placement: "top",
          triggerId: "setup-first-grid-btn",
          action: "click"
        });
        steps.push({
          targetId: "setup-save-btn",
          title: "Bước 3: Lưu & Khởi tạo",
          content: "Kiểm tra lại các thông số và nhấn 'Lưu' để hệ thống bắt đầu khởi tạo sơ đồ.",
          placement: "top",
          triggerId: "setup-first-grid-btn"
        });
        steps.push({
          targetId: "setup-close-wizard-btn",
          title: "Hoàn tất thiết lập",
          content: "Chúc mừng! Sơ đồ bãi đỗ của bạn đã sẵn sàng. Nhấn 'Đóng' để bắt đầu vận hành.",
          placement: "top",
          triggerId: "setup-first-grid-btn",
          action: "close-dialog"
        });
      } else {
        steps.push({
          targetId: "config-tech-price-btn",
          title: "Cấu hình & Bảng giá",
          content: "Khi cần thay đổi cấu trúc hoặc điều chỉnh giá vé, bạn hãy sử dụng chức năng này.",
          placement: "bottom",
          action: "click"
        });
        steps.push({
          targetId: "structure-add-floor-btn",
          title: "Quản lý Cấu trúc",
          content: "Tại đây bạn có thể thêm Tầng mới hoặc mở rộng Tầng hiện có.",
          placement: "bottom",
          triggerId: "config-tech-price-btn"
        });
        steps.push({
          targetId: "structure-edit-zone-btn-0",
          title: "Chỉnh sửa Khu vực & Giá",
          content: "Bấm vào đây để thay đổi số lượng ô đỗ, tiền tố mã hoặc cập nhật lại bảng giá mới.",
          placement: "bottom",
          triggerId: "config-tech-price-btn"
        });
        steps.push({
          targetId: "structure-sync-all-btn",
          title: "Đồng bộ hệ thống",
          content: "Sau khi thay đổi cấu trúc, hãy nhấn 'Đồng bộ' để hệ thống cập nhật lại trạng thái thực tế của toàn bộ ô đỗ.",
          placement: "bottom",
          triggerId: "config-tech-price-btn"
        });
        steps.push({
          targetId: "structure-close-btn",
          title: "Hoàn tất chỉnh sửa",
          content: "Bạn đã cập nhật cấu hình thành công. Nhấn 'Đóng' để áp dụng các thay đổi và quay lại sơ đồ.",
          placement: "bottom",
          triggerId: "config-tech-price-btn",
          action: "close-dialog"
        });
      }
    } else if (pathname === "/owner/account") {
      steps = [
        {
          targetId: "account-profile-card",
          title: "Hồ sơ đối tác",
          content: "Đây là nơi hiển thị thông tin cơ bản và vai trò của bạn trong hệ thống GoPark.",
          placement: "bottom"
        },
        {
          targetId: "account-security-card",
          title: "An toàn tài khoản",
          content: "Bạn có thể kiểm tra trạng thái bảo mật và thực hiện đổi mật khẩu định kỳ tại đây.",
          placement: "top"
        },
        {
          targetId: "account-password-update-btn",
          title: "Cập nhật mật khẩu",
          content: "Nhấn vào đây để mở hộp thoại đổi mật khẩu. Hãy sử dụng mật khẩu có độ phức tạp cao.",
          placement: "bottom"
        },
        {
          targetId: "account-info-card",
          title: "Thông tin liên lạc",
          content: "Cập nhật Họ tên và Số điện thoại chính xác để chúng tôi có thể hỗ trợ bạn tốt nhất.",
          placement: "left"
        },
        {
          targetId: "account-save-button",
          title: "Lưu thông tin",
          content: "Đừng quên nhấn 'Cập nhật hồ sơ' sau khi đã chỉnh sửa xong các thông tin nhé.",
          placement: "top"
        }
      ];
    } else if (pathname === "/owner/staff-management") {
      steps = [
        {
          targetId: "staff-search-filter",
          title: "Bộ lọc & Tìm kiếm",
          content: "Tìm kiếm nhanh nhân viên theo tên hoặc lọc theo bãi đỗ xe cụ thể.",
          placement: "bottom"
        },
        {
          targetId: "add-staff-btn",
          title: "Thêm nhân viên mới",
          content: "Nhấn vào đây để bắt đầu cấp tài khoản cho nhân viên vận hành.",
          placement: "bottom"
        },
        {
          targetId: "staff-lot-select",
          title: "Phân quyền bãi đỗ",
          content: "Chọn bãi đỗ xe mà nhân viên này sẽ phụ trách vận hành.",
          placement: "bottom",
          triggerId: "add-staff-btn"
        },
        {
          targetId: "staff-name-input",
          title: "Thông tin cá nhân",
          content: "Nhập họ tên và số điện thoại liên lạc của nhân viên.",
          placement: "bottom",
          triggerId: "add-staff-btn"
        },
        {
          targetId: "staff-email-input",
          title: "Tên đăng nhập",
          content: "Tạo tên định danh (Email/Username) để nhân viên sử dụng khi đăng nhập hệ thống.",
          placement: "bottom",
          triggerId: "add-staff-btn"
        },
        {
          targetId: "staff-password-input",
          title: "Mật khẩu",
          content: "Thiết lập mật khẩu ban đầu cho nhân viên.",
          placement: "bottom",
          triggerId: "add-staff-btn"
        },
        {
          targetId: "staff-phone-input",
          title: "Số điện thoại",
          content: "Nhập số điện thoại của nhân viên để dễ dàng liên lạc khi cần thiết.",
          placement: "bottom",
          triggerId: "add-staff-btn"
        },
        {
          targetId: "staff-submit-btn",
          title: "Tạo tài khoản",
          content: "Sau khi điền đủ thông tin, nhấn vào đây để hoàn tất việc cấp quyền cho nhân viên. Hãy nhấn 'Hủy' để đóng form này nếu chưa muốn tạo.",
          placement: "bottom",
          triggerId: "add-staff-btn"
        }
      ];
    } else {
      steps = [
        {
          targetId: "sidebar-item-dashboard",
          title: "Hệ thống GoPark",
          content: "Khám phá các tính năng quản trị dành cho chủ bãi đỗ tại đây.",
          placement: "right"
        }
      ];
    }

    startTour("page", steps, pathname);
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
                  <h4 className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-tighter">Hỗ trợ đối tác</h4>
                  <button onClick={() => setShowOptions(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <OptionButton
                    icon={Layout}
                    title="Hướng dẫn trang này"
                    onClick={handleStartPageTour}
                    color="text-orange-600 bg-orange-50 dark:bg-orange-900/20"
                  />
                  <OptionButton
                    icon={Flag}
                    title="Tổng quan hệ thống"
                    onClick={handleStartOverviewTour}
                    color="text-green-600 bg-green-50 dark:bg-green-900/20"
                  />
                  <OptionButton
                    icon={PlayCircle}
                    title="Trung tâm trợ giúp"
                    onClick={() => {
                      setShowOptions(false);
                      router.push("/owner/help");
                    }}
                    color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-white dark:bg-stone-900 border border-gray-200 dark:border-stone-800 shadow-xl hover:shadow-primary/20 transition-all duration-300"
          >
            <HelpCircle className={`w-5 h-5 ${showOptions ? 'text-primary' : 'text-gray-500'}`} />
            <span className="font-black text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Trợ giúp</span>
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
