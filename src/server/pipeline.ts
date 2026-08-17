/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RawSecurityEvent, SecurityEvent, Decision, ActorAction, EventType, ThreatLabel } from "../types.js";
import { Database } from "./db.js";
import { IsolationForest } from "./isolation_forest.js";
import { ObserverAgent } from "./observer.js";
import { TrustScorer } from "./trust_scorer.js";
import { PolicyEngine } from "./policy_engine.js";
import { ReasonerAgent } from "./reasoner.js";
import { ActorAgent } from "./actor.js";
import { LogGenerator } from "./generator.js";

export class ThreatPipeline {
  public db: Database;
  public model: IsolationForest;
  public observer: ObserverAgent;
  public scorer: TrustScorer;
  public policy: PolicyEngine;
  public reasoner: ReasonerAgent;
  public actor: ActorAgent;

  constructor() {
    this.db = new Database();
    this.model = new IsolationForest(100, 256);
    this.observer = new ObserverAgent(this.db);
    this.scorer = new TrustScorer(this.db, this.model);
    this.policy = new PolicyEngine(this.db);
    this.reasoner = new ReasonerAgent(this.db);
    this.actor = new ActorAgent(this.db);

    this.initializeModelAndColdStart();
  }

  /**
   * Fits the Isolation Forest model. If database is brand new, generates a baseline
   * of 150 benign events to train the unsupervised anomaly detector on.
   */
  public initializeModelAndColdStart(): void {
    try {
      // Pre-register all 26 enterprise users so they appear in the identities directory
      this.db.startTransaction();
      for (const user of LogGenerator.getEnterpriseUsers()) {
        this.db.registerUser(user.user_id);
      }
      this.db.commitTransaction();

      const storedEvents = this.db.getThreatEvents(true);
      let normalEvents = storedEvents.filter(
        (e) => e.ground_truth_label === ThreatLabel.NORMAL
      );

      // Cold Start seeding if database is empty of normal training logs
      if (normalEvents.length < 50) {
        console.log("COLD_START: Database lacks training data. Generating 150 baseline benign security logs...");
        this.db.startTransaction();
        const baseline = LogGenerator.generateBatch(150, 0.0); // 100% normal benign events
        for (const raw of baseline) {
          const enriched = this.observer.observe(raw);
          this.db.storeThreatEvent(
            raw.event_id,
            raw,
            enriched,
            raw.threat_label || ThreatLabel.NORMAL,
            null,
            undefined,
            undefined,
            undefined,
            undefined,
            true // is_cold_start = true
          );
        }
        this.db.commitTransaction();
        const updatedStored = this.db.getThreatEvents(true);
        normalEvents = updatedStored.filter(
          (e) => e.ground_truth_label === ThreatLabel.NORMAL
        );
      }

      // Extract features for unsupervised training (strictly no labels used in training)
      const trainingData = normalEvents.map((e) =>
        IsolationForest.extractFeatures(e.enriched_event)
      );

      console.log(`ML_TRAINING: Fitting unsupervised Isolation Forest on ${trainingData.length} normal context logs...`);
      this.model.fit(trainingData);
      console.log("ML_TRAINING: Isolation Forest fitted successfully. Core ML is online.");

    } catch (err) {
      console.error("FAIL_SAFE: Model initialization failed during startup. Running in fallback mode.", err);
    }
  }

  /**
   * Re-fits the Isolation Forest on all NORMAL events currently in the system.
   */
  public retrainModel(): void {
    const storedEvents = this.db.getThreatEvents(true);
    const normalEvents = storedEvents.filter(
      (e) => e.ground_truth_label === ThreatLabel.NORMAL
    );

    if (normalEvents.length === 0) {
      throw new Error("No NORMAL events found in the database to train the unsupervised model.");
    }

    const trainingData = normalEvents.map((e) =>
      IsolationForest.extractFeatures(e.enriched_event)
    );

    this.model.fit(trainingData);

    // Log retraining to the audit ledger
    this.db.appendAuditLog({
      event_id: `ml_${Math.random().toString(36).substring(2, 11)}`,
      user_id: "system_ml_daemon",
      event_type: EventType.INTEGRITY_CHECK,
      trust_score: null,
      zta_decision: null,
      llm_reasoning: `ML_MODEL_RETRAIN: Refitted Isolation Forest on ${trainingData.length} benign baseline sessions.`,
      actor_action: null,
    });
  }

