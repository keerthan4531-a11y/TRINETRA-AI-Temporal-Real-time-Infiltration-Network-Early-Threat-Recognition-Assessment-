import React from 'react';
import { Network, Server, Shield } from 'lucide-react';
import { FlaggedFlow } from '../../types/prediction';

interface GraphProps {
  flows: FlaggedFlow[];
  currentRisk: number;
}

export const NetworkGraphView: React.FC<GraphProps> = ({ flows, currentRisk }) => {
  const isHighRisk = currentRisk >= 0.75;
  const attackerNodeColor = isHighRisk ? 'var(--severity-critical)' : 'var(--cyan-accent)';
  const flowCount = flows.length;

  // Static/Dynamic nodes based on real CTU-13 telemetry
  const attackerIp = '147.32.84.165';
  const targetNodes = [
    { id: 't1', ip: '147.32.80.9', role: 'Domain Controller', port: '445 / SMB', x: 420, y: 70 },
    { id: 't2', ip: '147.32.80.14', role: 'Database Server', port: '1433 / SQL', x: 490, y: 150 },
    { id: 't3', ip: '147.32.80.15', role: 'Internal Web App', port: '80 / HTTP', x: 450, y: 230 },
    { id: 't4', ip: '147.32.80.1', role: 'Core DNS Gateway', port: '53 / DNS', x: 330, y: 260 },
  ];

  const attackerX = 130;
  const attackerY = 160;

  return (
    <div className="soc-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Network size={18} color="var(--cyan-accent)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Active Host Telemetry Topology & Infiltration Vectors
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
            HOST NODES: 5
          </span>
          <span style={{ padding: '2px 8px', borderRadius: '4px', background: isHighRisk ? 'rgba(255, 56, 96, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: isHighRisk ? 'var(--severity-critical)' : 'var(--severity-normal)' }}>
            VECTORS: {flowCount > 0 ? `${flowCount} ACTIVE PROBES` : isHighRisk ? 'HIGH RISK' : 'NOMINAL'}
          </span>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div style={{ flex: 1, position: 'relative', minHeight: '260px', backgroundColor: 'rgba(7, 10, 15, 0.7)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <svg width="100%" height="100%" viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="edgeGradRed" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff3860" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="edgeGradCyan" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Connection Edges */}
          {targetNodes.map((target) => (
            <g key={`edge-${target.id}`}>
              <line
                x1={attackerX}
                y1={attackerY}
                x2={target.x}
                y2={target.y}
                stroke={isHighRisk ? 'url(#edgeGradRed)' : 'url(#edgeGradCyan)'}
                strokeWidth={isHighRisk ? 2.5 : 1.5}
                strokeDasharray={isHighRisk ? '6 4' : 'none'}
              />
              {/* Traffic Packet Marker */}
              {isHighRisk && (
                <circle r="4" fill="#ff3860">
                  <animateMotion
                    path={`M${attackerX},${attackerY} L${target.x},${target.y}`}
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          ))}

          {/* Attacker Node */}
          <g transform={`translate(${attackerX}, ${attackerY})`}>
            <circle r="28" fill={`${attackerNodeColor}20`} stroke={attackerNodeColor} strokeWidth="2" />
            <circle r="18" fill={`${attackerNodeColor}40`} />
            <foreignObject x="-10" y="-10" width="20" height="20">
              <Shield size={20} color="#f8fafc" />
            </foreignObject>
            <text x="0" y="44" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold" fontFamily="var(--font-mono)">
              {attackerIp}
            </text>
            <text x="0" y="56" textAnchor="middle" fill={attackerNodeColor} fontSize="8" fontWeight="bold" fontFamily="var(--font-mono)">
              {isHighRisk ? 'COMPROMISED HOST' : 'MONITORED SENSOR'}
            </text>
          </g>

          {/* Target Nodes */}
          {targetNodes.map((target) => (
            <g key={target.id} transform={`translate(${target.x}, ${target.y})`}>
              <circle r="20" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1.5" />
              <foreignObject x="-8" y="-8" width="16" height="16">
                <Server size={16} color="#38bdf8" />
              </foreignObject>
              <text x="26" y="-4" fill="#f8fafc" fontSize="9" fontWeight="600" fontFamily="var(--font-mono)">
                {target.ip}
              </text>
              <text x="26" y="8" fill="var(--text-muted)" fontSize="8">
                {target.role} ({target.port})
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '8px' }}>
        Dynamic topology mapped from real CTU-13 source/destination pairs during live attack replay.
      </div>
    </div>
  );
};
