import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Ticket,
  Tag,
  CheckCircle2,
  Info,
  AlertCircle,
} from "lucide-react";

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  vouchers: any[];
  onSelect: (voucher: any) => void;
  selectedVoucher: any;
  subTotal: number;
}

export function VoucherModal({
  isOpen,
  onClose,
  vouchers = [],
  onSelect,
  selectedVoucher,
  subTotal,
}: VoucherModalProps) {
  const [tempSelected, setTempSelected] = useState<any>(null);

  // Cập nhật tempSelected khi modal mở hoặc selectedVoucher thay đổi
  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedVoucher);
    }
  }, [isOpen, selectedVoucher]);

  const safeVouchers = Array.isArray(vouchers) ? vouchers : [];

  // Phân loại voucher
  // 1. Kiểm tra điều kiện người dùng (số lần booking, v.v.) từ BE
  // 2. Kiểm tra điều kiện đơn hàng (tổng tiền) tại FE
  const eligibleVouchers = safeVouchers.filter(
    (v) => v.is_user_eligible && subTotal >= Number(v.min_booking_value || 0),
  );
  const ineligibleVouchers = safeVouchers.filter(
    (v) => !v.is_user_eligible || subTotal < Number(v.min_booking_value || 0),
  );

  const handleApply = () => {
    onSelect(tempSelected);
    onClose();
  };

  const renderVoucherCard = (v: any, isEligible: boolean) => {
    const isSelected = tempSelected?.id === v.id;

    // Xác định lý do không khả dụng
    let reason = v.ineligible_reason;
    const minBookingVal = Number(v.min_booking_value || 0);
    if (v.is_user_eligible && subTotal < minBookingVal) {
      reason = `Thiếu ${Math.round(
        minBookingVal - subTotal,
      ).toLocaleString()}đ để sử dụng`;
    }

    return (
      <div
        key={v.id}
        onClick={() => {
          if (!isEligible) return;
          setTempSelected(isSelected ? null : v);
        }}
        className={`relative flex border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
          !isEligible
            ? "opacity-60 grayscale border-gray-100 cursor-not-allowed"
            : isSelected
              ? "border-orange-500 bg-orange-50/50 ring-4 ring-orange-500/10 cursor-pointer"
              : "border-gray-100 hover:border-orange-200 cursor-pointer"
        }`}
      >
        {/* Left side (Coupon design) */}
        <div
          className={`w-24 flex flex-col items-center justify-center p-4 text-white relative ${
            !isEligible
              ? "bg-gray-300"
              : isSelected
                ? "bg-orange-500"
                : "bg-gray-400"
          }`}
        >
          <Tag className="w-8 h-8 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Voucher
          </span>
          <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-4 bg-white rounded-full" />
          <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-4 bg-white rounded-full z-10" />
        </div>

        {/* Right side (Info) */}
        <div className="flex-1 p-4 pr-12 relative">
          <div className="space-y-1">
            <h4 className="font-black text-gray-900 flex items-center gap-2">
              {v.code}
              {isSelected && (
                <CheckCircle2 className="w-4 h-4 text-orange-500" />
              )}
            </h4>
            <p
              className={`text-sm font-bold ${
                !isEligible ? "text-gray-500" : "text-orange-600"
              }`}
            >
              {v.discount_type === "PERCENTAGE"
                ? `Giảm ${Number(v.discount_value).toLocaleString()}%`
                : `Giảm ${Number(v.discount_value).toLocaleString()}đ`}
            </p>

            {!isEligible && reason && (
              <p className="text-[11px] text-red-500 flex items-center gap-1 font-bold mt-1">
                <AlertCircle className="w-3 h-3" />
                {reason}
              </p>
            )}

            <div className="pt-2 space-y-1">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                Điều kiện:
              </p>
              <p className="text-[11px] text-gray-500 leading-tight">
                • Đơn tối thiểu {Number(v.min_booking_value).toLocaleString()}đ
                {Number(v.max_discount_amount) > 0 &&
                  `\n• Giảm tối đa ${Number(
                    v.max_discount_amount,
                  ).toLocaleString()}đ`}
              </p>
            </div>

            {isEligible && (
              <div className="mt-3 p-2 px-3 bg-green-50 rounded-lg border border-green-100 flex items-center gap-2">
                <p className="text-[10px] text-green-600 font-bold uppercase tracking-tight">Ước tính giảm:</p>
                <p className="text-sm font-black text-green-700">
                  -{(() => {
                    const dv = Number(v.discount_value || 0);
                    const md = v.max_discount_amount ? Number(v.max_discount_amount) : Infinity;
                    let amt = 0;
                    if (v.discount_type === "PERCENTAGE") {
                      amt = (subTotal * dv) / 100;
                    } else {
                      amt = dv;
                    }
                    return Math.min(amt, md, subTotal).toLocaleString();
                  })()}đ
                </p>
              </div>
            )}
          </div>

          {/* Status tag */}
          {isEligible && (
            <div className="absolute top-4 right-4">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? "border-orange-500 bg-orange-500"
                    : "border-gray-200"
                }`}
              >
                {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="voucher-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        />
      )}
      {isOpen && (
        <motion.div
          key="voucher-modal-container"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[101] max-h-[85vh] flex flex-col shadow-2xl"
        >
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between relative">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full absolute top-3 left-1/2 -translate-x-1/2" />
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900">
                  GoPark Vouchers
                </h3>
                <p className="text-xs text-gray-500">
                  Chọn voucher để nhận ưu đãi tốt nhất
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {tempSelected && (
                  <button
                    onClick={handleApply}
                    className="px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    Áp dụng
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-10">
              {safeVouchers.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                    <Ticket className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    Bạn chưa có mã giảm giá nào khả dụng
                  </p>
                </div>
              ) : (
                <>
                  {/* Eligible Section */}
                  {eligibleVouchers.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                          Voucher Khả dụng
                        </span>
                      </div>
                      {eligibleVouchers.map((v) => renderVoucherCard(v, true))}
                    </div>
                  )}

                  {/* Ineligible Section */}
                  {ineligibleVouchers.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1 border-t pt-4 mt-4">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                          Chưa đủ điều kiện
                        </span>
                      </div>
                      {ineligibleVouchers.map((v) => renderVoucherCard(v, false))}
                    </div>
                  )}
                </>
              )}
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
