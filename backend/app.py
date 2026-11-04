from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Boolean, DateTime, JSON, String, Text, create_engine, desc, or_, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./omni_memory.db")
CONNECT_ARGS = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=CONNECT_ARGS, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


WORKSPACES = ("general", "coding", "youtube", "creative", "drawing", "automation", "email")
MEMORY_KINDS = ("preference", "project", "decision", "workflow", "reference", "fact")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MemoryRecord(Base):
    __tablename__ = "memories"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    workspace: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    kind: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    source: Mapped[str] = mapped_column(String(80), nullable=False, default="manual")
    pinned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)


class MemoryCreate(BaseModel):
    workspace: Literal["general", "coding", "youtube", "creative", "drawing", "automation", "email"] = "general"
    kind: Literal["preference", "project", "decision", "workflow", "reference", "fact"] = "fact"
    title: str = Field(min_length=1, max_length=180)
    content: str = Field(min_length=1, max_length=12000)
    tags: list[str] = Field(default_factory=list, max_length=20)
    source: str = Field(default="manual", max_length=80)
    pinned: bool = False


class MemoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    workspace: Literal["general", "coding", "youtube", "creative", "drawing", "automation", "email"] | None = None
    kind: Literal["preference", "project", "decision", "workflow", "reference", "fact"] | None = None
    title: str | None = Field(default=None, min_length=1, max_length=180)
    content: str | None = Field(default=None, min_length=1, max_length=12000)
    tags: list[str] | None = Field(default=None, max_length=20)
    source: str | None = Field(default=None, max_length=80)
    pinned: bool | None = None


class MemoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    workspace: str
    kind: str
    title: str
    content: str
    tags: list[str]
    source: str
    pinned: bool
    created_at: datetime
    updated_at: datetime


app = FastAPI(title="OMNI AI Memory API", version="0.1.0",
              description="Local-first persistent memory API for OMNI AI workspaces.")
origins = [v.strip() for v in os.getenv(
    "OMNI_ALLOWED_ORIGINS",
    "http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000,http://127.0.0.1:8000",
).split(",") if v.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                   allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
                   allow_headers=["Content-Type"])


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/api/health")
def health() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("SELECT 1")
        return {"status": "ok", "service": "omni-memory-api", "database": "connected"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database unavailable") from exc


@app.get("/api/workspaces")
def workspaces() -> dict[str, list[str]]:
    return {"workspaces": list(WORKSPACES), "memory_kinds": list(MEMORY_KINDS)}


@app.get("/api/memories", response_model=list[MemoryOut])
def list_memories(workspace: str | None = Query(default=None),
                  kind: str | None = Query(default=None),
                  q: str | None = Query(default=None, max_length=200),
                  limit: int = Query(default=50, ge=1, le=100),
                  db: Session = Depends(get_db)):
    stmt = select(MemoryRecord)
    if workspace:
        if workspace not in WORKSPACES:
            raise HTTPException(status_code=400, detail="Unknown workspace")
        stmt = stmt.where(MemoryRecord.workspace == workspace)
    if kind:
        if kind not in MEMORY_KINDS:
            raise HTTPException(status_code=400, detail="Unknown memory kind")
        stmt = stmt.where(MemoryRecord.kind == kind)
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(or_(MemoryRecord.title.ilike(pattern), MemoryRecord.content.ilike(pattern)))
    stmt = stmt.order_by(desc(MemoryRecord.pinned), desc(MemoryRecord.updated_at)).limit(limit)
    return list(db.scalars(stmt).all())


@app.post("/api/memories", response_model=MemoryOut, status_code=201)
def create_memory(payload: MemoryCreate, db: Session = Depends(get_db)):
    record = MemoryRecord(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.patch("/api/memories/{memory_id}", response_model=MemoryOut)
def update_memory(memory_id: str, payload: MemoryUpdate, db: Session = Depends(get_db)):
    record = db.get(MemoryRecord, memory_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(record, key, value)
    record.updated_at = utc_now()
    db.commit()
    db.refresh(record)
    return record


@app.delete("/api/memories/{memory_id}", status_code=204)
def delete_memory(memory_id: str, db: Session = Depends(get_db)):
    record = db.get(MemoryRecord, memory_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    db.delete(record)
    db.commit()
    return None
