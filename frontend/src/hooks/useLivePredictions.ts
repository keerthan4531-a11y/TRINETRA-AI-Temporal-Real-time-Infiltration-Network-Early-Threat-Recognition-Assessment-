import { useState, useEffect, useRef } from 'react';
import { PredictionResponse } from '../types/prediction';
import { TelemetryWebSocket } from '../api/websocket';

export function useLivePredictions(maxHistory: number = 30) {
  const [timeline, setTimeline] = useState<PredictionResponse[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<TelemetryWebSocket | null>(null);

  useEffect(() => {
    const ws = new TelemetryWebSocket();
    wsRef.current = ws;
    
    const unsubStatus = ws.onStatusChange((connected) => {
      setIsConnected(connected);
    });

    ws.connect();

    const unsubscribe = ws.subscribe((pred: PredictionResponse) => {
      setCurrentPrediction(pred);
      setTimeline((prev) => {
        const next = [...prev, pred];
        if (next.length > maxHistory) {
          return next.slice(next.length - maxHistory);
        }
        return next;
      });
    });

    return () => {
      unsubStatus();
      unsubscribe();
      ws.disconnect();
      setIsConnected(false);
    };
  }, [maxHistory]);

  const loadBatchTimeline = (batch: PredictionResponse[]) => {
    setTimeline(batch);
    if (batch.length > 0) {
      setCurrentPrediction(batch[batch.length - 1]);
    }
  };

  return {
    timeline,
    currentPrediction,
    isConnected,
    loadBatchTimeline,
  };
}
