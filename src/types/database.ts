/* ============================================
   Database Types (mirrors Supabase schema)
   ============================================ */

export type ActivityStatus = "en_proceso" | "cumplida" | "vencida" | "eliminada";
export type ActivityCategory = "academica" | "personal";
export type ActivityPriority = "baja" | "normal" | "alta" | "urgente";
export type ReminderType = "7_dias" | "5_dias" | "3_dias" | "dia_cierre";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  google_refresh_token: string | null;
  google_access_token: string | null;
  token_expires_at: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  category: ActivityCategory;
  course_name: string | null;
  title: string;
  description: string | null;
  start_date: string;
  due_date: string;
  block_duration_hours: number;
  status: ActivityStatus;
  priority: ActivityPriority;
  file_url: string | null;
  google_event_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  subtasks?: Subtask[];
  reminders?: Reminder[];
}

export interface Subtask {
  id: string;
  activity_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}

export interface Reminder {
  id: string;
  activity_id: string;
  user_id: string;
  remind_at: string;
  type: ReminderType;
  is_sent: boolean;
  created_at: string;
}

export interface FileUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  ai_processed: boolean;
  ai_result: AIExtractionResult | null;
  created_at: string;
}

/* ============================================
   AI Processing Types
   ============================================ */

export interface AIExtractionResult {
  classification: ActivityCategory;
  course_name?: string;
  tasks: AIExtractedTask[];
  follow_up_questions: string[];
  follow_up_voice_message: string | null;
  confidence: number;
}

export interface AIExtractedTask {
  title: string;
  description?: string;
  due_date?: string;
  location?: string | null;
  event_type?: string;
  subtasks?: string[];
}

/* ============================================
   Calendar Types
   ============================================ */

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface CollisionCheckResult {
  hasCollision: boolean;
  suggestedSlot?: TimeSlot;
  originalSlot: TimeSlot;
}