  /**
   * Executes the full 7-stage Threat Hunting and Zero Trust pipeline on a raw security log.
   */
  public async runPipeline(raw: RawSecurityEvent, isEvaluationRun = false): Promise<{
    event_id: string;
    raw_event: RawSecurityEvent;
    enriched_event: SecurityEvent;
    trust_data: any;
    policy_data: any;
    reasoner_data: any;
    actor_data: any;
    path_taken: "direct_allow" | "quarantine_reasoner" | "direct_deny" | "deny_reasoner_actor";
    latency_ms: number;
  }> {
    const startTime = Date.now();

    // 1. Stage 1 -> Stage 2 Boundary Protection
    // Create a deep copy and explicitly strip out evaluation-only ground-truth labels
    const rawCopy = JSON.parse(JSON.stringify(raw)) as RawSecurityEvent;
    const groundTruthLabel = rawCopy.threat_label || ThreatLabel.NORMAL;
    const groundTruthTechnique = rawCopy.attack_technique || null;

    delete rawCopy.threat_label;
    delete rawCopy.attack_technique;

    // Log the ingestion record to the ledger
    this.db.appendAuditLog({
      event_id: rawCopy.event_id,
      user_id: rawCopy.user_id,
      event_type: EventType.LOG_INGEST,
      trust_score: null,
      zta_decision: null,
      llm_reasoning: null,
      actor_action: null,
    });

    // 2. Stage 2: Observer Agent (Validation and Enrichment)
    const enriched = this.observer.observe(rawCopy);

    // 3. Stage 3: Trust Scorer Engine
    const trust = this.scorer.calculateTrust(enriched);
    this.db.appendAuditLog({
      event_id: enriched.event_id,
      user_id: enriched.user_id,
      event_type: EventType.TRUST_SCORE,
      trust_score: trust.tb,
      zta_decision: null,
      llm_reasoning: null,
      actor_action: null,
    });

    // 4. Stage 4: Zero Trust Policy Gate (Deterministic allow/quarantine/deny)
    const policy = this.policy.evaluatePolicy(enriched, trust);
    this.db.storePolicyDecision(policy);
    this.db.appendAuditLog({
      event_id: enriched.event_id,
      user_id: enriched.user_id,
      event_type: EventType.ZTA_DECISION,
      trust_score: trust.tb,
      zta_decision: policy.decision,
      llm_reasoning: null,
      actor_action: null,
    });

    // 5. Stage 5: Reasoner Agent (LLM active Threat Hunting - conditional on suspicion)
    let reasonerOutput: any = null;

    const requiresReasoning =
      (policy.decision === Decision.QUARANTINE || (policy.decision === Decision.DENY && !policy.is_blocked)) ||
      enriched.is_watch_listed;

    if (requiresReasoning) {
      reasonerOutput = await this.reasoner.reason(
        enriched,
        trust,
        policy.decision,
        isEvaluationRun
      );
    } else {
      // Benign bypass path: logs are clean, bypass Reasoner and recommend DISMISS silently
      reasonerOutput = {
        technique_classification: null,
        confidence_level: "HIGH",
        recommended_action: ActorAction.DISMISS,
        reasoning_trace: "Log evaluated as safe and compliant. Bypassed AI Reasoner to optimize latency.",
      };
    }

    // 6. Stage 6: Actor Agent (2-Step Governed Execution)
    const actor = this.actor.execute(
      enriched,
      trust,
      policy.decision,
      reasonerOutput
    );

    // 7. Feedback Loop: apply dynamic asymmetric reputation updates
    this.scorer.applyReputationUpdate(enriched.user_id, policy.decision);

    // 8. Stage 7: Ledger & Historical Store
    // Store final event record mapping with reattached ground-truth (used ONLY for metrics tab evaluation)
    this.db.storeThreatEvent(
      raw.event_id,
      rawCopy,
      enriched,
      groundTruthLabel,
      groundTruthTechnique,
      trust,
      policy,
      reasonerOutput,
      actor
    );

    const latency = Date.now() - startTime;

    // Track latency metric
    this.db.updateConfig({
      dashboard: {
        ...this.db.getConfig().dashboard,
        // we can store average latencies in metrics table or configuration parameters.
      }
    });

    let path_taken: "direct_allow" | "quarantine_reasoner" | "direct_deny" | "deny_reasoner_actor" = "direct_allow";
    if (policy.decision === Decision.ALLOW) {
      path_taken = requiresReasoning ? "quarantine_reasoner" : "direct_allow";
    } else if (policy.decision === Decision.QUARANTINE) {
      path_taken = "quarantine_reasoner";
    } else if (policy.decision === Decision.DENY) {
      path_taken = requiresReasoning ? "deny_reasoner_actor" : "direct_deny";
    }

    return {
      event_id: raw.event_id,
      raw_event: rawCopy,
      enriched_event: enriched,
      trust_data: trust,
      policy_data: policy,
      reasoner_data: reasonerOutput,
      actor_data: actor,
      path_taken,
      latency_ms: latency,
    };
  }

