"""PulseBoard V10 - Main Application Entry Point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import engine, Base
from app.models import *

from app.api.auth import router as auth_router
from app.api.password import router as password_router
from app.api.notifications import router as notifications_router
from app.api.profile import router as profile_router
from app.api.admin import router as admin_router
from app.api.polls import router as polls_router
from app.api.wall_of_fame import router as wall_of_fame_router
from app.api.ot import router as ot_router
from app.api.performance_analytics import router as perf_router
from app.api.file_manager import router as file_manager_router
from app.api.metric_files import router as metric_files_router
from app.api.metric_config import router as metric_config_router
from app.api.published_metrics import router as published_metrics_router
from app.api.published_metrics import router as published_metrics_router
from app.api.dashboard_v2 import router as dashboard_v2_router
from app.api.member_notifications import router as member_notifications_router
from app.api.user_preferences import router as user_preferences_router
from app.api.skills import router as skills_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=False
)

origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["*"], allow_headers=["*"])

Base.metadata.create_all(bind=engine)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs("uploads/profiles", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/team-photos", StaticFiles(directory="team-photos"), name="team-photos")

app.include_router(auth_router)
app.include_router(password_router)
app.include_router(notifications_router)
app.include_router(profile_router)
app.include_router(admin_router)
app.include_router(polls_router)
app.include_router(wall_of_fame_router)
app.include_router(ot_router)
app.include_router(perf_router)
app.include_router(file_manager_router)
app.include_router(metric_files_router)
app.include_router(metric_config_router)
app.include_router(published_metrics_router)
app.include_router(published_metrics_router)
app.include_router(dashboard_v2_router)
app.include_router(member_notifications_router)
app.include_router(user_preferences_router)
app.include_router(skills_router)


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}
