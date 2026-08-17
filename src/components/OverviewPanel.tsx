/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Shield, 
  Users, 
  Lock, 
  FileText, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  Database, 
  Cpu, 
  Layers, 
  Terminal, 
  GitMerge, 
  HelpCircle,
  TrendingUp,
  Workflow
} from "lucide-react";
import { Decision } from "../types.js";

interface OverviewPanelProps {
  events: any[];
  reputations: any[];
  blockedCount: number;
  ledgerCount: number;
  apiConnected: boolean;
  apiStatus?: string;
  ledgerOk: boolean | null;
  onRefresh: () => void;
  onClear: () => void;
}

export const OverviewPanel: React.FC<OverviewPanelProps> = ({
  events,
  reputations,
  blockedCount,
  ledgerCount,
  apiConnected,
  apiStatus = "FALLBACK_MODE",
  ledgerOk,
  onRefresh,
  onClear,
}) => {
  // Compute ZTA decision ratios
  const totalEnriched = events.length;
  let allowCount = 0;
  let quarantineCount = 0;
  let denyCount = 0;

  events.forEach((evt) => {
    const decision = evt.policy_data?.decision;
    if (decision === Decision.ALLOW) allowCount++;
    else if (decision === Decision.QUARANTINE) quarantineCount++;
    else if (decision === Decision.DENY) denyCount++;
  });

  const allowPct = totalEnriched > 0 ? Math.round((allowCount / totalEnriched) * 100) : 0;
  const quarantinePct = totalEnriched > 0 ? Math.round((quarantineCount / totalEnriched) * 100) : 0;
  const denyPct = totalEnriched > 0 ? Math.round((denyCount / totalEnriched) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6" id="overview-grid">
      {/* Metrics Cards */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Events parsed */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs relative overflow-hidden" id="card-total-events">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500">Threat Logs Processed</p>
              <h3 className="text-3xl font-sans font-bold text-slate-900 mt-1">{totalEnriched}</h3>
            </div>
            <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100 text-indigo-600">
              <Activity className="h-5 w-5 text-indigo-600 animate-pulse" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-500" />
        </div>

        {/* Known Users */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs relative overflow-hidden" id="card-known-users">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500">Supervised Users</p>
              <h3 className="text-3xl font-sans font-bold text-slate-900 mt-1">{reputations.length}</h3>
            </div>
            <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100 text-indigo-600">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500" />
        </div>

        {/* Blocked Users */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs relative overflow-hidden" id="card-blocked-users">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500">Containment Blocks</p>
              <h3 className="text-3xl font-sans font-bold text-red-600 mt-1">{blockedCount}</h3>
            </div>
            <div className="bg-red-50 p-2.5 rounded-lg border border-red-100 text-red-600">
              <Lock className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 to-orange-500" />
        </div>

        {/* Ledger Entries */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs relative overflow-hidden" id="card-ledger-entries">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500">Audit Blocks Chained</p>
              <h3 className="text-3xl font-sans font-bold text-emerald-600 mt-1">{ledgerCount}</h3>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 text-emerald-600">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>
      </div>

      {/* Control / System Panel */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-md flex flex-col justify-between" id="card-system-control">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-sans font-semibold text-white tracking-tight flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              Agentic Guard Status
            </h4>
            <div className="flex gap-2">
              <button
                onClick={onRefresh}
                className="text-slate-400 hover:text-white bg-slate-850 p-1.5 rounded-lg border border-slate-750 transition cursor-pointer"
                title="Refresh States"
                id="btn-refresh-status"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1 border-b border-slate-850/60">
              <span className="text-slate-400">Gemini LLM:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                apiStatus === "CONNECTED"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                  : apiStatus === "QUOTA_EXHAUSTED"
                  ? "bg-red-950 text-red-400 border border-red-900 animate-pulse"
                  : "bg-yellow-950/80 text-yellow-400 border border-yellow-900"
              }`}>
                {apiStatus === "CONNECTED"
                  ? "ACTIVE (FLASH 3.5)"
                  : apiStatus === "QUOTA_EXHAUSTED"
                  ? "QUOTA EXHAUSTED"
                  : "OFFLINE FALLBACK"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850/60">
              <span className="text-slate-400">ML Forest Model:</span>
              <span className="text-emerald-400 font-bold">ONLINE (UNSUPERVISED)</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Ledger Hash Link:</span>
              <span className={`font-bold ${ledgerOk === null ? "text-slate-400" : ledgerOk ? "text-emerald-400" : "text-red-500 flex items-center gap-1"}`}>
                {ledgerOk === null ? "UNCHECKED" : ledgerOk ? "VERIFIED (SECURE)" : (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    TAMPER_DETECTED
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClear}
          className="mt-4 w-full bg-slate-800 hover:bg-red-950/30 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-900/40 text-xs py-2 rounded-lg font-mono transition cursor-pointer"
          id="btn-system-wipe"
        >
          Factory Reset Database
        </button>
      </div>

      {/* Policy decision distributions custom SVG visual */}
      <div className="col-span-1 lg:col-span-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs" id="panel-policy-distribution">
        <h4 className="text-sm font-sans font-semibold text-slate-900 tracking-tight mb-4">
          Zero Trust Policy Action Ratios
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Allow */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className="relative h-14 w-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="#e2e8f0" strokeWidth="4" fill="transparent" />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="#10b981"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={150.7}
                  strokeDashoffset={150.7 - (150.7 * allowPct) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-mono font-bold text-slate-900">{allowPct}%</span>
            </div>
            <div>
              <p className="text-xs font-mono text-slate-500 font-semibold">ALLOW DECISIONS</p>
              <p className="text-lg font-sans font-bold text-emerald-600 mt-0.5">{allowCount} Logs</p>
            </div>
          </div>

          {/* Quarantine */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className="relative h-14 w-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="#e2e8f0" strokeWidth="4" fill="transparent" />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="#f59e0b"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={150.7}
                  strokeDashoffset={150.7 - (150.7 * quarantinePct) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-mono font-bold text-slate-900">{quarantinePct}%</span>
            </div>
            <div>
              <p className="text-xs font-mono text-slate-500 font-semibold">QUARANTINE TRIAGES</p>
              <p className="text-lg font-sans font-bold text-amber-600 mt-0.5">{quarantineCount} Logs</p>
            </div>
          </div>

          {/* Deny */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className="relative h-14 w-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="#e2e8f0" strokeWidth="4" fill="transparent" />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="#ef4444"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={150.7}
                  strokeDashoffset={150.7 - (150.7 * denyPct) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-mono font-bold text-slate-900">{denyPct}%</span>
            </div>
            <div>
              <p className="text-xs font-mono text-slate-500 font-semibold">DENIED BLOCKADES</p>
              <p className="text-lg font-sans font-bold text-red-600 mt-0.5">{denyCount} Logs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
