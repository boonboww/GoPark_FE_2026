/**
 * API Client Configuration
 * Configure your API base URL and common headers here
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Base API client with common configurations
 */
export async function apiClient<T>(
  endpoint: string,
  config: RequestConfig = {},
): Promise<T> {
  const { params, ...restConfig } = config;

  // Build URL with query params
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...restConfig.headers,
    },
    ...restConfig,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * GET request helper
 */
export function get<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> {
  return apiClient<T>(endpoint, { method: "GET", params });
}

/**
 * POST request helper
 */
export function post<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiClient<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * PUT request helper
 */
export function put<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiClient<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper
 */
export function del<T>(endpoint: string): Promise<T> {
  return apiClient<T>(endpoint, { method: "DELETE" });
}
