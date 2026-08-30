/**
 * Typed WebSocket Client for Real-Time Streaming Ingestion.
 */
import { PredictionResponse } from '../types/prediction';

const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  return `ws://${host}:8000/ws/live`;
};

const WS_BASE = getWsUrl();

export type PredictionListener = (prediction: PredictionResponse) => void;
export type StatusListener = (connected: boolean) => void;

export class TelemetryWebSocket {
  private ws: WebSocket | null = null;
  private listeners: PredictionListener[] = [];
  private statusListeners: StatusListener[] = [];
  private reconnectInterval: number = 2000;
  private shouldReconnect: boolean = true;

  constructor(private url: string = WS_BASE) {}

  public onStatusChange(callback: StatusListener) {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  public connect() {
    this.shouldReconnect = true;
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[+] Connected to live forecasting WebSocket at', this.url);
        this.statusListeners.forEach(cb => cb(true));
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
        this.statusListeners.forEach(cb => cb(false));
        console.log('[-] WebSocket disconnected. Reconnecting in', this.reconnectInterval, 'ms...');
        if (this.shouldReconnect) {
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };

      this.ws.onerror = (err) => {
        this.statusListeners.forEach(cb => cb(false));
        console.warn('[!] WebSocket connection attempt pending:', err);
      };
    } catch (e) {
      this.statusListeners.forEach(cb => cb(false));
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    }
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
