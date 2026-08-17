/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  Cpu,
  AlertTriangle,
  User,
  Zap,
  Shield,
  FileCheck,
  Binary,
  ShieldAlert,
  Sliders,
  Sparkles,
  RotateCcw,
  Activity,
  CheckCircle,
  Terminal,
  ArrowRight,
  Layers
} from "lucide-react";
import { Decision, ActorAction } from "../types.js";

interface LiveFeedPanelProps {
  events: any[];
  onGenerate: (count: number, ratio: number) => Promise<void>;
  onReset: () => Promise<void>;
}

export const LiveFeedPanel: React.FC<LiveFeedPanelProps> = ({ events, onGenerate, onReset }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Log generation state
  const [countVal, setCountVal] = useState(15);
  const [ratioVal, setRatioVal] = useState(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // State for selected event in Figure 4.3
  const [selectedObserverEventId, setSelectedObserverEventId] = useState<string | null>(null);

  // Derive the active event for Figure 4.3
  const activeEvt = (events && events.find(e => e.event_id === selectedObserverEventId)) || (events && events[0]) || {
    event_id: "evt_cold_start_demo",
    enriched_event: {
      user_id: "svc-telemetry-demo",
      source_ip: "10.0.4.15",
      port: 22,
      protocol: "SSH",
      bytes_sent: 5242880,
      timestamp: new Date().toISOString(),
      is_off_hours: true,
      bytes_per_second: 131072,
      abnormal_port_flag: true,
      session_abnormal: true,
      is_watch_listed: false,
    },
    policy_data: {
      decision: "QUARANTINE"
    }
  };

  const enriched = activeEvt?.enriched_event || {};
  const decision = activeEvt?.policy_data?.decision || "ALLOW";

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      await onGenerate(countVal, ratioVal / 100);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredEvents = events.filter((evt) => {
    const term = searchTerm.toLowerCase();
    return (
      evt.event_id.toLowerCase().includes(term) ||
      evt.enriched_event?.user_id?.toLowerCase().includes(term) ||
      evt.enriched_event?.source_ip?.toLowerCase().includes(term) ||
      evt.ground_truth_technique?.toLowerCase().includes(term) ||
      evt.policy_data?.decision?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6" id="panel-live-feed">
      {/* Simulation Controls */}
      <div className="border border-slate-200 bg-slate-50/50 p-5 rounded-xl pb-6 mb-6" id="feed-generation-bar">
        <h3 className="text-base font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-amber-500" />
          Ingestion & Simulation Controls
        </h3>
        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
              Event Batch Count ({countVal})
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={countVal}
              onChange={(e) => setCountVal(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
              Attack Ratio ({ratioVal}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={ratioVal}
              onChange={(e) => setRatioVal(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto" id="feed-action-buttons">
            <button
              type="submit"
              disabled={isGenerating || isResetting}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-mono text-xs font-bold px-5 py-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              id="btn-generate-telemetry"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Ingesting Batch...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Trigger Batch Ingestion
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isGenerating || isResetting}
              onClick={async () => {
                setIsResetting(true);
                try {
                  await onReset();
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsResetting(false);
                }
              }}
              className="w-full md:w-auto bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-700 hover:text-rose-700 disabled:bg-slate-50 disabled:text-slate-400 font-mono text-xs font-bold px-5 py-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              id="btn-reset-system"
            >
              {isResetting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5 text-slate-500 group-hover:text-rose-600" />
                  Reset System
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4" id="feed-search-bar">
        <h3 className="text-base font-sans font-bold text-slate-900 tracking-tight">
          Supervised Telemetry Logs
        </h3>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Filter logs by User, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 text-xs font-mono py-2.5 pl-9 pr-4 rounded-lg focus:outline-none transition"
            id="input-search-feed"
          />
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>



      {/* Events List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" id="feed-log-list">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-300 rounded-xl bg-slate-50/50" id="feed-empty-state">
            <Eye className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-mono text-slate-500">No telemetry logs captured in buffer.</p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isExpanded = expandedEventId === evt.event_id;
            const decision = evt.policy_data?.decision;
            const action = evt.actor_data?.authorized_action;

            // Decoupled Decision and Action chip colors - Light corporate theme
            let decisionBadge = "bg-slate-100 text-slate-600 border border-slate-200";
            if (decision === Decision.ALLOW) decisionBadge = "bg-emerald-50 text-emerald-700 border border-emerald-200";
            else if (decision === Decision.QUARANTINE) decisionBadge = "bg-amber-50 text-amber-700 border border-amber-200";
            else if (decision === Decision.DENY) decisionBadge = "bg-red-50 text-red-700 border border-red-200";

            let actionBadge = "bg-slate-100 text-slate-600 border border-slate-200";
            if (action === ActorAction.ISOLATE) actionBadge = "bg-red-50 text-red-700 border border-red-250";
            else if (action === ActorAction.ESCALATE) actionBadge = "bg-amber-50 text-amber-700 border border-amber-250";
            else if (action === ActorAction.MONITOR) actionBadge = "bg-indigo-50 text-indigo-700 border border-indigo-250";
            else if (action === ActorAction.DISMISS) actionBadge = "bg-slate-100 text-slate-600 border border-slate-200";

            return (
              <div
                key={evt.event_id}
                className={`border rounded-xl bg-white transition-all duration-200 ${isExpanded ? "border-indigo-300 shadow-xs" : "border-slate-200 hover:border-slate-300"}`}
                id={`feed-item-${evt.event_id}`}
              >
                {/* Header Summary Row */}
                <div
                  onClick={() => setExpandedEventId(isExpanded ? null : evt.event_id)}
                  className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-slate-50 transition rounded-t-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900">{evt.enriched_event?.user_id}</span>
                        <span className="text-[10px] font-mono text-slate-400">[{evt.event_id}]</span>
                        {evt.ground_truth_label === "ATTACK" && (
                          <span className="bg-red-50 text-red-700 border border-red-200 text-[9px] px-1.5 rounded font-bold font-mono">
                            ATTACK REALITY: {evt.ground_truth_technique}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5 space-x-2">
                        <span>IP: {evt.enriched_event?.source_ip}</span>
                        <span>•</span>
                        <span>Port: {evt.enriched_event?.port} ({evt.enriched_event?.protocol})</span>
                        <span>•</span>
                        <span>Bytes: {(evt.enriched_event?.bytes_sent / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                    <div className="text-right mr-2 hidden md:block">
                      <p className="text-[10px] font-mono text-slate-400">
                        {new Date(evt.enriched_event?.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5 font-medium">
                        Trust tb: {evt.trust_data?.tb.toFixed(4)}
                      </p>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded ${decisionBadge}`}>
                      {decision}
                    </span>

                    <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded ${actionBadge}`}>
                      {action}
                    </span>

                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Detailed 7-Stage Pipeline View */}
                {isExpanded && (
                  <div className="border-t border-slate-200 p-6 bg-slate-50/70 rounded-b-xl" id={`feed-expansion-${evt.event_id}`}>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold mb-6 border-b border-slate-200 pb-2">
                      7-Stage Zero Trust & Threat Hunting Trace
                    </h4>
                    <div className="relative pl-6 space-y-6 border-l-2 border-slate-300" id="pipeline-trace-wrapper">

                      {/* Stage 1 */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full bg-slate-200 border-2 border-slate-400 flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-slate-600">1</span>
                        </div>
                        <div>
                          <h5 className="text-xs font-mono font-bold text-slate-900 flex items-center gap-2">
                            Stage 1: Log Generator & Boundary Filter
                          </h5>
                          <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                            Raw security log captured at network edge. Ground-truth values (label: <strong className="text-slate-800">{evt.ground_truth_label}</strong>, technique: <strong className="text-slate-800">{evt.ground_truth_technique || "None"}</strong>) were strictly stripped before passing to downstream stages.
                          </p>
                        </div>
                      </div>

                      {/* Stage 2 */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full bg-slate-200 border-2 border-slate-400 flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-slate-600">2</span>
                        </div>
                        <div>
                          <h5 className="text-xs font-mono font-bold text-slate-900 flex items-center gap-2">
                            Stage 2: Observer Agent (Validation & Enrichment)
                          </h5>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs text-center">
                              <p className="text-[9px] text-slate-400 font-mono font-semibold">OFF HOURS</p>
                              <span className={`text-[10px] font-mono font-bold ${evt.enriched_event?.is_off_hours ? "text-amber-600" : "text-slate-400"}`}>
                                {evt.enriched_event?.is_off_hours ? "YES" : "NO"}
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs text-center">
                              <p className="text-[9px] text-slate-400 font-mono font-semibold">BPS SPEED</p>
                              <span className="text-[10px] font-mono font-bold text-slate-800">
                                {Math.round(evt.enriched_event?.bytes_per_second / 1024).toLocaleString()} KB/s
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs text-center">
                              <p className="text-[9px] text-slate-400 font-mono font-semibold">UNUSUAL PORT</p>
                              <span className={`text-[10px] font-mono font-bold ${evt.enriched_event?.abnormal_port_flag ? "text-amber-600" : "text-slate-400"}`}>
                                {evt.enriched_event?.abnormal_port_flag ? "YES" : "NO"}
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs text-center">
                              <p className="text-[9px] text-slate-400 font-mono font-semibold">SESSION LEN</p>
                              <span className={`text-[10px] font-mono font-bold ${evt.enriched_event?.session_abnormal ? "text-amber-600" : "text-slate-400"}`}>
                                {evt.enriched_event?.session_abnormal ? "ABNORMAL" : "NORMAL"}
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs text-center">
                              <p className="text-[9px] text-slate-400 font-mono font-semibold">WATCH LISTED</p>
                              <span className={`text-[10px] font-mono font-bold ${evt.enriched_event?.is_watch_listed ? "text-red-600" : "text-slate-400"}`}>
                                {evt.enriched_event?.is_watch_listed ? "YES" : "NO"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stage 3 */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full bg-slate-200 border-2 border-slate-400 flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-slate-600">3</span>
                        </div>
                        <div>
                          <h5 className="text-xs font-mono font-bold text-slate-900">
                            Stage 3: Trust Scorer Engine
                          </h5>
                          <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                            Unsupervised Anomaly Score: <strong className="text-slate-800">{evt.trust_data?.anomaly_score.toFixed(4)}</strong> (Anomaly Flag: <strong className={evt.trust_data?.anomaly_flag ? "text-amber-600" : "text-slate-500"}>{evt.trust_data?.anomaly_flag ? "TRUE" : "FALSE"}</strong>). User persistent reputation score: <strong className="text-slate-800">{evt.trust_data?.reputation_score.toFixed(4)}</strong>. Combined continuous trust score: <strong className="text-indigo-600">{evt.trust_data?.tb.toFixed(4)}</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Stage 4 */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full bg-slate-200 border-2 border-slate-400 flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-slate-600">4</span>
                        </div>
                        <div>
                          <h5 className="text-xs font-mono font-bold text-slate-900 flex items-center gap-2">
                            Stage 4: Zero Trust Policy Compliance Gate
                          </h5>
                          <div className="bg-white border border-slate-200 p-3 rounded-lg mt-1.5 shadow-2xs">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${decisionBadge}`}>
                              {decision}
                            </span>
                            <p className="text-slate-700 text-xs mt-2 font-mono leading-relaxed">{evt.policy_data?.reason}</p>
                          </div>
                        </div>
                      </div>

                      {/* Stage 5 */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full bg-slate-200 border-2 border-slate-400 flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-slate-600">5</span>
                        </div>
                        <div>
                          <h5 className="text-xs font-mono font-bold text-slate-900 flex items-center gap-2">
                            Stage 5: Reasoner Agent (LLM Threat Hunting AI)
                          </h5>
                          <div className="bg-white border border-slate-200 p-4 rounded-lg mt-1.5 space-y-2 shadow-2xs">
                            <div className="flex flex-wrap gap-4 text-[10px] font-mono">
                              <div>
                                <span className="text-slate-400 font-semibold">MITRE CODE:</span>{" "}
                                <strong className="text-amber-600">{evt.reasoner_data?.technique_classification || "BENIGN / NONE"}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 font-semibold">CONFIDENCE:</span>{" "}
                                <strong className="text-slate-800">{evt.reasoner_data?.confidence_level}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 font-semibold">SUGGESTION:</span>{" "}
                                <strong className="text-indigo-600">{evt.reasoner_data?.recommended_action}</strong>
                              </div>
                            </div>
                            <p className="text-slate-700 text-xs leading-relaxed border-l-2 border-indigo-500 pl-3 italic font-sans">
                              "{evt.reasoner_data?.reasoning_trace}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stage 6 */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full bg-slate-200 border-2 border-slate-400 flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-slate-600">6</span>
                        </div>
                        <div>
                          <h5 className="text-xs font-mono font-bold text-slate-900">
                            Stage 6: Actor Agent (2-Step Execution Gate)
                          </h5>
                          <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                            Authorized Action: <span className="text-indigo-600 font-bold font-mono text-[11px]">{action}</span>. {evt.actor_data?.justification}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 mt-1">
                            User Reputation delta: {evt.actor_data?.reputation_before.toFixed(4)} ➔ {evt.actor_data?.reputation_after.toFixed(4)}
                          </p>
                        </div>
                      </div>

                      {/* Stage 7 */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full bg-slate-200 border-2 border-slate-400 flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-slate-600">7</span>
                        </div>
                        <div>
                          <h5 className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1.5">
                            Stage 7: Cryptographic SHA-256 Audit Ledger Block
                          </h5>
                          <div className="bg-white p-3 rounded-lg border border-slate-200 mt-1.5 font-mono text-[10px] space-y-1 shadow-2xs">
                            <div className="flex text-slate-500">
                              <span className="w-24 text-slate-400 font-semibold">PREV_HASH:</span>
                              <span className="truncate text-slate-500" title={evt.actor_data?.prev_hash}>{evt.actor_data?.prev_hash || "0000000000000000000000000000000000000000000000000000000000000000"}</span>
                            </div>
                            <div className="flex text-emerald-600 font-bold">
                              <span className="w-24 text-slate-400 font-semibold">BLOCK_HASH:</span>
                              <span className="truncate" title={evt.actor_data?.record_hash}>{evt.actor_data?.record_hash || "sha256-signature-linked"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
