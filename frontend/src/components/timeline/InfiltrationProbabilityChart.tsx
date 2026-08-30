import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { PredictionResponse } from '../../types/prediction';
import { Activity } from 'lucide-react';

interface ChartProps {
  timeline: PredictionResponse[];
  futureTrajectory?: number[];
}

export const InfiltrationProbabilityChart: React.FC<ChartProps> = ({
  timeline,
  futureTrajectory = [],
}) => {
  // Combine historical timeline and forward trajectory
  const chartData = timeline.slice(-30).map((pt, idx) => ({
    time: `t-${timeline.length - 1 - idx}`,
    observedRisk: Math.round(pt.current_infil_probability * 100),
    stage: pt.predicted_mitre_stage,
    tacticId: pt.tactic_id,
    forecastRisk: null as number | null,
  }));

  // Append forward rollout projection steps
  if (futureTrajectory && futureTrajectory.length > 0 && chartData.length > 0) {
    const lastObs = chartData[chartData.length - 1];
    lastObs.forecastRisk = lastObs.observedRisk;

    futureTrajectory.forEach((futProb, k) => {
      chartData.push({
        time: `t+${k + 1}`,
        observedRisk: null as any,
        stage: 'Rollout Projection',
        tacticId: 'FORECAST',
        forecastRisk: Math.round(futProb * 100),
      });
    });
  }

  // Custom Dark Glass Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const val = payload[0].value;
      const isForecast = label.startsWith('t+');
      return (
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-glow)',
            borderRadius: '6px',
            padding: '10px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            FRAME: <strong style={{ color: '#f8fafc' }}>{label}</strong> {isForecast ? '(K-Step Rollout)' : '(Observed)'}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: val >= 75 ? 'var(--severity-critical)' : val >= 40 ? 'var(--severity-medium)' : 'var(--cyan-accent)' }}>
            INFILTRATION RISK: {val}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
            STAGE: <span style={{ color: '#f8fafc' }}>{data.stage}</span> ({data.tacticId})
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="soc-card" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--cyan-accent)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Threat Infiltration Horizon & K-Step Rollout Forecast
          </h3>
        </div>

        {/* Legend Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', backgroundColor: '#00d9ff', borderRadius: '1px' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Observed Risk (Historical)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #ff3860' }} />
            <span style={{ color: 'var(--text-secondary)' }}>World Model Rollout (t+1..t+5)</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00d9ff" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="time"
              stroke="#475569"
              fontSize={10}
              tickLine={false}
              fontFamily="var(--font-mono)"
            />
            <YAxis
              domain={[0, 100]}
              stroke="#475569"
              fontSize={10}
              tickLine={false}
              fontFamily="var(--font-mono)"
              unit="%"
            />

            {/* Threshold Line at 75% */}
            <ReferenceLine
              y={75}
              stroke="#ff3860"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'ALERT THRESHOLD (tau=0.75)',
                fill: '#ff3860',
                fontSize: 9,
                position: 'insideTopRight',
                fontFamily: 'var(--font-mono)',
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Historical Observed Curve */}
            <Area
              type="monotone"
              dataKey="observedRisk"
              stroke="#00d9ff"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#riskGradient)"
              isAnimationActive={true}
              animationDuration={400}
            />

            {/* K-Step Forward Rollout Line */}
            <Line
              type="monotone"
              dataKey="forecastRisk"
              stroke="#ff3860"
              strokeWidth={2.5}
              strokeDasharray="4 3"
              dot={{ r: 4, fill: '#ff3860', strokeWidth: 1, stroke: '#fff' }}
              isAnimationActive={true}
              animationDuration={400}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