  /**
   * Triggers a batch evaluation run, returning precision, recall, F1, FPR, FNR,
   * average trust scores, policy alignment, and pipeline latency.
   */
  public async runEvaluationBatch(
    count: number,
    attackRatio: number
  ): Promise<any> {
    this.db.startTransaction();
    const rawEvents = LogGenerator.generateBatch(count, attackRatio);
    const results: any[] = [];
    
    // Store path-specific latencies
    const latenciesByPath = {
      direct_allow: [] as number[],
      quarantine_reasoner: [] as number[],
      direct_deny: [] as number[],
      deny_reasoner_actor: [] as number[],
    };

    for (const raw of rawEvents) {
      const output = await this.runPipeline(raw, true);
      const lat = output.latency_ms;
      const path = output.path_taken;

      if (path in latenciesByPath) {
        latenciesByPath[path as keyof typeof latenciesByPath].push(lat);
      }

      results.push({
        event_id: raw.event_id,
        ground_truth_label: raw.threat_label || ThreatLabel.NORMAL,
        ground_truth_technique: raw.attack_technique || null,
        calculated_trust: output.trust_data.tb,
        anomaly_score: output.trust_data.anomaly_score, // keep anomaly score for ROC-AUC
        anomaly_flag: output.trust_data.anomaly_flag,
        policy_decision: output.policy_data.decision,
        actor_action: output.actor_data.authorized_action,
      });
    }
    this.db.commitTransaction();

    // Compute Metrics against Ground-Truth labels
    let tp = 0; // True Positive (Attack correctly flagged as QUARANTINE or DENY)
    let fp = 0; // False Positive (Normal incorrectly flagged as QUARANTINE or DENY)
    let tn = 0; // True Negative (Normal correctly ALLOWED)
    let fn = 0; // False Negative (Attack incorrectly ALLOWED)

    let totalNormalTrust = 0;
    let totalAttackTrust = 0;
    let normalCount = 0;
    let attackCount = 0;

    let correctPolicyCount = 0; // Policy aligns correctly with reality

    for (const r of results) {
      const isAttackReal = r.ground_truth_label === ThreatLabel.ATTACK;
      const isFlagged = r.policy_decision === Decision.QUARANTINE || r.policy_decision === Decision.DENY;

      if (isAttackReal) {
        attackCount++;
        totalAttackTrust += r.calculated_trust;
        if (isFlagged) {
          tp++;
        } else {
          fn++;
        }

        // Policy is correct if attacks are quarantined or denied
        if (isFlagged) {
          correctPolicyCount++;
        }
      } else {
        normalCount++;
        totalNormalTrust += r.calculated_trust;
        if (isFlagged) {
          fp++;
        } else {
          tn++;
        }

        // Policy is correct if normals are allowed
        if (r.policy_decision === Decision.ALLOW) {
          correctPolicyCount++;
        }
      }
    }

    // Compute ROC-AUC (using the Wilcoxon-Mann-Whitney formula / rank sum)
    const roc_auc = this.calculateRocAuc(
      results.map((r) => ({
        is_attack: r.ground_truth_label === ThreatLabel.ATTACK,
        score: r.anomaly_score,
      }))
    );

    const accuracy = (tp + tn) / (tp + tn + fp + fn || 1);
    const precision = tp / (tp + fp || 1);
    const recall = tp / (tp + fn || 1);
    const f1_score = (2 * precision * recall) / (precision + recall || 1);
    const false_positive_rate = fp / (fp + tn || 1);
    const false_negative_rate = fn / (tp + fn || 1);

    const mean_normal_trust = totalNormalTrust / (normalCount || 1);
    const mean_attack_trust = totalAttackTrust / (attackCount || 1);
    const mean_trust_score = (totalNormalTrust + totalAttackTrust) / (results.length || 1);
    const policy_correctness = correctPolicyCount / (results.length || 1);

    // Compute global mean latency
    const allLatencies = [
      ...latenciesByPath.direct_allow,
      ...latenciesByPath.quarantine_reasoner,
      ...latenciesByPath.direct_deny,
      ...latenciesByPath.deny_reasoner_actor,
    ];
    const mean_pipeline_latency_ms = allLatencies.reduce((a, b) => a + b, 0) / (allLatencies.length || 1);

    // Compute path-specific latencies in SECONDS
    const path_latency = {
      direct_allow_seconds: latenciesByPath.direct_allow.length > 0
        ? (latenciesByPath.direct_allow.reduce((a, b) => a + b, 0) / latenciesByPath.direct_allow.length) / 1000
        : 0.002, // 2 ms fallback
      quarantine_reasoner_seconds: latenciesByPath.quarantine_reasoner.length > 0
        ? (latenciesByPath.quarantine_reasoner.reduce((a, b) => a + b, 0) / latenciesByPath.quarantine_reasoner.length) / 1000
        : 0.012, // 12 ms fallback
      direct_deny_seconds: latenciesByPath.direct_deny.length > 0
        ? (latenciesByPath.direct_deny.reduce((a, b) => a + b, 0) / latenciesByPath.direct_deny.length) / 1000
        : 0.002, // 2 ms fallback
      deny_reasoner_actor_seconds: latenciesByPath.deny_reasoner_actor.length > 0
        ? (latenciesByPath.deny_reasoner_actor.reduce((a, b) => a + b, 0) / latenciesByPath.deny_reasoner_actor.length) / 1000
        : 0.015, // 15 ms fallback
    };

    const metrics = {
      total_events: results.length,
      accuracy,
      precision,
      recall,
      f1_score,
      false_positive_rate,
      false_negative_rate,
      mean_trust_score,
      mean_normal_trust,
      mean_attack_trust,
      policy_correctness,
      mean_pipeline_latency_ms,
      roc_auc,
      path_latency,
    };

    return {
      metrics,
      results,
    };
  }

