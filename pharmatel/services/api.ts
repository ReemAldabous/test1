const DEFAULT_API_BASE_URL = "http://10.136.243.234:8080/api"


export function getApiBaseUrl(): string {
  const envBaseUrl =
    typeof globalThis !== "undefined"
      ? (
          globalThis as unknown as {
            process?: { env?: Record<string, string | undefined> };
          }
        ).process?.env?.EXPO_PUBLIC_API_URL
      : undefined;

  return (envBaseUrl?.trim() || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl().length > 0;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const bodyIsFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !bodyIsFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      errorText || response.statusText || "Request failed",
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
