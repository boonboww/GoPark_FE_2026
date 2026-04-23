import { get, post } from "@/lib/api";

export interface User {
  _id: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  role: "user" | "owner" | "admin" | "staff";
  status: "active" | "banned" | "ACTIVE";
  createdAt: string;
}

export interface UserResponse {
  status: string;
  data: User[] | { data: User[] };
}

export interface CreateStaffDto {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface UserResDto {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  roles: string[];
  profile: {
    id: number;
    name: string;
    phone: string | null;
    gender: string | null;
    image: string | null;
  };
}

/**
 * User Service
 * Handles fetching users from the admin API and staff management.
 */
export const userService = {
  /**
   * Get users by role
   * GET /api/v1/admin/users?role={role}
   */
  getUsersByRole: async (role: "user" | "owner" | "admin"): Promise<User[]> => {
    const response = await get<UserResponse>(`/admin/users?role=${role}`);
    if (response.status === "success") {
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    }
    return [];
  },

  /**
   * Get all users (both customers and owners)
   * GET /api/v1/users/
   */
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await get<UserResponse>("/users/");
      if (response.status === "success") {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }
      return [];
    } catch (error) {
      console.error("Error fetching all users:", error);
      return [];
    }
  },

  /**
   * Create a new staff account
   * POST /api/v1/users/staff
   */
  createStaff: async (data: CreateStaffDto): Promise<UserResDto> => {
    return await post<UserResDto>("/users/staff", data);
  },
};

