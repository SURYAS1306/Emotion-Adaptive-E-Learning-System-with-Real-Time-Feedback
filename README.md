## Emotion-Adaptive E-Learning System

This repository implements a research-oriented **Emotion-Adaptive E-Learning System** built on top of the original emotion-aware UI.

The platform combines:

- **Webcam facial emotion recognition** (via `face-api.js`)
- **Text-based emotion detection** (keyword + sentiment-based)
- A **unified emotion & engagement state model**
- A **rule-based adaptive quiz engine**
- A **FastAPI backend** with WebSocket streaming and research-friendly logging
- A basic **teacher dashboard** for live monitoring

---

## Architecture Overview

- **Frontend** (`React + TypeScript + Tailwind + shadcn-ui`)
  - `EmotionCamera`: webcam-based facial emotion detection.
  - `EmotionChat`: text-based emotion/confusion detection.
  - `domain/emotion/emotionEngine.ts`: maps discrete emotions into a **UnifiedEmotionState** including:
    - `emotion`, `attention`, `engagement`, `frustration`, `boredom`, `cognitive_load`, `confidence`, `timestamp`, `source`.
  - `domain/emotion/useEmotionStream.ts`:
    - Maintains current unified state and a local history buffer.
    - Streams events over WebSocket to the backend every few seconds.
  - `domain/learning/AdaptiveQuiz.tsx`:
    - Simple quiz POC with **easy / medium / hard** questions.
    - Decision rules (examples):
      - High frustration + low attention → easier + hint.
      - Bored + high attention → harder questions.
      - High cognitive load + negative affect → recommend break.
  - `pages/Index.tsx`:
    - Central student view:
      - Composes `EmotionCamera`, `EmotionChat`, engagement indicators, and the adaptive quiz.
  - `pages/TeacherDashboard.tsx`:
    - Connects to `/ws/emotion` and shows latest emotion / engagement signals for live monitoring.

- **Backend** (`backend/app/main.py`, FastAPI)
  - `WebSocket /ws/emotion`:
    - Receives **EmotionStreamEvent** payloads from students.
    - Logs each event to SQLite.
    - Broadcasts events to all connected clients (e.g. teacher dashboard).
  - REST endpoints:
    - `GET /api/health` – basic health check.
    - `POST /api/emotion/log` – log emotion event via HTTP.
    - `POST /api/learning/log` – log learning events (question attempts).
    - `GET /api/analytics/session/{session_id}` – export emotion and learning events for a session (research / benchmarking).
  - Storage:
    - Simple **SQLite** database `backend/emotion_learning.db` with:
      - `emotion_events` table (time-series emotion + context).
      - `learning_events` table (question attempts, difficulty, correctness, mode).

- **DevOps**
  - `Dockerfile.frontend` – builds and serves the Vite app with Nginx.
  - `Dockerfile.backend` – runs the FastAPI backend with Uvicorn.
  - `docker-compose.yml`:
    - Spins up both services and wires the WebSocket URL via `VITE_EMOTION_WS_URL`.

---

## Running the System Locally (Development)

### Prerequisites

- Node.js (18+ recommended)
- npm
- Python 3.11+

### 0. Download face-api.js model weights (required for reliable emotion detection)

The webcam emotion detection requires `face-api.js` weights under `public/models/`.

Run:

```sh
cd Emotion_Project
npm install
npm run setup:models
```

This downloads:

- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_expression_model-weights_manifest.json`
- `face_expression_model-shard1`

### 1. Frontend

```sh
cd Emotion_Project
npm run dev
```

The app will start on the Vite dev port (usually `http://localhost:5173`).

### 2. Backend

```sh
cd Emotion_Project
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

This will start the FastAPI backend with:

- WebSocket endpoint at `ws://localhost:8000/ws/emotion`
- REST API at `http://localhost:8000`

Ensure the frontend is configured to use the same WebSocket URL:

- By default `useEmotionStream` uses `VITE_EMOTION_WS_URL` if set, otherwise `ws://localhost:8000/ws/emotion`.

You can set this in a `.env` file for Vite:

```sh
VITE_EMOTION_WS_URL=ws://localhost:8000/ws/emotion
```

---

## Camera troubleshooting (if emotion stays neutral / incorrect)

- Ensure you ran `npm run setup:models` (models must exist in `public/models/`).
- Use good lighting and face the camera (the UI shows:
  - **face=...%** (face detection score)
  - **expr=...%** (dominant expression confidence)
  - status messages like **"No face detected"**)
- If you see repeated “No face detected”, try:
  - moving closer to the camera,
  - increasing ambient light,
  - removing strong backlight.

---

## Running with Docker

From the project root:

```sh
docker-compose up --build
```

Services:

- **backend**: FastAPI on `http://localhost:8000`
- **frontend**: static build served on `http://localhost:4173`

The compose file also sets `VITE_EMOTION_WS_URL=ws://localhost:8000/ws/emotion` for the frontend.

---

## Research & Experimentation Notes

- **Unified emotion representation**
  - Defined in `src/types/emotion.ts` as `UnifiedEmotionState` and `EmotionStreamEvent`.
  - Designed to support:
    - emotion + attention + engagement
    - frustration / boredom indices
    - cognitive load levels
    - IEEE-style, time-series logging.

- **Benchmarking static vs adaptive modes**
  - Each streamed event includes a `context.mode` field (`static` or `adaptive`).
  - Learning events logged via `/api/learning/log` also include `mode`.
  - Use `/api/analytics/session/{session_id}` to export per-session data and compare:
    - Engagement curves
    - Question performance
    - Emotion trajectories between static and adaptive conditions.

- **Extending the Emotion Intelligence Engine**
  - `domain/emotion/emotionEngine.ts` currently uses interpretable heuristics.
  - You can replace these rules with:
    - Learned models,
    - Multimodal fusion (face, gaze, text, interaction),
    - More precise cognitive load estimators.

---

## High-Level Flow

1. **Student view (`/`)**
   - Student opens the app, enables camera.
   - `EmotionCamera` + `EmotionChat` detect emotions.
   - `useEmotionStream` fuses signals into a `UnifiedEmotionState` and streams it to the backend.
   - `AdaptiveQuiz` consumes this state and adjusts difficulty, hints, and break recommendations.

2. **Backend**
   - Receives emotion stream events via WebSocket.
   - Logs them into SQLite for later analysis.
   - Broadcasts them in real time to all connected clients.

3. **Teacher view (`/teacher`)**
   - Connects to `/ws/emotion`.
   - Displays the latest emotion, engagement, frustration, boredom, and cognitive load estimates per session.

4. **Analytics**
   - Use `/api/analytics/session/{session_id}` to export CSV/JSON-style data.
   - Suitable for offline statistical analysis and plotting in Python, R, or MATLAB.

