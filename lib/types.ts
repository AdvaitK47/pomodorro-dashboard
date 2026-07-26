// lib/types.ts

export interface SessionRecord {
  id?: string | number;
  client_session_id?: string;
  user_id?: string;
  created_at: string;
  tag_name: string;
  session_title?: string;
  duration_seconds: number;
  todo_id?: string | null;
}

export type OverlayEffect = "none" | "rain" | "snow" | "sakura" | "fire";

export interface Todo {
  id: string;
  name: string;
  tag: string;
  targetHours: number;
  scheduledDate: string; // YYYY-MM-DD
  createdAt: string;
}
