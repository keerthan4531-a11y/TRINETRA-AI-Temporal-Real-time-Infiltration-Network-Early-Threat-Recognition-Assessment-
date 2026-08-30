import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AlertProps {
  stage: string;
  tacticId: string;
  risk: number;
  onDismiss?: () => void;
}

export const AlertBanner: React.FC<AlertProps> = ({
  stage,
  tacticId,
  risk,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      if (onDismiss) onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [stage, risk]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '24px',
        width: '360px',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid var(--severity-critical)',
        boxShadow: '0 8px 32px rgba(255, 56, 96, 0.35)',
        borderRadius: '8px',
        padding: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        animation: 'slide-in 0.3s ease-out',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} color="var(--severity-critical)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
            CRITICAL ATTACK DETECTED
          </span>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            if (onDismiss) onDismiss();
          }}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
        Threat risk crossed threshold at <strong style={{ color: 'var(--severity-critical)' }}>{Math.round(risk * 100)}%</strong>. Projected stage: <strong style={{ color: '#fff' }}>{stage}</strong> ({tacticId}).
      </div>

      {/* Auto dismiss bar */}
      <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--severity-critical)',
            animation: 'dismiss 6s linear forwards',
          }}
        />
      </div>
    </div>
  );
};
