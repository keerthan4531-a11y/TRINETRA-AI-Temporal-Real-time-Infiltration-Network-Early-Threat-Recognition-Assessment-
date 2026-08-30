/**
 * Enterprise SOC Theme Tokens & Design System Specification.
 * Tailored for high-density, mission-critical cyber defense monitoring.
 */

export const theme = {
  colors: {
    // Deep SOC dark backgrounds
    bgBase: '#070a0f',
    bgSidebar: '#0b0f17',
    bgCard: '#0f172a',
    bgCardHover: '#141e33',
    bgSubtle: 'rgba(15, 23, 42, 0.65)',

    // Borders & Glass
    borderSubtle: 'rgba(56, 189, 248, 0.12)',
    borderGlow: 'rgba(56, 189, 248, 0.35)',
    borderCard: '#1e293b',

    // Signature Accents
    cyanAccent: '#00d9ff',
    cyanMuted: '#0284c7',
    blueAccent: '#3b82f6',

    // Functional Severity Palette
    severityNormal: '#10b981', // Benign / Normal (Green)
    severityLow: '#06b6d4',    // Low threat (Cyan)
    severityMedium: '#f59e0b', // Warning / Elevated (Amber)
    severityHigh: '#f97316',   // High Alert (Orange)
    severityCritical: '#ff3860', // Critical Breach / Red Alert (Threat Rose/Red)

    // Typography
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    textHighlight: '#38bdf8',
  },
  fonts: {
    sans: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'Cascadia Code', monospace",
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  shadows: {
    card: '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.4)',
    glowCyan: '0 0 15px rgba(0, 217, 255, 0.25)',
    glowCritical: '0 0 20px rgba(255, 56, 96, 0.35)',
  }
} as const;

export type Theme = typeof theme;
