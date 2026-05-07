"use client";
import React from "react";
import { useAuthStore } from "@/stores/auth.store";
import UserChatbot from "./user/UserChatbot";
import OwnerChatbot from "./owner/OwnerChatbot";

/**
 * Chatbot wrapper:
 * - Chỉ hiển thị khi đã đăng nhập (isAuthenticated)
 * - Role USER  → UserChatbot  (tìm bãi, đặt bãi, xem tài khoản)
 * - Role OWNER → OwnerChatbot (phân tích doanh thu, gợi ý tăng trưởng)
 * - Role ADMIN → không hiển thị chatbot
 */
export default function Chatbot() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) return null;

  const role = user.role || (user.roles?.[0] ?? "");

  if (role === "OWNER") return <OwnerChatbot />;
  if (role === "USER") return <UserChatbot />;

  // ADMIN hoặc role khác không cần chatbot
  return null;
}
