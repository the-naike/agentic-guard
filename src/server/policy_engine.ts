/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Decision, PolicyDecisionData, SecurityEvent, TrustScoreData } from "../types.js";
import { Database } from "./db.js";

export class PolicyEngine {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Stage 4: Continuous deterministic access control check.
   * Fail-closed by default: any failure results in DENY.
   */
  public evaluatePolicy(event: SecurityEvent, trust: TrustScoreData): PolicyDecisionData {
    const timestamp = new Date().toISOString();

    try {
      const config = this.db.getConfig();
      const { allow_min, quarantine_min } = config.policy_thresholds;

      // 1. Strict priority blocklist check (un-bypassable gate)
      const is_blocked = this.db.isBlocked(event.user_id);
      if (is_blocked) {
        return {
          event_id: event.event_id,
          user_id: event.user_id,
          decision: Decision.DENY,
          tb: trust.tb,
          anomaly_flag: trust.anomaly_flag,
          is_blocked: true,
          reason: "CRITICAL_POLICY_ENFORCEMENT: User is actively blocked on the global security registry.",
          timestamp,
        };
      }

      // 2. Continuous access decision rules based on tb and anomaly_flag
      if (trust.tb >= allow_min && trust.anomaly_flag) {
        // High trust score but flagged as anomalous by Isolation Forest
        return {
          event_id: event.event_id,
          user_id: event.user_id,
          decision: Decision.QUARANTINE,
          tb: trust.tb,
          anomaly_flag: trust.anomaly_flag,
          is_blocked: false,
          reason: "QUARANTINE_POLICY: Trust score meets threshold but anomaly detection flag was raised.",
          timestamp,
        };
      }

      if (trust.tb >= allow_min && !trust.anomaly_flag) {
        // High trust score, no anomaly -> ALLOW
        return {
          event_id: event.event_id,
          user_id: event.user_id,
          decision: Decision.ALLOW,
          tb: trust.tb,
          anomaly_flag: trust.anomaly_flag,
          is_blocked: false,
          reason: "ALLOW_POLICY: Trust score is verified green and no anomalies were flagged.",
          timestamp,
        };
      }

      if (trust.tb >= quarantine_min && trust.tb < allow_min) {
        // Borderline trust score -> QUARANTINE (invoke Stage 5 Reasoner Agent)
        return {
          event_id: event.event_id,
          user_id: event.user_id,
          decision: Decision.QUARANTINE,
          tb: trust.tb,
          anomaly_flag: trust.anomaly_flag,
          is_blocked: false,
          reason: "QUARANTINE_POLICY: Trust score is borderline; routed to Reasoner Agent for active AI triage.",
          timestamp,
        };
      }

      if (trust.anomaly_flag && trust.tb >= allow_min) {
        // Overlap exception: anomaly_flag is true, tb is theoretically above limit
        return {
          event_id: event.event_id,
          user_id: event.user_id,
          decision: Decision.QUARANTINE,
          tb: trust.tb,
          anomaly_flag: trust.anomaly_flag,
          is_blocked: false,
          reason: "QUARANTINE_POLICY: Enriched anomaly flag triggered on high-trust account.",
          timestamp,
        };
      }

      // Default: tb < quarantine_min -> DENY
      return {
        event_id: event.event_id,
        user_id: event.user_id,
        decision: Decision.DENY,
        tb: trust.tb,
        anomaly_flag: trust.anomaly_flag,
        is_blocked: false,
        reason: `DENY_POLICY: Continuous trust score (${trust.tb}) fell below critical warning limit (${quarantine_min}).`,
        timestamp,
      };

    } catch (error) {
      // Fail-closed fallback: log failure and block access
      console.error("FAIL_CLOSED: Exception occurred inside Policy Engine", error);
      return {
        event_id: event.event_id,
        user_id: event.user_id,
        decision: Decision.DENY,
        tb: trust.tb,
        anomaly_flag: trust.anomaly_flag,
        is_blocked: false,
        reason: "DENY_POLICY: FAIL_CLOSED triggered due to unexpected error in policy evaluation.",
        timestamp,
      };
    }
  }
}
