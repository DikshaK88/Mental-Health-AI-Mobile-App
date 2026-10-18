from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Index
)
from sqlalchemy.orm import relationship
from backend.app.db.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="USER", nullable=False)  # USER or ADMIN
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Feature Inputs
    age = Column(Integer, nullable=False)
    gender = Column(String(50), nullable=False)
    academic_pressure = Column(Integer, nullable=False)  # 1 to 5
    study_satisfaction = Column(Integer, nullable=False)  # 1 to 5
    sleep_duration = Column(String(50), nullable=False)  # 'Less than 5 hours', etc.
    study_hours = Column(Integer, nullable=False)  # Daily study/work hours
    financial_stress = Column(Integer, nullable=False)  # 1 to 5
    social_support = Column(String(50), nullable=False)  # 'Low', 'Medium', 'High'
    family_history = Column(String(50), nullable=False)  # 'No', 'Yes'
    attendance = Column(Integer, nullable=False)  # 0 to 100 percentage
    
    # Prediction Results
    prediction_label = Column(String(100), nullable=False)  # "Depression Risk Detected" or "No Depression Detected"
    prediction_code = Column(Integer, nullable=False)  # 1 or 0
    probability = Column(Float, nullable=False)  # Model risk probability 0.0 - 1.0
    risk_level = Column(String(50), nullable=False)  # "Low", "Moderate", "High"
    model_version = Column(String(50), nullable=False, default="1.0.0")
    model_type = Column(String(100), nullable=False, default="Random Forest")
    feature_importance_snapshot = Column(JSON, nullable=True)  # Key factor contributions
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    # Relationship
    user = relationship("User", back_populates="assessments")

class ModelMetric(Base):
    __tablename__ = "model_metrics"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)  # "Random Forest", "XGBoost"
    model_version = Column(String(50), nullable=False)
    accuracy = Column(Float, nullable=False)
    precision_score = Column(Float, nullable=False)
    recall_score = Column(Float, nullable=False)
    f1_macro = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=True)
    confusion_matrix = Column(JSON, nullable=False)
    class_report = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    training_samples_count = Column(Integer, nullable=False)
    parameters = Column(JSON, nullable=True)
    trained_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)  # LOGIN, REGISTER, ASSESSMENT, ADMIN_ACTION
    description = Column(Text, nullable=False)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    # Relationship
    user = relationship("User", back_populates="audit_logs")
