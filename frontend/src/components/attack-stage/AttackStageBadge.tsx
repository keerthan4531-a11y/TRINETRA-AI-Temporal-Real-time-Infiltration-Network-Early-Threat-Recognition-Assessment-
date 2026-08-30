import React from 'react';
import {
  ShieldCheck,
  Search,
  KeyRound,
  GitFork,
  Radio,
} from 'lucide-react';

interface AttackStageBadgeProps {
  stage: string;
  tacticId: string;
  severity: string;
  color: string;
  description: string;
}

export const AttackStageBadge: React.FC<AttackStageBadgeProps> = ({
  stage,
  tacticId,
  severity,
  color,
  description,
}) => {
  const getStageIcon = () => {
    if (stage.includes('Recon')) return <Search size={22} color={color} />;
    if (stage.includes('Initial')) return <KeyRound size={22} color={color} />;
    if (stage.includes('Lateral')) return <GitFork size={22} color={color} />;
    if (stage.includes('Command') || stage.includes('C2')) return <Radio size={22} color={color} />;
    return <ShieldCheck size={22} color="var(--severity-normal)" />;
  };

  const stagesList = [
    { name: 'Benign', num: 0 },
    { name: 'Recon', num: 1 },
    { name: 'Initial Access', num: 2 },
    { name: 'Lateral', num: 3 },
    { name: 'C2', num: 4 },
  ];

  const getActiveStageIndex = () => {
    if (stage.includes('Recon')) return 1;
    if (stage.includes('Initial')) return 2;
    if (stage.includes('Lateral')) return 3;
    if (stage.includes('Command') || stage.includes('C2')) return 4;
    return 0;
  };

  const activeIdx = getActiveStageIndex();

  return (
    <div className="soc-card" style={{ padding: '20px' }}>
      {/* Header Pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          PROJECTED MITRE ATT&CK STAGE
        </span>
        <span
          style={{
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            backgroundColor: `${color}20`,
            color: color,
            border: `1px solid ${color}50`,
          }}
        >
          {severity} SEVERITY
        </span>
      </div>

      {/* Main Threat Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            backgroundColor: `${color}15`,
            border: `1px solid ${color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 16px ${color}25`,
            flexShrink: 0,
          }}
        >
          {getStageIcon()}
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0', color: color }}>
            {stage}
          </h2>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            TACTIC IDENTIFIER: <strong style={{ color: '#f8fafc' }}>{tacticId}</strong>
          </div>
        </div>
      </div>

      {/* 5-Step Kill Chain Stepper */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '4px',
          padding: '8px',
          backgroundColor: 'rgba(10, 14, 20, 0.6)',
          borderRadius: '6px',
          marginBottom: '14px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {stagesList.map((s, idx) => {
          const isCurrent = idx === activeIdx;
          const isPast = idx < activeIdx && activeIdx > 0;
          return (
            <div
              key={s.num}
              style={{
                textAlign: 'center',
                padding: '6px 2px',
                borderRadius: '4px',
                backgroundColor: isCurrent ? `${color}25` : isPast ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                border: isCurrent ? `1px solid ${color}` : '1px solid transparent',
              }}
            >
              <div
                style={{
                  fontSize: '0.62rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? color : isPast ? '#94a3b8' : 'var(--text-muted)',
                }}
              >
                {s.name}
              </div>
              <div
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  margin: '4px auto 0',
                  backgroundColor: isCurrent ? color : isPast ? '#38bdf8' : '#334155',
                }}
              />
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  );
};
