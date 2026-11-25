import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
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

import { useAuth } from './context/AuthContext';
import {
  saveInvestigationToFirestore,
  getUserInvestigationsFromFirestore,
} from './firebase/firestore';
import { AuthPage } from './components/AuthPage';
import { AccountInfoModal } from './components/AccountInfoModal';
import { Navigation, NavTab } from './components/Navigation';
import { DashboardOverview } from './components/DashboardOverview';
import { EvidenceUploadCenter } from './components/EvidenceUploadCenter';
import { EvidenceAnalysis } from './components/EvidenceAnalysis';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { ReportDossier } from './components/ReportDossier';
import { AssistantChat } from './components/AssistantChat';
import { SettingsView } from './components/SettingsView';
import { EvidenceDetailModal } from './components/EvidenceDetailModal';
import { ContradictionCenter } from './components/ContradictionCenter';
import { ReliabilityAssessment } from './components/ReliabilityAssessment';
import { EntityResolution } from './components/EntityResolution';
import { InvestigationsView } from './components/InvestigationsView';

export const App: React.FC = () => {
  const {
    user,
    userProfile,
    loading: authLoading,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('home');
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
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('cerberus_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => {
    localStorage.setItem('cerberus_theme', theme);
    if (user && theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme, user]);

  useEffect(() => {
    if (errorNotification) {
      const timer = setTimeout(() => setErrorNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorNotification]);

  // Load initial system status and investigations only when authenticated
  const loadInitialData = useCallback(async () => {
    if (!user) return;
    try {
      const [sys, invs, fsInvs] = await Promise.all([
        api.getSystemStatus(),
        api.getInvestigations(),
        getUserInvestigationsFromFirestore(user.uid).catch(() => []),
      ]);
      setSystemStatus(sys);

      // Sync existing investigations to Firestore for this user if none saved yet
      if (fsInvs.length === 0 && invs.length > 0) {
        await Promise.all(
          invs.map((inv) =>
            saveInvestigationToFirestore(user.uid, {
              investigationId: String(inv.id),
              investigationName: inv.title,
              investigationStatus: inv.status,
              uploadedEvidenceReferences: [],
            }).catch(() => undefined)
          )
        );
      }

      setInvestigations(invs);
      if (invs.length > 0) {
        setCurrentInvestigation(invs[0]);
      }
    } catch (err: any) {
      console.warn('Initial data load notice:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadInitialData();
    } else {
      setInvestigations([]);
      setCurrentInvestigation(null);
      setEvidence([]);
      setClaims([]);
      setEntities([]);
      setConflicts([]);
      setReliability([]);
      setGraphData(null);
      setDashboardData(null);
      setReportData(null);
    }
  }, [user, loadInitialData]);

  // Fetch all data for the active investigation
  const refreshCaseData = useCallback(async () => {
    if (!currentInvestigation || !user) return;
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

      // Sync evidence references to Firestore investigation doc
      saveInvestigationToFirestore(user.uid, {
        investigationId: String(currentInvestigation.id),
        investigationName: currentInvestigation.title,
        investigationStatus: currentInvestigation.status,
        uploadedEvidenceReferences: evList.map(
          (e) => `${e.evidence_code}:${e.filename}`
        ),
      }).catch(() => undefined);
    } catch (err: any) {
      console.error('Failed to refresh case data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentInvestigation, user]);

  useEffect(() => {
    if (currentInvestigation && user) {
      refreshCaseData();
    }
  }, [currentInvestigation, user, refreshCaseData]);

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
        if (user) {
          saveInvestigationToFirestore(user.uid, {
            investigationId: String(demo.id),
            investigationName: demo.title,
            investigationStatus: demo.status,
            uploadedEvidenceReferences: [],
          }).catch(() => undefined);
        }
      }
      setActiveTab('home');
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
      if (user) {
        await saveInvestigationToFirestore(user.uid, {
          investigationId: String(created.id),
          investigationName: created.title,
          investigationStatus: created.status || 'ACTIVE',
          uploadedEvidenceReferences: [],
        }).catch(() => undefined);
      }
      setInvestigations((prev) => [created, ...prev]);
      setCurrentInvestigation(created);
      setIsCreatingCase(false);
      setNewCaseTitle('');
      setNewCaseDesc('');
      setActiveTab('repository');
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

  // Loading gate while Firebase resolves persistent session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07080a] flex flex-col items-center justify-center text-white space-y-4">
        <img
          src="/logo.png"
          alt="CERBERUS-X"
          className="w-14 h-14 object-contain rounded-xl opacity-90 animate-pulse"
        />
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono tracking-wider">
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>AUTHENTICATING SESSION...</span>
        </div>
      </div>
    );
  }

  // Protected Route Gate: redirect unauthenticated users to Login Page
  if (!user) {
    return <AuthPage />;
  }

  const displayUserName =
    userProfile?.fullName ||
    user.displayName ||
    user.email?.split('@')[0] ||
    'Investigator';

  return (
    <div className="min-h-screen bg-[#0d0d12] flex font-sans text-slate-200 antialiased selection:bg-slate-700 selection:text-white">
      {/* Sleek Sidebar matching Image */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setPendingAssistantQuery('');
        }}
        onNewInvestigation={() => setIsCreatingCase(true)}
        userName={displayUserName}
        userEmail={user.email || undefined}
        userPhotoURL={user.photoURL}
        onOpenAccountInfo={() => setShowAccountInfo(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={async () => {
          await logout();
          setActiveTab('home');
        }}
      />

      {/* Main App Content Viewport */}
      <main className={`flex-1 bg-[#0d0d12] flex flex-col ${activeTab === 'graph' ? 'h-screen overflow-hidden' : 'min-h-screen overflow-y-auto'}`}>
        {/* 1. Home Screen (Matches User's Reference Image & 8 Cards Hub) */}
        {activeTab === 'home' && (
          <DashboardOverview
            data={dashboardData}
            currentInvestigation={currentInvestigation}
            onNavigate={(tab) => setActiveTab(tab)}
            onNewInvestigation={() => setIsCreatingCase(true)}
            onAskQuery={handleAskFromDashboard}
            onUploadFiles={async (files) => {
              await handleUploadEvidence(Array.from(files));
              setActiveTab('repository');
            }}
            theme={theme}
            onToggleTheme={toggleTheme}
            userName={displayUserName}
            userEmail={user.email || undefined}
            userPhotoURL={user.photoURL}
            onOpenAccountInfo={() => setShowAccountInfo(true)}
            onLogout={async () => {
              await logout();
              setActiveTab('home');
            }}
          />
        )}

        {/* 2. Investigations Case Files View */}
        {activeTab === 'investigations' && (
          <InvestigationsView
            investigations={investigations}
            currentInvestigation={currentInvestigation}
            onSelectInvestigation={(inv) => setCurrentInvestigation(inv)}
            onNewInvestigation={() => setIsCreatingCase(true)}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {/* 3. Evidence Repository / Upload View */}
        {activeTab === 'repository' && (
          <EvidenceUploadCenter
            evidence={evidence}
            currentInvestigation={currentInvestigation}
            onUpload={handleUploadEvidence}
            onDelete={handleDeleteEvidence}
            onSelectEvidence={handleInspectEvidence}
            loading={loading}
          />
        )}

        {/* 4. Evidence Analysis View (Comprehensive Hub) */}
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

        {/* 5. Knowledge Graph View */}
        {activeTab === 'graph' && (
          <KnowledgeGraph graphData={graphData} onRefresh={refreshCaseData} />
        )}

        {/* 6. Conflict Detection View */}
        {activeTab === 'conflicts' && (
          <ContradictionCenter
            conflicts={conflicts}
            onUpdateStatus={handleUpdateConflictStatus}
            loading={loading}
          />
        )}

        {/* 7. Reliability Scoring View */}
        {activeTab === 'reliability' && (
          <ReliabilityAssessment items={reliability} />
        )}

        {/* 8. Entity Resolution View */}
        {activeTab === 'entities' && (
          <EntityResolution
            entities={entities}
            onMergeEntities={handleMergeEntities}
            loading={loading}
          />
        )}

        {/* 9. Investigation Report & Dossier View */}
        {activeTab === 'reports' && (
          <ReportDossier
            currentInvestigation={currentInvestigation}
            reportData={reportData}
            onGenerateReport={handleGenerateReport}
            loading={loading}
          />
        )}

        {/* 10. Settings View */}
        {activeTab === 'settings' && (
          <SettingsView
            systemStatus={systemStatus}
            onRunDemoSeed={handleRunDemoSeed}
            loading={loading}
          />
        )}

        {/* 11. AI Assistant Chat View (Evidence Reasoning) */}
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
      {/* Discreet floating action notification toast */}
      {errorNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-3.5 rounded-xl bg-[#1c1214] border border-rose-900/60 text-rose-300 text-xs flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="mr-3">{errorNotification}</span>
          <button
            onClick={() => setErrorNotification(null)}
            className="text-rose-400 hover:text-white text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal: Account Information */}
      <AccountInfoModal
        isOpen={showAccountInfo}
        onClose={() => setShowAccountInfo(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
};
