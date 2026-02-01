from __future__ import annotations

"""
FastAPI backend for the Emotion-Adaptive E-Learning System.

Responsibilities:
- Receive real-time emotion stream events from the frontend via WebSocket.
- Broadcast events to all connected clients (e.g. teacher dashboards).
- Log emotion and learning events to a lightweight SQLite database for research.
- Provide simple analytics/health endpoints.

This backend is intentionally simple and explainable for final-year evaluation.
You can extend the data model or move heavy ML workloads here in future work.
"""

import asyncio
import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "emotion_learning.db"


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------


@contextmanager
def get_db():
  conn = sqlite3.connect(DB_PATH)
  try:
    yield conn
    conn.commit()
  finally:
    conn.close()


def init_db() -> None:
  """Create simple tables for emotion and learning events if they do not exist."""
  with get_db() as conn:
    cur = conn.cursor()
    cur.execute(
      """
      CREATE TABLE IF NOT EXISTS emotion_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        emotion TEXT,
        attention REAL,
        engagement REAL,
        frustration REAL,
        boredom REAL,
        cognitive_load TEXT,
        confidence REAL,
        source TEXT,
        timestamp INTEGER,
        context_mode TEXT,
        context_activity_id TEXT,
        context_question_id TEXT
      )
      """
    )
    cur.execute(
      """
      CREATE TABLE IF NOT EXISTS learning_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        question_id TEXT,
        difficulty TEXT,
        correct INTEGER,
        timestamp INTEGER,
        mode TEXT
      )
      """
    )


# ---------------------------------------------------------------------------
# Pydantic models (mirror frontend EmotionStreamEvent structure)
# ---------------------------------------------------------------------------


class EmotionContext(BaseModel):
  activity_id: Optional[str] = None
  question_id: Optional[str] = None
  mode: Optional[str] = Field(
    default=None, description="static | adaptive | other experiment mode"
  )


class EmotionEvent(BaseModel):
  session_id: str
  emotion: str
  attention: float
  engagement: float
  frustration: float
  boredom: float
  cognitive_load: str
  confidence: float
  source: str
  timestamp: int
  context: Optional[EmotionContext] = None


class LearningEvent(BaseModel):
  session_id: str
  question_id: str
  difficulty: str
  correct: bool
  timestamp: int
  mode: str


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------


app = FastAPI(title="Emotion-Adaptive E-Learning Backend", version="0.1.0")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
  init_db()


@app.get("/api/health")
async def health() -> Dict[str, Any]:
  return {"status": "ok"}


@app.post("/api/emotion/log")
async def log_emotion(event: EmotionEvent) -> Dict[str, Any]:
  """Log an emotion event via HTTP (alternative to WebSocket)."""
  with get_db() as conn:
    cur = conn.cursor()
    cur.execute(
      """
      INSERT INTO emotion_events (
        session_id, emotion, attention, engagement, frustration, boredom,
        cognitive_load, confidence, source, timestamp,
        context_mode, context_activity_id, context_question_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      """,
      (
        event.session_id,
        event.emotion,
        event.attention,
        event.engagement,
        event.frustration,
        event.boredom,
        event.cognitive_load,
        event.confidence,
        event.source,
        event.timestamp,
        event.context.mode if event.context else None,
        event.context.activity_id if event.context else None,
        event.context.question_id if event.context else None,
      ),
    )
  return {"status": "logged"}


@app.post("/api/learning/log")
async def log_learning(event: LearningEvent) -> Dict[str, Any]:
  """Log a learning event (question attempt, difficulty, correctness)."""
  with get_db() as conn:
    cur = conn.cursor()
    cur.execute(
      """
      INSERT INTO learning_events (
        session_id, question_id, difficulty, correct, timestamp, mode
      )
      VALUES (?, ?, ?, ?, ?, ?)
      """,
      (
        event.session_id,
        event.question_id,
        event.difficulty,
        int(event.correct),
        event.timestamp,
        event.mode,
      ),
    )
  return {"status": "logged"}


@app.get("/api/analytics/session/{session_id}")
async def get_session_analytics(session_id: str) -> Dict[str, Any]:
  """
  Simple research-friendly export for a single session.
  Returns raw emotion and learning events suitable for offline analysis
  or IEEE-style experiment reporting.
  """
  with get_db() as conn:
    cur = conn.cursor()
    cur.execute(
      "SELECT emotion, attention, engagement, frustration, boredom, cognitive_load, "
      "confidence, source, timestamp, context_mode, context_activity_id, context_question_id "
      "FROM emotion_events WHERE session_id = ? ORDER BY timestamp ASC",
      (session_id,),
    )
    emotion_rows = cur.fetchall()

    cur.execute(
      "SELECT question_id, difficulty, correct, timestamp, mode "
      "FROM learning_events WHERE session_id = ? ORDER BY timestamp ASC",
      (session_id,),
    )
    learning_rows = cur.fetchall()

  emotion_events = [
    {
      "emotion": row[0],
      "attention": row[1],
      "engagement": row[2],
      "frustration": row[3],
      "boredom": row[4],
      "cognitive_load": row[5],
      "confidence": row[6],
      "source": row[7],
      "timestamp": row[8],
      "context": {
        "mode": row[9],
        "activity_id": row[10],
        "question_id": row[11],
      },
    }
    for row in emotion_rows
  ]

  learning_events = [
    {
      "question_id": row[0],
      "difficulty": row[1],
      "correct": bool(row[2]),
      "timestamp": row[3],
      "mode": row[4],
    }
    for row in learning_rows
  ]

  return {
    "session_id": session_id,
    "emotion_events": emotion_events,
    "learning_events": learning_events,
  }


# ---------------------------------------------------------------------------
# WebSocket: emotion streaming + broadcast for teacher dashboards
# ---------------------------------------------------------------------------


class ConnectionManager:
  """
  Very small connection manager that:
  - Tracks all WebSocket connections.
  - Broadcasts received events to all listeners (e.g., teacher dashboards).
  """

  def __init__(self) -> None:
    self.active_connections: Set[WebSocket] = set()
    self.lock = asyncio.Lock()

  async def connect(self, websocket: WebSocket) -> None:
    await websocket.accept()
    async with self.lock:
      self.active_connections.add(websocket)

  async def disconnect(self, websocket: WebSocket) -> None:
    async with self.lock:
      self.active_connections.discard(websocket)

  async def broadcast(self, message: str) -> None:
    async with self.lock:
      to_remove: List[WebSocket] = []
      for ws in self.active_connections:
        try:
          await ws.send_text(message)
        except Exception:
          to_remove.append(ws)
      for ws in to_remove:
        self.active_connections.discard(ws)


manager = ConnectionManager()


@app.websocket("/ws/emotion")
async def websocket_emotion_endpoint(websocket: WebSocket) -> None:
  """
  WebSocket endpoint for real-time emotion streaming.

  Frontend students send EmotionEvent-like JSON payloads every few seconds.
  The backend:
  - Logs each event for research.
  - Broadcasts it to all other connected clients (e.g., teacher dashboards).
  """
  await manager.connect(websocket)
  try:
    while True:
      data = await websocket.receive_text()
      try:
        payload = json.loads(data)
        event = EmotionEvent(**payload)
      except Exception:
        # If parsing fails, ignore this message but keep connection alive.
        continue

      # Log to DB
      await log_emotion(event)

      # Broadcast to all connected clients (including the sender).
      await manager.broadcast(json.dumps(payload))
  except WebSocketDisconnect:
    await manager.disconnect(websocket)

