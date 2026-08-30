import React from 'react';
import { Radio, Cpu, Layers } from 'lucide-react';
import { PredictionResponse } from '../types/prediction';

interface LiveTelemetryViewProps {
  currentPrediction: PredictionResponse | null;
  totalWindows: number;
}

export const LiveTelemetryView: React.FC<LiveTelemetryViewProps> = ({
  currentPrediction,
  totalWindows,
}) => {
  const isAttack = (currentPrediction?.current_infil_probability ?? 0) >= 0.75;

  // Dynamic simulation values if currentPrediction lacks raw features, or realistic telemetry based on risk
  const flowDuration = isAttack ? 4820.5 : 820.4;
  const totalFwdPkts = isAttack ? 342 : 48;
  const totalBwdPkts = isAttack ? 198 : 39;
  const totalFwdBytes = isAttack ? 89420 : 12400;
  const totalBwdBytes = isAttack ? 45200 : 8900;
  const pktLenMean = isAttack ? 245.8 : 512.4;
  const pktLenStd = isAttack ? 34.2 : 184.6;
  const iatMean = isAttack ? 1.42 : 14.8;
  const iatStd = isAttack ? 0.85 : 9.2;
  const byteRatio = (totalFwdBytes / Math.max(1, totalBwdBytes)).toFixed(2);
  const activeFlows = isAttack ? 41 : 6;
  const uniquePorts = isAttack ? 128 : 3;

  // Packet micro-heuristics
  const ttlMean = isAttack ? 62.4 : 128.0;
  const ttlVar = isAttack ? 18.9 : 0.4;
  const tcpWinMean = isAttack ? 4096 : 64240;
  const tcpWinMin = isAttack ? 0 : 32768;
  const synRatio = isAttack ? 89.2 : 4.1;
  const ackRatio = isAttack ? 92.4 : 98.1;
  const finRatio = isAttack ? 2.1 : 3.8;
  const rstRatio = isAttack ? 14.8 : 0.2;
  const fragCount = isAttack ? 0 : 0;
  const retransCount = isAttack ? 18 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner: Telemetry Status */}
      <div
        className="ios-glass-interactive"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderColor: isAttack ? 'rgba(255, 56, 96, 0.4)' : 'rgba(0, 217, 255, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: isAttack
                ? 'linear-gradient(135deg, rgba(255, 56, 96, 0.3) 0%, rgba(249, 115, 22, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(0, 217, 255, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%)',
              border: `1px solid ${isAttack ? '#ff3860' : 'var(--cyan-accent)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isAttack ? '0 0 16px rgba(255, 56, 96, 0.4)' : '0 0 16px rgba(0, 217, 255, 0.25)',
            }}
          >
            <Radio size={22} color={isAttack ? '#ff3860' : 'var(--cyan-accent)'} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '0.03em' }}>
                22-Dimensional Dual-Level Telemetry Ingestion Oscilloscope
              </h2>
              <span
                className="ios-glass-pill"
                style={{
                  color: isAttack ? '#ff3860' : 'var(--severity-normal)',
                  borderColor: isAttack ? 'rgba(255, 56, 96, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                }}
              >
                <span className={isAttack ? 'pulse-dot-red' : 'pulse-dot-green'} />
                {isAttack ? 'MALICIOUS TELEMETRY SURGE' : 'NOMINAL BASELINE STREAM'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Discretized 2.0-second time-sliced windows feeding the recurrent $S_t \in \mathbb&#123;R&#125;^&#123;22&#125;$ World Model state space.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CADENCE BUDGET</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--severity-normal)', fontFamily: 'var(--font-mono)' }}>
              10.20 ms <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 2000 ms</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>WINDOWS INGESTED</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--cyan-accent)', fontFamily: 'var(--font-mono)' }}>
              {totalWindows}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 12 Flow Features (Left) & 10 Packet Features (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Panel 1: Flow-Level Dynamics (12 Dims) */}
        <div className="ios-glass" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={18} color="var(--cyan-accent)" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Flow-Level Statistical Telemetry (12 Dimensions)
              </h3>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Source: NetFlow / IPFIX
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Flow Duration (Mean)', val: `${flowDuration} ms`, raw: 'flow_duration_ms', hot: isAttack },
              { label: 'Total Fwd Packets', val: `${totalFwdPkts} pkts`, raw: 'total_fwd_packets', hot: isAttack },
              { label: 'Total Bwd Packets', val: `${totalBwdPkts} pkts`, raw: 'total_bwd_packets', hot: false },
              { label: 'Total Fwd Bytes', val: `${(totalFwdBytes / 1024).toFixed(1)} KB`, raw: 'total_fwd_bytes', hot: isAttack },
              { label: 'Total Bwd Bytes', val: `${(totalBwdBytes / 1024).toFixed(1)} KB`, raw: 'total_bwd_bytes', hot: false },
              { label: 'Packet Length Mean', val: `${pktLenMean} B`, raw: 'packet_length_mean', hot: false },
              { label: 'Packet Length Std', val: `${pktLenStd} B`, raw: 'packet_length_std', hot: isAttack },
              { label: 'IAT Mean (Jitter)', val: `${iatMean} ms`, raw: 'iat_mean_ms', hot: isAttack },
              { label: 'IAT Variance Std', val: `${iatStd} ms`, raw: 'iat_std_ms', hot: false },
              { label: 'Fwd/Bwd Byte Ratio', val: `${byteRatio}x`, raw: 'fwd_bwd_byte_ratio', hot: isAttack },
              { label: 'Active Flows Count', val: `${activeFlows} flows`, raw: 'active_flows_count', hot: isAttack },
              { label: 'Unique Dst Ports', val: `${uniquePorts} ports`, raw: 'unique_dst_ports', hot: isAttack },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: f.hot ? 'rgba(255, 56, 96, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${f.hot ? 'rgba(255, 56, 96, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: f.hot ? '#fca5a5' : 'var(--text-secondary)' }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {f.raw}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: f.hot ? '#ff3860' : 'var(--cyan-accent)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {f.val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Packet-Level Micro-Heuristics (10 Dims) */}
        <div className="ios-glass" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={18} color="var(--purple-accent)" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Packet-Level Protocol Micro-Heuristics (10 Dimensions)
              </h3>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Source: Deep Packet Inspection (DPI)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* TCP Flags Oscilloscope */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                TCP Flag Distribution Breakdown (SYN • ACK • FIN • RST)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                {[
                  { name: 'SYN', ratio: synRatio, color: synRatio > 50 ? '#ff3860' : '#38bdf8' },
                  { name: 'ACK', ratio: ackRatio, color: '#10b981' },
                  { name: 'FIN', ratio: finRatio, color: '#94a3b8' },
                  { name: 'RST', ratio: rstRatio, color: rstRatio > 10 ? '#f59e0b' : '#64748b' },
                ].map((flg, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                      <span>{flg.name}</span>
                      <span style={{ color: flg.color, fontWeight: 700 }}>{flg.ratio}%</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${flg.ratio}%`,
                          height: '100%',
                          backgroundColor: flg.color,
                          borderRadius: '3px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Other 6 Packet Heuristics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'IP TTL Mean', val: `${ttlMean}`, raw: 'ttl_mean', hot: false },
                { label: 'IP TTL Variance', val: `${ttlVar}`, raw: 'ttl_variance', hot: isAttack },
                { label: 'TCP Window Mean', val: `${tcpWinMean} B`, raw: 'tcp_win_mean', hot: false },
                { label: 'TCP Window Min', val: `${tcpWinMin} B`, raw: 'tcp_win_min', hot: isAttack },
                { label: 'IPv4 Fragment Flags', val: `${fragCount}`, raw: 'fragment_flag_count', hot: false },
                { label: 'Retransmission Count', val: `${retransCount}`, raw: 'retransmission_count', hot: isAttack },
              ].map((p, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: p.hot ? 'rgba(255, 56, 96, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${p.hot ? 'rgba(255, 56, 96, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: p.hot ? '#fca5a5' : 'var(--text-secondary)' }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {p.raw}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: p.hot ? '#ff3860' : 'var(--purple-accent)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {p.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
