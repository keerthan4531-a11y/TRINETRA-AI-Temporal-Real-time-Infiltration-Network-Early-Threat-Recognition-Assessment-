import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { StatsSummaryRow } from './components/dashboard/StatsSummaryRow';
import { InfiltrationProbabilityChart } from './components/timeline/InfiltrationProbabilityChart';
import { AttackStageBadge } from './components/attack-stage/AttackStageBadge';
import { NetworkGraphView } from './components/dashboard/NetworkGraphView';
import { FeatureAttributionPanel } from './components/explainability/FeatureAttributionPanel';
import { FlaggedFlowsTable } from './components/flows/FlaggedFlowsTable';
import { FileUploadPanel } from './components/upload/FileUploadPanel';
import { AlertBanner } from './components/alerts/AlertBanner';

// Dedicated Full Views
import { LiveTelemetryView } from './views/LiveTelemetryView';
import { FullTopologyView } from './views/FullTopologyView';
import { ModelDynamicsView } from './views/ModelDynamicsView';
import { TerminalConsoleView } from './views/TerminalConsoleView';
import { ConfigurationView } from './views/ConfigurationView';

import { useLivePredictions } from './hooks/useLivePredictions';
import { fetchHealth } from './api/client';
import { FlaggedFlow, AnalyzeFileResponse } from './types/prediction';

export const App: React.FC = () => {
  const { timeline, currentPrediction, isConnected, loadBatchTimeline } = useLivePredictions(60);
  const [device, setDevice] = useState('CPU');
  const [flaggedFlows, setFlaggedFlows] = useState<FlaggedFlow[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    fetchHealth()
      .then((h) => setDevice(h.device.toUpperCase()))
      .catch(() => setDevice('CPU'));
  }, []);

  const handleAnalysisComplete = (res: AnalyzeFileResponse) => {
    loadBatchTimeline(res.timeline);
    setFlaggedFlows(res.flagged_flows);
    setAlertDismissed(false);
  };

  const activeProb = currentPrediction ? currentPrediction.current_infil_probability : 0.0;
  const activeStage = currentPrediction ? currentPrediction.predicted_mitre_stage : 'Benign';
  const activeTacticId = currentPrediction ? currentPrediction.tactic_id : 'TA0000';
  const activeSeverity = currentPrediction ? currentPrediction.stage_severity : 'NORMAL';
  const activeColor = currentPrediction ? currentPrediction.stage_color : '#10b981';
  const activeDesc = currentPrediction
    ? currentPrediction.stage_description
    : 'System monitoring live 2.0s telemetry windows. Baseline clean.';
  const activeFeatures = currentPrediction ? currentPrediction.top_driving_features : [];

  // Reset alert dismissed state on stage change
  useEffect(() => {
    if (activeProb >= 0.75) {
      setAlertDismissed(false);
    }
  }, [activeStage, activeProb]);

  // Count active alerts from timeline
  const activeAlertCount = timeline.filter((pt) => pt.current_infil_probability >= 0.75).length;

  const tabTitles: Record<string, string> = {
    dashboard: 'SOC Operations Command Center',
    live: '22-Dimensional Real-Time Telemetry Stream',
    network: 'Cyber Warfare Attack Topology Canvas',
    model: 'World Model Neural Dynamics & Rollout Lab',
    cli: 'Hacker Cyber Terminal & Audit Logs',
    settings: 'Operational Defense Calibration & SQLite',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)', position: 'relative' }}>
      {/* Ambient Fluid Liquid Mesh Background Orbs */}
      <div className="liquid-ambient-container">
        <div className="liquid-blob-1" />
        <div className="liquid-blob-2" />
        <div className="liquid-blob-3" />
        <div className="cyber-grid-overlay" />
      </div>

      {/* Persistent Left Sidebar with iOS Liquid Glass */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Command Console Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, zIndex: 10 }}>
        <Header
          isConnected={isConnected}
          device={device}
          isStreaming={timeline.length > 0}
          activeTabTitle={tabTitles[activeTab] || 'SOC Command Center'}
        />

        {/* Real Alert Toast when >= 75% threshold crossed */}
        {activeProb >= 0.75 && !alertDismissed && (
          <div style={{ padding: '0 16px', marginTop: '12px' }}>
            <AlertBanner
              stage={activeStage}
              tacticId={activeTacticId}
              risk={activeProb}
              onDismiss={() => setAlertDismissed(true)}
            />
          </div>
        )}

        <main style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          {/* View 1: Main SOC Dashboard */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Top KPI Metrics Row */}
              <StatsSummaryRow
                totalWindows={timeline.length}
                activeAlerts={activeAlertCount}
                currentRisk={activeProb}
                currentStage={activeStage}
              />

              {/* Upper Grid: Threat Badge & Replay Uploader | Infiltration Horizon Chart */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '380px 1fr',
                  gap: '20px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <AttackStageBadge
                    stage={activeStage}
                    tacticId={activeTacticId}
                    severity={activeSeverity}
                    color={activeColor}
                    description={activeDesc}
                  />
                  <FileUploadPanel onAnalysisComplete={handleAnalysisComplete} />
                </div>

                <InfiltrationProbabilityChart
                  timeline={timeline}
                  futureTrajectory={currentPrediction?.future_trajectory || []}
                />
              </div>

              {/* Middle Grid: Network Topology Graph | Real-Time XAI Feature Attributions */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                }}
              >
                <NetworkGraphView flows={flaggedFlows} currentRisk={activeProb} />
                <FeatureAttributionPanel features={activeFeatures} />
              </div>

              {/* Lower Section: Dense Malicious Telemetry Flows Table */}
              <FlaggedFlowsTable flows={flaggedFlows} />
            </div>
          )}

          {/* View 2: Dedicated 22-Dimensional Live Telemetry */}
          {activeTab === 'live' && (
            <LiveTelemetryView
              currentPrediction={currentPrediction}
              totalWindows={timeline.length}
            />
          )}

          {/* View 3: Dedicated Full-Scale Cyber Attack Topology */}
          {activeTab === 'network' && (
            <FullTopologyView
              flows={flaggedFlows}
              currentRisk={activeProb}
            />
          )}

          {/* View 4: World Model Neural Dynamics & Rollout Lab */}
          {activeTab === 'model' && (
            <ModelDynamicsView
              currentPrediction={currentPrediction}
            />
          )}

          {/* View 5: Hacker Cyber Terminal & Console */}
          {activeTab === 'cli' && (
            <TerminalConsoleView
              currentPrediction={currentPrediction}
            />
          )}

          {/* View 6: Operational Defense Calibration & Settings */}
          {activeTab === 'settings' && (
            <ConfigurationView />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
