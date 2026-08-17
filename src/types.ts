/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AttackTechnique {
  T1078 = "T1078", // Valid Accounts
  T1021 = "T1021", // Remote Services
  T1041 = "T1041", // Exfiltration Over C2 Channel
}

export enum ThreatLabel {
  NORMAL = "NORMAL",
  ATTACK = "ATTACK",
}

export enum Decision {
  ALLOW = "ALLOW",
  QUARANTINE = "QUARANTINE",
  DENY = "DENY",
}

export enum ActorAction {
  ISOLATE = "ISOLATE",
  ESCALATE = "ESCALATE",
  MONITOR = "MONITOR",
  DISMISS = "DISMISS",
}

export enum EventType {
  LOG_INGEST = "LOG_INGEST",
  TRUST_SCORE = "TRUST_SCORE",
  ZTA_DECISION = "ZTA_DECISION",
  AGENT_ACTION = "AGENT_ACTION",
  INTEGRITY_CHECK = "INTEGRITY_CHECK",
  SCHEMA_REJECT = "SCHEMA_REJECT",
  ZTA_UNAVAILABLE = "ZTA_UNAVAILABLE",
  HUMAN_OVERRIDE = "HUMAN_OVERRIDE",
}

export enum ConfidenceLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export interface RawSecurityEvent {
  event_id: string;
  timestamp: string; // ISO 8601 UTC
  user_id: string;
  source_ip: string;
  destination_ip: string;
  port: number;
  protocol: "TCP" | "UDP" | "ICMP";
  bytes_sent: number;
  session_duration: number; // in seconds
  threat_label?: ThreatLabel; // Ground truth - removed before Stage 2
  attack_technique?: AttackTechnique; // Ground truth - removed before Stage 2
}

export interface SecurityEvent {
  event_id: string;
  timestamp: string;
  user_id: string;
  source_ip: string;
  destination_ip: string;
  port: number;
  protocol: "TCP" | "UDP" | "ICMP";
  bytes_sent: number;
  session_duration: number;
  // Enriched fields
  is_off_hours: boolean;
  bytes_per_second: number;
  ip_reputation_flag: boolean;
  abnormal_port_flag: boolean;
  session_abnormal: boolean;
  is_watch_listed: boolean;
}

export interface TrustScoreData {
  event_id: string;
  user_id: string;
  timestamp: string;
  tb: number; // calculated trust score in [0, 1]
  anomaly_score: number; // raw isolation forest score
  anomaly_flag: boolean; // boolean isolation forest classification
  reputation_score: number; // user reputation from database
  temporal_risk: number; // calculated temporal risk factor
}

export interface PolicyDecisionData {
  event_id: string;
  user_id: string;
  decision: Decision;
  tb: number;
  anomaly_flag: boolean;
  is_blocked: boolean;
  reason: string;
  timestamp: string;
}

export interface ReasonerOutput {
  technique_classification: AttackTechnique | string | null;
  confidence_level: ConfidenceLevel;
  recommended_action: ActorAction;
  reasoning_trace: string;
}

export interface ActorOutput {
  event_id: string;
  user_id: string;
  authorized_action: ActorAction;
  reputation_before: number;
  reputation_after: number;
  is_isolated: boolean;
  is_escalated: boolean;
  justification?: string;
  timestamp: string;
}

export interface AuditLogEntry {
  record_id?: number;
  timestamp: string;
  event_id: string;
  user_id: string;
  event_type: EventType;
  trust_score: number | null;
  zta_decision: Decision | null;
  llm_reasoning: string | null;
  actor_action: ActorAction | null;
  prev_hash: string;
  record_hash: string;
}

export interface AppConfig {
  trust_weights: {
    w1_anomaly: number;
    w2_reputation: number;
    w3_temporal: number;
  };
  policy_thresholds: {
    allow_min: number;
    quarantine_min: number;
  };
  reputation_updates: {
    allow_gain_pct: number;
    quarantine_penalty_pct: number;
    deny_penalty_pct: number;
  };
  generation: {
    default_event_count: number;
    default_attack_ratio: number;
  };
  llm: {
    primary_model: string;
    rate_limit_per_minute: number;
    fallback_enabled: boolean;
  };
  dashboard: {
    refresh_interval_seconds: number;
  };
}

export interface UserReputation {
  user_id: string;
  score: number;
  last_updated: string;
}

export interface ActiveState {
  user_id_or_ip: string;
  flagged_at: string;
  reason: string;
}

export interface EvaluationMetrics {
  total_events: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  false_positive_rate: number;
  false_negative_rate: number;
  mean_trust_score: number;
  mean_normal_trust: number;
  mean_attack_trust: number;
  policy_correctness: number; // percent of attacks blocked/quarantined and normals allowed
  mean_pipeline_latency_ms: number;
  roc_auc: number;
  path_latency: {
    direct_allow_seconds: number;
    quarantine_reasoner_seconds: number;
    direct_deny_seconds: number;
    deny_reasoner_actor_seconds: number;
  };
}
