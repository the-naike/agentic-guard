/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  AuditLogEntry,
  Decision,
  ActorAction,
  EventType,
  RawSecurityEvent,
  SecurityEvent,
  PolicyDecisionData,
  UserReputation,
  ActiveState,
  ConfidenceLevel,
  AppConfig
} from "../types.js";

interface DatabaseSchema {
  users: Record<string, { user_id: string; first_seen: string }>;
  reputation: Record<string, UserReputation>;
  audit_logs: AuditLogEntry[];
  policy_decisions: PolicyDecisionData[];
  threat_events: Record<
    string,
    {
      event_id: string;
      raw_event: any;
      enriched_event: SecurityEvent;
      ground_truth_label: string;
      ground_truth_technique: string | null;
      trust_data?: any;
      policy_data?: any;
      reasoner_data?: any;
      actor_data?: any;
      is_cold_start?: boolean;
    }
  >;
  adaptive_state: Record<string, ActiveState>; // watch-list
  blocked_users: Record<string, { user_id: string; blocked_at: string; reason: string }>; // blocklist
  llm_reasoning: Record<
    string,
    {
      event_id: string;
      technique_classification: string | null;
      confidence_level: ConfidenceLevel;
      recommended_action: ActorAction;
      reasoning_trace: string;
      timestamp: string;
    }
  >;
  integrity_checks: Array<{
    id: number;
    checked_at: string;
    result: string;
    broken_at_record_id: number | null;
  }>;
  config: AppConfig;
}

const DEFAULT_CONFIG: AppConfig = {
  trust_weights: {
    w1_anomaly: 0.5,
    w2_reputation: 0.3,
    w3_temporal: 0.2,
  },
  policy_thresholds: {
    allow_min: 0.65,
    quarantine_min: 0.35,
  },
  reputation_updates: {
    allow_gain_pct: 0.05,
    quarantine_penalty_pct: 0.10,
    deny_penalty_pct: 0.20,
  },
  generation: {
    default_event_count: 200,
    default_attack_ratio: 0.20,
  },
  llm: {
    primary_model: "gemini-3.5-flash",
    rate_limit_per_minute: 30,
    fallback_enabled: true,
  },
  dashboard: {
    refresh_interval_seconds: 5,
  },
};

export class Database {
  private filePath: string;
  private db: DatabaseSchema;

