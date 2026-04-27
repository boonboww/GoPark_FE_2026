"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTourStore } from "@/store/tourStore";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, CheckCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";

export function TourOverlay() {
  const { isTourActive, currentStep, steps, nextStep, prevStep, stopTour } = useTourStore();
  const [coords, setCoords] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
  const step = steps[currentStep];
  const pathname = usePathname();

  useEffect(() => {
    if (!isTourActive || !step) return;

    if (step.targetId.includes('parking') && pathname === '/') {
        stopTour();
        return;
    }

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
    const interval = setInterval(updateCoords, 300);

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
    <div className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden">
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
            className="absolute border-2 border-green-500 rounded-xl shadow-lg z-[10001]"
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute z-[10002] pointer-events-auto w-72 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-5 border border-gray-100 dark:border-stone-800"
        style={{
          // Nếu có coords thì hiển thị gần đó, nếu không thì hiển thị cố định ở góc dưới
          bottom: coords ? "auto" : "40px",
          top: coords ? (coords.top + coords.height + 30 > window.innerHeight - 250 ? coords.top - 210 : coords.top + coords.height + 30) : "auto",
          left: coords ? Math.max(20, Math.min(window.innerWidth - 300, coords.left + coords.width / 2 - 144)) : "40px"
        }}
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
            onClick={currentStep === steps.length - 1 ? stopTour : nextStep}
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
