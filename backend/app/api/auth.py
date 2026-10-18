from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.app.db.database import get_db
from backend.app.db.models import User, AuditLog
from backend.app.core.security import verify_password, get_password_hash, create_access_token
from backend.app.schemas.auth import (
    UserRegister, UserLogin, TokenResponse, UserProfile, PasswordChange
)
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, request: Request, db: Session = Depends(get_db)):
    """Registers a new standard user account and returns an access token."""
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        role="USER",
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Log audit event
    log = AuditLog(
        user_id=user.id,
        event_type="REGISTER",
        description=f"User registered with email: {user.email}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log)
    db.commit()

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Authenticates user credentials and issues a JWT access token."""
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        # Audit failed login attempt
        log = AuditLog(
            user_id=user.id if user else None,
            event_type="FAILED_LOGIN",
            description=f"Failed login attempt for email: {login_in.email}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(log)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently inactive. Please contact support."
        )

    # Audit successful login
    log = AuditLog(
        user_id=user.id,
        event_type="LOGIN",
        description="User logged in successfully.",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log)
    db.commit()

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }

@router.get("/me", response_model=UserProfile)
def get_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile details."""
    return current_user

@router.post("/change-password")
def change_password(
    pwd_in: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows an authenticated user to change their password."""
    if not verify_password(pwd_in.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed."
        )

    current_user.hashed_password = get_password_hash(pwd_in.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()

    log = AuditLog(
        user_id=current_user.id,
        event_type="PASSWORD_CHANGE",
        description="User password successfully changed."
    )
    db.add(log)
    db.commit()

    return {"message": "Password updated successfully."}
