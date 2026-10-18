from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class AssessmentCreate(BaseModel):
    age: int = Field(..., ge=16, le=100, description="Age in years (16-100)")
    gender: str = Field(..., description="Gender (Male, Female, Non-Binary/Other)")
    academic_pressure: int = Field(..., ge=1, le=5, description="Academic/educational pressure (1=Low, 5=Extreme)")
    study_satisfaction: int = Field(..., ge=1, le=5, description="Study or work satisfaction (1=Very Dissatisfied, 5=Very Satisfied)")
    sleep_duration: str = Field(..., description="Daily sleep hours (e.g., 'Less than 5 hours', '5-6 hours', '7-8 hours', 'More than 8 hours')")
    study_hours: int = Field(..., ge=0, le=18, description="Daily study or focused work hours (0-18)")
    financial_stress: int = Field(..., ge=1, le=5, description="Level of financial pressure (1=None/Minimal, 5=Severe)")
    social_support: str = Field(..., description="Availability of social support ('Low', 'Medium', 'High')")
    family_history: str = Field(..., description="Family history of mental health struggles ('No', 'Yes')")
    attendance: int = Field(..., ge=0, le=100, description="Class/work attendance percentage (0-100%)")

class AssessmentResponse(BaseModel):
    id: int
    user_id: int
    age: int
    gender: str
    academic_pressure: int
    study_satisfaction: int
    sleep_duration: str
    study_hours: int
    financial_stress: int
    social_support: str
    family_history: str
    attendance: int
    
    # Prediction details
    prediction_label: str
    prediction_code: int
    probability: float
    risk_level: str
    model_version: str
    model_type: str
    feature_importance_snapshot: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AssessmentHistoryItem(BaseModel):
    id: int
    created_at: datetime
    prediction_label: str
    prediction_code: int
    probability: float
    risk_level: str
    model_version: str
    model_type: str
    academic_pressure: int
    sleep_duration: str
    financial_stress: int

    model_config = ConfigDict(from_attributes=True)

class AssessmentHistoryResponse(BaseModel):
    items: List[AssessmentHistoryItem]
    total: int
    page: int
    page_size: int
    total_pages: int

class DashboardSummary(BaseModel):
    total_assessments: int
    latest_result: Optional[AssessmentResponse] = None
    average_risk_score: float
    sleep_summary: Dict[str, Any]
    stress_summary: Dict[str, Any]
    trend_data: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
