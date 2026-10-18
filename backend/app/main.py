import sys
from pathlib import Path

# Ensure project root and backend directory are in sys.path
_current_file = Path(__file__).resolve()
_backend_dir = _current_file.parent.parent
_project_root = _backend_dir.parent
for _p in [str(_project_root), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.db.database import init_db
from backend.app.api.auth import router as auth_router
from backend.app.api.assessments import router as assessments_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.admin import router as admin_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables & initial admin account exist
    logger.info("Initializing database and bootstrap configurations...")
    init_db()
    
    # Ensure model artifacts exist or train initial model
    import os
    model_path = os.path.join(settings.MODEL_DIR, "best_model.joblib")
    if not os.path.exists(model_path):
        logger.info("Model artifact not found. Executing initial ML pipeline training...")
        try:
            from backend.app.ml.train_model import train_and_evaluate
            train_and_evaluate()
        except Exception as e:
            logger.warning(f"Initial model training deferred: {e}")
            
    yield
    # Shutdown logic if needed
    logger.info("Application shutting down.")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Full-stack AI-based mental health risk prediction system for academic & screening decision support.",
    lifespan=lifespan
)

# CORS setup
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API V1 routers
api_prefix = settings.API_V1_PREFIX
app.include_router(auth_router, prefix=api_prefix)
app.include_router(assessments_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)
app.include_router(admin_router, prefix=api_prefix)

@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/health", tags=["Health"])
def health_check():
    import os
    model_exists = os.path.exists(os.path.join(settings.MODEL_DIR, "best_model.joblib"))
    dataset_exists = os.path.exists(os.path.join(settings.DATA_DIR, settings.DATASET_FILENAME))
    return {
        "status": "healthy",
        "database": "connected",
        "model_loaded": model_exists,
        "dataset_ready": dataset_exists,
        "model_version": settings.MODEL_VERSION
    }
