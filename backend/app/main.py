from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import engine
from app.database import Base

# Импорт всех моделей для автоматического создания таблиц
import app.models  # noqa: F401

from app.routers import auth, projects, contractors, tax, export
from app.routers.budget import router as budget_router, lines_router
from app.routers.contracts import router as contracts_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # При старте — ничего, миграции через alembic
    yield
    await engine.dispose()


app = FastAPI(
    title="YOMI Finance API",
    description="Система управления финансами кинопроизводства",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роутеры
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(projects.router, prefix=API_PREFIX)
app.include_router(contractors.router, prefix=API_PREFIX)
app.include_router(tax.router, prefix=API_PREFIX)
app.include_router(budget_router, prefix=API_PREFIX)
app.include_router(lines_router, prefix=API_PREFIX)
app.include_router(export.router, prefix=API_PREFIX)
app.include_router(contracts_router, prefix=API_PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
