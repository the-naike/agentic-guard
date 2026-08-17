/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FileCheck, ShieldAlert, Binary, AlertTriangle, CheckCircle, RefreshCw, Download, Skull, HeartPulse } from "lucide-react";
import { EventType } from "../types.js";

interface LedgerPanelProps {
  ledger: any[];
  onVerify: () => Promise<any>;
  onSimulateBreach: (recordId: number) => Promise<any>;
  onHeal: () => Promise<any>;
}

export const LedgerPanel: React.FC<LedgerPanelProps> = ({ ledger, onVerify, onSimulateBreach, onHeal }) => {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [breachRecordId, setBreachRecordId] = useState("");
  const [breachMessage, setBreachMessage] = useState<string | null>(null);
  const [healing, setHealing] = useState(false);
  const [healMessage, setHealMessage] = useState<string | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await onVerify();
      setVerificationResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleHeal = async () => {
    setHealing(true);
    setHealMessage(null);
    setBreachMessage(null);
    try {
      const res = await onHeal();
      setHealMessage(res.details || "Ledger successfully healed and verification chain rebuilt.");
      // Re-verify immediately to update the verification card UI
      const verifyRes = await onVerify();
      setVerificationResult(verifyRes);
    } catch (err: any) {
      setHealMessage(`Remediation failure: ${err.message}`);
    } finally {
      setHealing(false);
    }
  };

  const handleSimulateBreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breachRecordId) return;

    try {
      const res = await onSimulateBreach(Number(breachRecordId));
      setBreachMessage(res.message);
      setVerificationResult(null); // Clear previous verification status to prompt re-check
    } catch (err: any) {
      setBreachMessage(`Breach injection failure: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    if (ledger.length === 0) return;

    const headers = ["Record ID", "Timestamp", "Event ID", "User ID", "Event Type", "Trust Score", "ZTA Decision", "Actor Action", "Prev Hash", "Block Hash"];
    const rows = ledger.map((log) => [
      log.record_id,
      log.timestamp,
      log.event_id,
      log.user_id,
      log.event_type,
      log.trust_score ?? "",
      log.zta_decision ?? "",
      log.actor_action ?? "",
      log.prev_hash,
      log.record_hash,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `agentic_guard_audit_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="panel-ledger-wrapper">
      {/* Ledger Log Feed */}
      <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-xl shadow-xs flex flex-col h-[580px]" id="ledger-feed-wrapper">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Binary className="h-4 w-4 text-emerald-600" />
            Append-Only SHA-256 Cryptographic Ledger
          </h3>
          <button
            onClick={handleExportCSV}
            disabled={ledger.length === 0}
            className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 border border-slate-200 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-sans text-xs font-semibold transition cursor-pointer"
            id="btn-export-ledger"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg shadow-2xs" id="ledger-table-container">
          <table className="w-full text-left font-sans text-[11px] text-slate-600">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
              <tr className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                <th className="py-2.5 px-3">Block ID</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Prev Hash Mapping</th>
                <th className="py-2.5 px-3 text-right">Self Hash Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.map((log) => {
                let logBadge = "bg-slate-100 text-slate-500 border border-slate-200";
                if (log.event_type === EventType.LOG_INGEST) logBadge = "bg-blue-50 text-blue-700 border border-blue-200";
                else if (log.event_type === EventType.TRUST_SCORE) logBadge = "bg-indigo-50 text-indigo-700 border border-indigo-200";
                else if (log.event_type === EventType.ZTA_DECISION) logBadge = "bg-amber-50 text-amber-700 border border-amber-200";
                else if (log.event_type === EventType.AGENT_ACTION) logBadge = "bg-red-50 text-red-700 border border-red-200";
                else if (log.event_type === EventType.HUMAN_OVERRIDE) logBadge = "bg-purple-50 text-purple-700 border border-purple-200";

                return (
                  <tr key={log.record_hash} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-bold text-slate-500 font-mono">#{log.record_id}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${logBadge}`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-900 font-mono font-medium">{log.user_id}</td>
                    <td className="py-2 px-3 text-slate-400 font-mono truncate max-w-[80px]" title={log.prev_hash}>{log.prev_hash}</td>
                    <td className="py-2 px-3 text-right text-emerald-600 font-bold font-mono truncate max-w-[80px]" title={log.record_hash}>{log.record_hash}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification & Breach injection */}
      <div className="space-y-6" id="ledger-controls-wrapper">
        {/* Verification Panel */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs" id="panel-verification-controls">
          <h3 className="text-base font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-4">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            Integrity Verification
          </h3>
          <p className="text-slate-500 text-xs mb-4 leading-relaxed">
            Sequentially recalculates block hashes. Returns success if and only if the backward mappings are strictly intact.
          </p>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-mono text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            id="btn-trigger-ledger-verify"
          >
            {verifying ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying Chained Blocks...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Initiate Block Audit
              </>
            )}
          </button>

          <button
            onClick={handleHeal}
            disabled={healing || ledger.length === 0}
            className="w-full mt-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-mono text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
            id="btn-remediate-ledger"
          >
            {healing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Remediating Ledger...
              </>
            ) : (
              <>
                <HeartPulse className="h-3.5 w-3.5 text-indigo-600" />
                Fix Audit Ledger (Remediate)
              </>
            )}
          </button>

          {healMessage && (
            <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-950 font-mono text-[10px] font-medium" id="heal-message-banner">
              <p className="leading-normal">{healMessage}</p>
            </div>
          )}

          {/* Verification Result Display */}
          {verificationResult && (
            <div
              className={`mt-4 p-4 rounded-lg border flex items-start gap-3 ${verificationResult.passed ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}
              id="verification-result-display"
            >
              {verificationResult.passed ? (
                <>
                  <CheckCircle className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <h5 className="font-sans font-bold text-xs uppercase text-emerald-950">Ledger Secured</h5>
                    <p className="text-[10px] font-mono mt-1 text-slate-600">{verificationResult.details}</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 animate-bounce text-red-600" />
                  <div className="flex-1">
                    <h5 className="font-sans font-bold text-xs uppercase text-red-950">Integrity Failure Detected</h5>
                    <p className="text-[10px] font-mono mt-1 text-red-700">{verificationResult.details}</p>
                    <p className="text-[10px] font-mono mt-1 text-slate-700">
                      Broken Block Index: <strong className="text-red-950">Block #{verificationResult.broken_at_record_id}</strong>
                    </p>
                    <button
                      onClick={handleHeal}
                      disabled={healing}
                      className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 font-sans text-[10px] font-bold py-1.5 px-3 rounded-md flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <HeartPulse className="h-3 w-3 text-red-600" />
                      Fix Chain Mismatches Now
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Breach Injection Panel */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs" id="panel-breach-controls">
          <h3 className="text-base font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-2">
            <Skull className="h-4 w-4 text-red-500 animate-pulse" />
            Simulate Adversarial Breach
          </h3>
          <p className="text-slate-500 text-xs mb-4 leading-relaxed">
            Simulate administrative database tampering. Alters a historic log entry, which breaks the SHA-256 hash chains. Run verification to inspect detection.
          </p>

          <form onSubmit={handleSimulateBreach} className="space-y-4">
            <div>
              <label className="block text-xs font-sans uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                Target Block ID to Tamper
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 5"
                value={breachRecordId}
                onChange={(e) => setBreachRecordId(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 text-xs font-sans py-2.5 px-3 rounded-lg focus:outline-none transition"
                id="input-breach-id"
              />
            </div>

            <button
              type="submit"
              disabled={!breachRecordId || ledger.length === 0}
              className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-sans text-xs font-bold py-2.5 rounded-lg transition cursor-pointer shadow-2xs"
              id="btn-trigger-breach"
            >
              Inject Log Tampering
            </button>
          </form>

          {breachMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-950 font-mono text-[10px] font-medium" id="breach-message-banner">
              <p className="leading-normal">{breachMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
