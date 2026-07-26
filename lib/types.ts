// lib/types.ts

export interface SessionRecord {
  id?: number;
  created_at: string;
  tag_name: string;
  session_title?: string;
  duration_seconds: number;
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

export type SessionRecord = {
  // ...existing fields
  todo_id?: string | null;
};
