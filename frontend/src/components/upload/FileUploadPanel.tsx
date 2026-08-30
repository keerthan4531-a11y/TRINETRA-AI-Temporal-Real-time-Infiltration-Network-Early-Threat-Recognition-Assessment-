import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useUploadTraffic } from '../../hooks/useUploadTraffic';
import { runDemoScenario } from '../../api/client';
import { AnalyzeFileResponse } from '../../types/prediction';

interface FileUploadPanelProps {
  onAnalysisComplete: (result: AnalyzeFileResponse) => void;
}

export const FileUploadPanel: React.FC<FileUploadPanelProps> = ({ onAnalysisComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, error } = useUploadTraffic();
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const res = await uploadFile(file);
      if (res) {
        onAnalysisComplete(res);
      }
    }
  };

  const handleTriggerDemo = async (scenario: 'benign' | 'attack') => {
    setDemoLoading(scenario);
    try {
      const res = await runDemoScenario(scenario);
      onAnalysisComplete(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDemoLoading(null);
    }
  };

  const busy = isUploading || demoLoading !== null;

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          OFFLINE TELEMETRY INGESTION
        </span>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '4px 0 0 0' }}>
          Analyze PCAP or Flow Telemetry
        </h3>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pcap,.pcapng,.csv,.binetflow,.netflow"
        style={{ display: 'none' }}
      />

      <div
        onClick={() => !busy && fileInputRef.current?.click()}
        style={{
          border: '1px dashed var(--border-glow)',
          borderRadius: '8px',
          padding: '20px 16px',
          textAlign: 'center',
          cursor: busy ? 'not-allowed' : 'pointer',
          background: 'rgba(15, 23, 42, 0.4)',
          transition: 'all 0.2s ease',
          marginBottom: '16px',
        }}
      >
        {busy ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Loader2 className="animate-spin" size={24} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Executing feature extraction & forward rollout...
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Upload size={22} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              Upload real .PCAP or NetFlow .CSV
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Accepts CTU-13 / CIC-IDS captures up to 50MB
            </span>
          </div>
        )}
      </div>

      {/* Verified Demo Scenarios Section */}
      <div>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
          1-Click Verified Ground-Truth Scenarios
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={() => handleTriggerDemo('benign')}
            disabled={busy}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 8px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid var(--accent-emerald)',
              color: 'var(--accent-emerald)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <ShieldCheck size={14} />
            Verified Benign
          </button>

          <button
            onClick={() => handleTriggerDemo('attack')}
            disabled={busy}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 8px',
              borderRadius: '6px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid var(--accent-rose)',
              color: 'var(--accent-rose)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <ShieldAlert size={14} />
            Verified Attack
          </button>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: 'var(--accent-rose)', fontSize: '0.8rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
