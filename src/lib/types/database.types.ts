export type SourceType = "text" | "file";
export type QuizStatus = "generating" | "ready" | "failed";
export type StudyActivity = "flashcards" | "quiz" | "reading";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
  lifetime_points: number;
  unlocked_themes: string[];
  active_theme: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  streak_freezes_available: number;
  freeze_week_start: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at: string | null;
}

export interface LeaderboardRow {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  is_self: boolean;
  period_points: number;
  total_points: number;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Material {
  id: string;
  subject_id: string;
  topic_id: string | null;
  user_id: string;
  title: string;
  content: string;
  source_type: SourceType;
  file_path: string | null;
  file_type: string | null;
  created_at: string;
}

export interface Flashcard {
  id: string;
  subject_id: string;
  material_id: string | null;
  topic_id: string | null;
  user_id: string;
  front: string;
  back: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
  last_reviewed_at: string | null;
  created_at: string;
}

export interface Quiz {
  id: string;
  subject_id: string;
  material_id: string | null;
  user_id: string;
  title: string;
  status: QuizStatus;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  topic_id: string | null;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total: number;
  completed_at: string | null;
  created_at: string;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  topic_id: string | null;
  selected_index: number | null;
  is_correct: boolean;
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string | null;
  activity: StudyActivity;
  duration_seconds: number;
  created_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  entry_date: string; // YYYY-MM-DD
  mood: number; // 1-5
  stress_level: number; // 0-100
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface TopicMastery {
  topic_id: string;
  topic_name: string;
  subject_id: string;
  correct: number;
  total: number;
  accuracy: number;
}
