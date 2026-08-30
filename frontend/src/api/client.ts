/**
 * Typed REST API client matching serving/api.py endpoints.
 */
import { AnalyzeFileResponse, SystemHealth } from '../types/prediction';

const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const host = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '127.0.0.1' : (typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1');
  return `http://${host}:8000`;
};

const API_BASE = getApiBase();

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function uploadTrafficFile(file: File): Promise<AnalyzeFileResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'File analysis failed');
  }

  return res.json();
}

export async function runDemoScenario(scenario: 'benign' | 'attack'): Promise<AnalyzeFileResponse> {
  const res = await fetch(`${API_BASE}/api/demo/${scenario}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Demo scenario '${scenario}' failed`);
  }
  return res.json();
}
