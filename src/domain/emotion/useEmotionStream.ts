import { useEffect, useMemo, useRef, useState } from "react";
import type {
  EmotionType,
  EmotionStreamEvent,
  UnifiedEmotionState,
} from "@/types/emotion";
import { computeUnifiedEmotionState } from "./emotionEngine";

export interface UseEmotionStreamOptions {
  /**
   * Whether the webcam/face stream is currently active.
   * This is a proxy for visual attention in the absence of full gaze tracking.
   */
  faceStreamActive?: boolean;
  /**
   * Anonymous session identifier. In a full system this would come from
   * auth / backend. For now we generate a stable random ID per browser tab.
   */
  sessionId?: string;
  /**
   * Whether to enable WebSocket streaming. Can be disabled in development.
   */
  enableStreaming?: boolean;
  /**
   * Explicit mode flag to support static vs adaptive benchmarking.
   */
  mode?: "static" | "adaptive";
}

export interface UseEmotionStreamResult {
  /** Latest unified emotion state available to UI and adaptation engine. */
  state: UnifiedEmotionState;
  /** Recent history (limited length) for simple local analytics. */
  history: UnifiedEmotionState[];
  /** Whether the WebSocket is currently connected. */
  wsConnected: boolean;
}

const DEFAULT_WS_URL =
  (import.meta.env.VITE_EMOTION_WS_URL as string | undefined) ??
  "ws://localhost:8000/ws/emotion";

const HISTORY_LIMIT = 300; // ~10 minutes if sampling every 2 seconds

export function useEmotionStream(
  latestEmotion: EmotionType,
  options: UseEmotionStreamOptions = {}
): UseEmotionStreamResult {
  const {
    faceStreamActive = true,
    sessionId,
    enableStreaming = true,
    mode = "adaptive",
  } = options;

  const [state, setState] = useState<UnifiedEmotionState>(() =>
    computeUnifiedEmotionState({
      emotion: "neutral",
      source: "fusion",
      faceStreamActive,
    })
  );
  const [history, setHistory] = useState<UnifiedEmotionState[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string>(
    sessionId ?? `session_${Math.random().toString(36).slice(2)}`
  );

  // Recompute unified state whenever the latest discrete emotion changes.
  useEffect(() => {
    setState((prev) => {
      const next = computeUnifiedEmotionState({
        emotion: latestEmotion,
        lastState: prev,
        faceStreamActive,
      });
      setHistory((prevHistory) => {
        const updated = [...prevHistory, next];
        if (updated.length > HISTORY_LIMIT) {
          updated.shift();
        }
        return updated;
      });
      return next;
    });
  }, [latestEmotion, faceStreamActive]);

  // Maintain a WebSocket connection and periodically stream the current state.
  useEffect(() => {
    if (!enableStreaming) {
      return;
    }

    let cancelled = false;
    let ws: WebSocket | null = null;

    function connect() {
      if (cancelled) return;

      ws = new WebSocket(DEFAULT_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setWsConnected(true);
      };

      ws.onclose = () => {
        if (cancelled) return;
        setWsConnected(false);
        // Simple reconnect with backoff
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        // Errors are surfaced via onclose / reconnection; keep UI simple.
      };
    }

    connect();

    return () => {
      cancelled = true;
      setWsConnected(false);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enableStreaming]);

  // Periodically send the latest state over WebSocket.
  useEffect(() => {
    if (!enableStreaming) return;

    const intervalId = window.setInterval(() => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const payload: EmotionStreamEvent = {
        ...state,
        session_id: sessionIdRef.current,
        context: {
          mode,
        },
      };

      try {
        ws.send(JSON.stringify(payload));
      } catch {
        // Ignore transient send errors; connection handler will reconnect if needed.
      }
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [state, enableStreaming, mode]);

  const result = useMemo<UseEmotionStreamResult>(
    () => ({
      state,
      history,
      wsConnected,
    }),
    [state, history, wsConnected]
  );

  return result;
}

