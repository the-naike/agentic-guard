/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  Shield,
  Activity,
  Users,
  Binary,
  Target,
  Sliders,
  Sparkles,
  Info,
  Lock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Terminal,
  ArrowRight,
  Eye,
  Layers,
  Cpu
} from "lucide-react";
import { OverviewPanel } from "./components/OverviewPanel.tsx";
import { LiveFeedPanel } from "./components/LiveFeedPanel.tsx";
import { AgentsPanel } from "./components/AgentsPanel.tsx";
import { ReputationPanel } from "./components/ReputationPanel.tsx";
import { LedgerPanel } from "./components/LedgerPanel.tsx";
import { EvaluationPanel } from "./components/EvaluationPanel.tsx";
import { SettingsPanel } from "./components/SettingsPanel.tsx";
import { AppConfig, EvaluationMetrics } from "./types.ts";

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"feed" | "agents" | "users" | "ledger" | "eval" | "settings">("feed");

  // Synchronized States
  const [events, setEvents] = useState<any[]>([]);
  const [reputations, setReputations] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [watchList, setWatchList] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [apiStatus, setApiStatus] = useState<string>("FALLBACK_MODE");
  const [ledgerOk, setLedgerOk] = useState<boolean | null>(null);
  const [enterpriseUsers, setEnterpriseUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Poll server state on mount and intervals
  const fetchData = async () => {
    try {
      const [
        resEvents,
        resRep,
        resBlocked,
        resWatch,
        resLedger,
        resConfig,
        resHealth,
        resEntUsers,
        resVerifyLedger
      ] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/reputation"),
        fetch("/api/blocked-users"),
        fetch("/api/watch-list"),
        fetch("/api/ledger"),
        fetch("/api/config"),
        fetch("/api/health"),
        fetch("/api/enterprise-users"),
        fetch("/api/ledger/verify", { method: "POST" })
      ]);

      if (resEvents.ok) setEvents(await resEvents.json());
      if (resRep.ok) setReputations(await resRep.json());
      if (resBlocked.ok) setBlockedUsers(await resBlocked.json());
      if (resWatch.ok) setWatchList(await resWatch.json());
      if (resLedger.ok) setLedger(await resLedger.json());
      if (resConfig.ok) setConfig(await resConfig.json());
      if (resHealth.ok) {
        const health = await resHealth.json();
        setApiStatus(health.api_key_status || "FALLBACK_MODE");
        setApiConnected(health.api_key_status === "CONNECTED");
      }
      if (resEntUsers.ok) setEnterpriseUsers(await resEntUsers.json());
      if (resVerifyLedger && resVerifyLedger.ok) {
        const verifyData = await resVerifyLedger.json();
        setLedgerOk(verifyData.passed);
      }
    } catch (err) {
      // Quietly log as warning to prevent AI Studio UI error popups during server restarts
      console.warn("[AGENTIC GUARD] Backend offline or rebooting, retrying soon...", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh states every 4 seconds to simulate live streaming logs
    const timer = setInterval(fetchData, 4000);
    return () => clearInterval(timer);
  }, []);

  // API Call Trigger Handlers
  const handleGenerate = async (count: number, ratio: number) => {
    const res = await fetch("/api/pipeline/generate-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count, attack_ratio: ratio }),
    });
    if (res.ok) await fetchData();
  };

  const handleInjectUserLog = async (userId: string, isAttack: boolean) => {
    const res = await fetch("/api/pipeline/generate-user-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, is_attack: isAttack }),
    });
    if (res.ok) {
      await fetchData();
    }
  };

  const handleManualOverride = async (user_id: string, action: "UNBLOCK" | "FORCE_BLOCK", justification: string) => {
    const res = await fetch("/api/override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, action, justification }),
    });
    if (res.ok) await fetchData();
  };

  const handleVerifyLedger = async (): Promise<any> => {
    const res = await fetch("/api/ledger/verify", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLedgerOk(data.passed);
      return data;
    }
    throw new Error("Ledger verification API failed.");
  };

  const handleSimulateBreach = async (record_id: number): Promise<any> => {
    const res = await fetch("/api/ledger/simulate-breach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record_id }),
    });
    if (res.ok) {
      const data = await res.json();
      await fetchData();
      setLedgerOk(null); // prompt re-verification
      return data;
    }
    throw new Error("Simulated breach injection failed.");
  };

  const handleHealLedger = async (): Promise<any> => {
    const res = await fetch("/api/ledger/heal", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      await fetchData();
      setLedgerOk(true);
      return data;
    }
    throw new Error("Ledger healing API failed.");
  };

  const handleRunEvaluation = async (count: number, ratio: number): Promise<EvaluationMetrics> => {
    const res = await fetch("/api/evaluation/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count, attack_ratio: ratio }),
    });
    if (res.ok) {
      const data = await res.json();
      await fetchData(); // Refresh feed after evaluation to show newly parsed events
      return data.metrics;
    }
    throw new Error("Evaluation run API failed.");
  };

  const handleSaveConfig = async (newConfig: Partial<AppConfig>) => {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newConfig),
    });
    if (res.ok) {
      const data = await res.json();
      setConfig(data.config);
    }
  };

  const handleRetrainModel = async (): Promise<string> => {
    const res = await fetch("/api/model/retrain", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      return data.message;
    }
    throw new Error("Model retraining API failed.");
  };

  const handleClearData = async () => {
    const res = await fetch("/api/events/clear", { method: "POST" });
    if (res.ok) {
      await fetchData();
      setLedgerOk(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-mono text-slate-800">
        <Activity className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-950">Initializing Agentic Guard Threat Engine...</p>
        <p className="text-xs text-slate-500 mt-2">Cold-starting Isolation Forest and loading parameters...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-600/20 selection:text-indigo-900" id="app-root">
      {/* Top Header Panel */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 px-6 py-4" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-sans font-extrabold tracking-tight text-slate-900 uppercase flex items-center gap-2">
                Agentic Guard
              </h1>
            </div>
          </div>

          {/* Status Indicators (Beeping Agent & Audit Ledger) */}
          <div className="flex flex-wrap items-center gap-3" id="header-status-indicators">
            {/* Agent Beeping Light */}
            <div className="flex items-center gap-2.5 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl" id="header-agent-status">
              <div className="relative flex h-2.5 w-2.5" id="agent-ping-container">
                {apiConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" id="agent-ping-pulse"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${apiConnected ? "bg-emerald-500" : "bg-slate-400"}`} id="agent-ping-dot"></span>
              </div>
              <div className="text-left" id="agent-status-label-group">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold leading-none">Threat Hunter Agent</p>
                <p className="text-xs font-semibold text-slate-900 mt-0.5" id="agent-status-text">
                  {apiConnected ? "Up & Active (LLM)" : "Active (Heuristics)"}
                </p>
              </div>
            </div>

            {/* Audit Ledger Integrity Indicator */}
            <div className={`flex items-center gap-2.5 border px-3.5 py-2 rounded-xl transition-all duration-300 ${
              ledgerOk === true
                ? "bg-emerald-50/50 border-emerald-200"
                : ledgerOk === false
                ? "bg-rose-50/50 border-rose-200 animate-pulse"
                : "bg-slate-100 border-slate-200"
            }`} id="header-ledger-status">
              {ledgerOk === true ? (
                <Shield className="h-4 w-4 text-emerald-600" id="ledger-intact-icon" />
              ) : ledgerOk === false ? (
                <AlertTriangle className="h-4 w-4 text-rose-600" id="ledger-tampered-icon" />
              ) : (
                <Activity className="h-4 w-4 text-slate-500" id="ledger-pending-icon" />
              )}
              <div className="text-left" id="ledger-status-label-group">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold leading-none">Audit Ledger</p>
                <p className={`text-xs font-semibold mt-0.5 ${
                  ledgerOk === true
                    ? "text-emerald-800"
                    : ledgerOk === false
                    ? "text-rose-800"
                    : "text-slate-900"
                }`} id="ledger-status-text">
                  {ledgerOk === true
                    ? "Ledger Secure"
                    : ledgerOk === false
                    ? "Ledger Tampered"
                    : "Verifying Integrity"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="max-w-7xl mx-auto px-6 py-8" id="app-stage">
        {/* Dynamic Overview Metrics Panel */}
        <OverviewPanel
          events={events}
          reputations={reputations}
          blockedCount={blockedUsers.length}
          ledgerCount={ledger.length}
          apiConnected={apiConnected}
          apiStatus={apiStatus}
          ledgerOk={ledgerOk}
          onRefresh={fetchData}
          onClear={handleClearData}
        />

        {/* Dynamic Tab Navigation Rail */}
        <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-xs mb-6 font-sans text-xs overflow-x-auto gap-1" id="navigation-rail">
          <button
            onClick={() => setActiveTab("feed")}
            className={`py-2 px-4 rounded-lg font-medium transition flex items-center gap-2 ${activeTab === "feed" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            id="tab-btn-feed"
          >
            <Activity className="h-4 w-4" />
            Threat Feeds
          </button>
          <button
            onClick={() => setActiveTab("agents")}
            className={`py-2 px-4 rounded-lg font-medium transition flex items-center gap-2 ${activeTab === "agents" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            id="tab-btn-agents"
          >
            <Cpu className="h-4 w-4" />
            Agents
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`py-2 px-4 rounded-lg font-medium transition flex items-center gap-2 ${activeTab === "users" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            id="tab-btn-users"
          >
            <Users className="h-4 w-4" />
            User Registry
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`py-2 px-4 rounded-lg font-medium transition flex items-center gap-2 ${activeTab === "ledger" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            id="tab-btn-ledger"
          >
            <Binary className="h-4 w-4" />
            Cryptographic Ledger
          </button>
          <button
            onClick={() => setActiveTab("eval")}
            className={`py-2 px-4 rounded-lg font-medium transition flex items-center gap-2 ${activeTab === "eval" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            id="tab-btn-eval"
          >
            <Target className="h-4 w-4" />
            Evaluation Module
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-2 px-4 rounded-lg font-medium transition flex items-center gap-2 ${activeTab === "settings" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            id="tab-btn-settings"
          >
            <Sliders className="h-4 w-4" />
            System Tuning
          </button>
        </div>

        {/* Render Active Tab Component */}
        <div id="tab-viewport">
          {activeTab === "feed" && (
            <LiveFeedPanel events={events} onGenerate={handleGenerate} onReset={handleClearData} />
          )}

          {activeTab === "agents" && (
            <AgentsPanel
              events={events}
              reputations={reputations}
              blockedUsers={blockedUsers}
              ledger={ledger}
              ledgerOk={ledgerOk}
              enterpriseUsers={enterpriseUsers}
              onInjectUserLog={handleInjectUserLog}
            />
          )}

          {activeTab === "users" && (
            <ReputationPanel
              reputations={reputations}
              blockedUsers={blockedUsers}
              watchList={watchList}
              events={events}
              onManualOverride={handleManualOverride}
              enterpriseUsers={enterpriseUsers}
            />
          )}

          {activeTab === "ledger" && (
            <LedgerPanel
              ledger={ledger}
              onVerify={handleVerifyLedger}
              onSimulateBreach={handleSimulateBreach}
              onHeal={handleHealLedger}
            />
          )}

          {activeTab === "eval" && (
            <EvaluationPanel onRunEvaluation={handleRunEvaluation} />
          )}

          {activeTab === "settings" && (
            <SettingsPanel
              config={config}
              onSaveConfig={handleSaveConfig}
              onRetrainModel={handleRetrainModel}
            />
          )}
        </div>
      </main>

      {/* Footer Section */}
      <footer className="border-t border-slate-200 mt-16 py-8 px-6 bg-white text-center text-slate-500 font-sans text-[11px]" id="app-footer">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="text-slate-400">
            Constructed under Design Science Research Methodology (DSRM) • Unsupervised ML & Governed Multi-Agent Architecture
          </p>
        </div>
      </footer>
    </div>
  );
}
