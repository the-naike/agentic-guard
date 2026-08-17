/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RawSecurityEvent, SecurityEvent } from "../types.js";
import { Database } from "./db.js";

export class ObserverAgent {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Stage 2: Validate raw event, enrich with risk flags, and apply adaptive watch-listing.
   */
  public observe(raw: any): SecurityEvent {
    // 1. Strict Validation (Reject-not-coerce contract)
    if (
      !raw ||
      typeof raw.event_id !== "string" ||
      typeof raw.timestamp !== "string" ||
      typeof raw.user_id !== "string" ||
      typeof raw.source_ip !== "string" ||
      typeof raw.destination_ip !== "string" ||
      typeof raw.port !== "number" ||
      typeof raw.bytes_sent !== "number" ||
      typeof raw.session_duration !== "number" ||
      !["TCP", "UDP", "ICMP"].includes(raw.protocol)
    ) {
      throw new Error("SCHEMA_VALIDATION_FAILURE: Event does not conform to RawSecurityEvent schema.");
    }

    const typedRaw = raw as RawSecurityEvent;

    // 2. Feature Enrichment
    // Check Off-hours: before 08:00 or after 20:00 (UTC/Local hour)
    const date = new Date(typedRaw.timestamp);
    const hour = date.getUTCHours();
    const is_off_hours = hour < 8 || hour >= 20;

    // Check Bytes per second
    const bytes_per_second =
      typedRaw.session_duration > 0 ? typedRaw.bytes_sent / typedRaw.session_duration : 0;

    // Check IP reputation: flagged if rare external IPs or on watch-list
    const rare_ips = ["198.51.100.99", "203.0.113.255", "192.0.2.201", "185.190.140.23"];
    const ip_reputation_flag = rare_ips.includes(typedRaw.source_ip) || this.db.isWatchListed(typedRaw.source_ip);

    // Check abnormal ports: ports that are not standard HTTP, HTTPS, SSH, DNS, RDP, WinRM
    const standardPorts = [80, 443, 22, 53, 3389, 5985];
    const abnormal_port_flag = !standardPorts.includes(typedRaw.port);

    // Check abnormal session duration: < 3 seconds or > 1 hour (3600 seconds)
    const session_abnormal = typedRaw.session_duration < 3 || typedRaw.session_duration > 3600;

    // 3. Adaptive Watch-list lookup (Threat Memory)
    const is_watch_listed =
      this.db.isWatchListed(typedRaw.user_id) || this.db.isWatchListed(typedRaw.source_ip);

    return {
      event_id: typedRaw.event_id,
      timestamp: typedRaw.timestamp,
      user_id: typedRaw.user_id,
      source_ip: typedRaw.source_ip,
      destination_ip: typedRaw.destination_ip,
      port: typedRaw.port,
      protocol: typedRaw.protocol,
      bytes_sent: typedRaw.bytes_sent,
      session_duration: typedRaw.session_duration,
      is_off_hours,
      bytes_per_second,
      ip_reputation_flag,
      abnormal_port_flag,
      session_abnormal,
      is_watch_listed,
    };
  }
}
