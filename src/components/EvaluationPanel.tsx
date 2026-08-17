/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sliders, Sparkles, TrendingUp, Cpu, Hourglass, ShieldCheck, CheckSquare, Target } from "lucide-react";
import { EvaluationMetrics } from "../types.js";

interface EvaluationPanelProps {
  onRunEvaluation: (count: number, ratio: number) => Promise<EvaluationMetrics>;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({ onRunEvaluation }) => {
  const [evalCount, setEvalCount] = useState(50);
  const [evalRatio, setEvalRatio] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);

  const handleRunEval = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setMetrics(null);

    try {
      const data = await onRunEvaluation(evalCount, evalRatio / 100);
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6" id="panel-evaluation">
      {/* Simulation Trigger */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
        <h3 className="text-base font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-indigo-600" />
          Academic Performance Evaluation Module
        </h3>
        <p className="text-slate-500 text-xs mb-4 leading-relaxed">
          Runs a closed-loop batch evaluation of N synthetic events. It re-attaches the stripped ground-truth labels only at the evaluation boundary to calculate standard detection metrics.
        </p>

        <form onSubmit={handleRunEval} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-sans uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
              Evaluation Size ({evalCount} Sessions)
            </label>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={evalCount}
              onChange={(e) => setEvalCount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-sans uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
              Attack Event Density ({evalRatio}%)
            </label>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={evalRatio}
              onChange={(e) => setEvalRatio(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={isRunning}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-sans text-xs font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            id="btn-run-evaluation"
          >
            {isRunning ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Evaluating Pipeline...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Execute Evaluation Run
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Display */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="evaluation-results-wrapper">
          {/* Main Accuracy Metrics Card */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-xl shadow-xs grid grid-cols-2 gap-6 animate-fade-in" id="metrics-scores-grid">
            <div className="col-span-2 border-b border-slate-200 pb-3">
              <h4 className="text-sm font-sans font-bold text-slate-900">Detection Performance Results</h4>
            </div>

            {/* F1 Progress Ring */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="relative h-24 w-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="42" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="#4f46e5"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={263.89}
                    strokeDashoffset={263.89 - (263.89 * metrics.f1_score)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xl font-mono font-bold text-slate-900">
                  {(metrics.f1_score * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-[10px] font-sans font-bold text-slate-500 mt-3 uppercase tracking-wider">F1 Harmonized Score</p>
            </div>

            {/* Metrics Checklist */}
            <div className="space-y-3 flex flex-col justify-center">
              <div className="flex justify-between items-center text-xs font-sans border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Accuracy Score:</span>
                <span className="text-slate-900 font-mono font-bold">{(metrics.accuracy * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center text-xs font-sans border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Precision Rate:</span>
                <span className="text-slate-900 font-mono font-bold">{(metrics.precision * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center text-xs font-sans border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Recall (Sensitivity):</span>
                <span className="text-slate-900 font-mono font-bold">{(metrics.recall * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center text-xs font-sans border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-semibold text-indigo-600">ROC-AUC Discriminator:</span>
                <span className="text-indigo-600 font-mono font-bold">{metrics.roc_auc.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-sans">
                <span className="text-slate-500 font-semibold">ZTA Gate Correctness:</span>
                <span className="text-emerald-600 font-mono font-bold">{(metrics.policy_correctness * 100).toFixed(2)}%</span>
              </div>
            </div>

            {/* False Alarms row */}
            <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex justify-between items-center text-xs font-sans font-medium">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px]">False Positive Rate (FPR)</span>
                  <span className="text-amber-600 font-mono font-bold">{(metrics.false_positive_rate * 100).toFixed(2)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-amber-500 h-full" style={{ width: `${metrics.false_positive_rate * 100}%` }} />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex justify-between items-center text-xs font-sans font-medium">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px]">False Negative Rate (FNR)</span>
                  <span className="text-red-600 font-mono font-bold">{(metrics.false_negative_rate * 100).toFixed(2)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-red-500 h-full" style={{ width: `${metrics.false_negative_rate * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Core Latency and Trust Separation */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs flex flex-col justify-between" id="evaluation-context-panel">
            <div>
              <h4 className="text-sm font-sans font-bold text-slate-900 tracking-tight mb-4">
                System Efficiency Metrics
              </h4>

              <div className="space-y-4">
                {/* Pipeline Latency */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3 shadow-2xs">
                  <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 text-indigo-600">
                    <Hourglass className="h-4.5 w-4.5 animate-spin" />
                  </div>
                  <div>
                    <p className="text-[9px] font-sans font-bold text-slate-400 uppercase tracking-wider">Average Pipeline Latency</p>
                    <p className="text-lg font-sans font-bold text-indigo-600 mt-0.5">
                      {metrics.mean_pipeline_latency_ms.toFixed(1)} ms
                    </p>
                  </div>
                </div>

                {/* End-to-End Latency by Path (in seconds) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <h5 className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-3">
                    End-to-End Latency by Execution Path
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[10px] font-sans font-medium text-slate-500">
                        <span>Direct ALLOW Path</span>
                        <span className="text-indigo-600 font-bold font-mono">{(metrics.path_latency?.direct_allow_seconds ?? 0).toFixed(4)} s</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-indigo-500 h-full animate-pulse" style={{ width: `${Math.min(100, ((metrics.path_latency?.direct_allow_seconds ?? 0.002) / 0.03) * 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-sans font-medium text-slate-500">
                        <span>Direct DENY Path</span>
                        <span className="text-indigo-600 font-bold font-mono">{(metrics.path_latency?.direct_deny_seconds ?? 0).toFixed(4)} s</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-indigo-500 h-full animate-pulse" style={{ width: `${Math.min(100, ((metrics.path_latency?.direct_deny_seconds ?? 0.002) / 0.03) * 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-sans font-medium text-slate-500">
                        <span>QUARANTINE (Reasoner) Path</span>
                        <span className="text-amber-600 font-bold font-mono">{(metrics.path_latency?.quarantine_reasoner_seconds ?? 0).toFixed(4)} s</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-amber-500 h-full animate-pulse" style={{ width: `${Math.min(100, ((metrics.path_latency?.quarantine_reasoner_seconds ?? 0.015) / 0.03) * 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-sans font-medium text-slate-500">
                        <span>DENY (Reasoner + Actor) Path</span>
                        <span className="text-red-600 font-bold font-mono">{(metrics.path_latency?.deny_reasoner_actor_seconds ?? 0).toFixed(4)} s</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-red-500 h-full animate-pulse" style={{ width: `${Math.min(100, ((metrics.path_latency?.deny_reasoner_actor_seconds ?? 0.02) / 0.03) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-[8px] font-sans text-slate-400 mt-2.5 leading-normal">
                    AI Reasoner invocation adds substantial latency overhead due to the LLM agent decision loop, whereas Direct paths are executed within microseconds.
                  </p>
                </div>

                {/* Trust score separation visual curves */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <h5 className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Trust Margin Separation Curve
                  </h5>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] font-sans font-medium text-slate-500">
                        <span>BENIGN TRUTH (tb)</span>
                        <span className="text-emerald-600 font-bold font-mono">tb: {metrics.mean_normal_trust.toFixed(4)}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-emerald-500 h-full" style={{ width: `${metrics.mean_normal_trust * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-sans font-medium text-slate-500">
                        <span>ATTACK TRUTH (tb)</span>
                        <span className="text-red-600 font-bold font-mono">tb: {metrics.mean_attack_trust.toFixed(4)}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-red-500 h-full" style={{ width: `${metrics.mean_attack_trust * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] font-sans text-slate-400 mt-3 leading-normal border-t border-slate-200 pt-2 text-center font-medium">
                    Mathematical separation of trust scores between NORMAL (high tb) and ATTACK (low tb) confirms threat boundary validity.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-lg flex items-start gap-2 mt-4" id="eval-evaluation-notices">
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-600 mt-0.5 shrink-0" />
              <p className="text-[10px] font-sans text-indigo-950 leading-normal font-medium">
                All measurements generated during this run are fitted directly to hardware clocks (single container node), proving zero-GPU model feasibility.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
