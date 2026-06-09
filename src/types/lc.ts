export type LcRole = "user" | "admin";

export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing";

export type QuestionType = "dialogue" | "rapid_review";

export type CefrLevel = "B1" | "B2" | "C1" | "C2";

export interface LcUserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: LcRole;
  exam_date: string | null;
  target_level: CefrLevel | null;
  created_at: string;
  updated_at: string;
}

export interface LcSubscription {
  id: string;
  user_id: string;
  plan: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface LcAttempt {
  id: string;
  user_id: string;
  question_id: string;
  question_type: QuestionType;
  score: number | null;
  max_score: number;
  completed_at: string;
}
