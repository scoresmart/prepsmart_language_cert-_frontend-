/**
 * Backend API client for PrepSmart Language Cert backend.
 * Base URL is read from VITE_API_URL env variable.
 */

import { supabase } from "./supabase/client";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function getHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...((options.headers as object) || {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json as T;
}

function qs(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";
  const q = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return q ? `?${q}` : "";
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  totalPages: number;
  questions?: T[];
  tests?: T[];
  users?: T[];
}

// Auth
export interface UserProfile {
  id: string;
  role: "admin" | "tutor" | "student";
  name: string;
  email?: string | null;
  phone?: string | null;
  subject_preferences?: string[] | null;
  first_login_completed?: boolean;
  created_at: string;
  updated_at?: string | null;
}

// Questions
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

// Student Access
export interface StudentAccess {
  id: string;
  student_id: string;
  subject: string;
  allow_master: boolean;
  allow_quad: boolean;
  allow_one_to_one: boolean;
  expiry_date: string | null;
  one_to_one_quota: number;
  one_to_one_used: number;
  course_expiry_at: string | null;
  quad_expiry_at: string | null;
  status: "active" | "paused" | "expired";
  course_start_date: string | null;
  created_at: string;
  updated_at: string;
}

// Tutors
export interface Tutor {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  google_connected: boolean;
  calendar_email: string | null;
  default_daily_hours_start: string | null;
  default_daily_hours_end: string | null;
  default_break_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TutorWorkingHours {
  id: string;
  tutor_id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  is_active: boolean;
  date: string | null;
  break_start_time: string | null;
  break_minutes: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface TutorBreak {
  id: string;
  tutor_id: string;
  break_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

// Slots
export interface QuadSlot {
  id: string;
  subject: string;
  tutor_id: string;
  starts_at: string;
  ends_at: string;
  max_seats: number;
  capacity: number;
  booked_count: number;
  meet_link: string | null;
  status: "scheduled" | "cancelled" | "completed";
  is_student_visible: boolean;
  notes: string | null;
  created_at: string;
}

export interface QuadBooking {
  id: string;
  slot_id: string;
  student_id: string;
  status: "scheduled" | "cancelled" | "completed";
  cancel_reason: string | null;
  booked_at: string;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface O2OSlot {
  id: string;
  subject: string;
  tutor_id: string;
  student_id: string | null;
  starts_at: string;
  ends_at: string;
  meet_link: string | null;
  google_event_id: string | null;
  status: "scheduled" | "cancelled" | "completed";
  created_at: string;
}

// Tickets
export interface Ticket {
  id: string;
  created_by_student: string;
  subject: string;
  category: string;
  assigned_tutor: string | null;
  status: "open" | "waiting_student" | "resolved";
  priority: "low" | "normal" | "high";
  title: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender: string;
  body: string;
  created_at: string;
}

// Materials
export interface Material {
  id: string;
  subject: string;
  category: string;
  title: string;
  description: string | null;
  file_type: "pdf" | "image" | "audio" | "video" | "link";
  storage_path: string | null;
  drive_file_id: string | null;
  web_view_link: string | null;
  created_by: string;
  approved_by: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

// Announcements
export interface Announcement {
  id: string;
  created_by: string;
  scope: "all" | "subject" | "class_type" | "cohort";
  subject_filter: string | null;
  class_type_filter: string | null;
  title: string;
  body: string;
  link: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Communities
export interface Community {
  id: string;
  name: string;
  slug: string;
  subject: string;
  description: string | null;
  is_active: boolean;
  member_count?: number;
  created_at: string;
}

export interface CommunityMessage {
  id: string;
  community_id: string;
  sender_id: string;
  body: string;
  is_announcement: boolean;
  created_at: string;
  updated_at: string;
}

// Assessments
export interface StudentAssessment {
  id: string;
  student_id: string;
  course: string;
  target_score: string | null;
  previous_score: string | null;
  exam_date: string | null;
  mock_tests_count: number;
  mock_tests_scores: object[];
  pass_probability: number | null;
  total_classes_attended: number | null;
  tutor_assessment: number | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentHistory {
  id: string;
  student_id: string;
  tutor_id: string;
  assessment_date: string;
  score: number;
  assessment_details: string;
  created_at: string;
}

// Templates
export interface Template {
  id: string;
  section: string;
  title: string;
  content: string;
  order_index: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── API ───────────────────────────────────────────────────────────────────────

export const api = {
  // ─── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    login: (email: string, password: string) =>
      request<ApiResponse<{ access_token: string; refresh_token: string; user: UserProfile }>>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),
    logout: () => request("/auth/logout", { method: "POST" }),
    refresh: (refresh_token: string) =>
      request("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token }) }),
  },

  // ─── Profiles ────────────────────────────────────────────────────────────
  profiles: {
    me: () => request<ApiResponse<UserProfile>>("/profiles/me"),
    updateMe: (body: { name?: string; phone?: string; subject_preferences?: string[] }) =>
      request<ApiResponse<UserProfile>>("/profiles/me", { method: "PATCH", body: JSON.stringify(body) }),
    get: (id: string) => request<ApiResponse<UserProfile>>(`/profiles/${id}`),
    list: (params?: { role?: string; page?: number; limit?: number }) =>
      request<ApiResponse<{ profiles: UserProfile[]; total: number }>>(`/profiles${qs(params)}`),
  },

  // ─── Student Access ───────────────────────────────────────────────────────
  access: {
    mine: () => request<ApiResponse<StudentAccess[]>>("/access/me"),
    byStudent: (studentId: string) =>
      request<ApiResponse<StudentAccess[]>>(`/access/student/${studentId}`),
    upsert: (body: {
      student_id: string;
      subject: string;
      allow_master?: boolean;
      allow_quad?: boolean;
      allow_one_to_one?: boolean;
      expiry_date?: string;
      one_to_one_quota?: number;
      course_expiry_at?: string;
      status?: string;
    }) => request<ApiResponse<StudentAccess>>("/access", { method: "POST", body: JSON.stringify(body) }),
    revoke: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/access/${id}`, { method: "DELETE" }),
  },

  // ─── Tutors ───────────────────────────────────────────────────────────────
  tutors: {
    list: () => request<ApiResponse<Tutor[]>>("/tutors"),
    get: (id: string) => request<ApiResponse<Tutor>>(`/tutors/${id}`),
    update: (id: string, body: Partial<Tutor>) =>
      request<ApiResponse<Tutor>>(`/tutors/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    workingHours: (id: string) =>
      request<ApiResponse<TutorWorkingHours[]>>(`/tutors/${id}/working-hours`),
    upsertWorkingHours: (id: string, body: Partial<TutorWorkingHours> | Partial<TutorWorkingHours>[]) =>
      request<ApiResponse<TutorWorkingHours[]>>(`/tutors/${id}/working-hours`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    breaks: (id: string, date?: string) =>
      request<ApiResponse<TutorBreak[]>>(`/tutors/${id}/breaks${qs({ date })}`),
    createBreak: (id: string, body: { break_date: string; start_time: string; end_time: string; duration_minutes?: number }) =>
      request<ApiResponse<TutorBreak>>(`/tutors/${id}/breaks`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    deleteBreak: (id: string, breakId: string) =>
      request<ApiResponse<{ message: string }>>(`/tutors/${id}/breaks/${breakId}`, { method: "DELETE" }),
  },

  // ─── Quad Slots ───────────────────────────────────────────────────────────
  slots: {
    listQuad: (params?: { subject?: string; tutor_id?: string; status?: string; from?: string; to?: string }) =>
      request<ApiResponse<QuadSlot[]>>(`/slots/quad${qs(params)}`),
    getQuad: (id: string) => request<ApiResponse<QuadSlot>>(`/slots/quad/${id}`),
    createQuad: (body: Partial<QuadSlot>) =>
      request<ApiResponse<QuadSlot>>("/slots/quad", { method: "POST", body: JSON.stringify(body) }),
    updateQuad: (id: string, body: Partial<QuadSlot>) =>
      request<ApiResponse<QuadSlot>>(`/slots/quad/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    deleteQuad: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/slots/quad/${id}`, { method: "DELETE" }),
    bookQuad: (slotId: string) =>
      request<ApiResponse<QuadBooking>>(`/slots/quad/${slotId}/book`, { method: "POST" }),
    myQuadBookings: () => request<ApiResponse<QuadBooking[]>>("/slots/quad/bookings/mine"),
    slotBookings: (slotId: string) =>
      request<ApiResponse<QuadBooking[]>>(`/slots/quad/${slotId}/bookings`),
    cancelQuadBooking: (bookingId: string, cancel_reason?: string) =>
      request<ApiResponse<QuadBooking>>(`/slots/quad/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ cancel_reason }),
      }),
    listO2O: (params?: { tutor_id?: string; student_id?: string; status?: string; from?: string; to?: string }) =>
      request<ApiResponse<O2OSlot[]>>(`/slots/o2o${qs(params)}`),
    createO2O: (body: Partial<O2OSlot>) =>
      request<ApiResponse<O2OSlot>>("/slots/o2o", { method: "POST", body: JSON.stringify(body) }),
    updateO2O: (id: string, body: Partial<O2OSlot>) =>
      request<ApiResponse<O2OSlot>>(`/slots/o2o/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    deleteO2O: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/slots/o2o/${id}`, { method: "DELETE" }),
  },

  // ─── Tickets ─────────────────────────────────────────────────────────────
  tickets: {
    list: (params?: { status?: string; subject?: string; priority?: string }) =>
      request<ApiResponse<Ticket[]>>(`/tickets${qs(params)}`),
    get: (id: string) =>
      request<ApiResponse<Ticket & { messages: TicketMessage[] }>>(`/tickets/${id}`),
    create: (body: { subject: string; category: string; title: string }) =>
      request<ApiResponse<Ticket>>("/tickets", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: { status?: string; priority?: string; assigned_tutor?: string }) =>
      request<ApiResponse<Ticket>>(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    addMessage: (id: string, body: string) =>
      request<ApiResponse<TicketMessage>>(`/tickets/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    pin: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/tickets/${id}/pin`, { method: "POST" }),
    unpin: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/tickets/${id}/pin`, { method: "DELETE" }),
  },

  // ─── Materials ────────────────────────────────────────────────────────────
  materials: {
    list: (params?: { subject?: string; category?: string; file_type?: string; is_approved?: boolean }) =>
      request<ApiResponse<Material[]>>(`/materials${qs(params)}`),
    get: (id: string) => request<ApiResponse<Material>>(`/materials/${id}`),
    create: (body: Partial<Material>) =>
      request<ApiResponse<Material>>("/materials", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Material>) =>
      request<ApiResponse<Material>>(`/materials/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    approve: (id: string) =>
      request<ApiResponse<Material>>(`/materials/${id}/approve`, { method: "PATCH" }),
    delete: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/materials/${id}`, { method: "DELETE" }),
  },

  // ─── Announcements ────────────────────────────────────────────────────────
  announcements: {
    list: (params?: { scope?: string; subject?: string }) =>
      request<ApiResponse<Announcement[]>>(`/announcements${qs(params)}`),
    create: (body: Partial<Announcement>) =>
      request<ApiResponse<Announcement>>("/announcements", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Announcement>) =>
      request<ApiResponse<Announcement>>(`/announcements/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/announcements/${id}`, { method: "DELETE" }),
  },

  // ─── Communities ──────────────────────────────────────────────────────────
  communities: {
    list: () => request<ApiResponse<Community[]>>("/communities"),
    get: (slug: string) => request<ApiResponse<Community>>(`/communities/${slug}`),
    messages: (slug: string, params?: { page?: number; limit?: number }) =>
      request<ApiResponse<CommunityMessage[]>>(`/communities/${slug}/messages${qs(params)}`),
    postMessage: (slug: string, body: string, is_announcement = false) =>
      request<ApiResponse<CommunityMessage>>(`/communities/${slug}/messages`, {
        method: "POST",
        body: JSON.stringify({ body, is_announcement }),
      }),
    join: (slug: string) =>
      request<ApiResponse<{ message: string }>>(`/communities/${slug}/join`, { method: "POST" }),
    leave: (slug: string) =>
      request<ApiResponse<{ message: string }>>(`/communities/${slug}/leave`, { method: "POST" }),
  },

  // ─── Assessments ──────────────────────────────────────────────────────────
  assessments: {
    mine: () => request<ApiResponse<StudentAssessment[]>>("/assessments/me"),
    byStudent: (studentId: string) =>
      request<ApiResponse<StudentAssessment[]>>(`/assessments/student/${studentId}`),
    upsert: (body: Partial<StudentAssessment>) =>
      request<ApiResponse<StudentAssessment>>("/assessments", { method: "POST", body: JSON.stringify(body) }),
    history: (studentId: string) =>
      request<ApiResponse<AssessmentHistory[]>>(`/assessments/history/${studentId}`),
    addHistory: (body: { student_id: string; score: number; assessment_details: string }) =>
      request<ApiResponse<AssessmentHistory>>("/assessments/history", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  // ─── Templates ────────────────────────────────────────────────────────────
  templates: {
    pte: (section?: string) =>
      request<ApiResponse<Template[]>>(`/templates/pte${qs({ section })}`),
    upsertPte: (body: Partial<Template>) =>
      request<ApiResponse<Template>>("/templates/pte", { method: "POST", body: JSON.stringify(body) }),
    deletePte: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/templates/pte/${id}`, { method: "DELETE" }),
    predictions: (section?: string) =>
      request<ApiResponse<Template[]>>(`/templates/pte/predictions${qs({ section })}`),
    upsertPrediction: (body: Partial<Template>) =>
      request<ApiResponse<Template>>("/templates/pte/predictions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    deletePrediction: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/templates/pte/predictions/${id}`, { method: "DELETE" }),
    langCert: (section?: string) =>
      request<ApiResponse<Template[]>>(`/templates/language-cert${qs({ section })}`),
    upsertLangCert: (body: Partial<Template>) =>
      request<ApiResponse<Template>>("/templates/language-cert", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    deleteLangCert: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/templates/language-cert/${id}`, { method: "DELETE" }),
  },

  // ─── Writing Questions ────────────────────────────────────────────────────
  writing: {
    list: (task_type?: "task1" | "task2") =>
      request<ApiResponse<WritingQuestion[]>>(
        `/questions/writing${qs({ task_type })}`
      ),
    get: (id: string) => request<ApiResponse<WritingQuestion>>(`/questions/writing/${id}`),
    create: (body: { task_type: string; question_text: string; image_path?: string }) =>
      request<ApiResponse<WritingQuestion>>("/questions/writing", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Partial<WritingQuestion>) =>
      request<ApiResponse<WritingQuestion>>(`/questions/writing/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/questions/writing/${id}`, { method: "DELETE" }),
  },

  // ─── Listening Questions ──────────────────────────────────────────────────
  listening: {
    list: (params?: { part_number?: number; page?: number; limit?: number }) =>
      request<ApiResponse<PaginatedResponse<ListeningQuestion>>>(
        `/questions/listening${qs(params)}`
      ),
    get: (id: string) => request<ApiResponse<ListeningQuestion>>(`/questions/listening/${id}`),
    create: (body: { part_number: number; audio_path?: string; questions: ListeningSubQuestion[] }) =>
      request<ApiResponse<ListeningQuestion>>("/questions/listening", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Partial<ListeningQuestion>) =>
      request<ApiResponse<ListeningQuestion>>(`/questions/listening/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/questions/listening/${id}`, { method: "DELETE" }),
  },

  // ─── Reading Questions ────────────────────────────────────────────────────
  reading: {
    list: (params?: { part_type?: string; page?: number; limit?: number }) =>
      request<ApiResponse<PaginatedResponse<ReadingQuestion>>>(
        `/questions/reading${qs(params)}`
      ),
    get: (id: string) => request<ApiResponse<ReadingQuestion>>(`/questions/reading/${id}`),
    create: (body: Partial<ReadingQuestion>) =>
      request<ApiResponse<ReadingQuestion>>("/questions/reading", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Partial<ReadingQuestion>) =>
      request<ApiResponse<ReadingQuestion>>(`/questions/reading/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/questions/reading/${id}`, { method: "DELETE" }),
  },

  // ─── Mock Tests ───────────────────────────────────────────────────────────
  tests: {
    list: () => request<ApiResponse<{ tests: MockTest[]; total: number }>>("/tests"),
    get: (id: string) => request<ApiResponse<MockTest>>(`/tests/${id}`),
    structure: (id: string) => request<ApiResponse<unknown>>(`/tests/${id}/structure`),
    create: (body: { title: string; description?: string }) =>
      request<ApiResponse<MockTest>>("/tests", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<MockTest>) =>
      request<ApiResponse<MockTest>>(`/tests/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/tests/${id}`, { method: "DELETE" }),
  },

  // ─── Practice Attempts ────────────────────────────────────────────────────
  practice: {
    saveAttempt: (body: { question_type: string; question_set_id: string; score: number; total: number }) =>
      request<ApiResponse<{ id: string }>>("/practice/attempts", { method: "POST", body: JSON.stringify(body) }),
    myAttempts: (question_type?: string) =>
      request<ApiResponse<{ id: string; question_type: string; question_set_id: string; score: number; total: number; created_at: string }[]>>(
        `/practice/attempts/mine${qs({ question_type })}`
      ),
    progress: () =>
      request<
        ApiResponse<{
          modules: {
            speaking: { total: number; practiced: number };
            writing: { total: number; practiced: number };
            reading: { total: number; practiced: number };
            listening: { total: number; practiced: number };
          };
          overall: { total: number; practiced: number };
        }>
      >("/practice/progress"),
  },

  // ─── Users ───────────────────────────────────────────────────────────────
  users: {
    me: () => request<ApiResponse<UserProfile>>("/users/me"),
    list: (params?: { role?: string; search?: string; page?: number; limit?: number }) =>
      request<ApiResponse<{ users: UserProfile[]; total: number; page: number; totalPages: number }>>(
        `/users${qs(params)}`
      ),
    delete: (id: string) =>
      request<ApiResponse<{ message: string }>>(`/users/${id}`, { method: "DELETE" }),
  },
};
