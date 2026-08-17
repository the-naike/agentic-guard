/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActorAction,
  ActorOutput,
  Decision,
  EventType,
  ReasonerOutput,
  SecurityEvent,
  TrustScoreData
} from "../types.js";
import { Database } from "./db.js";

export class ActorAgent {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Stage 6: Safe governed execution gate.
   * Performs 2-Step verification to ensure LLM recommendations do not violate policy boundaries.
   */
  public execute(
    event: SecurityEvent,
    trust: TrustScoreData,
    policyDecision: Decision,
    reasoner: ReasonerOutput
  ): ActorOutput {
    const timestamp = new Date().toISOString();
    const reputation_before = trust.reputation_score;
    let reputation_after = reputation_before;
    let authorized_action = reasoner.recommended_action;
    let justification = `Action authorized: ${authorized_action}. Reasoner confidence: ${reasoner.confidence_level}.`;

    // 1. Two-Step Safety Auditing (Zero Trust policy alignment check)
    if (policyDecision === Decision.DENY) {
      // If policy engine decided DENY, the system MUST enforce containment.
      // Do not allow an LLM recommendation to downgrade this to DISMISS or MONITOR.
      if (authorized_action === ActorAction.DISMISS || authorized_action === ActorAction.MONITOR) {
        authorized_action = ActorAction.ISOLATE;
        justification = `CRITICAL SAFETY OVERRIDE: Policy Engine enforce-gate was DENY. Reasoner suggested downgrade '${reasoner.recommended_action}' was rejected. Coerced to ISOLATE.`;
      }
    }

    // Downgrade rules based on confidence
    if (authorized_action === ActorAction.ISOLATE && reasoner.confidence_level === "LOW") {
      // Avoid accidental automated lockouts of legitimate users on low confidence
      authorized_action = ActorAction.ESCALATE;
      justification = `SAFETY DE-ESCALATION: Suggestion ISOLATE was downgraded to ESCALATE due to LOW-confidence LLM assessment.`;
    }

    // 2. State execution and feedback loops
    let is_isolated = false;
    let is_escalated = false;

    switch (authorized_action) {
      case ActorAction.ISOLATE:
        // Set reputation to 0.0, block user, and write ledger log
        this.db.blockUser(
          event.user_id,
          `Threat hunting containment (MITRE classification: ${reasoner.technique_classification || "Unknown"}). Reasoning: ${reasoner.reasoning_trace}`
        );
        this.db.updateReputation(event.user_id, 0.0);
        reputation_after = 0.0;
        is_isolated = true;

        // Force user's source IP and user ID to watch-list for adaptive tracking
        this.db.addToWatchList(event.user_id, "Isolated due to active threat containment.");
        this.db.addToWatchList(event.source_ip, "Isolated source IP.");
        break;

      case ActorAction.ESCALATE:
        // Move to watch-list and flag for manual human review
        this.db.addToWatchList(
          event.user_id,
          `Escalated session. Tech classification: ${reasoner.technique_classification || "None"}`
        );
        is_escalated = true;
        reputation_after = Math.max(0.05, reputation_before - 0.15); // moderate reputation decay
        this.db.updateReputation(event.user_id, reputation_after);
        break;

      case ActorAction.MONITOR:
        // Place on the adaptive watch-list to inspect future logs with higher priority
        this.db.addToWatchList(
          event.user_id,
          `Adaptive Watch List placement following warning anomaly.`
        );
        reputation_after = Math.max(0.1, reputation_before - 0.05); // minor trust decay
        this.db.updateReputation(event.user_id, reputation_after);
        break;

      case ActorAction.DISMISS:
        // Slight trust recovery since analyst/LLM validated this event as safe/false-positive
        reputation_after = Math.min(1.0, reputation_before + 0.02);
        this.db.updateReputation(event.user_id, reputation_after);
        break;
    }

    // 3. Write Execution to Cryptographic Audit Ledger (Stage 7)
    this.db.appendAuditLog({
      event_id: event.event_id,
      user_id: event.user_id,
      event_type: EventType.AGENT_ACTION,
      trust_score: trust.tb,
      zta_decision: policyDecision,
      llm_reasoning: reasoner.reasoning_trace,
      actor_action: authorized_action,
    });

    return {
      event_id: event.event_id,
      user_id: event.user_id,
      authorized_action,
      reputation_before,
      reputation_after,
      is_isolated,
      is_escalated,
      justification,
      timestamp,
    };
  }

  /**
   * Conducts manual human overrides from security analyst dashboard.
   * Every override is cryptographically logged under EventType.HUMAN_OVERRIDE.
   */
  public executeManualOverride(
    user_id: string,
    action: "UNBLOCK" | "FORCE_BLOCK",
    justification: string
  ): void {
    const timestamp = new Date().toISOString();

    if (action === "UNBLOCK") {
      this.db.unblockUser(user_id);
      this.db.removeFromWatchList(user_id);
      this.db.updateReputation(user_id, 0.5); // restore to neutral baseline

      this.db.appendAuditLog({
        event_id: `man_${Math.random().toString(36).substring(2, 11)}`,
        user_id,
        event_type: EventType.HUMAN_OVERRIDE,
        trust_score: 0.5,
        zta_decision: Decision.ALLOW,
        llm_reasoning: `MANUAL HUMAN OVERRIDE: Analyst unlocked user. Justification: ${justification}`,
        actor_action: ActorAction.DISMISS,
      });
    } else if (action === "FORCE_BLOCK") {
      this.db.blockUser(user_id, `Forced manual containment: ${justification}`);
      this.db.updateReputation(user_id, 0.0);

      this.db.appendAuditLog({
        event_id: `man_${Math.random().toString(36).substring(2, 11)}`,
        user_id,
        event_type: EventType.HUMAN_OVERRIDE,
        trust_score: 0.0,
        zta_decision: Decision.DENY,
        llm_reasoning: `MANUAL HUMAN OVERRIDE: Analyst forced blockade. Justification: ${justification}`,
        actor_action: ActorAction.ISOLATE,
      });
    }
  }
}
