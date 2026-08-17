/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RawSecurityEvent, AttackTechnique, ThreatLabel } from "../types.js";

export interface EnterpriseUserMetadata {
  user_id: string;
  name: string;
  role: string;
  department: string;
  profileType: "NORMAL" | "HIGH_PRIVILEGE" | "ADVERSARY_INSIDER" | "ADVERSARY_EXTERNAL";
  normal_ips: string[];
  typical_hours: number[];
  destination_ips: string[];
  typical_ports: number[];
  typical_protocols: ("TCP" | "UDP")[];
}

export const ENTERPRISE_USERS: EnterpriseUserMetadata[] = [
  {
    user_id: "usr_dev_alice",
    name: "Alice Smith",
    role: "Lead Cloud Developer",
    department: "Engineering",
    profileType: "NORMAL",
    normal_ips: ["192.168.1.15", "10.0.4.52"],
    typical_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    destination_ips: ["10.0.100.15", "8.8.8.8"],
    typical_ports: [80, 443, 53],
    typical_protocols: ["TCP", "UDP"],
  },
  {
    user_id: "usr_dev_bob",
    name: "Bob Jones",
    role: "Senior Systems Developer",
    department: "Engineering",
    profileType: "NORMAL",
    normal_ips: ["10.0.4.52", "172.16.12.8"],
    typical_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    destination_ips: ["10.20.30.40", "10.0.100.12"],
    typical_ports: [22, 443, 80],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_admin_charlie",
    name: "Charlie Brown",
    role: "Lead IAM Security Administrator",
    department: "IT Infrastructure",
    profileType: "HIGH_PRIVILEGE",
    normal_ips: ["198.51.100.42", "10.240.1.11"],
    typical_hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    destination_ips: ["10.0.1.5", "10.0.100.12"],
    typical_ports: [22, 3389, 53],
    typical_protocols: ["TCP", "UDP"],
  },
  {
    user_id: "usr_analyst_david",
    name: "David Miller",
    role: "SOC Lead Security Analyst",
    department: "Security Operations",
    profileType: "NORMAL",
    normal_ips: ["172.31.55.90", "192.168.1.15"],
    typical_hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    destination_ips: ["10.0.100.12", "8.8.8.8"],
    typical_ports: [53, 443, 80],
    typical_protocols: ["TCP", "UDP"],
  },
  {
    user_id: "usr_mktg_eve",
    name: "Eve Jenkins",
    role: "Marketing Director",
    department: "Marketing",
    profileType: "NORMAL",
    normal_ips: ["203.0.113.88", "192.0.2.145"],
    typical_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
    destination_ips: ["104.244.42.1", "8.8.8.8"],
    typical_ports: [80, 443],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_hr_frank",
    name: "Frank Wright",
    role: "HR Operations Director",
    department: "Human Resources",
    profileType: "NORMAL",
    normal_ips: ["10.240.1.11", "172.16.12.8"],
    typical_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
    destination_ips: ["10.0.100.15", "8.8.8.8"],
    typical_ports: [80, 443, 22],
    typical_protocols: ["TCP", "UDP"],
  },
  {
    user_id: "usr_sales_grace",
    name: "Grace Hopper",
    role: "VP Enterprise Sales",
    department: "Sales",
    profileType: "NORMAL",
    normal_ips: ["192.0.2.145", "192.168.1.15"],
    typical_hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    destination_ips: ["10.0.100.15", "8.8.8.8"],
    typical_ports: [443, 80],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_ops_helen",
    name: "Helen Troya",
    role: "Lead DevOps Architect",
    department: "IT Operations",
    profileType: "HIGH_PRIVILEGE",
    normal_ips: ["10.240.1.11", "10.0.4.52"],
    typical_hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    destination_ips: ["10.20.30.40", "10.0.100.12", "10.0.1.5"],
    typical_ports: [22, 443, 80, 3389],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_intern_ian",
    name: "Ian Gallagher",
    role: "Engineering Intern",
    department: "Engineering",
    profileType: "NORMAL",
    normal_ips: ["192.168.1.15"],
    typical_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
    destination_ips: ["10.0.100.15", "8.8.8.8"],
    typical_ports: [80, 443, 53],
    typical_protocols: ["TCP", "UDP"],
  },
  {
    user_id: "usr_finance_jack",
    name: "Jack Ryan",
    role: "Chief Financial Officer (CFO)",
    department: "Finance",
    profileType: "HIGH_PRIVILEGE",
    normal_ips: ["192.0.2.145", "203.0.113.88"],
    typical_hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    destination_ips: ["10.0.100.12", "10.0.100.15"],
    typical_ports: [443, 80],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_support_karen",
    name: "Karen Peterson",
    role: "Technical Support Tier 2",
    department: "Customer Success",
    profileType: "NORMAL",
    normal_ips: ["172.31.55.90", "192.168.1.15"],
    typical_hours: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    destination_ips: ["10.0.100.15", "8.8.8.8"],
    typical_ports: [443, 80],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_sysadmin_leo",
    name: "Leo Decaprio",
    role: "Enterprise Systems Administrator",
    department: "IT Infrastructure",
    profileType: "HIGH_PRIVILEGE",
    normal_ips: ["198.51.100.42", "10.0.4.52"],
    typical_hours: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    destination_ips: ["10.0.1.5", "10.0.100.12", "10.20.30.40"],
    typical_ports: [22, 3389, 5985],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_legal_megan",
    name: "Megan Fox",
    role: "General Legal Counsel",
    department: "Legal",
    profileType: "NORMAL",
    normal_ips: ["203.0.113.88"],
    typical_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
    destination_ips: ["10.0.100.15", "8.8.8.8"],
    typical_ports: [443, 80],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_qa_nathan",
    name: "Nathan Drake",
    role: "Lead QA Automation Engineer",
    department: "Quality Assurance",
    profileType: "NORMAL",
    normal_ips: ["192.168.1.15", "172.16.12.8"],
    typical_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    destination_ips: ["10.0.100.15", "8.8.8.8"],
    typical_ports: [80, 443, 53],
    typical_protocols: ["TCP", "UDP"],
  },
  {
    user_id: "usr_db_oscar",
    name: "Oscar Wilde",
    role: "Senior Database Administrator",
    department: "IT Operations",
    profileType: "HIGH_PRIVILEGE",
    normal_ips: ["10.0.4.52", "172.31.55.90"],
    typical_hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    destination_ips: ["10.0.100.12", "10.0.100.15"],
    typical_ports: [53, 443, 22],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_vp_patricia",
    name: "Patricia Neal",
    role: "VP Cloud Engineering",
    department: "Engineering Suite",
    profileType: "HIGH_PRIVILEGE",
    normal_ips: ["192.168.1.15", "203.0.113.88"],
    typical_hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    destination_ips: ["10.0.100.12", "10.0.100.15", "8.8.8.8"],
    typical_ports: [443, 80],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_sec_quentin",
    name: "Quentin Security",
    role: "Senior DevSecOps Engineer",
    department: "Information Security",
    profileType: "NORMAL",
    normal_ips: ["172.16.12.8", "10.240.1.11"],
    typical_hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    destination_ips: ["10.0.1.5", "10.0.100.12", "10.20.30.40"],
    typical_ports: [22, 443, 80, 53],
    typical_protocols: ["TCP", "UDP"],
  },
  {
    user_id: "usr_research_rachel",
    name: "Rachel Green",
    role: "Principal AI Research Scientist",
    department: "Research & Development",
    profileType: "NORMAL",
    normal_ips: ["10.0.4.52", "192.168.1.15"],
    typical_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22],
    destination_ips: ["10.0.100.15", "8.8.8.8"],
    typical_ports: [443, 80],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_pm_steve",
    name: "Steve Rogers",
    role: "Senior Product Manager",
    department: "Product Management",
    profileType: "NORMAL",
    normal_ips: ["192.0.2.145", "192.168.1.15"],
    typical_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    destination_ips: ["10.0.100.15", "8.8.8.8"],
    typical_ports: [443, 80],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_billing_tina",
    name: "Tina Turner",
    role: "Billing & Accounts Receivable Specialist",
    department: "Finance Operations",
    profileType: "NORMAL",
    normal_ips: ["192.0.2.145"],
    typical_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
    destination_ips: ["10.0.100.15", "8.8.8.8"],
    typical_ports: [443, 80],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_partner_zack",
    name: "Zack Snyder",
    role: "External Vendor Partner",
    department: "External Contractors",
    profileType: "NORMAL",
    normal_ips: ["192.0.2.201"],
    typical_hours: [10, 11, 12, 13, 14, 15, 16],
    destination_ips: ["10.0.100.15"],
    typical_ports: [443, 80],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_exec_ceo",
    name: "Clara Croft",
    role: "Chief Executive Officer (CEO)",
    department: "Executive Suite",
    profileType: "HIGH_PRIVILEGE",
    normal_ips: ["203.0.113.88", "192.0.2.145"],
    typical_hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    destination_ips: ["10.0.100.15", "8.8.8.8"],
    typical_ports: [443, 80],
    typical_protocols: ["TCP"],
  },
  // --- ADVERSARY PROFILES (Inside and External) ---
  {
    user_id: "usr_insider_victor",
    name: "Victor Creed",
    role: "Disgruntled Software Engineer",
    department: "Engineering Systems",
    profileType: "ADVERSARY_INSIDER",
    normal_ips: ["172.16.12.8"],
    typical_hours: [23, 0, 1, 2, 3], // highly off-hours
    destination_ips: ["185.190.140.23"], // Exfiltrating data to C2 external server!
    typical_ports: [443],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_ext_anonymous",
    name: "Anonymous compromised credential",
    role: "Compromised Valid Account",
    department: "Unverified Identity Entity",
    profileType: "ADVERSARY_EXTERNAL",
    normal_ips: ["198.51.100.99", "203.0.113.255"], // Foreign IPs
    typical_hours: [2, 3, 4], // Deep off-hours
    destination_ips: ["10.0.1.5"], // Attacking Domain Controller using T1078 (Valid Accounts)
    typical_ports: [53, 22, 443],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_ext_apt29",
    name: "Cozy Bear / APT29 Agent",
    role: "State-Sponsored Cyber Threat Agent",
    department: "APT Threat Actor Operations",
    profileType: "ADVERSARY_EXTERNAL",
    normal_ips: ["192.0.2.201"],
    typical_hours: [1, 2, 3],
    destination_ips: ["10.0.100.12"], // Doing Lateral Movement via T1021 (Remote Services)
    typical_ports: [22, 443],
    typical_protocols: ["TCP"],
  },
  {
    user_id: "usr_ext_ransomware",
    name: "Ransomware Affiliates Group",
    role: "Financial Extortion Hacker",
    department: "Cyber Crime Syndicate",
    profileType: "ADVERSARY_EXTERNAL",
    normal_ips: ["203.0.113.255"],
    typical_hours: [0, 1, 2, 3, 4],
    destination_ips: ["10.0.100.12", "10.0.1.5"], // Remote service lateral sweep
    typical_ports: [22, 443],
    typical_protocols: ["TCP"],
  }
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export class LogGenerator {
  public static getEnterpriseUsers(): EnterpriseUserMetadata[] {
    return ENTERPRISE_USERS;
  }

  /**
   * Generates a single event for a specific user ID. If isAttack is true, generates an attack event tailored to them or a general attack.
   */
  public static generateForUser(userId: string, isAttack: boolean): RawSecurityEvent {
    const user = ENTERPRISE_USERS.find(u => u.user_id === userId);
    if (!user) {
      throw new Error(`User ${userId} not found.`);
    }

    const eventId = `evt_${Math.random().toString(36).substring(2, 11)}`;
    const timestamp = new Date().toISOString();

    if (isAttack) {
      const technique = randomChoice([
        AttackTechnique.T1078,
        AttackTechnique.T1021,
        AttackTechnique.T1041,
      ]);
      return LogGenerator.generateAttack(eventId, timestamp, technique, user);
    } else {
      return LogGenerator.generateNormal(eventId, timestamp, user);
    }
  }

  /**
   * Generates a batch of synthetic cloud security events using the 26 detailed profiles.
   */
  public static generateBatch(count: number, attackRatio: number): RawSecurityEvent[] {
    const events: RawSecurityEvent[] = [];
    const baseTime = Date.now();

    // Separate normal-behaving users vs adversary profiles
    const benignUsers = ENTERPRISE_USERS.filter(u => u.profileType === "NORMAL" || u.profileType === "HIGH_PRIVILEGE");
    const adversaryUsers = ENTERPRISE_USERS.filter(u => u.profileType === "ADVERSARY_INSIDER" || u.profileType === "ADVERSARY_EXTERNAL");

    for (let i = 0; i < count; i++) {
      const isAttack = Math.random() < attackRatio;
      const eventId = `evt_${Math.random().toString(36).substring(2, 11)}`;
      // Stagger timestamps backwards
      const timestamp = new Date(baseTime - (count - i) * 60000).toISOString();

      if (isAttack) {
        const technique = randomChoice([
          AttackTechnique.T1078,
          AttackTechnique.T1021,
          AttackTechnique.T1041,
        ]);
        // Pick an appropriate adversary profile or simulate bad behavior
        const advUser = randomChoice(adversaryUsers);
        events.push(LogGenerator.generateAttack(eventId, timestamp, technique, advUser));
      } else {
        // Pick a standard benign employee
        const normUser = randomChoice(benignUsers);
        events.push(LogGenerator.generateNormal(eventId, timestamp, normUser));
      }
    }

    return events;
  }

  private static generateNormal(eventId: string, timestamp: string, user: EnterpriseUserMetadata): RawSecurityEvent {
    const source_ip = randomChoice(user.normal_ips);
    const destination_ip = randomChoice(user.destination_ips);
    const protocol = randomChoice(user.typical_protocols);
    const port = randomChoice(user.typical_ports);

    const date = new Date(timestamp);
    const hour = randomChoice(user.typical_hours);
    date.setUTCHours(hour, randomInt(0, 59), randomInt(0, 59));

    // Special byte volumes for Rachel (research scientist) or regular employees
    let bytes_sent = randomInt(500, 25000);
    if (user.user_id === "usr_research_rachel") {
      bytes_sent = randomInt(500000, 4500000); // 500KB - 4.5MB transfers
    }
    const session_duration = randomFloat(15, 450); // 15 seconds to ~7.5 minutes

    return {
      event_id: eventId,
      timestamp: date.toISOString(),
      user_id: user.user_id,
      source_ip,
      destination_ip,
      port,
      protocol,
      bytes_sent,
      session_duration,
      threat_label: ThreatLabel.NORMAL,
    };
  }

  private static generateAttack(
    eventId: string,
    timestamp: string,
    technique: AttackTechnique,
    advUser: EnterpriseUserMetadata
  ): RawSecurityEvent {
    const date = new Date(timestamp);

    switch (technique) {
      case AttackTechnique.T1078: {
        // Valid Accounts: off-hours, unusual untrusted IP, quick session on Domain Controller
        const targetAdv = advUser.user_id === "usr_ext_anonymous" ? advUser : ENTERPRISE_USERS.find(u => u.user_id === "usr_ext_anonymous")!;
        const hour = randomChoice([1, 2, 3, 4, 23]); // late night
        date.setUTCHours(hour, randomInt(0, 59), randomInt(0, 59));

        return {
          event_id: eventId,
          timestamp: date.toISOString(),
          user_id: targetAdv.user_id,
          source_ip: randomChoice(targetAdv.normal_ips), // Foreign/compromised IPs
          destination_ip: "10.0.1.5", // DC
          port: 5986, // WinRM HTTPS / atypical admin port
          protocol: "TCP",
          bytes_sent: randomInt(12000, 48000),
          session_duration: randomFloat(0.5, 3.5), // short probe session
          threat_label: ThreatLabel.ATTACK,
          attack_technique: AttackTechnique.T1078,
        };
      }

      case AttackTechnique.T1021: {
        // Remote Services: Lateral movement SSH/RDP connection from compromised asset
        const targetAdv = advUser.profileType === "ADVERSARY_EXTERNAL" ? advUser : ENTERPRISE_USERS.find(u => u.user_id === "usr_ext_apt29")!;
        const port = randomChoice([22, 3389]); // SSH, RDP
        const hour = randomChoice([0, 1, 2, 3, 4]); // off-hours
        date.setUTCHours(hour, randomInt(0, 59), randomInt(0, 59));

        return {
          event_id: eventId,
          timestamp: date.toISOString(),
          user_id: targetAdv.user_id,
          source_ip: "10.0.4.52", // compromised internal IP hop
          destination_ip: "10.0.100.12", // core DB
          port,
          protocol: "TCP",
          bytes_sent: randomInt(5000, 22000),
          session_duration: randomFloat(4, 35),
          threat_label: ThreatLabel.ATTACK,
          attack_technique: AttackTechnique.T1021,
        };
      }

      case AttackTechnique.T1041: {
        // Exfiltration Over C2 Channel: Massive byte count transfer to foreign server
        const targetAdv = advUser.user_id === "usr_insider_victor" ? advUser : ENTERPRISE_USERS.find(u => u.user_id === "usr_insider_victor")!;
        const hour = randomChoice([22, 23, 0, 1, 2, 3]); // late night
        date.setUTCHours(hour, randomInt(0, 59), randomInt(0, 59));

        return {
          event_id: eventId,
          timestamp: date.toISOString(),
          user_id: targetAdv.user_id,
          source_ip: randomChoice(targetAdv.normal_ips),
          destination_ip: "185.190.140.23", // Malicious exfiltration node
          port: 443, // SSL camouflage
          protocol: "TCP",
          bytes_sent: randomInt(20000000, 95000000), // 20MB to 95MB of exfiltrated data!
          session_duration: randomFloat(10, 45), // fast exfiltration (leads to massive BPS)
          threat_label: ThreatLabel.ATTACK,
          attack_technique: AttackTechnique.T1041,
        };
      }
    }
  }
}