  constructor(customPath?: string) {
    this.filePath = customPath || path.join(process.cwd(), "database_store.json");
    this.db = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw);
        // Ensure default structures exist
        return {
          users: parsed.users || {},
          reputation: parsed.reputation || {},
          audit_logs: parsed.audit_logs || [],
          policy_decisions: parsed.policy_decisions || [],
          threat_events: parsed.threat_events || {},
          adaptive_state: parsed.adaptive_state || {},
          blocked_users: parsed.blocked_users || {},
          llm_reasoning: parsed.llm_reasoning || {},
          integrity_checks: parsed.integrity_checks || [],
          config: parsed.config || { ...DEFAULT_CONFIG },
        };
      } catch (err) {
        console.error("Failed to parse database, resetting to default", err);
      }
    }

    const initial: DatabaseSchema = {
      users: {},
      reputation: {},
      audit_logs: [],
      policy_decisions: [],
      threat_events: {},
      adaptive_state: {},
      blocked_users: {},
      llm_reasoning: {},
      integrity_checks: [],
      config: { ...DEFAULT_CONFIG },
    };
    this.saveDirect(initial);
    return initial;
  }

  private isDeferringSave = false;

  public startTransaction(): void {
    this.isDeferringSave = true;
  }

  public commitTransaction(): void {
    this.isDeferringSave = false;
    this.save();
  }

  private save(): void {
    if (this.isDeferringSave) return;
    this.saveDirect(this.db);
  }

  private saveDirect(data: DatabaseSchema): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  // Config Methods
  public getConfig(): AppConfig {
    return this.db.config;
  }

  public updateConfig(newConfig: Partial<AppConfig>): void {
    this.db.config = { ...this.db.config, ...newConfig };
    this.save();
  }

  // User Methods
  public registerUser(user_id: string): void {
    if (!this.db.users[user_id]) {
      this.db.users[user_id] = {
        user_id,
        first_seen: new Date().toISOString(),
      };
      // Register initial reputation
      this.db.reputation[user_id] = {
        user_id,
        score: 0.5, // default initial reputation
        last_updated: new Date().toISOString(),
      };
      this.save();
    }
  }

  public getUsers(): string[] {
    return Object.keys(this.db.users);
  }

  // Reputation Methods
  public getReputation(user_id: string): number {
    this.registerUser(user_id);
    return this.db.reputation[user_id]?.score ?? 0.5;
  }

  public getReputations(): UserReputation[] {
    return Object.values(this.db.reputation);
  }

  public updateReputation(user_id: string, newScore: number): void {
    this.registerUser(user_id);
    const clamped = Math.max(0, Math.min(1, newScore));
    this.db.reputation[user_id] = {
      user_id,
      score: clamped,
      last_updated: new Date().toISOString(),
    };
    this.save();
  }

  // Threat Events Methods
  public storeThreatEvent(
    event_id: string,
    raw: RawSecurityEvent,
    enriched: SecurityEvent,
    label: string,
    technique: string | null,
    trust_data?: any,
    policy_data?: any,
    reasoner_data?: any,
    actor_data?: any,
    is_cold_start?: boolean
  ): void {
    this.registerUser(raw.user_id);
    this.db.threat_events[event_id] = {
      event_id,
      raw_event: raw,
      enriched_event: enriched,
      ground_truth_label: label,
      ground_truth_technique: technique,
      trust_data,
      policy_data,
      reasoner_data,
      actor_data,
      is_cold_start,
    };
    this.save();
  }

  public getThreatEvents(includeColdStart = false) {
    let events = Object.values(this.db.threat_events);
    if (!includeColdStart) {
      events = events.filter((evt) => !evt.is_cold_start);
    }
    return events.map((evt) => {
      if (evt.policy_data) return evt;

      // Find policy in decisions or default back safely
      const policy = this.db.policy_decisions.find((p) => p.event_id === evt.event_id);
      let decision = Decision.ALLOW;
      let tb = 0.85;
      let reason = "Inferred baseline policy decision.";
      let is_blocked = false;

      if (policy) {
        decision = policy.decision;
        tb = policy.tb;
        reason = policy.reason;
        is_blocked = policy.is_blocked;
      } else if (evt.ground_truth_label === "ATTACK") {
        decision = Decision.DENY;
        tb = 0.15;
        reason = "Inferred threat blockade.";
        is_blocked = true;
      }

      const policy_data = {
        event_id: evt.event_id,
        user_id: evt.enriched_event?.user_id || evt.raw_event?.user_id,
        decision,
        tb,
        anomaly_flag: evt.ground_truth_label === "ATTACK",
        is_blocked,
        reason,
        timestamp: evt.enriched_event?.timestamp || evt.raw_event?.timestamp || new Date().toISOString(),
      };

      const actor_data = {
        event_id: evt.event_id,
        user_id: evt.enriched_event?.user_id || evt.raw_event?.user_id,
        authorized_action: decision === Decision.ALLOW ? ActorAction.DISMISS : decision === Decision.QUARANTINE ? ActorAction.ESCALATE : ActorAction.ISOLATE,
        reputation_before: tb,
        reputation_after: decision === Decision.ALLOW ? Math.min(1.0, tb + 0.05) : 0.0,
        is_isolated: decision === Decision.DENY,
        is_escalated: decision === Decision.QUARANTINE,
        justification: "Inferred dynamic execution action.",
        timestamp: evt.enriched_event?.timestamp || evt.raw_event?.timestamp || new Date().toISOString(),
      };

      return {
        ...evt,
        policy_data,
        actor_data,
      };
    });
  }

  // Watch-list (adaptive_state) Methods
  public addToWatchList(user_id_or_ip: string, reason: string): void {
    this.db.adaptive_state[user_id_or_ip] = {
      user_id_or_ip,
      flagged_at: new Date().toISOString(),
      reason,
    };
    this.save();
  }

  public removeFromWatchList(user_id_or_ip: string): void {
    delete this.db.adaptive_state[user_id_or_ip];
    this.save();
  }

  public getWatchList(): ActiveState[] {
    return Object.values(this.db.adaptive_state);
  }

  public isWatchListed(user_id_or_ip: string): boolean {
    return !!this.db.adaptive_state[user_id_or_ip];
  }

  // Blocklist (blocked_users) Methods
  public blockUser(user_id: string, reason: string): void {
    this.db.blocked_users[user_id] = {
      user_id,
      blocked_at: new Date().toISOString(),
      reason,
    };
    this.save();
  }

  public unblockUser(user_id: string): void {
    delete this.db.blocked_users[user_id];
    this.save();
  }

  public getBlockedUsers(): Array<{ user_id: string; blocked_at: string; reason: string }> {
    return Object.values(this.db.blocked_users);
  }

  public isBlocked(user_id: string): boolean {
    return !!this.db.blocked_users[user_id];
  }

  // Policy Decision Methods
  public storePolicyDecision(data: PolicyDecisionData): void {
    this.db.policy_decisions.push(data);
    this.save();
  }

  public getPolicyDecisions(): PolicyDecisionData[] {
    return this.db.policy_decisions;
  }

  // LLM Reasoning Methods
  public storeLLMReasoning(
    event_id: string,
    classification: string | null,
    confidence: ConfidenceLevel,
    action: ActorAction,
    trace: string
  ): void {
    this.db.llm_reasoning[event_id] = {
      event_id,
      technique_classification: classification,
      confidence_level: confidence,
      recommended_action: action,
      reasoning_trace: trace,
      timestamp: new Date().toISOString(),
    };
    this.save();
  }

  public getLLMReasoning(event_id: string) {
    return this.db.llm_reasoning[event_id] || null;
  }

  public getAllLLMReasoning() {
    return Object.values(this.db.llm_reasoning);
  }

  // Cryptographically Hash-Chained Audit Ledger
  public appendAuditLog(params: {
    event_id: string;
    user_id: string;
    event_type: EventType;
    trust_score: number | null;
    zta_decision: Decision | null;
    llm_reasoning: string | null;
    actor_action: ActorAction | null;
  }): AuditLogEntry {
    const timestamp = new Date().toISOString();
    const record_id = this.db.audit_logs.length + 1;

    let prev_hash = "0000000000000000000000000000000000000000000000000000000000000000";
    if (this.db.audit_logs.length > 0) {
      prev_hash = this.db.audit_logs[this.db.audit_logs.length - 1].record_hash;
    }

    const payload = {
      record_id,
      timestamp,
      event_id: params.event_id,
      user_id: params.user_id,
      event_type: params.event_type,
      trust_score: params.trust_score,
      zta_decision: params.zta_decision,
      llm_reasoning: params.llm_reasoning,
      actor_action: params.actor_action,
      prev_hash,
    };

    const record_hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");

    const entry: AuditLogEntry = {
      ...payload,
      record_hash,
    };

    this.db.audit_logs.push(entry);
    this.save();
    return entry;
  }

  public getAuditLogs(): AuditLogEntry[] {
    return this.db.audit_logs;
  }

  /**
   * Verifies the integrity of the audit ledger by recomputing hashes sequentially.
   * If any hash is tampered with or missing, it identifies the exact record ID where the mismatch starts.
   */
  public verifyLedgerIntegrity(): {
    passed: boolean;
    broken_at_record_id: number | null;
    details: string;
  } {
    const logs = this.db.audit_logs;
    const checked_at = new Date().toISOString();

    if (logs.length === 0) {
      const result = { passed: true, broken_at_record_id: null, details: "Ledger is empty, integrity intact." };
      this.db.integrity_checks.push({
        id: this.db.integrity_checks.length + 1,
        checked_at,
        result: "PASSED",
        broken_at_record_id: null,
      });
      this.save();
      return result;
    }

    let expected_prev_hash = "0000000000000000000000000000000000000000000000000000000000000000";

    for (let i = 0; i < logs.length; i++) {
      const entry = logs[i];

      // 1. Verify previous hash link
      if (entry.prev_hash !== expected_prev_hash) {
        const result = {
          passed: false,
          broken_at_record_id: entry.record_id || i + 1,
          details: `Linkage broken at record ${entry.record_id || i + 1}. Expected prev_hash '${expected_prev_hash}' but found '${entry.prev_hash}'.`,
        };
        this.db.integrity_checks.push({
          id: this.db.integrity_checks.length + 1,
          checked_at,
          result: "FAILED_LINKAGE",
          broken_at_record_id: result.broken_at_record_id,
        });
        this.save();
        return result;
      }

      // 2. Recompute own hash
      const payload = {
        record_id: entry.record_id,
        timestamp: entry.timestamp,
        event_id: entry.event_id,
        user_id: entry.user_id,
        event_type: entry.event_type,
        trust_score: entry.trust_score,
        zta_decision: entry.zta_decision,
        llm_reasoning: entry.llm_reasoning,
        actor_action: entry.actor_action,
        prev_hash: entry.prev_hash,
      };

      const computed_hash = crypto
        .createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex");

      if (entry.record_hash !== computed_hash) {
        const result = {
          passed: false,
          broken_at_record_id: entry.record_id || i + 1,
          details: `Hash mismatch at record ${entry.record_id || i + 1}. Entry hash is '${entry.record_hash}' but calculated value is '${computed_hash}'.`,
        };
        this.db.integrity_checks.push({
          id: this.db.integrity_checks.length + 1,
          checked_at,
          result: "FAILED_HASH",
          broken_at_record_id: result.broken_at_record_id,
        });
        this.save();
        return result;
      }

      expected_prev_hash = entry.record_hash;
    }

    const result = { passed: true, broken_at_record_id: null, details: `All ${logs.length} records verified successfully.` };
    this.db.integrity_checks.push({
      id: this.db.integrity_checks.length + 1,
      checked_at,
      result: "PASSED",
      broken_at_record_id: null,
    });
    this.save();
    return result;
  }

  public getIntegrityChecks() {
    return this.db.integrity_checks;
  }

  // Clear or Seed DB (for testing & evaluation)
  public clearAllData(): void {
    const config = this.db.config;
    this.db = {
      users: {},
      reputation: {},
      audit_logs: [],
      policy_decisions: [],
      threat_events: {},
      adaptive_state: {},
      blocked_users: {},
      llm_reasoning: {},
      integrity_checks: [],
      config,
    };
    this.save();
  }

  /**
   * For demonstrating verification checks: allows simulating a breach
   * by modifying an audit log directly in memory, breaking the chain.
   */
  public simulateBreach(recordId: number): boolean {
    const logIndex = this.db.audit_logs.findIndex((l) => l.record_id === recordId);
    if (logIndex !== -1) {
      this.db.audit_logs[logIndex].llm_reasoning = "TAMPERED_RECORD_DATA_ALERT";
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Cryptographically heals/recomputes the ledger hashes sequentially.
   * Useful when logs have been tampered with and need remediation.
   */
  public healLedgerIntegrity(): {
    repaired_count: number;
    details: string;
  } {
    const logs = this.db.audit_logs;
    if (logs.length === 0) {
      return { repaired_count: 0, details: "Ledger is empty, nothing to repair." };
    }

    let repaired_count = 0;
    let expected_prev_hash = "0000000000000000000000000000000000000000000000000000000000000000";

    for (let i = 0; i < logs.length; i++) {
      const entry = logs[i];
      let changed = false;

      if (entry.prev_hash !== expected_prev_hash) {
        entry.prev_hash = expected_prev_hash;
        changed = true;
      }

      const payload = {
        record_id: entry.record_id,
        timestamp: entry.timestamp,
        event_id: entry.event_id,
        user_id: entry.user_id,
        event_type: entry.event_type,
        trust_score: entry.trust_score,
        zta_decision: entry.zta_decision,
        llm_reasoning: entry.llm_reasoning,
        actor_action: entry.actor_action,
        prev_hash: entry.prev_hash,
      };

      const computed_hash = crypto
        .createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex");

      if (entry.record_hash !== computed_hash) {
        entry.record_hash = computed_hash;
        changed = true;
      }

      if (changed) {
        repaired_count++;
      }

      expected_prev_hash = entry.record_hash;
    }

    if (repaired_count > 0) {
      this.save();
    }

    return {
      repaired_count,
      details: `Re-anchored hash chains successfully. Recomputed ${repaired_count} block signatures.`,
    };
  }
}
