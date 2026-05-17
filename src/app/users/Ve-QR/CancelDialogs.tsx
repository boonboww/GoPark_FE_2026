"use client";

import React from "react";
import { Ticket, CheckCircle2, ShieldCheck, Bell, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface CancelDialogsProps {
  cancelBookingId: string | null;
  onCancelClose: () => void;
  onCancelConfirm: () => void;
  loading: boolean;
  alertConfig: {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  };
  onAlertClose: () => void;
  brandGreen?: string;
}

export const CancelDialogs: React.FC<CancelDialogsProps> = ({
  cancelBookingId,
  onCancelClose,
  onCancelConfirm,
  loading,
  alertConfig,
  onAlertClose,
  brandGreen = "#00D18A",
}) => {
  return (
    <>
      {/* Custom Confirmation Dialog for Hủy Vé */}
      <AnimatePresence>
        {cancelBookingId && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-[#E5E7EB] dark:border-[#2C2C2E] max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/10 text-red-500 mx-auto">
                  <Ticket className="w-7 h-7" />
                </div>
                
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-black uppercase tracking-wider text-gray-900 dark:text-white">
                    Xác Nhận Hủy Vé
                  </h3>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed px-2">
                    Bạn có chắc chắn muốn hủy lượt đặt chỗ này không? Số tiền đã thanh toán sẽ được hoàn trả đầy đủ vào ví của bạn.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={onCancelClose}
                    className="flex-1 py-6 rounded-xl font-bold uppercase tracking-wider text-xs border-2 border-gray-200 dark:border-stone-850"
                  >
                    Đóng
                  </Button>
                  <Button
                    style={{ backgroundColor: "#E53E3E" }}
                    onClick={onCancelConfirm}
                    disabled={loading}
                    className="flex-1 py-6 rounded-xl font-bold uppercase tracking-wider text-xs text-white hover:opacity-90 transition-opacity"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      "Hủy Vé"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Alert Dialog for success and errors */}
      <AnimatePresence>
        {alertConfig.isOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-[#E5E7EB] dark:border-[#2C2C2E] max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-6">
                <div className={`flex items-center justify-center w-14 h-14 rounded-2xl mx-auto
                  ${alertConfig.type === 'success' ? 'bg-green-100 dark:bg-green-500/10 text-green-500' : 
                    alertConfig.type === 'error' ? 'bg-red-100 dark:bg-red-500/10 text-red-500' : 
                    'bg-blue-100 dark:bg-blue-500/10 text-blue-500'}
                `}>
                  {alertConfig.type === 'success' ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : alertConfig.type === 'error' ? (
                    <ShieldCheck className="w-7 h-7" />
                  ) : (
                    <Bell className="w-7 h-7" />
                  )}
                </div>
                
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-black uppercase tracking-wider text-gray-900 dark:text-white">
                    {alertConfig.title}
                  </h3>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed px-2">
                    {alertConfig.message}
                  </p>
                </div>

                <Button
                  style={{
                    backgroundColor: alertConfig.type === 'success' ? brandGreen : 
                                    alertConfig.type === 'error' ? '#E53E3E' : '#3182CE'
                  }}
                  onClick={onAlertClose}
                  className="w-full py-6 rounded-xl font-bold uppercase tracking-wider text-xs text-white hover:opacity-90 transition-opacity"
                >
                  Xác nhận
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
