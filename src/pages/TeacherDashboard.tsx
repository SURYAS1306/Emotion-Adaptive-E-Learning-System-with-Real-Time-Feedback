import { useEffect, useState } from "react";
import type { EmotionStreamEvent } from "@/types/emotion";
import { Card } from "@/components/ui/card";

const WS_URL =
  (import.meta.env.VITE_EMOTION_WS_URL as string | undefined) ??
  "ws://localhost:8000/ws/emotion";

const TeacherDashboard = () => {
  const [lastEvent, setLastEvent] = useState<EmotionStreamEvent | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;

    function connect() {
      if (cancelled) return;
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        setTimeout(connect, 3000);
      };

      ws.onmessage = (event) => {
        try {
          const data: EmotionStreamEvent = JSON.parse(event.data);
          setLastEvent(data);
        } catch {
          // Ignore parse errors
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      setConnected(false);
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-8 emotion-transition">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live view of student emotion and engagement signals as they interact
            with the adaptive quiz.
          </p>
          <p className="text-xs text-muted-foreground">
            WebSocket connection:{" "}
            <span
              className={
                connected ? "text-emerald-500 font-semibold" : "text-red-500"
              }
            >
              {connected ? "connected" : "disconnected"}
            </span>
          </p>
        </div>

        <Card className="p-6 emotion-card">
          {lastEvent ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Last update from session{" "}
                <span className="font-mono text-xs">
                  {lastEvent.session_id}
                </span>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Emotion
                  </p>
                  <p className="text-base font-semibold capitalize">
                    {lastEvent.emotion}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Engagement
                  </p>
                  <p className="text-base font-semibold">
                    {Math.round(lastEvent.engagement * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Attention
                  </p>
                  <p className="text-base font-semibold">
                    {Math.round(lastEvent.attention * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Frustration
                  </p>
                  <p className="text-base font-semibold">
                    {Math.round(lastEvent.frustration * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Boredom
                  </p>
                  <p className="text-base font-semibold">
                    {Math.round(lastEvent.boredom * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Cognitive load
                  </p>
                  <p className="text-base font-semibold capitalize">
                    {lastEvent.cognitive_load}
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>
                  Source: <span className="font-mono">{lastEvent.source}</span>{" "}
                  · Confidence:{" "}
                  <span className="font-semibold">
                    {Math.round(lastEvent.confidence * 100)}%
                  </span>
                </p>
                {lastEvent.context && (
                  <p className="mt-1">
                    Mode:{" "}
                    <span className="font-semibold">
                      {lastEvent.context.mode ?? "n/a"}
                    </span>{" "}
                    · Activity:{" "}
                    <span className="font-mono">
                      {lastEvent.context.activity_id ?? "n/a"}
                    </span>{" "}
                    · Question:{" "}
                    <span className="font-mono">
                      {lastEvent.context.question_id ?? "n/a"}
                    </span>
                  </p>
                )}
                <p className="mt-1">
                  Timestamp:{" "}
                  {new Date(lastEvent.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Waiting for student emotion stream. Once a learner opens the main
              page and allows camera access, their emotion and engagement
              signals will appear here in real time.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;

