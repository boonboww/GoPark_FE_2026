import { apiClient } from "@/lib/api";

export const uploadAvatarToSupabase = async (file: File, _userId?: string) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Chỉ hỗ trợ file ảnh.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient<any>("/users/me/avatar", {
    method: "POST",
    body: formData,
  });

  console.log("Avatar upload response:", response);

  const imageUrl = response?.data?.profile?.image || response?.profile?.image;
  if (!imageUrl) {
    throw new Error("Upload ảnh thành công nhưng không nhận được URL ảnh");
  }

  return imageUrl;
};
