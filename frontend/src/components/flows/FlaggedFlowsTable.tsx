import React, { useState } from 'react';
import { FlaggedFlow } from '../../types/prediction';
import { ShieldAlert, Search } from 'lucide-react';

interface FlowTableProps {
  flows: FlaggedFlow[];
}

export const FlaggedFlowsTable: React.FC<FlowTableProps> = ({ flows }) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredFlows = flows.filter((f) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      f.src_ip.toLowerCase().includes(q) ||
      f.dst_ip.toLowerCase().includes(q) ||
      String(f.src_port).includes(q) ||
      String(f.dst_port).includes(q) ||
      f.protocol.toLowerCase().includes(q) ||
      f.severity.toLowerCase().includes(q)
    );
  });

  const getSeverityBorder = (sev: string) => {
    if (sev === 'CRITICAL' || sev === 'HIGH') return 'var(--severity-critical)';
    if (sev === 'MEDIUM') return 'var(--severity-medium)';
    return 'var(--severity-low)';
  };

  return (
    <div className="soc-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Table Header & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} color="var(--severity-critical)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Flagged Malicious Telemetry Flows
          </h3>
          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255, 56, 96, 0.15)', color: 'var(--severity-critical)', fontFamily: 'var(--font-mono)' }}>
            {flows.length} events
          </span>
        </div>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(11, 15, 23, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '4px 10px',
            width: '200px',
          }}
        >
          <Search size={13} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Filter IP or port..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              fontSize: '0.75rem',
              outline: 'none',
              width: '100%',
              fontFamily: 'var(--font-mono)',
            }}
          />
        </div>
      </div>

      {/* Table Container */}
      <div style={{ flex: 1, overflowX: 'auto', maxHeight: '280px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '8px 10px' }}>TIME</th>
              <th style={{ padding: '8px 10px' }}>SOURCE ENDPOINT</th>
              <th style={{ padding: '8px 10px' }}>DESTINATION ENDPOINT</th>
              <th style={{ padding: '8px 10px' }}>PROTO</th>
              <th style={{ padding: '8px 10px' }}>BYTES</th>
              <th style={{ padding: '8px 10px' }}>PKTS</th>
              <th style={{ padding: '8px 10px' }}>FLAGS</th>
              <th style={{ padding: '8px 10px' }}>THREAT</th>
            </tr>
          </thead>
          <tbody>
            {filteredFlows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {flows.length === 0 ? 'No malicious flows flagged in recent telemetry.' : 'No flows match filter query.'}
                </td>
              </tr>
            ) : (
              filteredFlows.slice(-12).reverse().map((f, idx) => {
                const borderCol = getSeverityBorder(f.severity);
                return (
                  <tr
                    key={idx}
                    className="row-new"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      borderLeft: `3px solid ${borderCol}`,
                      backgroundColor: idx % 2 === 0 ? 'rgba(15, 23, 42, 0.4)' : 'rgba(10, 14, 20, 0.3)',
                      fontFamily: 'var(--font-mono)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                      +{Math.round(f.timestamp * 10) / 10}s
                    </td>
                    <td style={{ padding: '8px 10px', color: '#38bdf8' }}>
                      {f.src_ip}:{f.src_port}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#f8fafc' }}>
                      {f.dst_ip}:{f.dst_port}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                      <span style={{ padding: '1px 5px', borderRadius: '3px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.68rem' }}>
                        {f.protocol}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>
                      {f.bytes_transferred.toLocaleString()} B
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                      {f.packets_transferred}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--severity-medium)' }}>
                      {f.flags}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backgroundColor: `${borderCol}20`,
                          color: borderCol,
                          border: `1px solid ${borderCol}50`,
                        }}
                      >
                        {f.severity}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
