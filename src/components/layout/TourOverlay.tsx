"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTourStore } from "@/store/tourStore";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, CheckCircle2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function TourOverlay() {
  const { isTourActive, currentStep, steps, nextStep, prevStep, stopTour } = useTourStore();
  const [coords, setCoords] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
  const step = steps[currentStep];
  const pathname = usePathname();
  const router = useRouter();

  const handleNext = () => {
    // Nếu đây là bước yêu cầu chuyển sang trang tìm kiếm
    if (step?.targetId === 'find-parking-nav-link' && pathname !== '/users/findParking') {
      router.push('/users/findParking');
      setTimeout(() => {
        nextStep();
      }, 500);
      return;
    }

    // Nếu đây là bước yêu cầu quay về trang chủ
    if (step?.targetId === 'header-logo-link' && pathname !== '/') {
      router.push('/');
      setTimeout(() => {
        nextStep();
      }, 500);
      return;
    }

    nextStep();
  };

  useEffect(() => {
    if (!isTourActive || !step) return;

    const updateCoords = () => {
      const selector = step.targetId.startsWith('#') || step.targetId.startsWith('.') || step.targetId.startsWith('[') 
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
          height: rect.height
        });
      } else {
        setCoords(null);
      }
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords);
    const interval = setInterval(updateCoords, 150); // Tăng tần suất cập nhật để bám sát Modal

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
      clearInterval(interval);
    };
  }, [isTourActive, step, currentStep, pathname]);

  if (!isTourActive || !step) return null;

  // Quyết định xem có làm mờ màn hình hay không
  // Tắt làm mờ nếu không có tọa độ HOẶC đang ở bước chọn bãi đỗ xe (marker)
  const shouldDim = coords && !step.targetId.includes('parking-marker');

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden">
      {/* Lớp phủ mờ - Chỉ hiện khi thỏa mãn điều kiện shouldDim */}
      <motion.div
        className="absolute inset-0 bg-black/60 pointer-events-none"
        animate={{
          opacity: shouldDim ? 1 : 0,
        }}
        style={{
          clipPath: shouldDim && coords
            ? `polygon(0% 0%, 0% 100%, ${coords.left - 8}px 100%, ${coords.left - 8}px ${coords.top - 8}px, ${coords.left + coords.width + 8}px ${coords.top - 8}px, ${coords.left + coords.width + 8}px ${coords.top + coords.height + 8}px, ${coords.left - 8}px ${coords.top + coords.height + 8}px, ${coords.left - 8}px 100%, 100% 100%, 100% 0%)`
            : "none"
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Viền bao quanh vùng sáng - Chỉ hiện khi có tọa độ */}
      <AnimatePresence>
        {coords && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute border-2 border-green-500 rounded-xl shadow-lg z-[100000]"
            style={{
              top: coords.top - 10,
              left: coords.left - 10,
              width: coords.width + 20,
              height: coords.height + 20,
            }}
          />
        )}
      </AnimatePresence>

      {/* Thẻ hướng dẫn - Luôn hiển thị ở vị trí an toàn */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="absolute z-[100001] pointer-events-auto w-72 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-5 border border-gray-100 dark:border-stone-800"
        style={(() => {
          if (!coords) {
            return {
              bottom: "40px",
              left: "50%",
              transform: "translateX(-50%)",
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
          top = Math.max(10, Math.min(window.innerHeight - cardHeight - 20, top));
          left = Math.max(10, Math.min(window.innerWidth - cardWidth - 10, left));

          return { top, left };
        })()}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full uppercase tracking-tighter">
            Bước {currentStep + 1} / {steps.length}
          </span>
          <button onClick={stopTour} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1 leading-tight">{step.title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
          {step.content}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={prevStep}
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
              <>Hoàn tất <CheckCircle2 className="w-3 h-3 ml-1.5" /></>
            ) : (
              <>Tiếp theo <ChevronRight className="w-3 h-3 ml-1.5" /></>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
