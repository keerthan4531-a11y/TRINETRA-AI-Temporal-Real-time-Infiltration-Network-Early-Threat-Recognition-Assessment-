/**
 * Typed WebSocket Client for Real-Time Streaming Ingestion.
 */
import { PredictionResponse } from '../types/prediction';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/live';

export type PredictionListener = (prediction: PredictionResponse) => void;

export class TelemetryWebSocket {
  private ws: WebSocket | null = null;
  private listeners: PredictionListener[] = [];
  private reconnectInterval: number = 3000;
  private shouldReconnect: boolean = true;

  constructor(private url: string = WS_BASE) {}

  public connect() {
    this.shouldReconnect = true;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[+] Connected to live forecasting WebSocket');
    };

    this.ws.onmessage = (event) => {
      try {
        const data: PredictionResponse = JSON.parse(event.data);
        this.listeners.forEach((listener) => listener(data));
      } catch (err) {
        console.error('Failed to parse WebSocket telemetry message:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[-] WebSocket disconnected.');
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    };

    this.ws.onerror = (err) => {
      console.error('[!] WebSocket error:', err);
    };
  }

  public subscribe(listener: PredictionListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
