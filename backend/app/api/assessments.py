
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
import math

from backend.app.db.database import get_db
from backend.app.db.models import User, Assessment, AuditLog
from backend.app.schemas.assessment import (
    AssessmentCreate, AssessmentResponse, AssessmentHistoryResponse, AssessmentHistoryItem
)
from backend.app.api.deps import get_current_user
from backend.app.services.prediction import prediction_service

router = APIRouter(prefix="/assessments", tags=["Assessments"])

@router.post("/", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    assessment_in: AssessmentCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a mental health questionnaire, executes the machine learning model,
    saves the prediction results, and logs the action.
    """
    try:
        pred_result = prediction_service.predict(assessment_in)
    except Exception as ex:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Inference engine error: {str(ex)}"
        )

    assessment = Assessment(
        user_id=current_user.id,
        age=assessment_in.age,
        gender=assessment_in.gender,
        academic_pressure=assessment_in.academic_pressure,
        study_satisfaction=assessment_in.study_satisfaction,
        sleep_duration=assessment_in.sleep_duration,
        study_hours=assessment_in.study_hours,
        financial_stress=assessment_in.financial_stress,
        social_support=assessment_in.social_support,
        family_history=assessment_in.family_history,
        attendance=assessment_in.attendance,
        prediction_label=pred_result["prediction_label"],
        prediction_code=pred_result["prediction_code"],
        probability=pred_result["probability"],
        risk_level=pred_result["risk_level"],
        model_version=pred_result["model_version"],
        model_type=pred_result["model_type"],
        feature_importance_snapshot=pred_result["feature_importance_snapshot"]
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Audit log (minimal, no sensitive answers logged)
    log = AuditLog(
        user_id=current_user.id,
        event_type="ASSESSMENT_SUBMITTED",
        description=f"Assessment #{assessment.id} completed. Outcome: {assessment.risk_level} Risk ({assessment.prediction_label})",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log)
    db.commit()

    return assessment

@router.get("/history", response_model=AssessmentHistoryResponse)
def get_assessment_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    risk_level: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns paginated assessment history strictly belonging to the authenticated user.
    """
    query = db.query(Assessment).filter(Assessment.user_id == current_user.id)
    if risk_level and risk_level.strip():
        query = query.filter(Assessment.risk_level.ilike(f"%{risk_level.strip()}%"))

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    items = (
        query.order_by(desc(Assessment.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment_detail(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves full details of a specific assessment.
    Enforces authorization: users can only inspect their own records.
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment record not found."
        )

    # Ownership or Admin check
    if assessment.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You cannot view assessments belonging to other accounts."
        )

    return assessment
