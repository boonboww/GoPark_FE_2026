import { get, post, patch } from "@/lib/api";
import { SentNotification, TargetType, NotificationType } from "@/stores/notification.store";

export interface NotificationPayload {
  title: string;
  content: string;
  target_role: string;
  type: string;
}

export interface SendToUserDto {
  userIds: string[];
  notification: NotificationPayload;
}

export interface SendToRoleDto {
  notification: NotificationPayload;
}

/**
 * Notification Service
 * Encapsulates all notification-related API calls.
 */
export const notificationService = {
  /**
   * Get all sent notifications for table view
   * GET /api/v1/admin/notifications/table/list
   */
  getAll: (page?: number, limit?: number): Promise<{ data: { items: SentNotification[], meta: any } }> => {
    const url = page && limit ? `/admin/notifications/table/list?page=${page}&limit=${limit}` : "/admin/notifications/table/list";
    return get<{ data: { items: SentNotification[], meta: any } }>(url);
  },

  /**
   * Send a notification to specific roles
   * POST /api/v1/admin/notifications/send-to-role
   */
  sendToRole: (data: SendToRoleDto): Promise<unknown> =>
    post<unknown>("/admin/notifications/send-to-role", data),

  /**
   * Send a notification to specific users
   * POST /api/v1/admin/notifications/send-to-user
   */
  sendToUser: (data: SendToUserDto): Promise<unknown> =>
    post<unknown>("/admin/notifications/send-to-user", data),

  /**
   * Get all notifications for current user
   * GET /notifications
   */
  getForUser: (): Promise<{ data: SentNotification[] }> =>
    get<{ data: SentNotification[] }>("/notifications"),

  /**
   * Get unread notifications for current user
   * GET /notifications/unread
   */
  getUnread: (): Promise<{ data: SentNotification[] }> =>
    get<{ data: SentNotification[] }>("/notifications/unread"),

  /**
   * Count unread notifications for current user
   * GET /notifications/unread/count
   */
  countUnread: (): Promise<{ data: number }> =>
    get<{ data: number }>("/notifications/unread/count"),

  /**
   * Mark all notifications as read
   * PATCH /notifications/read-all
   */
  markAllRead: (): Promise<unknown> =>
    patch<unknown>("/notifications/read-all", {}),

  /**
   * Mark specific notification as read
   * PATCH /notifications/:id/read
   */
  markRead: (id: string): Promise<unknown> =>
    patch<unknown>(`/notifications/${id}/read`, {}),
};
