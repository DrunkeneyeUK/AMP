const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type EventItem = {
  id: string;
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

async function req<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${BASE}/api${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
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
