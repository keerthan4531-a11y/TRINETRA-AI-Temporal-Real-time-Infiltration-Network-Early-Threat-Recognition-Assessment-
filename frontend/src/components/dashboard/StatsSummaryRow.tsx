import React from 'react';
import { Activity, ShieldAlert, Zap, Compass } from 'lucide-react';
import { theme } from '../../styles/theme';

interface StatsProps {
  totalWindows: number;
  activeAlerts: number;
  currentRisk: number; // 0.0 to 1.0
  currentStage: string;
}

export const StatsSummaryRow: React.FC<StatsProps> = ({
  totalWindows,
  activeAlerts,
  currentRisk,
  currentStage,
}) => {
  const riskPct = Math.round(currentRisk * 100);

  const getRiskColor = (p: number) => {
    if (p >= 75) return theme.colors.severityCritical;
    if (p >= 40) return theme.colors.severityMedium;
    return theme.colors.severityNormal;
  };

  const riskColor = getRiskColor(riskPct);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '20px',
      }}
    >
      {/* Card 1: Total Windows Processed */}
      <div className="soc-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            TELEMETRY PROCESSED
          </span>
          <Activity size={16} color="var(--cyan-accent)" />
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
          {totalWindows.toLocaleString()}
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '6px' }}>windows</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          2.0s time-sliced network state frames
        </div>
      </div>

      {/* Card 2: Active Threat Alerts */}
      <div className="soc-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ESCALATED ALERTS (&ge;75%)
          </span>
          <ShieldAlert size={16} color={activeAlerts > 0 ? 'var(--severity-critical)' : 'var(--severity-normal)'} />
        </div>
        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: activeAlerts > 0 ? 'var(--severity-critical)' : 'var(--severity-normal)',
          }}
        >
          {activeAlerts}
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '6px' }}>events</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Filtered by N=2 window persistence
        </div>
      </div>

      {/* Card 3: Infiltration Risk Score */}
      <div className="soc-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            INFILTRATION THREAT SCORE
          </span>
          <Zap size={16} color={riskColor} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: riskColor }}>
            {riskPct}%
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: riskColor }}>
            {riskPct >= 75 ? 'HIGH ALERT' : riskPct >= 40 ? 'ELEVATED' : 'NOMINAL'}
          </span>
        </div>
        {/* Progress Mini Bar */}
        <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${riskPct}%`,
              height: '100%',
              backgroundColor: riskColor,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Card 4: Model Lead Time & Horizon */}
      <div className="soc-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            FORECAST LEAD TIME
          </span>
          <Compass size={16} color="var(--cyan-accent)" />
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cyan-accent)' }}>
          +1.50s
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '6px' }}>early warning</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          World Model K=5 Rollout (Stage: <strong style={{ color: '#f8fafc' }}>{currentStage}</strong>)
        </div>
      </div>
    </div>
  );
};
