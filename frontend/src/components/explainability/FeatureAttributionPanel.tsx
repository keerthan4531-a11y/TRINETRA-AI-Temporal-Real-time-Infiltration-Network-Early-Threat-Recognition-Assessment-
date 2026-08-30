import React from 'react';
import { FeatureAttribution } from '../../types/prediction';
import { HelpCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface AttributionProps {
  features: FeatureAttribution[];
}

export const FeatureAttributionPanel: React.FC<AttributionProps> = ({ features }) => {
  // Find maximum absolute weight for scaling bars
  const maxVal = Math.max(...features.map((f) => Math.abs(f.importance)), 0.001);

  return (
    <div className="soc-card" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={18} color="var(--cyan-accent)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Telemetry Feature Attributions (Real-Time XAI)
          </h3>
        </div>
        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          GRADIENT &times; INPUT ATTRIBUTION
        </span>
      </div>

      {/* Feature Attribution Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
        {features.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', padding: '20px' }}>
            Awaiting telemetry state attribution...
          </div>
        ) : (
          features.slice(0, 5).map((feat, idx) => {
            const isPositive = feat.importance > 0;
            const barWidth = Math.min(100, Math.round((Math.abs(feat.importance) / maxVal) * 100));
            const barColor = isPositive ? 'var(--severity-critical)' : 'var(--severity-normal)';

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{feat.feature}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      val: <strong style={{ color: 'var(--text-secondary)' }}>{typeof feat.raw_value === 'number' ? feat.raw_value.toFixed(2) : feat.raw_value}</strong>
                    </span>
                    <span style={{ color: barColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {feat.importance.toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      backgroundColor: barColor,
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '10px' }}>
        Identifies exact packet & flow metrics driving the World Model risk projection.
      </div>
    </div>
  );
};
