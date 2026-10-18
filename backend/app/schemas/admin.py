from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, ConfigDict

class AdminDashboardStats(BaseModel):
    total_users: int
    total_assessments: int
    high_risk_count: int
    moderate_risk_count: int
    low_risk_count: int
    label_distribution: Dict[str, int]
    risk_level_distribution: Dict[str, int]
    assessment_activity_trends: List[Dict[str, Any]]
    active_model_info: Dict[str, Any]
    recent_audit_events: List[Dict[str, Any]]

class AdminUserListItem(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    assessments_count: int

    model_config = ConfigDict(from_attributes=True)

class AdminUserListResponse(BaseModel):
    users: List[AdminUserListItem]
    total: int
    page: int
    page_size: int

class ModelEvaluationComparison(BaseModel):
    random_forest: Dict[str, Any]
    xgboost: Optional[Dict[str, Any]] = None
    best_model_name: str
    trained_at: datetime
    dataset_records_count: int
