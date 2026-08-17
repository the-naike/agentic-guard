# Agentic Guard

### Trust-Based Multi-Agent System for Autonomous Threat Hunting in Cloud Environments

Agentic Guard is a research prototype that combines **multi-agent security analysis, anomaly detection, trust scoring, Zero Trust policy enforcement, LLM-assisted reasoning, automated response, and tamper-evident auditing** to investigate and respond to suspicious activity in simulated cloud environments.

The system is designed to explore how autonomous security agents can work together to support threat detection and response while incorporating **trust evaluation and policy-based decision making**.

> **Project Status:** Research / Academic Prototype
> **Environment:** Simulated Cloud Security Environment
> **Primary Focus:** Threat Hunting, Security Automation, Zero Trust, Cloud Security

---

## Overview

Modern cloud environments generate large volumes of security telemetry that can be difficult to analyse manually and continuously. Agentic Guard explores an autonomous approach in which specialized security components collaborate across a structured threat-hunting pipeline.

Instead of relying solely on a single detection mechanism, Agentic Guard evaluates security events using:

* Event validation and enrichment
* Machine-learning-based anomaly detection
* Multi-factor trust scoring
* Reputation and temporal risk assessment
* Zero Trust policy enforcement
* LLM-assisted security reasoning
* Automated response actions
* Cryptographically linked audit records

The prototype uses synthetic cloud telemetry and simulated attack scenarios to demonstrate the complete security workflow without interacting with real production infrastructure.

---

## Architecture

Agentic Guard follows a seven-stage security pipeline:

```text
┌──────────────────────┐
│   Log Generator      │
│ Synthetic Telemetry  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Observer Agent     │
│ Validation &         │
│ Enrichment           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    Trust Scorer      │
│ Anomaly + Reputation │
│ + Temporal Risk      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   ZTA Policy Engine  │
│     OPA / Rego       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Reasoner Agent     │
│ LLM-Assisted         │
│ Security Reasoning   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│     Actor Agent      │
│ Automated Response   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    Audit Ledger      │
│ SHA-256 Hash Chain   │
└──────────────────────┘
```

---

## Core Components

### 1. Log Generator

Generates synthetic cloud security telemetry representing normal and suspicious activity.

The generated events provide a controlled environment for testing detection, trust evaluation, policy decisions, reasoning, and response.

### 2. Observer Agent

The Observer Agent validates incoming telemetry against the expected event structure and enriches the event with additional security context.

Responsibilities include:

* Schema validation
* Event normalization
* Metadata enrichment
* Initial event classification

### 3. Trust Scorer

The Trust Scorer evaluates the trustworthiness of an observed security event using multiple signals.

The prototype combines:

* Machine-learning anomaly detection
* Reputation score
* Temporal risk

The implemented trust formulation is:

```text
Trust Score =
    w₁ × (1 − Anomaly Flag)
  + w₂ × Reputation Score
  + w₃ × (1 − Temporal Risk)
```

Current weights:

```text
w₁ = 0.50
w₂ = 0.35
w₃ = 0.15
```

An **Isolation Forest** model is used for anomaly detection and is trained using an initial set of normal events.

### 4. Zero Trust Policy Engine

The policy layer evaluates security decisions using **Open Policy Agent (OPA)** and Rego policies.

The policy engine helps determine whether an event or requested action should be:

* Allowed
* Denied
* Escalated
* Subjected to additional analysis

This separates security policy decisions from the application logic.

### 5. Reasoner Agent

The Reasoner Agent provides higher-level analysis of suspicious events.

It can use an LLM to:

* Interpret security context
* Summarize suspicious activity
* Explain potential threats
* Recommend response actions
* Associate activity with relevant attack techniques

The system is designed to treat telemetry as **untrusted data rather than instructions**, reducing the risk of malicious telemetry content influencing the reasoning process.

An offline fallback mechanism is also included for environments where external LLM inference is unavailable.

### 6. Actor Agent

The Actor Agent represents the response layer.

Depending on the decision produced by the security pipeline, the system can simulate appropriate response actions such as:

* Blocking
* Isolation
* Escalation
* Alerting
* Monitoring

