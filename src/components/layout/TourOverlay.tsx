"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTourStore } from "@/store/tourStore";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, CheckCircle2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function TourOverlay() {
  const {
    isTourActive,
    currentStep,
    steps,
    nextStep,
    prevStep,
    stopTour,
    tourType,
    initialPathname,
  } = useTourStore();

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const [secondaryCoords, setSecondaryCoords] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const step = steps[currentStep];
  const pathname = usePathname();
  const router = useRouter();

  // Stop tour if pathname changes and it's a page-specific tour
  useEffect(() => {
    if (
      isTourActive &&
      tourType === "page" &&
      initialPathname &&
      pathname !== initialPathname
    ) {
      stopTour();
    }
  }, [pathname, isTourActive, tourType, stopTour, initialPathname]);

  const handlePrev = () => {
    // TỰ ĐỘNG QUAY LẠI TRANG TRƯỚC NẾU CẦN
    const prevStepIndex = currentStep - 1;
    const previousStepData = steps[prevStepIndex];

    if (previousStepData) {
      // 1. quay lại trang TÌM KIẾM (Find Parking)
      const isSearchTarget = 
        previousStepData.targetId === "top-search-input" || 
        previousStepData.targetId === "near-me-btn" ||
        previousStepData.targetId.includes("parking-marker") ||
        previousStepData.targetId.includes("parking-card");

      if (isSearchTarget && pathname !== "/users/findParking") {
        router.push("/users/findParking");
        setTimeout(() => prevStep(), 600);
        return;
      }

      // 2. Quay lại trang CHỦ
      if (previousStepData.targetId === "header-avatar-btn" && pathname !== "/") {
        router.push("/");
        setTimeout(() => prevStep(), 500);
        return;
      }
      
      // 3. Quay lại trang CHI TIẾT (từ trang SƠ ĐỒ hoặc trang khác)
      const isDetailTarget = 
        previousStepData.targetId === "parking-gallery-main" || 
        previousStepData.targetId === "detail-book-now-btn" ||
        previousStepData.targetId === "parking-price-selector" ||
        previousStepData.targetId === "parking-detail-btn";

      if (isDetailTarget) {
        // Nếu đang ở trang sơ đồ (có container sơ đồ)
        const isLayoutView = !!document.querySelector("#parking-layout-container");
        if (isLayoutView) {
          window.history.back();
          setTimeout(() => prevStep(), 800);
          return;
        }
      }
    }
    
    prevStep();
  };

  const handleNext = () => {
    // Tự động thực hiện hành động dựa trên targetId của bước HIỆN TẠI trước khi chuyển sang bước tiếp theo
    
    // 1. Mở menu Avatar nếu đang ở bước hướng dẫn Avatar
    if (step?.targetId === "header-avatar-btn") {
      const avatarBtn = document.getElementById("header-avatar-btn") || document.querySelector("#header-avatar-btn");
      if (avatarBtn) {
        (avatarBtn as HTMLElement).click();
        // Đợi menu mở ra rồi mới chuyển bước
        setTimeout(() => nextStep(), 300);
        return;
      }
    }

    // 2. Chuyển sang trang Profile nếu đang ở bước hướng dẫn link Profile
    if (step?.targetId === "header-profile-link") {
      const profileLink = document.getElementById("header-profile-link") || document.querySelector("#header-profile-link");
      if (profileLink) {
        (profileLink as HTMLElement).click();
        // Chờ trang Profile tải xong rồi mới chuyển sang bước tiếp theo
        setTimeout(() => nextStep(), 1200);
        return;
      }
      
      // Dự phòng nếu không tìm thấy link (ví dụ menu đóng), thay thế bằng router navigate
      if (pathname !== "/users/profile") {
        router.push("/users/profile");
        setTimeout(() => nextStep(), 1200);
        return;
      }
    }

    // 3. Mở modal đăng ký xe nếu đang ở bước hướng dẫn nút Add Vehicle
    if (step?.targetId === "add-vehicle-btn") {
      const addVehicleBtn = document.getElementById("add-vehicle-btn") || document.querySelector("#add-vehicle-btn") || document.querySelector('[id="add-vehicle-btn"]');
      if (addVehicleBtn) {
        (addVehicleBtn as HTMLElement).click();
        setTimeout(() => nextStep(), 300);
        return;
      }
    }

    // 4. Các hành động chuyển trang khác (đã có sẵn)
    if (step?.targetId === "parking-detail-btn" || step?.targetId === "get-directions-btn") {
      const btnSelector = step.targetId.startsWith("#") ? step.targetId : `#${step.targetId}`;
      const btn = document.querySelector(btnSelector);
      if (btn) {
        (btn as HTMLElement).click();
        setTimeout(() => nextStep(), 1500);
        return;
      }
    }

    if (step?.targetId === "detail-book-now-btn") {
      const bookNowBtn = document.querySelector("#detail-book-now-btn");
      if (bookNowBtn) {
        (bookNowBtn as HTMLElement).click();
        setTimeout(() => nextStep(), 1500);
        return;
      }
    }

    // TỰ ĐỘNG THỰC HIỆN CÁC HÀNH ĐỘNG CẦN THIẾT NẾU CHƯA LÀM
    // Bước 9: Sơ đồ bãi đỗ (Yêu cầu trang đã tải xong container)
    if (step?.targetId === "parking-layout-container") {
      // Nếu chưa ở đúng trang hoặc container chưa có, có thể cần đợi hoặc click lại nút đặt
      const container = document.querySelector("#parking-layout-container");
      if (!container) {
        const bookNowBtn = document.querySelector("#detail-book-now-btn");
        if (bookNowBtn) {
          (bookNowBtn as HTMLElement).click();
          setTimeout(() => nextStep(), 2000); // Đợi lâu hơn một chút cho trang layout tải
          return;
        }
      }
    }

    // Kiểm tra xem target hiện tại có tồn tại trên DOM không
    const currentSelector = step.targetId.startsWith("#") || step.targetId.startsWith(".") || step.targetId.startsWith("[")
      ? step.targetId
      : `#${step.targetId}`;
    const currentEl = document.querySelector(currentSelector);

    // Nếu target không tồn tại (người dùng chưa thực hiện hành động cần thiết)
    // Thực hiện nhấp nháy vùng bao quanh để cảnh báo thay vì chuyển bước
    if (!currentEl || (currentEl instanceof HTMLElement && (currentEl as HTMLElement).offsetParent === null)) {
      const borderEl = document.querySelector(".tour-highlight-border");
      if (borderEl) {
        borderEl.classList.add("animate-bounce", "border-red-600", "border-4", "shadow-[0_0_20px_rgba(220,38,38,0.7)]");
        setTimeout(() => {
          borderEl.classList.remove("animate-bounce", "border-red-600", "border-4", "shadow-[0_0_20px_rgba(220,38,38,0.7)]");
        }, 1000);
      }
      return; 
    }

    if (
      (tourType === "full" || tourType === "booking") &&
      step?.targetId === "find-parking-nav-link" &&
      pathname !== "/users/findParking"
    ) {
      const navLink = document.querySelector("#find-parking-nav-link");
      if (navLink) {
        (navLink as HTMLElement).click();
        setTimeout(() => nextStep(), 800);
        return;
      }
    }

    if (step?.targetId === "header-logo-link" && pathname !== "/") {
      router.push("/");
      setTimeout(() => nextStep(), 500);
      return;
    }

  // Danh sách các ID yêu cầu người dùng phải click vào trước khi có thể bấm "Tiếp theo"
  const manualActionTargets = ["near-me-btn", "near-me-radius-select", "parking-marker", "parking-card"];
  const needsManualAction = manualActionTargets.some(id => step.targetId.includes(id)) && !clickedTargets.has(step.targetId);

    if (needsManualAction) {
      const borderEl = document.querySelector(".tour-highlight-border");
      if (borderEl) {
        borderEl.classList.add("animate-bounce", "border-red-600", "border-4", "shadow-[0_0_20px_rgba(220,38,38,0.7)]");
        setTimeout(() => {
          borderEl.classList.remove("animate-bounce", "border-red-600", "border-4", "shadow-[0_0_20px_rgba(220,38,38,0.7)]");
        }, 1000);
      }
      return; // CHẶN LẠI: Yêu cầu người dùng tự click vào mục tiêu trước
    }

    nextStep();
  };

  useEffect(() => {
    if (isTourActive && step?.action) {
      if (step.action === "close-dialog") {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      } else if (step.action === "click") {
        const selector =
          step.targetId.startsWith("#") ||
          step.targetId.startsWith(".") ||
          step.targetId.startsWith("[")
            ? step.targetId
            : `#${step.targetId}`;
        const el = document.querySelector(selector) as HTMLElement;
        if (el) el.click();
      }
    }
  }, [isTourActive, currentStep, step]);

  useEffect(() => {
    if (!isTourActive || !step) return;

    const updateCoords = () => {
      const selector =
        step.targetId.startsWith("#") ||
        step.targetId.startsWith(".") ||
        step.targetId.startsWith("[")
          ? step.targetId
          : `#${step.targetId}`;
      const el = document.querySelector(selector);

      // Chỉ tính toán tọa độ nếu phần tử tồn tại và có kích thước thực tế
      if (el && el.getBoundingClientRect().width > 0) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        // Xử lý làm sáng song song (Secondary Target)
        // Nếu đang hướng dẫn marker trên bản đồ, tìm card tương ứng ở bên trái để làm sáng cùng lúc
        if (step.targetId.includes("parking-marker")) {
          const lotId = (el as HTMLElement).id?.replace("parking-marker-", "");
          const cardEl = document.querySelector(`[id^='parking-card-']`); // Ở bản FE bạn, card có thể được highlight chung
          
          if (cardEl) {
            const cardRect = cardEl.getBoundingClientRect();
            setSecondaryCoords({
              top: cardRect.top,
              left: cardRect.left,
              width: cardRect.width,
              height: cardRect.height,
            });
          } else {
            setSecondaryCoords(null);
          }
        } else {
          setSecondaryCoords(null);
        }
      } else {
        setCoords(null);
        setSecondaryCoords(null);

        // Auto-trigger logic: if target is missing/hidden and triggerId exists, try to click it
        if (isTourActive && step.triggerId) {
          const isModalOpen =
            document.querySelector('[role="dialog"]') ||
            document.querySelector(".radix-dialog-content");
          if (!isModalOpen) {
            const triggerEl = document.querySelector(
              step.triggerId.startsWith("#")
                ? step.triggerId
                : `#${step.triggerId}`,
            ) as HTMLElement;
            if (triggerEl) {
              triggerEl.click();
            }
          }
        }
      }
    };

    updateCoords();
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords);
    const interval = setInterval(updateCoords, 150); // Tăng tần suất cập nhật để bám sát Modal

    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords);
      clearInterval(interval);
    };
  }, [isTourActive, step, currentStep, pathname]);

  const [clickedTargets, setClickedTargets] = React.useState<Set<string>>(new Set());

  // Reset clicks when tour starts or ends
  useEffect(() => {
    if (!isTourActive) setClickedTargets(new Set());
  }, [isTourActive]);

  // Global click listener to track interactions
  useEffect(() => {
    if (!isTourActive) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const currentTargetId = step?.targetId;
      if (!currentTargetId) return;

      // Hỗ trợ cả selector ID thông thường và attribute selector như [id^='parking-marker-']
      const selector = currentTargetId.startsWith("#") || currentTargetId.startsWith(".") || currentTargetId.startsWith("[")
        ? currentTargetId
        : `#${currentTargetId}`;
      
      const el = document.querySelector(selector);
      
      // Kiểm tra nếu click vào chính phần tử đó hoặc con của nó
      // Hoặc nếu là parking-marker thì kiểm tra xem click có chứa class của marker không
      const isParkingMarkerClick = (currentTargetId.includes("parking-marker") || currentTargetId.includes("parking-card")) && 
        (target.closest("[id^='parking-marker-']") || target.id?.startsWith("parking-marker-") || 
         target.closest("[id^='parking-card-']") || target.id?.startsWith("parking-card-"));

      if ((el && (el === target || el.contains(target))) || isParkingMarkerClick) {
        setClickedTargets(prev => new Set(prev).add(currentTargetId));
      }
    };

    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, [isTourActive, step]);

  if (!isTourActive || !step) return null;

  // Quyết định xem có làm mờ màn hình hay không
  const shouldDim = !!coords;

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden">
      {/* Lớp phủ mờ - Chỉ hiện khi thỏa mãn điều kiện shouldDim */}
      <motion.div
        className="absolute inset-0 bg-black/60 pointer-events-none"
        animate={{
          opacity: shouldDim ? 1 : 0,
        }}
        style={{
          clipPath:
            shouldDim && coords
              ? secondaryCoords
                ? `polygon(
                    0% 0%, 
                    0% 100%, 
                    ${coords.left - 8}px 100%, 
                    ${coords.left - 8}px ${coords.top - 8}px, 
                    ${coords.left + coords.width + 8}px ${coords.top - 8}px, 
                    ${coords.left + coords.width + 8}px ${coords.top + coords.height + 8}px, 
                    ${coords.left - 8}px ${coords.top + coords.height + 8}px, 
                    ${coords.left - 8}px 100%, 
                    ${secondaryCoords.left - 8}px 100%,
                    ${secondaryCoords.left - 8}px ${secondaryCoords.top - 8}px,
                    ${secondaryCoords.left + secondaryCoords.width + 8}px ${secondaryCoords.top - 8}px,
                    ${secondaryCoords.left + secondaryCoords.width + 8}px ${secondaryCoords.top + secondaryCoords.height + 8}px,
                    ${secondaryCoords.left - 8}px ${secondaryCoords.top + secondaryCoords.height + 8}px,
                    ${secondaryCoords.left - 8}px 100%,
                    100% 100%, 
                    100% 0%
                  )`
                : `polygon(0% 0%, 0% 100%, ${coords.left - 8}px 100%, ${coords.left - 8}px ${coords.top - 8}px, ${coords.left + coords.width + 8}px ${coords.top - 8}px, ${coords.left + coords.width + 8}px ${coords.top + coords.height + 8}px, ${coords.left - 8}px ${coords.top + coords.height + 8}px, ${coords.left - 8}px 100%, 100% 100%, 100% 0%)`
              : "none",
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Viền bao quanh vùng sáng - Chỉ hiện khi có tọa độ */}
      <AnimatePresence mode="popLayout">
        {coords && (
          <motion.div
            key={`highlight-primary-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              top: coords.top - 10,
              left: coords.left - 10,
              width: coords.width + 20,
              height: coords.height + 20,
            }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute border-2 border-green-500 rounded-xl shadow-lg z-[100000] tour-highlight-border"
          />
        )}
        {secondaryCoords && (
          <motion.div
            key={`highlight-secondary-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              top: secondaryCoords.top - 10,
              left: secondaryCoords.left - 10,
              width: secondaryCoords.width + 20,
              height: secondaryCoords.height + 20,
            }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute border-2 border-green-500 rounded-xl shadow-lg z-[100000]"
          />
        )}
      </AnimatePresence>

      {/* Thẻ hướng dẫn - Luôn hiển thị ở vị trí an toàn */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          ...(() => {
            if (!coords) {
              return {
                top: window.innerHeight / 2 - 110, // Center vertically (approx half height)
                left: window.innerWidth / 2 - 144, // Center horizontally (approx half width)
              };
            }

            const padding = 40;
            const cardWidth = 288;
            const cardHeight = 220;

            let top = coords.top + coords.height + padding;
            let left = coords.left + coords.width / 2 - cardWidth / 2;

            // Điều chỉnh dựa trên placement
            if (step.placement === "top") {
              top = coords.top - cardHeight - padding;
            } else if (step.placement === "left") {
              top = coords.top + coords.height / 2 - cardHeight / 2;
              left = coords.left - cardWidth - padding;
            } else if (step.placement === "right") {
              top = coords.top + coords.height / 2 - cardHeight / 2;
              left = coords.left + coords.width + padding;
            } else if (step.placement === "center") {
              top = window.innerHeight / 2 - cardHeight / 2;
              left = window.innerWidth / 2 - cardWidth / 2;
            } else if (step.placement === "bottom") {
              // Tối ưu cho nút ở góc phải màn hình
              if (coords.left + coords.width > window.innerWidth - 100) {
                left = coords.left + coords.width - cardWidth;
              }
            }

            // Kiểm tra biên để không bị tràn màn hình
            top = Math.max(
              10,
              Math.min(window.innerHeight - cardHeight - 20, top),
            );
            left = Math.max(
              10,
              Math.min(window.innerWidth - cardWidth - 10, left),
            );

            return { top, left };
          })(),
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="absolute z-[100001] pointer-events-auto w-72 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-5 border border-gray-100 dark:border-stone-800"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full uppercase tracking-tighter">
            Bước {currentStep + 1} / {steps.length}
          </span>
          <button
            onClick={stopTour}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1 leading-tight">
          {step.title}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
          {step.content}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="rounded-lg h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Button
            onClick={currentStep === steps.length - 1 ? stopTour : handleNext}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg h-8 text-xs"
          >
            {currentStep === steps.length - 1 ? (
              <>
                Hoàn tất <CheckCircle2 className="w-3 h-3 ml-1.5" />
              </>
            ) : (
              <>
                Tiếp theo <ChevronRight className="w-3 h-3 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
