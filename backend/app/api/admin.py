from fastapi import APIRouter, Depends, Query, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
import math
from typing import Optional, List, Dict, Any

from backend.app.db.database import get_db
from backend.app.db.models import User, Assessment, ModelMetric, AuditLog
from backend.app.schemas.admin import (
    AdminDashboardStats, AdminUserListResponse, AdminUserListItem
)
from backend.app.api.deps import get_current_admin
from backend.app.services.analytics import get_admin_dashboard_stats
from backend.app.ml.train_model import train_and_evaluate
from backend.app.ml.evaluate_model import get_latest_evaluation

router = APIRouter(prefix="/admin", tags=["Administrative"])

@router.get("/stats", response_model=AdminDashboardStats)
def admin_stats(
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns aggregate platform statistics, risk distribution, and anonymized activity trends.
    """
    return get_admin_dashboard_stats(db)

@router.get("/users", response_model=AdminUserListResponse)
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: Optional[str] = Query(None),
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns paginated user list with assessment activity counts.
    """
    query = db.query(User)
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter((User.email.ilike(term)) | (User.full_name.ilike(term)))

    total = query.count()
    users = (
        query.order_by(desc(User.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    user_items = []
    for u in users:
        count = db.query(Assessment).filter(Assessment.user_id == u.id).count()
        user_items.append(
            AdminUserListItem(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                role=u.role,
                is_active=u.is_active,
                created_at=u.created_at,
                assessments_count=count
            )
        )

    return {
        "users": user_items,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/models")
def get_model_metrics(
    admin_user: User = Depends(get_current_admin)
):
    """
    Returns comparative evaluation metrics between Random Forest and XGBoost.
    """
    try:
        report = get_latest_evaluation()
        return report
    except Exception as ex:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to read model evaluation: {str(ex)}"
        )

@router.post("/retrain")
def retrain_model(
    request: Request,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Triggers complete retraining and evaluation pipeline on the dataset.
    """
    try:
        results = train_and_evaluate(save_artifacts=True)
        
        # Log retraining event
        log = AuditLog(
            user_id=admin_user.id,
            event_type="MODEL_RETRAINED",
            description=f"Model retraining initiated by administrator. Best Model: {results.get('best_model_name')}, Accuracy: {results.get('best_metrics', {}).get('accuracy')}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(log)
        db.commit()

        return {
            "message": "Model training and evaluation pipeline executed successfully.",
            "results": results
        }
    except Exception as ex:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retraining failed: {str(ex)}"
        )

@router.get("/audit-logs")
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns security and operational audit trail records.
    """
    query = db.query(AuditLog)
    total = query.count()
    logs = (
        query.order_by(desc(AuditLog.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "logs": [
            {
                "id": l.id,
                "user_id": l.user_id,
                "event_type": l.event_type,
                "description": l.description,
                "ip_address": l.ip_address,
                "created_at": l.created_at.isoformat()
            }
            for l in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }
