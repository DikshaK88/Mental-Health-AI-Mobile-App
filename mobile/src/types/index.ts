export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "USER" | "ADMIN";
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: "USER" | "ADMIN";
  user_id: number;
  full_name: string;
  email: string;
}

export interface AssessmentCreate {
  age: number;
  gender: string;
  academic_pressure: number;
  study_satisfaction: number;
  sleep_duration: string;
  study_hours: number;
  financial_stress: number;
  social_support: string;
  family_history: string;
  attendance: number;
}

export interface ContributingFactor {
  factor: string;
  impact: string;
  detail: string;
}

export interface AssessmentResponse {
  id: number;
  user_id: number;
  age: number;
  gender: string;
  academic_pressure: number;
  study_satisfaction: number;
  sleep_duration: string;
  study_hours: number;
  financial_stress: number;
  social_support: string;
  family_history: string;
  attendance: number;
  prediction_label: string;
  prediction_code: number;
  probability: number;
  risk_level: "Low" | "Moderate" | "High";
  model_version: string;
  model_type: string;
  feature_importance_snapshot?: {
    contributing_factors?: ContributingFactor[];
    input_summary?: Record<string, any>;
  };
  created_at: string;
}

export interface AssessmentHistoryItem {
  id: number;
  created_at: string;
  prediction_label: string;
  prediction_code: number;
  probability: number;
  risk_level: "Low" | "Moderate" | "High";
  model_version: string;
  model_type: string;
  academic_pressure: number;
  sleep_duration: string;
  financial_stress: number;
}

export interface DashboardSummary {
  total_assessments: number;
  latest_result: AssessmentResponse | null;
  average_risk_score: number;
  sleep_summary: {
    optimal_sleep_pct: number;
    short_sleep_pct: number;
    latest_sleep?: string;
  };
  stress_summary: {
    avg_academic_pressure: number;
    avg_financial_stress: number;
    latest_academic?: number;
    latest_financial?: number;
  };
  trend_data: Array<{
    id: number;
    date: string;
    risk_score: number;
    probability: number;
    risk_level: string;
    label: string;
  }>;
  recent_activity: Array<{
    id: number;
    date: string;
    risk_level: string;
    label: string;
    model_type: string;
  }>;
}
