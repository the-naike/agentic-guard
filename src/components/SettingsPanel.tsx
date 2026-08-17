/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sliders, Cpu, Save, ShieldAlert, CheckCircle, RefreshCw } from "lucide-react";
import { AppConfig } from "../types.js";

interface SettingsPanelProps {
  config: AppConfig | null;
  onSaveConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
  onRetrainModel: () => Promise<string>;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  onSaveConfig,
  onRetrainModel,
}) => {
  // Local state mirroring config
  const [w1, setW1] = useState(0.5);
  const [w2, setW2] = useState(0.3);
  const [w3, setW3] = useState(0.2);
  const [allowMin, setAllowMin] = useState(0.65);
  const [quarantineMin, setQuarantineMin] = useState(0.35);

  const [saving, setSaving] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setW1(config.trust_weights.w1_anomaly);
      setW2(config.trust_weights.w2_reputation);
      setW3(config.trust_weights.w3_temporal);
      setAllowMin(config.policy_thresholds.allow_min);
      setQuarantineMin(config.policy_thresholds.quarantine_min);
    }
  }, [config]);

  // Adjust weights to always sum to 1.0 when sliders are moved
  const handleWeightChange = (weightNum: 1 | 2 | 3, value: number) => {
    if (weightNum === 1) {
      setW1(value);
      // Redistribute difference to others
      const remaining = 1.0 - value;
      setW2(Math.max(0, Math.round((remaining * 0.6) * 100) / 100));
      setW3(Math.max(0, Math.round((remaining * 0.4) * 100) / 100));
    } else if (weightNum === 2) {
      setW2(value);
      const remaining = 1.0 - value;
      setW1(Math.max(0, Math.round((remaining * 0.7) * 100) / 100));
      setW3(Math.max(0, Math.round((remaining * 0.3) * 100) / 100));
    } else {
      setW3(value);
      const remaining = 1.0 - value;
      setW1(Math.max(0, Math.round((remaining * 0.6) * 100) / 100));
      setW2(Math.max(0, Math.round((remaining * 0.4) * 100) / 100));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await onSaveConfig({
        trust_weights: {
          w1_anomaly: w1,
          w2_reputation: w2,
          w3_temporal: w3,
        },
        policy_thresholds: {
          allow_min: allowMin,
          quarantine_min: quarantineMin,
        },
      });
      setMessage("Configuration updated successfully. New policies hot-reloaded.");
    } catch (err: any) {
      setMessage(`Failed to update config: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setMessage(null);

    try {
      const res = await onRetrainModel();
      setMessage(res);
    } catch (err: any) {
      setMessage(`Retraining failure: ${err.message}`);
    } finally {
      setRetraining(false);
    }
  };

  const sumWeights = Math.round((w1 + w2 + w3) * 100) / 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="panel-settings">
      {/* Policy and Weight Tuning */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
        <h3 className="text-base font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-4">
          <Sliders className="h-4 w-4 text-indigo-600" />
          Zero Trust Weight & Policy Gates Tuning
        </h3>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Trust weights */}
          <div className="space-y-4">
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200">
              Trust Formula Weights (Must Sum to 1.0) - Current Sum:{" "}
              <span className={sumWeights === 1.0 ? "text-emerald-600 font-bold font-mono" : "text-red-500 font-bold font-mono"}>
                {sumWeights.toFixed(2)}
              </span>
            </h4>

            {/* w1 */}
            <div>
              <div className="flex justify-between text-xs font-sans text-slate-500 font-semibold mb-1">
                <span>Anomaly Detection Weight (w1):</span>
                <span className="text-slate-800 font-mono font-bold">{w1.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={w1}
                onChange={(e) => handleWeightChange(1, Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* w2 */}
            <div>
              <div className="flex justify-between text-xs font-sans text-slate-500 font-semibold mb-1">
                <span>User Reputation Weight (w2):</span>
                <span className="text-slate-800 font-mono font-bold">{w2.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={w2}
                onChange={(e) => handleWeightChange(2, Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* w3 */}
            <div>
              <div className="flex justify-between text-xs font-sans text-slate-500 font-semibold mb-1">
                <span>Temporal Context Risk Weight (w3):</span>
                <span className="text-slate-800 font-mono font-bold">{w3.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={w3}
                onChange={(e) => handleWeightChange(3, Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          {/* Access Policy Thresholds */}
          <div className="space-y-4">
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200">
              Zero Trust Policy Gate Access Gates
            </h4>

            {/* allow min */}
            <div>
              <div className="flex justify-between text-xs font-sans text-slate-500 font-semibold mb-1">
                <span>Allow Minimum Threshold (tb ≥ allow_min):</span>
                <span className="text-emerald-600 font-mono font-bold">{allowMin.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="0.9"
                step="0.05"
                value={allowMin}
                onChange={(e) => setAllowMin(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* quarantine min */}
            <div>
              <div className="flex justify-between text-xs font-sans text-slate-500 font-semibold mb-1">
                <span>Quarantine Minimum Threshold (tb ≥ quarantine_min):</span>
                <span className="text-amber-600 font-mono font-bold">{quarantineMin.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={quarantineMin}
                onChange={(e) => setQuarantineMin(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || sumWeights !== 1.0}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-sans text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            id="btn-save-weights"
          >
            <Save className="h-4 w-4" />
            Deploy Policy Coefficients
          </button>
        </form>
      </div>

      {/* Machine Learning Controls */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs flex flex-col justify-between" id="ml-settings-wrapper">
        <div>
          <h3 className="text-base font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-4">
            <Cpu className="h-4 w-4 text-indigo-600" />
            Machine Learning & Anomaly Tuning
          </h3>
          <p className="text-slate-500 text-xs mb-4 leading-relaxed">
            Agentic Guard integrates an unsupervised <strong>Isolation Forest</strong> detector trained dynamically on benign event footprints. Fit the forest to recalculate anomaly thresholds as normal user profiles evolve.
          </p>

          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3 font-mono text-xs mb-6 shadow-2xs">
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-400 font-semibold">ML Engine:</span>
              <span className="text-emerald-600 font-bold">Unsupervised Isolation Forest</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-400 font-semibold">Trees:</span>
              <span className="text-slate-800 font-semibold">100 Trees</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-400 font-semibold">Sub-Sample Rate:</span>
              <span className="text-slate-800 font-semibold">256 samples per tree</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Feature Scaling:</span>
              <span className="text-indigo-600 font-bold">NATIVE StandardScaler FIT</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRetrain}
            disabled={retraining}
            className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 font-sans text-xs font-semibold py-3 rounded-lg border border-slate-200 hover:border-slate-300 flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
            id="btn-trigger-retrain"
          >
            <RefreshCw className={`h-4 w-4 ${retraining ? "animate-spin text-indigo-600" : "text-slate-400"}`} />
            {retraining ? "Fitting Isolation Forest..." : "Retrain Isolation Forest"}
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-150 rounded-lg flex items-start gap-2.5" id="settings-message-banner">
            <CheckCircle className="h-4.5 w-4.5 text-indigo-600 mt-0.5 shrink-0" />
            <p className="text-[10px] font-sans text-indigo-950 leading-normal font-medium">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};
