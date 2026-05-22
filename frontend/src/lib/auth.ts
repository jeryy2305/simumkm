export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "sim-umkm-token";
const USER_KEY = "sim-umkm-user";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const user = window.localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function setAuthUser(user: AuthUser): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init.headers ?? {});

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (!headers.has("X-Requested-With")) {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(input, {
      ...init,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      clearAuthToken();

      // Lakukan redirect ke login page jika jalan di sisi client
      if (typeof window !== "undefined" && window.location.pathname !== '/login') {
        window.location.href = "/login";
      }

      throw new Error("Sesi telah berakhir atau Anda tidak memiliki akses. Silakan masuk kembali.");
    }

    return response;
  } catch (error) {
    // Tangani jika terjadi network error (server mati, dll)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Gagal terhubung ke server. Pastikan koneksi internet stabil.");
    }
    throw error;
  }
}

export async function parseJson<T = unknown>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  const text = await response.text();
  throw new Error(`Expected JSON response but got: ${text.substring(0, 200)}`);
}

export async function logout(): Promise<void> {
  const token = getAuthToken();

  if (token) {
    await fetch(`${API_URL}/api/logout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }).catch(() => null);
  }

  clearAuthToken();
}
