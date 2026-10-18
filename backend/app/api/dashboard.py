from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models import User
from backend.app.schemas.assessment import DashboardSummary
from backend.app.api.deps import get_current_user
from backend.app.services.analytics import get_user_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["User Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def user_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated metrics, trend points, and wellness indicators for the current user.
    """
    return get_user_dashboard_summary(current_user.id, db)
