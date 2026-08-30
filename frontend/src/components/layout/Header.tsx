import React, { useState, useEffect } from 'react';
import { Clock, Cpu, Activity, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  device: string;
  isStreaming?: boolean;
  activeTabTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  device,
  isStreaming = true,
  activeTabTitle = 'SOC Command Center'
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [utcMode, setUtcMode] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(utcMode ? now.toUTCString().slice(17, 25) + ' UTC' : now.toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [utcMode]);

  return (
    <header
      className="ios-glass"
      style={{
        height: '68px',
        margin: '12px 16px 0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 10,
        borderRadius: '16px',
      }}
    >
      {/* Left: Operational Brand & Active Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)',
              border: '1px solid rgba(0, 217, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(0, 217, 255, 0.25)',
            }}
          >
            <Activity size={17} color="var(--cyan-accent)" />
          </div>
          <div>
            <h1 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, letterSpacing: '0.04em', color: '#f8fafc' }}>
              TRINETRA-AI <span style={{ color: 'var(--cyan-accent)', fontWeight: 400 }}>//</span> {activeTabTitle}
            </h1>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              NTRO CYBER WARFARE DEFENSE • PROACTIVE WORLD MODEL
            </div>
          </div>
        </div>

        {/* Live Stream Status Pill */}
        <div
          className="ios-glass-pill"
          style={{
            borderColor: isStreaming ? 'rgba(0, 217, 255, 0.35)' : 'rgba(100, 116, 139, 0.25)',
            color: isStreaming ? 'var(--cyan-accent)' : 'var(--text-muted)',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
          }}
        >
          <span className={isConnected ? 'pulse-dot-green' : 'pulse-dot-red'} />
          {isStreaming ? 'LIVE STREAM SYNCHRONIZED' : 'STREAM STANDBY'}
        </div>

        {/* SIH-2026 Badge */}
        <div
          className="ios-glass-pill"
          style={{
            borderColor: 'rgba(255, 153, 51, 0.35)',
            background: 'rgba(255, 153, 51, 0.08)',
            color: '#ff9933',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
          }}
        >
          <ShieldCheck size={11} color="#ff9933" />
          SIH 2026 • NTRO PS-26153
        </div>
      </div>

      {/* Right: Telemetry Specs & Live Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Hardware Status Tag */}
        <div
          className="ios-glass-pill"
          style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
          }}
        >
          <Cpu size={12} color="var(--text-muted)" />
          <span>{device}</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span>16GB RAM</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ color: 'var(--severity-normal)' }}>10.20ms</span>
        </div>

        {/* Live Clock with Local/UTC Toggle */}
        <button
          onClick={() => setUtcMode(!utcMode)}
          className="ios-glass-btn"
          title="Click to toggle Local / UTC format"
          style={{
            padding: '5px 12px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-highlight)',
          }}
        >
          <Clock size={13} color="var(--cyan-accent)" />
          <span>{timeStr || '00:00:00'}</span>
        </button>

        {/* Connection Dot */}
        <div
          className="ios-glass-pill"
          style={{
            padding: '4px 10px',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            borderColor: isConnected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 56, 96, 0.35)',
            color: isConnected ? 'var(--severity-normal)' : 'var(--severity-critical)',
          }}
        >
          <span className={isConnected ? 'pulse-dot-green' : 'pulse-dot-red'} />
          <span>{isConnected ? 'WEBSOCKET ACTIVE' : 'DISCONNECTED'}</span>
        </div>
      </div>
    </header>
  );
};