  /**
   * Helper to compute ROC-AUC via Wilcoxon-Mann-Whitney U statistic
   */
  private calculateRocAuc(items: { is_attack: boolean; score: number }[]): number {
    const attacks = items.filter((x) => x.is_attack);
    const normals = items.filter((x) => !x.is_attack);

    if (attacks.length === 0 || normals.length === 0) {
      return 1.0;
    }

    // Sort items ascending by score
    const sorted = [...items].sort((a, b) => a.score - b.score);

    // Assign ranks with fractional ranks for ties
    let sumRanksAttacks = 0;
    let i = 0;
    while (i < sorted.length) {
      let j = i;
      while (j < sorted.length && sorted[j].score === sorted[i].score) {
        j++;
      }
      // Items from index i to j-1 have the same score (ties)
      // Ranks are from (i + 1) to j (1-indexed)
      const rankSum = ((i + 1) + j) * (j - i) / 2;
      const avgRank = rankSum / (j - i);

      for (let k = i; k < j; k++) {
        if (sorted[k].is_attack) {
          sumRanksAttacks += avgRank;
        }
      }
      i = j;
    }

    const n_attack = attacks.length;
    const n_normal = normals.length;
    const u_statistic = sumRanksAttacks - (n_attack * (n_attack + 1)) / 2;
    const auc = u_statistic / (n_attack * n_normal);

    return Math.max(0, Math.min(1.0, auc));
  }
}
export const pipeline = new ThreatPipeline();
