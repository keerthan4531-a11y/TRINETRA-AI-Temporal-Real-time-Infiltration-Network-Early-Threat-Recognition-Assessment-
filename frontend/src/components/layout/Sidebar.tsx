import React, { useState } from 'react';
import {
  ShieldAlert,
  LayoutDashboard,
  Radio,
  Network,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Terminal,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'SOC Operations', icon: LayoutDashboard, badge: 'LIVE' },
    { id: 'live', label: '22-Dim Telemetry', icon: Radio, badge: '22D' },
    { id: 'network', label: 'Attack Topology', icon: Network },
    { id: 'model', label: 'World Model Lab', icon: Cpu, badge: 'K=5' },
    { id: 'cli', label: 'Hacker Terminal', icon: Terminal, badge: 'TUI' },
    { id: 'settings', label: 'Calibration & DB', icon: Settings },
  ];

  return (
    <aside
      className="ios-glass"
      style={{
        width: collapsed ? '72px' : '240px',
        margin: '12px 0 12px 12px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 20,
        userSelect: 'none',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00d9ff 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 217, 255, 0.35)',
            flexShrink: 0,
            transition: 'transform 0.25s ease',
          }}
        >
          <ShieldAlert size={21} color="#06090e" strokeWidth={2.6} />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, letterSpacing: '0.04em', color: '#f8fafc' }}>
              TRINETRA-AI
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--cyan-accent)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              FORECAST ENGINE v2.0
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: collapsed ? '11px 0' : '11px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '10px',
                backgroundColor: isActive ? 'rgba(0, 217, 255, 0.14)' : 'transparent',
                border: 'none',
                borderLeft: isActive ? '3px solid var(--cyan-accent)' : '3px solid transparent',
                boxShadow: isActive ? 'inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 4px 12px rgba(0, 217, 255, 0.15)' : 'none',
                color: isActive ? 'var(--cyan-accent)' : 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
              }}
            >
              <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
              {!collapsed && (
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
              )}
              {!collapsed && item.badge && (
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: isActive ? 'rgba(0, 217, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? 'var(--cyan-accent)' : 'var(--text-muted)',
                    fontWeight: 700,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
        }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ios-glass-btn"
          style={{
            padding: '6px',
            borderRadius: '8px',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>
    </aside>
  );
};
