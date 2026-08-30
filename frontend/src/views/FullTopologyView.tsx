import React, { useState } from 'react';
import { Network, Zap } from 'lucide-react';
import { FlaggedFlow } from '../types/prediction';

interface FullTopologyViewProps {
  flows?: FlaggedFlow[];
  currentRisk: number;
}

interface NodeDetail {
  id: string;
  name: string;
  ip: string;
  role: string;
  openPorts: string[];
  vulnerability: string;
  riskScore: number;
  status: 'compromised' | 'under_attack' | 'nominal';
  blastRadius: string;
  trafficVolume: string;
}

export const FullTopologyView: React.FC<FullTopologyViewProps> = ({ currentRisk }) => {
  const isAttack = currentRisk >= 0.75;

  const nodes: NodeDetail[] = [
    {
      id: 'attacker',
      name: 'Host 165 (Neris Botnet)',
      ip: '147.32.84.165',
      role: 'Infiltrated Workstation',
      openPorts: ['445/SMB', '1043/P2P', '6667/IRC'],
      vulnerability: 'Rbot Command Injection / Worm Dropper',
      riskScore: isAttack ? 99.8 : 12.0,
      status: isAttack ? 'compromised' : 'nominal',
      blastRadius: 'Entire 147.32.80.0/24 Class-C Subnet',
      trafficVolume: isAttack ? '1.42 MB/s (High Cadence)' : '24.1 KB/s (Idle)',
    },
    {
      id: 'gateway',
      name: 'Border Security Gateway',
      ip: '147.32.80.1',
      role: 'Enterprise Perimeter Firewall',
      openPorts: ['22/SSH', '80/HTTP', '443/HTTPS'],
      vulnerability: 'None (Hardened Cisco ASA Edge)',
      riskScore: isAttack ? 45.0 : 4.0,
      status: isAttack ? 'under_attack' : 'nominal',
      blastRadius: 'Perimeter Transit Point',
      trafficVolume: isAttack ? '4.89 MB/s' : '1.12 MB/s',
    },
    {
      id: 'smb_server',
      name: 'Internal Storage & SMB Host',
      ip: '147.32.80.9',
      role: 'File Server & Backup Repository',
      openPorts: ['445/SMB', '139/NetBIOS', '3389/RDP'],
      vulnerability: 'CVE-2008-4250 (MS08-067 NetAPI Exploit)',
      riskScore: isAttack ? 98.4 : 5.0,
      status: isAttack ? 'under_attack' : 'nominal',
      blastRadius: 'Core Enterprise Credentials & File Share',
      trafficVolume: isAttack ? '840 KB/s' : '82 KB/s',
    },
    {
      id: 'web_server',
      name: 'Intranet Portal Web Server',
      ip: '147.32.80.14',
      role: 'Apache/PHP Corporate Portal',
      openPorts: ['80/HTTP', '443/HTTPS', '8080/Admin'],
      vulnerability: 'Probed by Active TCP SYN Sweep',
      riskScore: isAttack ? 68.0 : 2.0,
      status: isAttack ? 'under_attack' : 'nominal',
      blastRadius: 'Web Tier Session Tokens',
      trafficVolume: isAttack ? '310 KB/s' : '150 KB/s',
    },
    {
      id: 'dns_server',
      name: 'Internal Domain DNS Resolver',
      ip: '147.32.80.15',
      role: 'BIND9 Recursive DNS',
      openPorts: ['53/UDP', '53/TCP', '953/RNDC'],
      vulnerability: 'DNS Tunneling Probe Target',
      riskScore: isAttack ? 32.0 : 1.0,
      status: 'nominal',
      blastRadius: 'Subnet Name Resolution',
      trafficVolume: isAttack ? '120 KB/s' : '90 KB/s',
    },
    {
      id: 'ad_dc',
      name: 'Active Directory Domain Controller',
      ip: '147.32.80.19',
      role: 'Kerberos KDC & Identity Provider',
      openPorts: ['88/Kerberos', '389/LDAP', '445/SMB', '636/LDAPS'],
      vulnerability: 'High-Value Lateral Target',
      riskScore: isAttack ? 85.0 : 3.0,
      status: isAttack ? 'under_attack' : 'nominal',
      blastRadius: 'Complete Domain Forest Takeover',
      trafficVolume: isAttack ? '420 KB/s' : '45 KB/s',
    },
  ];

  const [selectedNode, setSelectedNode] = useState<NodeDetail>(nodes[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
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
              background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.3) 0%, rgba(59, 130, 246, 0.2) 100%)',
              border: '1px solid var(--cyan-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 217, 255, 0.25)',
            }}
          >
            <Network size={22} color="var(--cyan-accent)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '0.03em' }}>
              Interactive Cyber Warfare Attack Topology Canvas
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Real-time CTU-13 network node interaction graph showing lateral trajectory propagation across subnet 147.32.80.0/24.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className="ios-glass-pill" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            Click any node below to inspect details
          </span>
          <div
            className="ios-glass-pill"
            style={{
              color: isAttack ? '#ff3860' : 'var(--severity-normal)',
              borderColor: isAttack ? 'rgba(255, 56, 96, 0.4)' : 'rgba(16, 185, 129, 0.4)',
              fontWeight: 700,
            }}
          >
            <span className={isAttack ? 'pulse-dot-red' : 'pulse-dot-green'} />
            {isAttack ? 'ACTIVE LATERAL ATTACK IN PROGRESS' : 'PERIMETER DEFENSE SECURE'}
          </div>
        </div>
      </div>

      {/* Main Layout: Interactive SVG Graph (Left) & Node Details Inspector (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
        {/* Interactive SVG Canvas */}
        <div
          className="ios-glass"
          style={{
            padding: '24px',
            minHeight: '520px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Subnet Zone Legend */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              display: 'flex',
              gap: '12px',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span style={{ color: '#ff3860' }}>● Compromised Source</span>
            <span style={{ color: '#f97316' }}>● Target Under Exploit</span>
            <span style={{ color: '#38bdf8' }}>● Nominal Target</span>
          </div>

          <svg width="100%" height="460" viewBox="0 0 680 440" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="link-attack-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff3860" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="link-nominal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Links from Attacker (X: 100, Y: 220) */}
            {/* Link to Gateway (X: 280, Y: 220) */}
            <line
              x1="120"
              y1="220"
              x2="260"
              y2="220"
              stroke={isAttack ? 'url(#link-attack-grad)' : 'url(#link-nominal-grad)'}
              strokeWidth={isAttack ? 3 : 1.5}
              strokeDasharray={isAttack ? '6,4' : undefined}
            />

            {/* Links from Gateway to Internal Servers */}
            {/* Gateway to SMB Server (X: 520, Y: 80) */}
            <line
              x1="300"
              y1="220"
              x2="500"
              y2="80"
              stroke={isAttack ? 'url(#link-attack-grad)' : 'url(#link-nominal-grad)'}
              strokeWidth={isAttack ? 3 : 1.5}
              strokeDasharray={isAttack ? '6,4' : undefined}
            />

            {/* Gateway to Web Server (X: 520, Y: 180) */}
            <line
              x1="300"
              y1="220"
              x2="500"
              y2="180"
              stroke={isAttack ? 'url(#link-attack-grad)' : 'url(#link-nominal-grad)'}
              strokeWidth={isAttack ? 2 : 1.5}
            />

            {/* Gateway to DNS Server (X: 520, Y: 280) */}
            <line
              x1="300"
              y1="220"
              x2="500"
              y2="280"
              stroke="url(#link-nominal-grad)"
              strokeWidth="1.5"
            />

            {/* Gateway to Active Directory (X: 520, Y: 380) */}
            <line
              x1="300"
              y1="220"
              x2="500"
              y2="380"
              stroke={isAttack ? 'url(#link-attack-grad)' : 'url(#link-nominal-grad)'}
              strokeWidth={isAttack ? 2.5 : 1.5}
            />

            {/* Animated Pulses on Attack Link */}
            {isAttack && (
              <>
                <circle r="4" fill="#ff3860">
                  <animateMotion path="M 120 220 L 260 220" dur="1s" repeatCount="indefinite" />
                </circle>
                <circle r="4" fill="#f97316">
                  <animateMotion path="M 300 220 L 500 80" dur="1.2s" repeatCount="indefinite" />
                </circle>
                <circle r="4" fill="#f97316">
                  <animateMotion path="M 300 220 L 500 380" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </>
            )}

            {/* Attacker Node (100, 220) */}
            <g
              onClick={() => setSelectedNode(nodes[0])}
              style={{ cursor: 'pointer' }}
              transform="translate(100, 220)"
            >
              {isAttack && (
                <circle r="36" fill="rgba(255, 56, 96, 0.15)" stroke="#ff3860" strokeWidth="1">
                  <animate attributeName="r" values="28;42;28" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                r="26"
                fill={isAttack ? '#2a0a14' : '#0e1726'}
                stroke={isAttack ? '#ff3860' : 'var(--cyan-accent)'}
                strokeWidth={selectedNode.id === 'attacker' ? 3 : 1.5}
              />
              <text y="5" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                SRC
              </text>
              <text y="42" textAnchor="middle" fill="#fca5a5" fontSize="10" fontFamily="var(--font-mono)">
                147.32.84.165
              </text>
              <text y="54" textAnchor="middle" fill="var(--text-muted)" fontSize="8">
                [Infiltrated Host]
              </text>
            </g>

            {/* Gateway Node (280, 220) */}
            <g
              onClick={() => setSelectedNode(nodes[1])}
              style={{ cursor: 'pointer' }}
              transform="translate(280, 220)"
            >
              <circle
                r="24"
                fill="#0e1726"
                stroke="var(--cyan-accent)"
                strokeWidth={selectedNode.id === 'gateway' ? 3 : 1.5}
              />
              <text y="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                GW
              </text>
              <text y="38" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="var(--font-mono)">
                147.32.80.1
              </text>
              <text y="50" textAnchor="middle" fill="var(--text-muted)" fontSize="8">
                [Perimeter Router]
              </text>
            </g>

            {/* Internal Server 1: SMB (520, 80) */}
            <g
              onClick={() => setSelectedNode(nodes[2])}
              style={{ cursor: 'pointer' }}
              transform="translate(520, 80)"
            >
              {isAttack && (
                <circle r="32" fill="rgba(249, 115, 22, 0.15)" stroke="#f97316" strokeWidth="1">
                  <animate attributeName="r" values="24;36;24" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                r="24"
                fill={isAttack ? '#2b1406' : '#0e1726'}
                stroke={isAttack ? '#f97316' : '#38bdf8'}
                strokeWidth={selectedNode.id === 'smb_server' ? 3 : 1.5}
              />
              <text y="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                SMB
              </text>
              <text y="38" textAnchor="middle" fill={isAttack ? '#fed7aa' : '#94a3b8'} fontSize="10" fontFamily="var(--font-mono)">
                147.32.80.9:445
              </text>
              <text y="50" textAnchor="middle" fill={isAttack ? '#ff3860' : 'var(--text-muted)'} fontSize="8" fontWeight="bold">
                {isAttack ? '⚠️ TARGET OF EXPLOIT' : '[File Server]'}
              </text>
            </g>

            {/* Internal Server 2: Web Server (520, 180) */}
            <g
              onClick={() => setSelectedNode(nodes[3])}
              style={{ cursor: 'pointer' }}
              transform="translate(520, 180)"
            >
              <circle
                r="22"
                fill="#0e1726"
                stroke={isAttack ? '#f59e0b' : '#38bdf8'}
                strokeWidth={selectedNode.id === 'web_server' ? 3 : 1.5}
              />
              <text y="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                WEB
              </text>
              <text y="36" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="var(--font-mono)">
                147.32.80.14:80
              </text>
            </g>

            {/* Internal Server 3: DNS Server (520, 280) */}
            <g
              onClick={() => setSelectedNode(nodes[4])}
              style={{ cursor: 'pointer' }}
              transform="translate(520, 280)"
            >
              <circle
                r="22"
                fill="#0e1726"
                stroke="#38bdf8"
                strokeWidth={selectedNode.id === 'dns_server' ? 3 : 1.5}
              />
              <text y="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                DNS
              </text>
              <text y="36" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="var(--font-mono)">
                147.32.80.15:53
              </text>
            </g>

            {/* Internal Server 4: Active Directory (520, 380) */}
            <g
              onClick={() => setSelectedNode(nodes[5])}
              style={{ cursor: 'pointer' }}
              transform="translate(520, 380)"
            >
              <circle
                r="24"
                fill={isAttack ? '#2a0a14' : '#0e1726'}
                stroke={isAttack ? '#ff3860' : 'var(--cyan-accent)'}
                strokeWidth={selectedNode.id === 'ad_dc' ? 3 : 1.5}
              />
              <text y="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                AD
              </text>
              <text y="38" textAnchor="middle" fill={isAttack ? '#fca5a5' : '#94a3b8'} fontSize="10" fontFamily="var(--font-mono)">
                147.32.80.19:88
              </text>
              <text y="50" textAnchor="middle" fill="var(--text-muted)" fontSize="8">
                [Domain Controller]
              </text>
            </g>
          </svg>
        </div>

        {/* Node Details Inspector Drawer (Right) */}
        <div className="ios-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NODE INSPECTOR</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '2px 0 0 0', color: '#f8fafc' }}>
                {selectedNode.name}
              </h3>
            </div>
            <span
              className="ios-glass-pill"
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: selectedNode.status === 'compromised' ? '#ff3860' : selectedNode.status === 'under_attack' ? '#f97316' : '#10b981',
                borderColor: selectedNode.status === 'compromised' ? 'rgba(255, 56, 96, 0.4)' : 'rgba(16, 185, 129, 0.4)',
              }}
            >
              {selectedNode.status.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>IP Address: </span>
              <span style={{ color: 'var(--cyan-accent)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {selectedNode.ip}
              </span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Role / System: </span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{selectedNode.role}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Threat Risk Score: </span>
              <span
                style={{
                  color: selectedNode.riskScore >= 75 ? '#ff3860' : '#10b981',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                }}
              >
                {selectedNode.riskScore.toFixed(1)}%
              </span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Listening Ports: </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {selectedNode.openPorts.map((p, idx) => (
                  <span
                    key={idx}
                    className="ios-glass-pill"
                    style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Vulnerability Profile: </span>
              <div style={{ color: '#fca5a5', marginTop: '2px', fontSize: '0.75rem' }}>
                {selectedNode.vulnerability}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Calculated Blast Radius: </span>
              <div style={{ color: '#f8fafc', marginTop: '2px', fontSize: '0.75rem' }}>
                {selectedNode.blastRadius}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Active Telemetry Volume: </span>
              <div style={{ color: 'var(--cyan-accent)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {selectedNode.trafficVolume}
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              className="ios-glass-btn"
              style={{
                width: '100%',
                padding: '10px',
                color: selectedNode.status === 'compromised' ? '#ff3860' : 'var(--cyan-accent)',
                borderColor: selectedNode.status === 'compromised' ? 'rgba(255, 56, 96, 0.4)' : 'rgba(0, 217, 255, 0.3)',
              }}
              onClick={() => alert(`[PROACTIVE DEFENSE] Automated isolation rule dispatched for host ${selectedNode.ip}`)}
            >
              <Zap size={14} />
              {selectedNode.status === 'compromised' ? 'Isolate Compromised Node' : 'Stage Defensive Rule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
