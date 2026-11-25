import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import {
  Investigation,
  EvidenceFile,
  ExtractedClaim,
  Entity,
  Conflict,
  ReliabilityAssessmentItem,
  KnowledgeGraphData,
  DashboardOverview as DashboardDataType,
  ReportData
} from './types';

import { Navigation, NavTab } from './components/Navigation';
import { DashboardOverview } from './components/DashboardOverview';
import { EvidenceUploadCenter } from './components/EvidenceUploadCenter';
import { EvidenceAnalysis } from './components/EvidenceAnalysis';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { ReportDossier } from './components/ReportDossier';
import { AssistantChat } from './components/AssistantChat';
import { SettingsView } from './components/SettingsView';
import { EvidenceDetailModal } from './components/EvidenceDetailModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab | 'assistant'>('dashboard');
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [currentInvestigation, setCurrentInvestigation] = useState<Investigation | null>(null);

  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);
  const [claims, setClaims] = useState<ExtractedClaim[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [reliability, setReliability] = useState<ReliabilityAssessmentItem[]>([]);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardDataType | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  const [inspectingEvidence, setInspectingEvidence] = useState<EvidenceFile | null>(null);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseDesc, setNewCaseDesc] = useState('');
  const [pendingAssistantQuery, setPendingAssistantQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  // Load initial system status and investigations
  const loadInitialData = async () => {
    try {
      const [sys, invs] = await Promise.all([
        api.getSystemStatus(),
        api.getInvestigations(),
      ]);
      setSystemStatus(sys);
      setInvestigations(invs);
      if (invs.length > 0) {
        setCurrentInvestigation(invs[0]);
      }
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      setErrorNotification('Unable to connect to Cerberus-X backend server.');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch all data for the active investigation
  const refreshCaseData = useCallback(async () => {
    if (!currentInvestigation) return;
    setLoading(true);
    try {
      const invId = currentInvestigation.id;
      const [evList, clmList, entList, cnfList, relList, gData, dData] = await Promise.all([
        api.getEvidenceList(invId),
        api.getClaims(invId),
        api.getEntities(invId),
        api.getConflicts(invId),
        api.getReliability(invId),
        api.getKnowledgeGraph(invId),
        api.getDashboardOverview(invId),
      ]);

      setEvidence(evList);
      setClaims(clmList);
      setEntities(entList);
      setConflicts(cnfList);
      setReliability(relList);
      setGraphData(gData);
      setDashboardData(dData);
    } catch (err: any) {
      console.error('Failed to refresh case data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentInvestigation]);

  useEffect(() => {
    if (currentInvestigation) {
      refreshCaseData();
    }
  }, [currentInvestigation, refreshCaseData]);

  // Demo Seed Handler
  const handleRunDemoSeed = async () => {
    setLoading(true);
    try {
      await api.triggerDemoSeed();
      const invs = await api.getInvestigations();
      setInvestigations(invs);
      const demo = invs.find((i) => i.case_code === 'INV-MED-2026-001') || invs[0];
      if (demo) {
        setCurrentInvestigation(demo);
      }
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error('Demo seed error:', err);
      setErrorNotification('Failed to execute demo seed.');
    } finally {
      setLoading(false);
    }
  };

  // Case creation
  const handleCreateCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle.trim()) return;
    setLoading(true);
    try {
      const created = await api.createInvestigation(newCaseTitle.trim(), newCaseDesc.trim());
      setInvestigations((prev) => [created, ...prev]);
      setCurrentInvestigation(created);
      setIsCreatingCase(false);
      setNewCaseTitle('');
      setNewCaseDesc('');
      setActiveTab('upload');
    } catch (err: any) {
      console.error('Failed to create case:', err);
      setErrorNotification('Error creating investigation.');
    } finally {
      setLoading(false);
    }
  };

  // Evidence upload
  const handleUploadEvidence = async (files: File[], sourceAttribution?: string) => {
    if (!currentInvestigation) return;
    setLoading(true);
    try {
      await api.uploadEvidence(currentInvestigation.id, files, sourceAttribution);
      await refreshCaseData();
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorNotification(err.message || 'Evidence ingestion failed.');
    } finally {
      setLoading(false);
    }
  };

  // Evidence delete
  const handleDeleteEvidence = async (id: number) => {
    if (!confirm('Are you sure you want to delete this evidence file and its associated claims?')) return;
    setLoading(true);
    try {
      await api.deleteEvidence(id);
      await refreshCaseData();
    } catch (err: any) {
      console.error('Delete error:', err);
      setErrorNotification('Failed to delete evidence.');
    } finally {
      setLoading(false);
    }
  };

  // Inspect detail modal
  const handleInspectEvidence = async (ev: EvidenceFile) => {
    try {
      const detailed = await api.getEvidenceDetail(ev.id);
      setInspectingEvidence(detailed);
    } catch {
      setInspectingEvidence(ev);
    }
  };

  // Entity merge
  const handleMergeEntities = async (canonicalId: number, aliasIds: number[]) => {
    setLoading(true);
    try {
      await api.mergeEntities(canonicalId, aliasIds);
      await refreshCaseData();
    } catch (err: any) {
      console.error('Merge error:', err);
      setErrorNotification('Failed to merge entities.');
    } finally {
      setLoading(false);
    }
  };

  // Conflict status update
  const handleUpdateConflictStatus = async (conflictId: number, status: string, notes?: string) => {
    setLoading(true);
    try {
      await api.updateConflictStatus(conflictId, status, notes);
      await refreshCaseData();
    } catch (err: any) {
      console.error('Conflict update error:', err);
      setErrorNotification('Failed to update conflict status.');
    } finally {
      setLoading(false);
    }
  };

  // Assistant query
  const handleQueryAssistant = async (query: string, mode?: string) => {
    if (!currentInvestigation) throw new Error('No active case selected');
    return await api.queryAssistant(currentInvestigation.id, query, mode);
  };

  // Report generation
  const handleGenerateReport = async () => {
    if (!currentInvestigation) return;
    setLoading(true);
    try {
      const rep = await api.generateReport(currentInvestigation.id);
      setReportData(rep);
    } catch (err: any) {
      console.error('Report error:', err);
      setErrorNotification('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  // Handlers for bottom prompt submission from dashboard
  const handleAskFromDashboard = (query: string) => {
    setPendingAssistantQuery(query);
    setActiveTab('assistant');
  };

  return (
    <div style={{ backgroundColor: '#0d0d12', minHeight: '100vh' }} className="min-h-screen bg-[#0d0d12] flex font-sans text-slate-200 antialiased selection:bg-slate-700 selection:text-white">
      {/* Sleek Sidebar matching Image */}
      <Navigation
        activeTab={activeTab === 'assistant' ? 'dashboard' : activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setPendingAssistantQuery('');
        }}
        onNewInvestigation={() => setIsCreatingCase(true)}
        userName="Raghavendra"
      />

      {/* Main App Content Viewport */}
      <main style={{ backgroundColor: '#0d0d12' }} className="flex-1 overflow-y-auto bg-[#0d0d12] min-h-screen flex flex-col justify-between">
        {errorNotification && (
          <div className="m-6 p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex justify-between items-center shadow-lg">
            <span>{errorNotification}</span>
            <button
              onClick={() => setErrorNotification(null)}
              className="font-bold text-rose-400 hover:text-white ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Dashboard View (Matches User's Reference Image) */}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            data={dashboardData}
            currentInvestigation={currentInvestigation}
            onNavigate={(tab) => setActiveTab(tab)}
            onNewInvestigation={() => setIsCreatingCase(true)}
            onAskQuery={handleAskFromDashboard}
          />
        )}

        {/* 2. Upload Evidence View */}
        {activeTab === 'upload' && (
          <EvidenceUploadCenter
            evidence={evidence}
            currentInvestigation={currentInvestigation}
            onUpload={handleUploadEvidence}
            onDelete={handleDeleteEvidence}
            onSelectEvidence={handleInspectEvidence}
            loading={loading}
          />
        )}

        {/* 3. Evidence Analysis View (Contradictions, Claims, Entities, Reliability) */}
        {activeTab === 'analysis' && (
          <EvidenceAnalysis
            conflicts={conflicts}
            claims={claims}
            entities={entities}
            reliability={reliability}
            onUpdateConflictStatus={handleUpdateConflictStatus}
            onMergeEntities={handleMergeEntities}
            loading={loading}
          />
        )}

        {/* 4. Knowledge Graph View */}
        {activeTab === 'graph' && (
          <KnowledgeGraph graphData={graphData} onRefresh={refreshCaseData} />
        )}

        {/* 5. Investigation Report View */}
        {activeTab === 'reports' && (
          <ReportDossier
            currentInvestigation={currentInvestigation}
            reportData={reportData}
            onGenerateReport={handleGenerateReport}
            loading={loading}
          />
        )}

        {/* 6. Settings View */}
        {activeTab === 'settings' && (
          <SettingsView
            systemStatus={systemStatus}
            onRunDemoSeed={handleRunDemoSeed}
            loading={loading}
          />
        )}

        {/* 7. AI Assistant Chat View */}
        {activeTab === 'assistant' && (
          <AssistantChat
            currentInvestigation={currentInvestigation}
            onQuery={handleQueryAssistant}
            loading={loading}
            initialQuery={pendingAssistantQuery}
          />
        )}
      </main>

      {/* Modal: Evidence Inspection */}
      {inspectingEvidence && (
        <EvidenceDetailModal
          evidence={inspectingEvidence}
          onClose={() => setInspectingEvidence(null)}
        />
      )}

      {/* Modal: New Investigation */}
      {isCreatingCase && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card rounded-xl border border-dark-cardBorder shadow-2xl max-w-md w-full p-6 space-y-4 text-xs text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-dark-borderSubtle">
              <h3 className="font-bold text-white text-sm">New Investigation Case</h3>
              <button
                onClick={() => setIsCreatingCase(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCaseSubmit} className="space-y-3.5">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Investigation Title *
                </label>
                <input
                  type="text"
                  required
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  placeholder="e.g. Government Medical Supply Investigation"
                  className="w-full text-xs bg-dark-input border border-dark-cardBorder text-white rounded-lg px-3 py-2 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Case Scope & Background
                </label>
                <textarea
                  rows={3}
                  value={newCaseDesc}
                  onChange={(e) => setNewCaseDesc(e.target.value)}
                  placeholder="Mandate details, suspected discrepancies, regional distribution boundaries..."
                  className="w-full text-xs bg-dark-input border border-dark-cardBorder text-white rounded-lg px-3 py-2 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-dark-borderSubtle">
                <button
                  type="button"
                  onClick={() => setIsCreatingCase(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-dark-cardBorder text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCaseTitle.trim() || loading}
                  className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold hover:bg-slate-200 shadow disabled:opacity-50"
                >
                  Create Case File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