Actions are executed within the prototype environment and should not be interpreted as production cloud remediation.

### 7. Audit Ledger

Agentic Guard maintains a tamper-evident audit trail using **SHA-256 hash chaining**.

Each audit record incorporates the cryptographic hash of the preceding record:

```text
Record N
    │
    ├── Event Data
    ├── Timestamp
    └── Hash
           │
           ▼
Record N+1
    │
    ├── Event Data
    ├── Timestamp
    ├── Previous Hash
    └── Hash
```

This allows the system to verify the integrity of the audit chain and identify potential modifications to historical records.

> The audit mechanism is a cryptographically linked ledger and is **not a blockchain**.

---

## Threat Detection Workflow

A typical suspicious event follows this workflow:

```text
Security Event
      │
      ▼
Event Validation
      │
      ▼
Feature Extraction
      │
      ▼
Anomaly Detection
      │
      ▼
Trust Evaluation
      │
      ▼
Zero Trust Policy Decision
      │
      ├──────────────► Low Risk
      │
      ▼
Suspicious Activity
      │
      ▼
LLM-Assisted Reasoning
      │
      ▼
Response Decision
      │
      ▼
Audit Record
```

---

## MITRE ATT&CK Alignment

The prototype uses selected **MITRE ATT&CK** techniques to model and classify suspicious behaviour within the simulated environment.

Example techniques include:

| Technique | Description                  | Prototype Context                        |
| --------- | ---------------------------- | ---------------------------------------- |
| T1078     | Valid Accounts               | Suspicious use of legitimate credentials |
| T1021     | Remote Services              | Suspicious remote access activity        |
| T1041     | Exfiltration Over C2 Channel | Simulated data exfiltration behaviour    |

The MITRE ATT&CK mappings are used for research and simulation rather than representing real-world incidents.

---

## Technology Stack

### Application

* TypeScript
* React
* Vite
* Node.js
* Express
* Streamlit-compatible security visualization concepts

### Security & Detection

* Isolation Forest
* Open Policy Agent (OPA)
* Rego
* MITRE ATT&CK
* SHA-256
* Trust scoring
* Security event analysis

### AI / LLM

* Google Gemini API
* LLM-assisted security reasoning
* Offline reasoning fallback

### Data & Storage

* JSON-based telemetry
* SQLite / local audit storage
* Synthetic security events

### Development

* Git
* GitHub
* Google AI Studio

---

## Key Features

* [x] Synthetic cloud security telemetry generation
* [x] Security event validation and enrichment
* [x] Anomaly detection using Isolation Forest
* [x] Multi-factor trust scoring
* [x] Reputation-based risk evaluation
* [x] Temporal risk analysis
* [x] Zero Trust policy enforcement
* [x] OPA/Rego policy evaluation
* [x] LLM-assisted security reasoning
* [x] Offline reasoning fallback
* [x] Simulated automated response
* [x] MITRE ATT&CK technique mapping
* [x] SHA-256 hash-chained audit ledger
* [x] Audit integrity verification
* [x] Security dashboard
* [x] Threat evaluation and testing workflow

---

## Project Structure

```text
agentic-guard/
│
├── src/
│   ├── App.tsx
│   ├── types.ts
│   │
│   ├── components/
│   │   └── ...
│   │
│   └── server/
│       ├── observer.ts
│       ├── generator.ts
│       ├── isolation_forest.ts
│       ├── trust_scorer.ts
│       ├── policy_engine.ts
│       ├── reasoner.ts
│       ├── actor.ts
│       ├── pipeline.ts
│       └── db.ts
│
├── server.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── .gitignore
└── README.md
```

---

## Installation

### Prerequisites

Before running Agentic Guard locally, ensure you have:

* Node.js
* npm
* Git
* A modern web browser

Optional:

* Google Gemini API key
* Ollama for offline/local LLM inference

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/agentic-guard.git
cd agentic-guard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file:

```bash
cp .env.example .env
```

Add your Gemini API key if you want to use cloud-based LLM reasoning:

```env
GEMINI_API_KEY=your_api_key_here
```

> Never commit your `.env` file or expose API keys in source code.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL displayed by the development server.

---

## Running Without an API Key

