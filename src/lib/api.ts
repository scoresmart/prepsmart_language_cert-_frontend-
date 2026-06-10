/**
 * Backend API client for PrepSmart Language Cert backend (Railway).
 * Base URL is read from VITE_API_URL env variable.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

function getHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...((options.headers as object) || {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json as T;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface WritingQuestion {
  id: string;
  task_type: "task1" | "task2";
  question_text: string;
  image_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ListeningSubQuestion {
  id?: string;
  text: string;
  options?: string[];
  answer?: string;
  type?: string;
}

export interface ListeningQuestion {
  id: string;
  part_number: number;
  audio_path: string | null;
  questions: ListeningSubQuestion[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReadingQuestion {
  id: string;
  part_type: "part1a" | "part1b" | "part2" | "part3" | "part4";
  title: string;
  passage: string | null;
  image_path: string | null;
  questions: object[];
  word_bank: object | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface MockTest {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface UserProfile {
  id: string;
  role: "admin" | "tutor" | "student";
  name: string;
  email: string | null;
  phone: string | null;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface PaginatedResponse<T> {
  questions: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── API ───────────────────────────────────────────────────────────────────────

export const api = {
  // ─── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    login: (email: string, password: string) =>
      request<{ success: boolean; data: { access_token: string; refresh_token: string; user: UserProfile } }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),
    logout: () => request("/auth/logout", { method: "POST" }),
    refresh: (refresh_token: string) =>
      request("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token }) }),
  },

  // ─── Writing Questions ───────────────────────────────────────────────────
  writing: {
    list: (task_type?: "task1" | "task2") =>
      request<{ success: boolean; data: WritingQuestion[] }>(
        `/questions/writing${task_type ? `?task_type=${task_type}` : ""}`
      ),
    get: (id: string) =>
      request<{ success: boolean; data: WritingQuestion }>(`/questions/writing/${id}`),
    create: (body: { task_type: string; question_text: string; image_path?: string }) =>
      request<{ success: boolean; data: WritingQuestion }>(
        "/questions/writing",
        { method: "POST", body: JSON.stringify(body) }
      ),
    update: (id: string, body: Partial<{ task_type: string; question_text: string; image_path: string | null }>) =>
      request<{ success: boolean; data: WritingQuestion }>(
        `/questions/writing/${id}`,
        { method: "PUT", body: JSON.stringify(body) }
      ),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(
        `/questions/writing/${id}`,
        { method: "DELETE" }
      ),
  },

  // ─── Listening Questions ─────────────────────────────────────────────────
  listening: {
    list: (params?: { part_number?: number; page?: number; limit?: number }) => {
      const q = new URLSearchParams(
        Object.entries(params || {})
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      return request<{ success: boolean; data: PaginatedResponse<ListeningQuestion> }>(
        `/questions/listening${q ? `?${q}` : ""}`
      );
    },
    get: (id: string) =>
      request<{ success: boolean; data: ListeningQuestion }>(`/questions/listening/${id}`),
    create: (body: { part_number: number; audio_path?: string; questions: ListeningSubQuestion[] }) =>
      request<{ success: boolean; data: ListeningQuestion }>(
        "/questions/listening",
        { method: "POST", body: JSON.stringify(body) }
      ),
    update: (id: string, body: Partial<{ part_number: number; audio_path: string; questions: ListeningSubQuestion[] }>) =>
      request<{ success: boolean; data: ListeningQuestion }>(
        `/questions/listening/${id}`,
        { method: "PUT", body: JSON.stringify(body) }
      ),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(
        `/questions/listening/${id}`,
        { method: "DELETE" }
      ),
  },

  // ─── Reading Questions ───────────────────────────────────────────────────
  reading: {
    list: (params?: { part_type?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams(
        Object.entries(params || {})
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      return request<{ success: boolean; data: PaginatedResponse<ReadingQuestion> }>(
        `/questions/reading${q ? `?${q}` : ""}`
      );
    },
    get: (id: string) =>
      request<{ success: boolean; data: ReadingQuestion }>(`/questions/reading/${id}`),
    create: (body: {
      part_type: string;
      title: string;
      passage?: string;
      image_path?: string;
      questions: object[];
      word_bank?: object;
    }) =>
      request<{ success: boolean; data: ReadingQuestion }>(
        "/questions/reading",
        { method: "POST", body: JSON.stringify(body) }
      ),
    update: (
      id: string,
      body: Partial<{ part_type: string; title: string; passage: string; image_path: string; questions: object[]; word_bank: object }>
    ) =>
      request<{ success: boolean; data: ReadingQuestion }>(
        `/questions/reading/${id}`,
        { method: "PUT", body: JSON.stringify(body) }
      ),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(
        `/questions/reading/${id}`,
        { method: "DELETE" }
      ),
  },

  // ─── Mock Tests ──────────────────────────────────────────────────────────
  tests: {
    list: () => request<{ success: boolean; data: MockTest[] }>("/tests"),
    get: (id: string) => request<{ success: boolean; data: MockTest }>(`/tests/${id}`),
    structure: (id: string) => request<{ success: boolean; data: unknown }>(`/tests/${id}/structure`),
    create: (body: { title: string; description?: string }) =>
      request<{ success: boolean; data: MockTest }>(
        "/tests",
        { method: "POST", body: JSON.stringify(body) }
      ),
    update: (id: string, body: Partial<{ title: string; description: string; is_active: boolean }>) =>
      request<{ success: boolean; data: MockTest }>(
        `/tests/${id}`,
        { method: "PUT", body: JSON.stringify(body) }
      ),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(
        `/tests/${id}`,
        { method: "DELETE" }
      ),
  },

  // ─── Users ───────────────────────────────────────────────────────────────
  users: {
    me: () => request<{ success: boolean; data: UserProfile }>("/users/me"),
    list: (params?: { role?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams(
        Object.entries(params || {})
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      return request<{ success: boolean; data: { users: UserProfile[]; total: number; page: number; totalPages: number } }>(
        `/users${q ? `?${q}` : ""}`
      );
    },
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(
        `/users/${id}`,
        { method: "DELETE" }
      ),
  },
};
