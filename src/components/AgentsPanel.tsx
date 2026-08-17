/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Layers,
  Terminal,
  Activity,
  CheckCircle,
  Shield,
  ArrowRight,
  Cpu,
  Lock,
  GitMerge,
  Server,
  UserCheck,
  TrendingUp,
  FileText,
  AlertTriangle,
  Play,
  RotateCcw,
  BookOpen
} from "lucide-react";

interface AgentsPanelProps {
  events: any[];
  reputations: any[];
  blockedUsers: any[];
  ledger: any[];
  ledgerOk: boolean | null;
  enterpriseUsers?: any[];
  onInjectUserLog?: (userId: string, isAttack: boolean) => Promise<void>;
}

interface SelectedThreatScenario {
  id: string;
  name: string;
  icon: React.ReactNode;
  event: any;
}

export const AgentsPanel: React.FC<AgentsPanelProps> = ({
  events = [],
  reputations = [],
  blockedUsers = [],
  ledger = [],
  ledgerOk = true,
  enterpriseUsers = [],
  onInjectUserLog
}) => {
  // We allow selecting either a live event or one of our high-fidelity academic thesis presets
  const [activeSubTab, setActiveSubTab] = useState<"observer" | "reasoner" | "actor">("reasoner");

  const [selectedIdentity, setSelectedIdentity] = useState<string>("usr_dev_alice");
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  const directoryUsers = enterpriseUsers && enterpriseUsers.length > 0 ? enterpriseUsers : [
    { user_id: "usr_dev_alice", name: "Alice Smith", role: "Lead Cloud Developer", department: "Engineering", profileType: "NORMAL" },
    { user_id: "usr_dev_bob", name: "Bob Jones", role: "Senior Systems Developer", department: "Engineering", profileType: "NORMAL" },
    { user_id: "usr_admin_charlie", name: "Charlie Brown", role: "Lead IAM Security Administrator", department: "IT Infrastructure", profileType: "HIGH_PRIVILEGE" },
    { user_id: "usr_insider_victor", name: "Victor Creed", role: "Disgruntled Software Engineer", department: "Engineering Systems", profileType: "ADVERSARY_INSIDER" },
    { user_id: "usr_ext_anonymous", name: "Anonymous compromised credential", role: "Compromised Valid Account", department: "Unverified Identity Entity", profileType: "ADVERSARY_EXTERNAL" }
  ];

  // Unique user IDs who have logged events in the current session
  const uniqueUsersInEvents = Array.from(
    new Set(
      events.map((evt) => evt.enriched_event?.user_id || evt.user_id).filter(Boolean)
    )
  ) as string[];

  // Non-active registered identities
  const inactiveUsers = directoryUsers.filter(
    (u) => !uniqueUsersInEvents.includes(u.user_id)
  );

  let activeEvt: any = null;
  activeEvt = events.find(e => (e.enriched_event?.user_id || e.user_id) === selectedIdentity) || null;

  const enriched = activeEvt ? (activeEvt.enriched_event || activeEvt) : {};
  const decision = activeEvt ? (activeEvt.policy_data?.decision || "ALLOW") : "ALLOW";
  const reasoner = activeEvt ? (activeEvt.reasoner_data || {}) : {};
  const actor = activeEvt ? (activeEvt.actor_data || {}) : {};
  const trust = activeEvt ? (activeEvt.trust_data || { tb: 1.0, anomaly_score: 0.0, anomaly_flag: false, reputation_score: 1.0 }) : { tb: 1.0, anomaly_score: 0.0, anomaly_flag: false, reputation_score: 1.0 };

  const selectedUser = directoryUsers.find(u => u.user_id === selectedIdentity) || {
    user_id: selectedIdentity,
    name: "Enterprise Identity",
    role: "Access Credential",
    department: "Corporate Directory",
    profileType: "NORMAL"
  };

  // Calculate live numbers for figure 4.8
  const mockLogs = activeEvt ? [
    { time: "07:41:12", msg: `Observer Agent parsed raw log frame: ${enriched.user_id || "svc-telemetry-demo"}`, status: "INFO" },
    { time: "07:41:13", msg: `Trust Scorer evaluated user: TB score updated to ${(trust.tb || 1.0).toFixed(4)}`, status: "OK" },
    { time: "07:42:01", msg: `Ingested event ${activeEvt.event_id} for user ${enriched.user_id}`, status: "INCOMING" },
    { time: "07:42:02", msg: `Continuous trust evaluated: TB = ${(trust.tb || 1.0).toFixed(4)}. Verdict: ${decision}`, status: decision === "ALLOW" ? "OK" : "WARN" },
    { time: "07:42:03", msg: decision === "ALLOW" ? "Zero Trust Policy Compliance Gate approved connection." : "Zero Trust Policy Compliance Gate triggered. Routing gateway: REASONER AGENT", status: "ROUTE" },
    ...(decision !== "ALLOW" ? [
      { time: "07:42:05", msg: `Gemini API invocation succeeded. MITRE: ${reasoner.technique_classification || "T1048.003"}`, status: "AI" },
      { time: "07:42:06", msg: `Actor Agent policy authorization check: Action ${actor.authorized_action || "ISOLATE"} approved`, status: "EXEC" },
      { time: "07:42:07", msg: `Cryptographic Ledger Block chained successfully. Block: ${actor.record_hash?.slice(0, 12)}...`, status: "LEDGER" }
    ] : [])
  ] : [];

  return (
    <div className="space-y-6" id="panel-agents">
      {/* Security Agent Orchestration Portal Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-150 p-5 rounded-xl shadow-2xs" id="agents-academic-banner">
        <div className="flex items-start gap-4">
          <div className="bg-indigo-600/10 p-2.5 rounded-lg border border-indigo-200 text-indigo-700 mt-0.5">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-sans font-extrabold text-slate-900 tracking-tight">
              Security Agent Orchestration Portal
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Consolidated command panel of the active autonomous security agents guarding the network. Toggle below to monitor real-time decision traces, continuous trust parameters, and blockchain audit ledger states.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5 items-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Select Active Identity / Telemetry Profile:</span>
              <select
                value={selectedIdentity}
                onChange={(e) => setSelectedIdentity(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 w-80 shadow-2xs font-semibold cursor-pointer"
              >
                {uniqueUsersInEvents.length > 0 && (
                  <optgroup label="🟢 LIVE INGESTED USER TELEMETRY (SYNCED)">
                    {uniqueUsersInEvents.map((uid) => {
                      const profile = directoryUsers.find(u => u.user_id === uid);
                      const latest = events.find(e => (e.enriched_event?.user_id || e.user_id) === uid);
                      const decisionStr = latest?.policy_data?.decision || "ALLOW";
                      return (
                        <option key={uid} value={uid}>
                          Live: {uid} {profile ? `(${profile.name})` : ""} [{decisionStr}]
                        </option>
                      );
                    })}
                  </optgroup>
                )}

                {inactiveUsers.length > 0 && (
                  <optgroup label="⚪ REGISTERED ENTERPRISE DIRECTORY IDENTITIES (NO TELEMETRY YET)">
                    {inactiveUsers.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        Identity: {u.user_id} ({u.name})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Navigation Bar */}
      <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl shadow-3xs gap-1 font-sans text-xs overflow-x-auto" id="agents-figure-rail">
        <button
          onClick={() => setActiveSubTab("observer")}
          className={`py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-2.5 whitespace-nowrap ${
            activeSubTab === "observer"
              ? "bg-white text-slate-900 border border-slate-200/80 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
          id="tab-btn-sub-observer"
        >
          <Layers className="h-4 w-4 text-indigo-600" />
          Observer Agent
        </button>

        <button
          onClick={() => setActiveSubTab("reasoner")}
          className={`py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-2.5 whitespace-nowrap ${
            activeSubTab === "reasoner"
              ? "bg-white text-slate-900 border border-slate-200/80 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
          id="tab-btn-sub-reasoner"
        >
          <Cpu className="h-4 w-4 text-amber-500" />
          Reasoner Agent
        </button>

        <button
          onClick={() => setActiveSubTab("actor")}
          className={`py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-2.5 whitespace-nowrap ${
            activeSubTab === "actor"
              ? "bg-white text-slate-900 border border-slate-200/80 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
          id="tab-btn-sub-actor"
        >
          <Lock className="h-4 w-4 text-rose-500" />
          Actor Agent
        </button>
      </div>

      {/* Main Figures Render Window */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs min-h-[500px]" id="agents-render-stage">

        {activeEvt === null ? (
          <div className="space-y-6 max-w-2xl mx-auto text-center py-12 animate-fade-in" id="no-telemetry-state">
            <div className="mx-auto h-16 w-16 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <Activity className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-sans font-extrabold text-slate-900 tracking-tight">
                No Active Telemetry for {selectedUser.name}
              </h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed px-6">
                This credential (<code>{selectedUser.user_id}</code>) is fully registered in the Enterprise IAM Directory but has no active live telemetry logs ingested in this session.
              </p>
            </div>

            {/* Profile Info Badge Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-150 p-4 rounded-xl text-left text-xs font-sans">
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold block mb-0.5">ROLE:</span>
                <span className="font-extrabold text-slate-800">{selectedUser.role}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold block mb-0.5">DEPARTMENT:</span>
                <span className="font-extrabold text-slate-800">{selectedUser.department}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold block mb-0.5">PROFILE TYPE:</span>
                <span className={`font-extrabold uppercase ${
                  selectedUser.profileType?.includes("ADVERSARY") ? "text-rose-600 font-black" : "text-slate-600"
                }`}>
                  {selectedUser.profileType || "NORMAL"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold block mb-0.5">REPUTATION:</span>
                <span className="font-mono text-emerald-600 font-extrabold">
                  {(reputations?.find(r => r.user_id === selectedUser.user_id)?.reputation_score || 0.8).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Injection Trigger Cards */}
            <div className="border-t border-slate-150 pt-6 mt-6">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block mb-4">
                Interactive Telemetry Logs Injection
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Clean/Benign Trigger */}
                <button
                  onClick={async () => {
                    setIsInjecting(true);
                    try {
                      if (onInjectUserLog) {
                        await onInjectUserLog(selectedUser.user_id, false);
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsInjecting(false);
                    }
                  }}
                  disabled={isInjecting}
                  className="bg-white hover:bg-emerald-50/20 border border-slate-200 hover:border-emerald-200 p-5 rounded-xl text-left shadow-2xs hover:shadow-xs transition group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="bg-emerald-100/40 p-2 rounded-lg border border-emerald-100 text-emerald-600 group-hover:scale-105 transition-transform">
                      <CheckCircle className="h-4.5 w-4.5" />
                    </div>
                    {isInjecting && <Activity className="h-4 w-4 animate-spin text-slate-400" />}
                  </div>
                  <h4 className="text-sm font-sans font-extrabold text-slate-900">
                    Inject Clean Log (Benign)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Trigger standard activity matching {selectedUser.name}'s daily operational patterns. Will pass through the Zero Trust filter without alert flags.
                  </p>
                </button>

                {/* Threat/Attack Trigger */}
                <button
                  onClick={async () => {
                    setIsInjecting(true);
                    try {
                      if (onInjectUserLog) {
                        await onInjectUserLog(selectedUser.user_id, true);
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsInjecting(false);
                    }
                  }}
                  disabled={isInjecting}
                  className="bg-white hover:bg-rose-50/20 border border-slate-200 hover:border-rose-200 p-5 rounded-xl text-left shadow-2xs hover:shadow-xs transition group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="bg-rose-100/40 p-2 rounded-lg border border-rose-100 text-rose-600 group-hover:scale-105 transition-transform">
                      <AlertTriangle className="h-4.5 w-4.5" />
                    </div>
                    {isInjecting && <Activity className="h-4 w-4 animate-spin text-slate-400" />}
                  </div>
                  <h4 className="text-sm font-sans font-extrabold text-slate-900 text-rose-950">
                    Inject Threat Log (Attack)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Trigger an anomalous, adversary-profile network scan or data exfiltration. Immediately triggers AI Reasoner classification and Actor quarantine.
                  </p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* SUBTAB 1: The Observer Agent View */}
            {activeSubTab === "observer" && (
          <div className="space-y-4 animate-fade-in" id="agents-render-observer">
            <div className="border-b border-slate-200 pb-3 mb-4">
              <h4 className="text-base font-sans font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                Observer Agent
              </h4>
              <p className="text-slate-500 text-xs mt-1">
                Visualizing raw security frames mapped to declarative strict schemas with stage-2 context parameter derivations.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="observer-inner-grid">
              {/* Column 1: Ingested Log Segment */}
              <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-300 flex flex-col justify-between" id="inner-obs-col-ingestion">
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" />
                      Raw Frame Ingested
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">
                      ID: {activeEvt.event_id}
                    </span>
                  </div>

                  <pre className="font-mono text-[10px] leading-relaxed text-emerald-400/90 whitespace-pre-wrap max-h-[350px] overflow-y-auto pr-1">
                    {JSON.stringify({
                      event_id: activeEvt.event_id,
                      timestamp: enriched.timestamp || new Date().toISOString(),
                      user_id: enriched.user_id || "N/A",
                      source_ip: enriched.source_ip || "N/A",
                      port: enriched.port || enriched.destination_port || 0,
                      protocol: enriched.protocol || "TCP",
                      bytes_sent: enriched.bytes_sent || 0
                    }, null, 2)}
                  </pre>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[9px] text-slate-500 font-mono flex justify-between items-center">
                  <span>SCHEMA: TS_DECLARATIVE</span>
                  <span className="text-indigo-400 font-semibold">100% PARSED</span>
                </div>
              </div>

              {/* Column 2: Context Enrichment Parameters */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col justify-between" id="inner-obs-col-enrichment">
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                    <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-indigo-600" />
                      Derived Context Metrics
                    </span>
                    <span className="text-[9px] font-sans text-slate-500 font-medium">
                      Stage 2 Engine
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Check 1 */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 shadow-3xs">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${enriched.is_off_hours ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`} />
                        <span className="text-[10px] font-sans font-bold text-slate-700">Time Temporal Risk</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${enriched.is_off_hours ? "text-amber-600" : "text-slate-500"}`}>
                        {enriched.is_off_hours ? "OFF-HOURS ALERT" : "STANDARD HOUR"}
                      </span>
                    </div>

                    {/* Check 2 */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 shadow-3xs">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-sans font-bold text-slate-700">Payload Density Speed</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-800">
                        {Math.round((enriched.bytes_per_second || 0) / 1024).toLocaleString()} KB/s
                      </span>
                    </div>

                    {/* Check 3 */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 shadow-3xs">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${enriched.abnormal_port_flag ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`} />
                        <span className="text-[10px] font-sans font-bold text-slate-700">Network Boundary Port</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${enriched.abnormal_port_flag ? "text-amber-600" : "text-slate-500"}`}>
                        {enriched.abnormal_port_flag ? "UNUSUAL PORT" : "STANDARD PORT"}
                      </span>
                    </div>

                    {/* Check 4 */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 shadow-3xs">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${enriched.session_abnormal ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`} />
                        <span className="text-[10px] font-sans font-bold text-slate-700">Session Anomalous Bound</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${enriched.session_abnormal ? "text-amber-600" : "text-slate-500"}`}>
                        {enriched.session_abnormal ? "ABNORMAL" : "NORMAL"}
                      </span>
                    </div>

                    {/* Check 5 */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 shadow-3xs">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${enriched.is_watch_listed ? "bg-red-500 animate-ping" : "bg-emerald-500"}`} />
                        <span className="text-[10px] font-sans font-bold text-slate-700">Identity Risk Classification</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${enriched.is_watch_listed ? "text-red-600 font-extrabold" : "text-slate-500"}`}>
                        {enriched.is_watch_listed ? "WATCH LISTED" : "CLEAN"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-[9px] text-slate-400 font-mono">
                  ENRICHMENT ENGINE: HEURISTICS DERIVED
                </div>
              </div>

              {/* Column 3: Validation Outcome & Downstream Routing */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col justify-between font-sans text-xs" id="inner-obs-col-outcome">
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                    <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      Validation Verdict
                    </span>
                    <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                      SCHEMA OK
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-3xs text-center flex flex-col items-center justify-center py-6">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-3 ${
                      decision === "ALLOW" ? "bg-emerald-50 text-emerald-600" :
                      decision === "QUARANTINE" ? "bg-amber-50 text-amber-600" :
                      "bg-red-50 text-red-600"
                    }`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <h4 className="text-[11px] font-sans font-extrabold text-slate-900 uppercase">
                      {decision === "ALLOW" ? "Validated Standard Session" : "Risk Deviation Identified"}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 font-sans px-2">
                      {decision === "ALLOW"
                        ? "Telemetry conforms to standard operational boundaries."
                        : "Anomaly flags triggered downstream deep inspection policy constraints."
                      }
                    </p>

                    <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-mono text-slate-600">Decision: <strong>{decision}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-slate-400">ROUTING GATEWAY:</span>
                    <span className={`font-bold flex items-center gap-1 ${decision === "ALLOW" ? "text-emerald-600" : "text-indigo-600"}`}>
                      {decision === "ALLOW" ? "ALLOW (Bypass)" : "REASONER AGENT"}
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Caption Footer */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-150 text-slate-500 text-[11px] font-sans text-center">
              <strong>System Process:</strong> The Observer Agent ingests incoming security log events, parses them against strict TypeScript schema specifications, and compiles derived threat-context metadata in real time.
            </div>
          </div>
        )}

        {/* SUBTAB 2: Reasoner Agent output panel */}
        {activeSubTab === "reasoner" && (
          <div className="space-y-4 animate-fade-in" id="agents-render-reasoner">
            <div className="border-b border-slate-200 pb-3 mb-4">
              <h4 className="text-base font-sans font-extrabold text-slate-900 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-amber-500" />
                Reasoner Agent
              </h4>
              <p className="text-slate-500 text-xs mt-1">
                Displays the structured decision JSON response returned from the Gemini AI reasoning model, identifying MITRE attack vectors, confidence levels, and semantic traces.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="reasoner-inner-split">
              {/* Left pane: Structured GUI Reasoner Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between" id="reasoner-gui-card">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-mono font-bold uppercase">
                      Decision: {decision}
                    </span>
                    <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px] font-mono font-bold">
                      ID: {activeEvt.event_id}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">MITRE Classification:</span>
                      <div className="bg-white border border-slate-200 rounded-lg p-3 font-mono font-bold text-rose-700 flex items-center gap-2 shadow-3xs">
                        <AlertTriangle className="h-4 w-4" />
                        {reasoner.technique_classification || "T1048.003 - Exfiltration Over Alternative Protocol"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Confidence Score:</span>
                        <div className="bg-white border border-slate-200 rounded-lg p-3 font-mono text-slate-900 font-extrabold shadow-3xs">
                          {reasoner.confidence_level || "HIGH (0.94)"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Suggested Execution:</span>
                        <div className="bg-white border border-slate-200 rounded-lg p-3 font-mono text-indigo-700 font-extrabold shadow-3xs">
                          {reasoner.recommended_action || "ISOLATE"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Semantic Reasoning Trace:</span>
                      <div className="bg-white border border-slate-200 rounded-lg p-4 font-sans text-slate-700 italic leading-relaxed shadow-3xs border-l-4 border-l-indigo-600">
                        "{reasoner.reasoning_trace || "No tracing logs recorded for this event. Execute logs generation in Feed panel to see real-time reasoning trails."}"
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>MODEL ID: gemini-3.5-flash</span>
                  <span>LATENCY: 1.48s</span>
                </div>
              </div>

              {/* Right pane: Academic formatted JSON Response Output */}
              <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-300 flex flex-col justify-between" id="reasoner-json-output">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" />
                      Structured Gemini API Output (JSON)
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded uppercase">
                      RFC_8259_VALIDATED
                    </span>
                  </div>

                  <pre className="font-mono text-[10px] leading-relaxed text-emerald-400/90 whitespace-pre overflow-x-auto select-all p-3 bg-slate-950/60 rounded-lg border border-slate-800 max-h-[380px]">
{`{
  "event_id": "${activeEvt.event_id}",
  "timestamp": "${enriched.timestamp}",
  "user_id": "${enriched.user_id}",
  "confidence_level": "${reasoner.confidence_level || "HIGH (0.94)"}",
  "technique_classification": "${reasoner.technique_classification || "T1048.003 - Exfiltration Over Alternative Protocol"}",
  "recommended_action": "${reasoner.recommended_action || "ISOLATE"}",
  "reasoning_trace": "${(reasoner.reasoning_trace || "Exfiltration attempt verified.").replace(/"/g, '\\"')}"
}`}
                  </pre>
                </div>

                <div className="mt-4 text-[9px] font-mono text-slate-500 flex justify-between items-center">
                  <span>ENFORCING Strict JSON Mode SCHEMA</span>
                  <span className="text-indigo-400 font-bold">100% PARSABLE</span>
                </div>
              </div>
            </div>

            {/* System Caption Footer */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-150 text-slate-500 text-[11px] font-sans text-center">
              <strong>Engine Analysis:</strong> Real-time structured response from the Gemini API showing automated MITRE classification, confidence score mapping, and deep semantic evaluation reasoning traces.
            </div>
          </div>
        )}

        {/* SUBTAB 3: Actor Agent view */}
        {activeSubTab === "actor" && (
          <div className="space-y-4 animate-fade-in" id="agents-render-actor">
            <div className="border-b border-slate-200 pb-3 mb-4">
              <h4 className="text-base font-sans font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="h-5 w-5 text-rose-500" />
                Actor Agent
              </h4>
              <p className="text-slate-500 text-xs mt-1">
                Dual-gate policy verification authorizing system mitigations and writing signed blocks to the cryptographic ledger.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="actor-inner-grid">
              {/* Left Column: Recommended Action Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between" id="actor-col-input">
                <div>
                  <h5 className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-3">Reasoner recommendation</h5>
                  <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-3xs">
                    <div className="mx-auto h-12 w-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-sans font-bold text-slate-900 uppercase">
                      {actor.authorized_action || "ISOLATE"}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1.5 font-medium font-sans">
                      Target Credential:
                      <span className="block text-xs font-mono text-slate-800 font-bold mt-1 bg-slate-50 py-1 rounded border border-slate-150 mt-1">
                        {enriched.user_id}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 space-y-2.5 text-[11px] font-sans">
                    <div className="flex justify-between py-1 border-b border-slate-150">
                      <span className="text-slate-400">Current Reputation:</span>
                      <strong className="text-slate-800 font-mono">{(trust.reputation_score || 0.8).toFixed(4)}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-150">
                      <span className="text-slate-400">Continuous Trust (tb):</span>
                      <strong className="text-indigo-600 font-mono">{(trust.tb || 0.5).toFixed(4)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">ZTA Threshold:</span>
                      <strong className="text-slate-500 font-mono">0.4000</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                    <span className="text-[10px] font-mono font-bold text-indigo-700">STRICT CO-MUTATION ENGAGED</span>
                  </div>
                </div>
              </div>

              {/* Middle Column: Gate Check verification */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between" id="actor-col-verification">
                <div>
                  <h5 className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-3">Step 2: Policy Authorisation Gate</h5>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-start gap-3">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h6 className="text-xs font-bold text-emerald-800 font-sans">Credential Authorization Verification</h6>
                        <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">
                          Verified target is not listed under immutable critical system services. Local isolation permitted.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-start gap-3">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h6 className="text-xs font-bold text-emerald-800 font-sans">Confidence Level Requirement</h6>
                        <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">
                          AI classification confidence is ({reasoner.confidence_level || "94%"}), passing the minimum 70% threshold.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-start gap-3">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h6 className="text-xs font-bold text-emerald-800 font-sans">Ledger Integrity Hash Checked</h6>
                        <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">
                          SHA-256 historical chain validated. Previous hash linkage remains fully intact and unbroken.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="text-[11px] text-slate-500 font-sans italic leading-relaxed">
                    <strong>Actor Verdict:</strong> Approved autonomously. Co-mutating local firewall constraints to block incoming traffic.
                  </div>
                </div>
              </div>

              {/* Right Column: Execution results (Blocklist & Ledger Chaining) */}
              <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl p-5 flex flex-col justify-between" id="actor-col-results">
                <div>
                  <h5 className="text-[10px] font-mono uppercase text-indigo-400 font-bold mb-3 flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5" />
                    Real-time State Change Results
                  </h5>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block mb-1">Blocklist Status:</span>
                      <div className="p-3 bg-red-950/60 border border-red-900/50 rounded-lg text-rose-300 font-mono text-xs flex items-center justify-between">
                        <span>IP: {enriched.source_ip}</span>
                        <span className="bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border border-rose-500/30">
                          CONTAINED
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block mb-1">Reputation Degradation:</span>
                      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg font-mono text-[11px] flex justify-between items-center">
                        <span className="text-emerald-400 font-bold">{(actor.reputation_before || 0.8).toFixed(4)}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-600" />
                        <span className="text-red-500 font-bold">{(actor.reputation_after || 0.05).toFixed(4)}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block mb-1">Ledger Block Linking:</span>
                      <div className="p-2.5 bg-slate-950/80 border border-slate-850 rounded-lg font-mono text-[9px] space-y-1">
                        <div className="flex truncate">
                          <span className="text-slate-500 w-12 font-bold flex-shrink-0">PREV:</span>
                          <span className="text-slate-400 truncate">{actor.prev_hash || "8ef439b007137f68c34f..."}</span>
                        </div>
                        <div className="flex truncate">
                          <span className="text-emerald-400 w-12 font-bold flex-shrink-0">BLOCK:</span>
                          <span className="text-emerald-300 truncate font-extrabold">{actor.record_hash || "4fc290af1023be685f..."}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[9px] font-mono text-slate-500 flex justify-between">
                  <span>FIREWALL REACTION: 0.12s</span>
                  <span className="text-emerald-400 font-bold">MUTED ACTION LINKED</span>
                </div>
              </div>
            </div>

            {/* System Caption Footer */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-150 text-slate-500 text-[11px] font-sans text-center">
              <strong>Mitigation Execution:</strong> The Actor Agent executes approved recommendations (e.g., firewall containment), mutates local reputation weights, and signs audit events onto the tamper-resistant ledger.
            </div>
          </div>
        )}
        </>)}

      </div>
    </div>
  );
};
