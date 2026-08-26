import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
export const TOKEN_KEY = "daysync.access_token";

export type EventItem = {
  id: string;
  company_id: string;
  owner_id: string;
  owner_name?: string;
  owner_color?: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  category: string;
  color: string;
  assignee?: string;
  all_day: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskItem = {
  id: string;
  company_id: string;
  owner_id: string;
  owner_name?: string;
  owner_color?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "done";
  category: string;
  assignee?: string;
  created_at: string;
  updated_at: string;
};

export type CategoryDef = {
  key: string;
  label: string;
  color: string;
  bg: string;
  icon?: string;
};

export type CompanyInfo = {
  id: string;
  name: string;
  logo_url?: string | null;
  brand_color: string;
  visibility_mode: "shared" | "private";
  invite_code?: string;
  categories?: CategoryDef[];
};

export type UserInfo = {
  id: string;
  company_id: string;
  email: string;
  name: string;
  role: "admin" | "employee";
  color: string;
  company?: CompanyInfo | null;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: UserInfo;
  invite_code?: string;
};

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await storage.secureGet(TOKEN_KEY, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = `API ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // Auth
  registerCompany: (body: {
    company_name: string;
    admin_email: string;
    admin_password: string;
    admin_name: string;
    visibility_mode: "shared" | "private";
  }) =>
    req<AuthResponse>("/auth/register-company", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  joinCompany: (body: {
    invite_code: string;
    email: string;
    password: string;
    name: string;
  }) =>
    req<AuthResponse>("/auth/join", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    req<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => req<UserInfo>("/auth/me"),

  // Company
  getCompany: () => req<CompanyInfo>("/company"),
  updateCompany: (body: Partial<CompanyInfo>) =>
    req<CompanyInfo>("/company", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  rotateInvite: () =>
    req<{ invite_code: string }>("/company/rotate-invite", { method: "POST" }),

  // Categories
  listCategories: () => req<CategoryDef[]>("/company/categories"),
  createCategory: (body: { label: string; color: string; bg?: string; icon?: string }) =>
    req<CategoryDef>("/company/categories", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCategory: (key: string, body: Partial<CategoryDef>) =>
    req<CategoryDef>(`/company/categories/${key}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCategory: (key: string) =>
    req<{ ok: boolean }>(`/company/categories/${key}`, { method: "DELETE" }),
  uploadLogo: async (fileUri: string, mime: string) => {
    const token = await storage.secureGet(TOKEN_KEY, "");
    const form = new FormData();
    // Native shape works on iOS/Android; on web we branch.
    // @ts-expect-error RN form data typing
    form.append("file", { uri: fileUri, name: "logo.png", type: mime });
    const res = await fetch(`${BASE}/api/company/logo`, {
      method: "POST",
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      let msg = `Upload ${res.status}`;
      try {
        const j = await res.json();
        msg = j?.detail || msg;
      } catch {}
      throw new Error(msg);
    }
    return (await res.json()) as { logo_url: string };
  },
  uploadLogoWeb: async (blob: Blob) => {
    const token = await storage.secureGet(TOKEN_KEY, "");
    const form = new FormData();
    form.append("file", blob, "logo.png");
    const res = await fetch(`${BASE}/api/company/logo`, {
      method: "POST",
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      let msg = `Upload ${res.status}`;
      try {
        const j = await res.json();
        msg = j?.detail || msg;
      } catch {}
      throw new Error(msg);
    }
    return (await res.json()) as { logo_url: string };
  },

  // Users
  listUsers: () => req<UserInfo[]>("/users"),
  updateMe: (body: { name?: string; color?: string }) =>
    req<UserInfo>("/users/me", { method: "PATCH", body: JSON.stringify(body) }),

  // Events
  listEvents: (params?: { start_after?: string; start_before?: string }) => {
    const qs = new URLSearchParams();
    if (params?.start_after) qs.set("start_after", params.start_after);
    if (params?.start_before) qs.set("start_before", params.start_before);
    const q = qs.toString();
    return req<EventItem[]>(`/events${q ? `?${q}` : ""}`);
  },
  createEvent: (data: Partial<EventItem>) =>
    req<EventItem>(`/events`, { method: "POST", body: JSON.stringify(data) }),
  updateEvent: (id: string, data: Partial<EventItem>) =>
    req<EventItem>(`/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteEvent: (id: string) =>
    req<{ ok: boolean }>(`/events/${id}`, { method: "DELETE" }),
  getEvent: (id: string) => req<EventItem>(`/events/${id}`),

  // Tasks
  listTasks: (params?: {
    status?: string;
    due_after?: string;
    due_before?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.due_after) qs.set("due_after", params.due_after);
    if (params?.due_before) qs.set("due_before", params.due_before);
    const q = qs.toString();
    return req<TaskItem[]>(`/tasks${q ? `?${q}` : ""}`);
  },
  createTask: (data: Partial<TaskItem>) =>
    req<TaskItem>(`/tasks`, { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<TaskItem>) =>
    req<TaskItem>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTask: (id: string) =>
    req<{ ok: boolean }>(`/tasks/${id}`, { method: "DELETE" }),
  getTask: (id: string) => req<TaskItem>(`/tasks/${id}`),

  // Agenda
  agenda: (date: string) =>
    req<{ events: EventItem[]; tasks: TaskItem[] }>(
      `/agenda?date=${encodeURIComponent(date)}`
    ),
};