Agentic Guard includes an offline fallback mechanism for security reasoning.

This allows the core threat-hunting pipeline to be tested without depending entirely on an external LLM service.

For local LLM experimentation, an Ollama-based workflow can also be used where supported by the implementation.

---

## Example Security Scenario

A simulated user generates an unusual authentication event.

The pipeline evaluates the event:

```text
Authentication Event
        │
        ▼
Observer
        │
        ▼
Isolation Forest
        │
        ▼
Anomaly Detected
        │
        ▼
Trust Score Reduced
        │
        ▼
OPA Policy Evaluation
        │
        ▼
Escalation / Denial
        │
        ▼
Security Reasoner
        │
        ▼
Response Action
        │
        ▼
Audit Ledger
```

The event and resulting decision are recorded for subsequent investigation and integrity verification.

---

## Security Considerations

Agentic Guard is designed as a security research prototype and incorporates several defensive considerations.

### Untrusted Telemetry

Telemetry is treated as untrusted input. Security events should not be interpreted as executable instructions.

### API Key Protection

External API credentials should be provided through environment variables and must never be committed to the repository.

### Policy Separation

Security decisions are separated from application logic through the policy engine.

### Audit Integrity

Audit records are cryptographically linked using SHA-256 hashes to provide tamper evidence.

### Controlled Response

Automated response actions operate within the simulated environment and should be reviewed before adapting the architecture to real infrastructure.

---

## Limitations

Agentic Guard is a research prototype and has several limitations:

* The cloud environment is simulated rather than connected to a production cloud account.
* Telemetry is primarily synthetic.
* Attack scenarios are controlled and predefined.
* The machine-learning component is not trained on a large enterprise security dataset.
* LLM-based reasoning can produce incorrect or incomplete conclusions.
* Automated response actions are simulated and should not be directly deployed to production.
* The prototype does not replace a production SIEM, SOAR, EDR, or SOC.
* Additional security testing is required before deployment in a real environment.

These limitations are intentional because the primary objective of the project is to investigate the architecture and demonstrate the integration of autonomous security components.

---

## Research Context

Agentic Guard was developed as an academic research prototype investigating:

> **How trust evaluation and Zero Trust policy enforcement can be integrated with multi-agent reasoning to support autonomous threat hunting in cloud environments.**

The project explores the combination of:

```text
Threat Detection
      +
Trust Evaluation
      +
Zero Trust
      +
Agentic Reasoning
      +
Automated Response
      +
Tamper-Evident Auditing
```

The resulting architecture demonstrates a potential approach for coordinating multiple security functions within an autonomous threat-hunting workflow.

---

## AI-Assisted Development

This project was developed with **AI-assisted software development using Google AI Studio**.

AI assistance was used during implementation and development. The project architecture, security objectives, requirements, testing, evaluation, and implementation decisions were reviewed and adapted during the development process.

The project is presented as an academic/research prototype, and users should independently review and validate the implementation before using any component in a production security environment.

---

## Future Improvements

Potential future work includes:

* Integration with real cloud telemetry
* AWS CloudTrail integration
* Azure Activity Logs integration
* Google Cloud audit logs integration
* SIEM integration
* EDR integration
* Expanded MITRE ATT&CK coverage
* Improved behavioural anomaly detection
* Continuous model evaluation
* Human-in-the-loop approval for high-impact actions
* Role-based access control
* Distributed audit storage
* Stronger adversarial testing of LLM reasoning
* Automated threat-intelligence enrichment
* Production-grade containerization and deployment

---

## Disclaimer

Agentic Guard is intended for **educational, research, and authorized security testing purposes**.

The project uses simulated telemetry and controlled security scenarios. It should not be deployed against systems or networks without explicit authorization.

The authors are not responsible for misuse of the software or for security decisions made solely on the basis of its output.

---

## Author

**Ogunnaike Olanrewaju David**

B.Sc. Cybersecurity Graduate
Lagos, Nigeria

* LinkedIn: www.linkedin.com/in/olanrewajuogunnaike
* GitHub: github.com/the-naike

---

## License

This project is currently provided for academic and research purposes.

See the `LICENSE` file for the applicable licensing terms.
