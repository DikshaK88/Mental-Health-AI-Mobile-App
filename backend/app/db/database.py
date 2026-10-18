import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Engine initialization with fallback resilience
engine_url = settings.DATABASE_URL
connect_args = {}
if engine_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(engine_url, connect_args=connect_args)
    # Test connection
    with engine.connect() as conn:
        logger.info(f"Database successfully connected using: {engine_url.split('@')[-1] if '@' in engine_url else engine_url}")
except Exception as e:
    logger.warning(f"Failed to connect to primary database ({engine_url}): {e}. Falling back to SQLite.")
    fallback_url = "sqlite:///./mental_health.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency that provides an active database session and ensures cleanup."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Creates database tables and boots the initial administrator user."""
    from backend.app.db.models import User, AuditLog
    from backend.app.core.security import get_password_hash
    from datetime import datetime, timezone

    Base.metadata.create_all(bind=engine)
    
    # Check if admin exists
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == settings.INITIAL_ADMIN_EMAIL).first()
        if not admin_user:
            admin_user = User(
                email=settings.INITIAL_ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                full_name=settings.INITIAL_ADMIN_FULL_NAME,
                role="ADMIN",
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            # Log admin initialization
            log = AuditLog(
                user_id=admin_user.id,
                event_type="SYSTEM_BOOTSTRAP",
                description="Initial administrator account created automatically via configuration."
            )
            db.add(log)
            db.commit()
            logger.info(f"Initial administrator created: {settings.INITIAL_ADMIN_EMAIL}")
    except Exception as ex:
        db.rollback()
        logger.error(f"Error during init_db: {ex}")
    finally:
        db.close()
