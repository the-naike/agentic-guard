/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SecurityEvent, TrustScoreData, AppConfig } from "../types.js";
import { Database } from "./db.js";
import { IsolationForest } from "./isolation_forest.js";

export class TrustScorer {
  private db: Database;
  private model: IsolationForest;

  constructor(db: Database, model: IsolationForest) {
    this.db = db;
    this.model = model;
  }

  /**
   * Stage 3: Compute continuous trust score tb in [0, 1].
   */
  public calculateTrust(event: SecurityEvent): TrustScoreData {
    const config = this.db.getConfig();
    const { w1_anomaly, w2_reputation, w3_temporal } = config.trust_weights;

    // 1. Get unsupervised anomaly score from Isolation Forest
    const features = IsolationForest.extractFeatures(event);
    const anomaly_score = this.model.computeAnomalyScore(features);

    // Flag as anomaly if the Isolation Forest score exceeds the threshold
    // (An unsupervised score close to or above 0.60 represents significant isolation)
    const anomaly_flag = anomaly_score > 0.58;

    // 2. Fetch persistent reputation score from database (defaults to 0.5)
    const reputation_score = this.db.getReputation(event.user_id);

    // 3. Calculate temporal and context risk (quantifiable context factors)
    let riskAccumulator = 0;
    if (event.is_off_hours) riskAccumulator += 0.35;
    if (event.session_abnormal) riskAccumulator += 0.35;
    if (event.abnormal_port_flag) riskAccumulator += 0.30;
    const temporal_risk = Math.min(1.0, riskAccumulator);

    // 4. Calculate final trust score:
    // tb = w1 * (1 - anomaly_flag) + w2 * reputation + w3 * (1 - temporal_risk)
    const anomaly_term = anomaly_flag ? 0 : 1;
    const tb =
      w1_anomaly * anomaly_term +
      w2_reputation * reputation_score +
      w3_temporal * (1.0 - temporal_risk);

    // Round to 4 decimal places for precision display
    const roundedTb = Math.round(tb * 10000) / 10000;

    return {
      event_id: event.event_id,
      user_id: event.user_id,
      timestamp: event.timestamp,
      tb: roundedTb,
      anomaly_score,
      anomaly_flag,
      reputation_score,
      temporal_risk,
    };
  }

  /**
   * Dynamic asymmetrical trust update rule: decay fast on penalties, recover slow on allowances.
   */
  public applyReputationUpdate(user_id: string, decision: "ALLOW" | "QUARANTINE" | "DENY"): { before: number; after: number } {
    const config = this.db.getConfig();
    const before = this.db.getReputation(user_id);
    let after = before;

    const { allow_gain_pct, quarantine_penalty_pct, deny_penalty_pct } = config.reputation_updates;

    if (decision === "ALLOW") {
      // Asymmetric slow recovery: reputation += gain * (1 - reputation) (diminishing gains)
      after = before + allow_gain_pct * (1.0 - before);
    } else if (decision === "QUARANTINE") {
      // Moderate fast decay: reputation -= penalty * reputation
      after = before - quarantine_penalty_pct * before;
    } else if (decision === "DENY") {
      // Aggressive decay: reputation -= penalty * reputation
      after = before - deny_penalty_pct * before;
    }

    // Clamp score strictly between [0.0, 1.0]
    after = Math.max(0.0, Math.min(1.0, after));
    const roundedAfter = Math.round(after * 10000) / 10000;

    this.db.updateReputation(user_id, roundedAfter);

    return {
      before,
      after: roundedAfter,
    };
  }
}
