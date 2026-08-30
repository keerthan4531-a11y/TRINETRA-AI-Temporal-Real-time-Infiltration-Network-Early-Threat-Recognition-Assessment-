import React, { useState, useEffect } from 'react';
import { Clock, Cpu, Bell, Activity } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  device: string;
  isStreaming?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isConnected, device, isStreaming = true }) => {
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
      style={{
        height: '64px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        userSelect: 'none',
      }}
    >
      {/* Left: Operational Title & Status Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--cyan-accent)" />
          <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, letterSpacing: '0.02em', color: '#f8fafc' }}>
            SOC Cyber Threat Defense Console
          </h1>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '12px',
            backgroundColor: isStreaming ? 'rgba(0, 217, 255, 0.12)' : 'rgba(100, 116, 139, 0.15)',
            border: `1px solid ${isStreaming ? 'rgba(0, 217, 255, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: isStreaming ? 'var(--cyan-accent)' : 'var(--text-muted)',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isStreaming ? '#00d9ff' : '#64748b' }} />
          {isStreaming ? 'LIVE TELEMETRY STREAM' : 'SYSTEM IDLE'}
        </div>
      </div>

      {/* Right: Technical Meta Badges (Clock, WebSocket, Hardware) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Shipped Threshold Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Bell size={13} color="var(--severity-medium)" />
          <span>ALERT THRESHOLD: <strong style={{ color: 'var(--text-primary)' }}>&tau;=0.75 (N=2)</strong></span>
        </div>

        {/* Device Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Cpu size={14} color="var(--cyan-accent)" />
          <span>{device} • 16GB RAM</span>
        </div>

        {/* Live Clock */}
        <div
          onClick={() => setUtcMode(!utcMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
          title="Click to toggle Local / UTC time"
        >
          <Clock size={13} color="var(--text-muted)" />
          <span>{timeStr}</span>
        </div>

        {/* WebSocket Connection Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 56, 96, 0.1)',
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 56, 96, 0.3)'}`,
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: isConnected ? 'var(--severity-normal)' : 'var(--severity-critical)',
          }}
        >
          <div className={isConnected ? 'pulse-dot-green' : 'pulse-dot-red'} />
          <span>{isConnected ? 'STREAM CONNECTED' : 'DISCONNECTED'}</span>
        </div>
      </div>
    </header>
  );
};
