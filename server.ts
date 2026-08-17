/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { pipeline } from "./src/server/pipeline.js";
import { LogGenerator, ENTERPRISE_USERS } from "./src/server/generator.js";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request body parsing
  app.use(express.json());

  // ==========================================
  // Core REST API Routes (API routes FIRST)
  // ==========================================

  app.get("/api/health", (req, res) => {
    let apiKeyStatus = "FALLBACK_MODE";
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && process.env.GEMINI_API_KEY.trim() !== "") {
      if (pipeline.reasoner.isQuotaExhausted()) {
        apiKeyStatus = "QUOTA_EXHAUSTED";
      } else {
        apiKeyStatus = "CONNECTED";
      }
    }
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      api_key_status: apiKeyStatus,
    });
  });

  // Config Endpoints
  app.get("/api/config", (req, res) => {
    res.json(pipeline.db.getConfig());
  });

  app.post("/api/config", (req, res) => {
    try {
      pipeline.db.updateConfig(req.body);
      res.json({ success: true, config: pipeline.db.getConfig() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Enterprise Users Metadata Directory Endpoint
  app.get("/api/enterprise-users", (req, res) => {
    res.json(ENTERPRISE_USERS);
  });

  // User Reputation Endpoints
  app.get("/api/reputation", (req, res) => {
    res.json(pipeline.db.getReputations());
  });

  // Watch-list (Adaptive monitoring) Endpoints
  app.get("/api/watch-list", (req, res) => {
    res.json(pipeline.db.getWatchList());
  });

  app.post("/api/watch-list/add", (req, res) => {
    const { user_id_or_ip, reason } = req.body;
    if (!user_id_or_ip) {
      res.status(400).json({ error: "user_id_or_ip is required." });
      return;
    }
    pipeline.db.addToWatchList(user_id_or_ip, reason || "Manual watch-list addition.");
    res.json({ success: true, watch_list: pipeline.db.getWatchList() });
  });

  app.post("/api/watch-list/remove", (req, res) => {
    const { user_id_or_ip } = req.body;
    if (!user_id_or_ip) {
      res.status(400).json({ error: "user_id_or_ip is required." });
      return;
    }
    pipeline.db.removeFromWatchList(user_id_or_ip);
    res.json({ success: true, watch_list: pipeline.db.getWatchList() });
  });

  // Blocklist (Blocked users) Endpoints
  app.get("/api/blocked-users", (req, res) => {
    res.json(pipeline.db.getBlockedUsers());
  });

  // Analyst Manual Overrides
  app.post("/api/override", (req, res) => {
    const { user_id, action, justification } = req.body;
    if (!user_id || !action || !justification) {
      res.status(400).json({ error: "user_id, action (UNBLOCK/FORCE_BLOCK), and justification are required." });
      return;
    }

    try {
      pipeline.actor.executeManualOverride(user_id, action, justification);
      res.json({
        success: true,
        blocked: pipeline.db.getBlockedUsers(),
        reputations: pipeline.db.getReputations(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Threat Events Endpoints
  app.get("/api/events", (req, res) => {
    // Return sorted newest first
    const events = pipeline.db.getThreatEvents();
    res.json(
      events.sort(
        (a, b) => new Date(b.enriched_event.timestamp).getTime() - new Date(a.enriched_event.timestamp).getTime()
      )
    );
  });

  app.post("/api/events/clear", (req, res) => {
    pipeline.db.clearAllData();
    pipeline.reasoner.resetQuotaStatus();
    pipeline.initializeModelAndColdStart(); // re-seed forest
    res.json({ success: true });
  });

  // Ingest logs (generate raw events and feed them through the pipeline)
  app.post("/api/pipeline/generate-logs", async (req, res) => {
    const { count, attack_ratio } = req.body;
    const finalCount = count || pipeline.db.getConfig().generation.default_event_count;
    const finalRatio = attack_ratio !== undefined ? attack_ratio : pipeline.db.getConfig().generation.default_attack_ratio;

    try {
      pipeline.db.startTransaction();
      const logs = LogGenerator.generateBatch(finalCount, finalRatio);
      const processed: any[] = [];

      for (const log of logs) {
        const out = await pipeline.runPipeline(log);
        processed.push(out);
      }
      pipeline.db.commitTransaction();

      res.json({ success: true, processed_count: processed.length });
    } catch (err: any) {
      pipeline.db.commitTransaction(); // safety clean transaction status
      res.status(500).json({ error: err.message });
    }
  });

  // Generate and ingest a log for a specific user ID
  app.post("/api/pipeline/generate-user-log", async (req, res) => {
    const { user_id, is_attack } = req.body;
    if (!user_id) {
      res.status(400).json({ error: "user_id is required." });
      return;
    }

    try {
      pipeline.db.startTransaction();
      const log = LogGenerator.generateForUser(user_id, !!is_attack);
      const processed = await pipeline.runPipeline(log);
      pipeline.db.commitTransaction();

      res.json({ success: true, processed_count: 1, event: processed });
    } catch (err: any) {
      pipeline.db.commitTransaction();
      res.status(500).json({ error: err.message });
    }
  });

  // Audit Ledger Endpoints
  app.get("/api/ledger", (req, res) => {
    res.json(pipeline.db.getAuditLogs());
  });

  app.post("/api/ledger/verify", (req, res) => {
    const verification = pipeline.db.verifyLedgerIntegrity();
    res.json(verification);
  });

  app.post("/api/ledger/simulate-breach", (req, res) => {
    const { record_id } = req.body;
    if (!record_id) {
      res.status(400).json({ error: "record_id is required." });
      return;
    }

    const success = pipeline.db.simulateBreach(Number(record_id));
    res.json({ success, message: success ? `Record ${record_id} data altered. Verification chain is now broken.` : `Record ${record_id} not found.` });
  });

  app.post("/api/ledger/heal", (req, res) => {
    try {
      const result = pipeline.db.healLedgerIntegrity();
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ML Training Endpoints
  app.post("/api/model/retrain", (req, res) => {
    try {
      pipeline.retrainModel();
      res.json({ success: true, message: "Isolation Forest unsupervised model retrained successfully." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Academic Evaluation Endpoint
  app.post("/api/evaluation/run", async (req, res) => {
    const { count, attack_ratio } = req.body;
    const finalCount = count || 100;
    const finalRatio = attack_ratio !== undefined ? attack_ratio : 0.20;

    try {
      const evaluationResult = await pipeline.runEvaluationBatch(finalCount, finalRatio);
      res.json(evaluationResult);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // Vite Middleware / Production Static Serve
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AGENTIC GUARD SERVER] Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer();
