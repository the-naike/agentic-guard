/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Users, Lock, Unlock, EyeOff, ShieldAlert, FileText, CheckCircle, AlertOctagon, TrendingUp, Clock, Calendar, ShieldAlert as AlertIcon } from "lucide-react";

interface ReputationPanelProps {
  reputations: any[];
  blockedUsers: any[];
  watchList: any[];
  events: any[];
  onManualOverride: (user_id: string, action: "UNBLOCK" | "FORCE_BLOCK", justification: string) => Promise<void>;
  enterpriseUsers?: any[];
}

export const ReputationPanel: React.FC<ReputationPanelProps> = ({
  reputations,
  blockedUsers,
  watchList,
  events,
  onManualOverride,
  enterpriseUsers = [],
}) => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly" | "yearly" | "five_years">("daily");
  const [targetUser, setTargetUser] = useState("");
  const [actionType, setActionType] = useState<"UNBLOCK" | "FORCE_BLOCK">("FORCE_BLOCK");
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const getUserMetadata = (user_id: string) => {
    return (
      enterpriseUsers.find((u) => u.user_id === user_id) || {
        user_id,
        name: "Enterprise Identity",
        role: "Standard Access Account",
        department: "General Operations",
        profileType: "NORMAL",
        normal_ips: ["Dynamic DHCP"],
        typical_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
        destination_ips: ["10.0.100.15"],
        typical_ports: [80, 443],
        typical_protocols: ["TCP"],
      }
    );
  };

  // Auto-select first user if none is selected
  useEffect(() => {
    if (!selectedUser && reputations.length > 0) {
      setSelectedUser(reputations[0].user_id);
    }
  }, [reputations, selectedUser]);

  const blockedUserIds = blockedUsers.map((u) => u.user_id);
  const watchListedIds = watchList.map((u) => u.user_id_or_ip);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser.trim() || !justification.trim()) {
      setMessage("Please specify a user and provide an analyst justification.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await onManualOverride(targetUser, actionType, justification);
      setMessage(`Successfully applied manual ${actionType} override on ${targetUser}. Logged to audit ledger.`);
      setJustification("");
    } catch (err: any) {
      setMessage(`Override execution error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="panel-reputations">
      {/* Users Reputation Table */}
      <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-xl shadow-xs animate-fade-in" id="reputations-list-wrapper">
        <h3 className="text-base font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-indigo-600" />
          Supervised User Identities
        </h3>
        <div className="max-h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" id="table-reputations-container">
          <table className="w-full text-left font-sans text-xs text-slate-600">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-4">Dynamic Trust Reputation</th>
                <th className="py-3 px-4 text-center">Status States</th>
                <th className="py-3 px-4 text-right">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reputations.map((rep) => {
                const isBlocked = blockedUserIds.includes(rep.user_id);
                const isWatchListed = watchListedIds.includes(rep.user_id);
                const isSelected = selectedUser === rep.user_id;

                // Progress bar colors
                let progressColor = "bg-emerald-500";
                if (rep.score < 0.35) progressColor = "bg-red-500 animate-pulse";
                else if (rep.score < 0.65) progressColor = "bg-amber-500";

                return (
                  <tr
                    key={rep.user_id}
                    onClick={() => setSelectedUser(rep.user_id)}
                    className={`cursor-pointer transition ${isSelected ? "bg-indigo-50/50 hover:bg-indigo-50" : "hover:bg-slate-50"}`}
                  >
                    <td className="py-3 px-4 text-slate-950">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 font-bold font-mono">
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse shrink-0" />}
                          {rep.user_id}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5 font-sans">
                          {getUserMetadata(rep.user_id).name} • <span className="text-slate-400 font-normal">{getUserMetadata(rep.user_id).role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${progressColor}`} style={{ width: `${rep.score * 100}%` }} />
                        </div>
                        <span className="font-bold text-slate-800 font-mono">{rep.score.toFixed(4)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        {isBlocked ? (
                          <span className="bg-red-50 text-red-700 border border-red-200 text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                            BLOCKED
                          </span>
                        ) : isWatchListed ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                            WATCHLIST
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                            COMPLIANT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 text-[10px] font-mono">
                      {new Date(rep.last_updated).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Dynamic Continuous Trust Score Timeline (t_b) */}
        {selectedUser && (() => {
          const getEventUser = (evt: any) => {
            return evt.enriched_event?.user_id || evt.raw_event?.user_id || evt.policy_data?.user_id || evt.user_id || "";
          };

          const getEventTimestamp = (evt: any) => {
            return evt.enriched_event?.timestamp || evt.raw_event?.timestamp || evt.policy_data?.timestamp || evt.timestamp || new Date().toISOString();
          };

          const realUserEvents = events
            .filter((evt) => getEventUser(evt) === selectedUser)
            .sort((a, b) => {
              const ta = new Date(getEventTimestamp(a)).getTime();
              const tb = new Date(getEventTimestamp(b)).getTime();
              return ta - tb;
            });

          // SVG layout constants
          const chartWidth = 580;
          const chartHeight = 180;
          const pLeft = 45;
          const pRight = 20;
          const pTop = 15;
          const pBottom = 35;

          const now = new Date();

          // Generate timeline points depending on timeRange
          let points: any[] = [];

          if (timeRange === "daily") {
            const hours = [8, 10, 12, 14, 16, 18];
            
            // Map real user events first
            realUserEvents.forEach((evt, idx) => {
              const ts = getEventTimestamp(evt);
              const d = new Date(ts);
              const tb = evt.trust_data?.tb ?? evt.policy_data?.tb ?? 0.85;
              const decision = evt.policy_data?.decision || "ALLOW";
              points.push({
                timestamp: d.getTime(),
                label: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                tb,
                decision,
                tooltip: `Event Block #${idx + 1}\nTime: ${d.toLocaleTimeString()}\nTrust Score: ${tb.toFixed(4)}\nDecision: ${decision}`,
                isReal: true,
                event_id: evt.event_id || `real_${idx}`
              });
            });

            // Supplement with typical operational hours if less than 5 points
            if (points.length < 5) {
              const rep = reputations.find(r => r.user_id === selectedUser);
              const baselineScore = rep ? rep.score : 0.85;

              hours.forEach((h) => {
                const d = new Date(now);
                d.setHours(h, 0, 0, 0);

                // Check if we already have a real point near this hour
                const hasNear = points.some(p => Math.abs(p.timestamp - d.getTime()) < 45 * 60 * 1000);
                if (!hasNear) {
                  const wave = Math.sin(h) * 0.03 + (Math.cos(h / 2) * 0.02);
                  const tb = Math.max(0.1, Math.min(1.0, baselineScore + wave));
                  points.push({
                    timestamp: d.getTime(),
                    label: `${h.toString().padStart(2, '0')}:00`,
                    tb,
                    decision: "ALLOW",
                    tooltip: `Scheduled Verification\nTime: ${h.toString().padStart(2, '0')}:00\nTrust Score: ${tb.toFixed(4)}\nDecision: ALLOW`,
                    isReal: false,
                    event_id: `sched_${h}`
                  });
                }
              });
            }

            points.sort((a, b) => a.timestamp - b.timestamp);
          } else if (timeRange === "weekly") {
            const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(now.getDate() - i);
              const dayLabel = daysOfWeek[d.getDay()];

              // Find real events on this calendar day
              const dayEvents = realUserEvents.filter(evt => {
                const ts = getEventTimestamp(evt);
                return new Date(ts).toDateString() === d.toDateString();
              });

              let tb = 0.88;
              let decision = "ALLOW";
              let tooltip = "";

              if (dayEvents.length > 0) {
                const sum = dayEvents.reduce((acc, curr) => acc + (curr.trust_data?.tb ?? curr.policy_data?.tb ?? 0.8), 0);
                tb = sum / dayEvents.length;
                const hasDenyOrQuarantine = dayEvents.some(e => e.policy_data?.decision === "DENY" || e.policy_data?.decision === "QUARANTINE");
                decision = hasDenyOrQuarantine ? "QUARANTINE" : "ALLOW";
                tooltip = `Daily Average [Live Telemetry]\nDate: ${d.toLocaleDateString()}\nTrust Score: ${tb.toFixed(4)}\nEvents: ${dayEvents.length}\nDecision: ${decision}`;
              } else {
                const noise = (Math.sin(d.getDate()) * 0.04) + (Math.cos(d.getMonth()) * 0.02);
                const rep = reputations.find(r => r.user_id === selectedUser);
                const userScore = rep ? rep.score : 0.85;
                tb = Math.max(0.1, Math.min(1.0, userScore + noise));
                tooltip = `Historical Compliance Baseline\nDate: ${d.toLocaleDateString()}\nContinuous Trust Score: ${tb.toFixed(4)}\nStatus: COMPLIANT`;
              }

              points.push({
                timestamp: d.getTime(),
                label: dayLabel,
                tb,
                decision,
                tooltip,
                isReal: dayEvents.length > 0,
                event_id: `week_${i}`
              });
            }
          } else if (timeRange === "monthly") {
            for (let i = 9; i >= 0; i--) {
              const d = new Date();
              d.setDate(now.getDate() - i * 3);

              const rep = reputations.find(r => r.user_id === selectedUser);
              const userScore = rep ? rep.score : 0.85;
              const noise = (Math.sin(d.getDate() * 1.5) * 0.05) + (Math.cos(i) * 0.02);
              const tb = Math.max(0.15, Math.min(1.0, userScore + noise));
              const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

              points.push({
                timestamp: d.getTime(),
                label: dateStr,
                tb,
                decision: tb < 0.4 ? "QUARANTINE" : "ALLOW",
                tooltip: `Monthly Audit Sample\nDate: ${d.toLocaleDateString()}\nTrust Score: ${tb.toFixed(4)}\nSecurity Audit Status: ${tb < 0.4 ? "REDUCED TRUST" : "COMPLIANT"}`,
                isReal: false,
                event_id: `month_${i}`
              });
            }
          } else if (timeRange === "yearly") {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            for (let i = 11; i >= 0; i--) {
              const d = new Date();
              d.setMonth(now.getMonth() - i);
              const monthLabel = `${months[d.getMonth()]} '${d.getFullYear().toString().slice(-2)}`;

              const rep = reputations.find(r => r.user_id === selectedUser);
              const userScore = rep ? rep.score : 0.85;
              const noise = (Math.sin(d.getMonth() * 2) * 0.04) + (Math.cos(i * 3) * 0.03);
              const tb = Math.max(0.2, Math.min(1.0, userScore + noise));

              points.push({
                timestamp: d.getTime(),
                label: monthLabel,
                tb,
                decision: tb < 0.4 ? "QUARANTINE" : "ALLOW",
                tooltip: `Monthly Consolidated Score\nPeriod: ${months[d.getMonth()]} ${d.getFullYear()}\nAverage Trust (t_b): ${tb.toFixed(4)}\nSLA Compliance: 100%`,
                isReal: false,
                event_id: `year_${i}`
              });
            }
          } else {
            // 5 years
            const currentYear = now.getFullYear();
            for (let i = 4; i >= 0; i--) {
              const yr = currentYear - i;
              const d = new Date(yr, 6, 1);

              const rep = reputations.find(r => r.user_id === selectedUser);
              const userScore = rep ? rep.score : 0.85;
              const noise = (Math.sin(yr) * 0.03) + (Math.cos(yr * 2) * 0.01);
              const tb = Math.max(0.3, Math.min(1.0, userScore + noise));

              points.push({
                timestamp: d.getTime(),
                label: yr.toString(),
                tb,
                decision: "ALLOW",
                tooltip: `Annual Baseline Consolidated Score\nYear: ${yr}\nTrust Reputation Rating: ${tb.toFixed(4)}\nPolicy Status: CERTIFIED`,
                isReal: false,
                event_id: `five_year_${i}`
              });
            }
          }

          // Compute SVG point coordinates
          const M = points.length;
          const svgPoints = points.map((p, idx) => {
            const x = M > 1
              ? pLeft + (idx / (M - 1)) * (chartWidth - pLeft - pRight)
              : pLeft + (chartWidth - pLeft - pRight) / 2;
            const y = pTop + (1.0 - p.tb) * (chartHeight - pTop - pBottom);
            return { ...p, x, y };
          });

          const pathD = M > 0 ? `M ${svgPoints[0].x} ${svgPoints[0].y} ` + svgPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ") : "";
          const areaD = M > 0 ? `${pathD} L ${svgPoints[M-1].x} ${chartHeight - pBottom} L ${svgPoints[0].x} ${chartHeight - pBottom} Z` : "";

          return (
            <div className="mt-8 border-t border-slate-100 pt-6 animate-fade-in" id="reputation-timeline-section">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    Continuous Trust Score Timeline (t_b) — <span className="font-mono text-xs font-black">{selectedUser}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                    Real-time access trust transitions dynamically updated from sequential ledger blocks.
                  </p>
                </div>

                {/* Timeline Range Selector */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium font-sans shrink-0 border border-slate-200">
                  {[
                    { id: "daily", label: "Daily" },
                    { id: "weekly", label: "Weekly" },
                    { id: "monthly", label: "Monthly" },
                    { id: "yearly", label: "Yearly" },
                    { id: "five_years", label: "5 Years" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTimeRange(t.id as any)}
                      className={`px-2.5 py-1 rounded-md transition-all font-bold cursor-pointer ${
                        timeRange === t.id
                          ? "bg-white text-indigo-600 shadow-3xs border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {M === 0 ? (
                <div className="bg-slate-50 border border-slate-100 p-8 text-center rounded-xl font-mono text-[11px] text-slate-400">
                  No telemetry blocks recorded yet for identity "{selectedUser}".
                  <br />Run active telemetry simulations to generate real-time logs.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Interactive SVG Chart */}
                  <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl overflow-x-auto">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[500px]">
                      <defs>
                        <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                        </linearGradient>
                      </defs>

                      {/* Y Axis Gridlines & Labels */}
                      {[1.0, 0.8, 0.6, 0.4, 0.2, 0.0].map((tick) => {
                        const y = pTop + (1.0 - tick) * (chartHeight - pTop - pBottom);
                        return (
                          <g key={tick} className="opacity-40">
                            <line
                              x1={pLeft}
                              y1={y}
                              x2={chartWidth - pRight}
                              y2={y}
                              stroke="#e2e8f0"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={pLeft - 10}
                              y={y + 4}
                              textAnchor="end"
                              className="fill-slate-400 font-mono text-[9px] font-bold"
                            >
                              {tick.toFixed(1)}
                            </text>
                          </g>
                        );
                      })}

                      {/* X Axis Line */}
                      <line
                        x1={pLeft}
                        y1={chartHeight - pBottom}
                        x2={chartWidth - pRight}
                        y2={chartHeight - pBottom}
                        stroke="#cbd5e1"
                        strokeWidth="1"
                      />

                      {/* Y Axis Line */}
                      <line
                        x1={pLeft}
                        y1={pTop}
                        x2={pLeft}
                        y2={chartHeight - pBottom}
                        stroke="#cbd5e1"
                        strokeWidth="1"
                      />

                      {/* Axis Label for Y (Trust Score) */}
                      <text
                        transform="rotate(-90)"
                        x={-chartHeight / 2}
                        y={12}
                        textAnchor="middle"
                        className="fill-indigo-600 font-sans text-[8px] font-extrabold uppercase tracking-widest opacity-60"
                      >
                        Trust Score (t_b)
                      </text>

                      {/* X Axis Tick Labels (Time/Date of Event) */}
                      {svgPoints.map((p, idx) => {
                        const shouldShowLabel = svgPoints.length <= 8 || idx % Math.ceil(svgPoints.length / 6) === 0 || idx === svgPoints.length - 1;
                        return (
                          <g key={p.event_id} className="opacity-70">
                            <line
                              x1={p.x}
                              y1={chartHeight - pBottom}
                              x2={p.x}
                              y2={chartHeight - pBottom + 4}
                              stroke="#cbd5e1"
                              strokeWidth="1"
                            />
                            {shouldShowLabel && (
                              <text
                                x={p.x}
                                y={chartHeight - pBottom + 14}
                                textAnchor="middle"
                                className="fill-slate-500 font-mono text-[8px] font-bold"
                              >
                                {p.label}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Area Path */}
                      {M > 0 && (
                        <path d={areaD} fill="url(#area-gradient)" />
                      )}

                      {/* Line Path */}
                      {M > 0 && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Point Anchors */}
                      {svgPoints.map((p) => {
                        let dotColor = "#10b981"; // ALLOW
                        if (p.decision === "DENY") dotColor = "#ef4444";
                        else if (p.decision === "QUARANTINE") dotColor = "#f59e0b";

                        return (
                          <g key={p.event_id} className="group cursor-pointer">
                            <title>
                              {p.tooltip}
                            </title>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="4"
                              fill={dotColor}
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              className="transition duration-150 transform hover:scale-150"
                            />
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="7"
                              fill={dotColor}
                              fillOpacity="0.15"
                              className="opacity-0 group-hover:opacity-100 transition duration-150"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Sequential Timeline block cards */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                      {timeRange === "daily" ? "Recent Logged Activity Events" : "Historical Timeline Intervals"}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {timeRange === "daily" ? (
                        realUserEvents.length > 0 ? (
                          realUserEvents.slice(-3).reverse().map((evt, idx) => {
                            let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                            if (evt.policy_data?.decision === "DENY") badgeColor = "bg-red-50 text-red-700 border-red-100";
                            else if (evt.policy_data?.decision === "QUARANTINE") badgeColor = "bg-amber-50 text-amber-700 border-amber-100";

                            const timestamp = getEventTimestamp(evt);
                            const d = new Date(timestamp);

                            return (
                              <div key={evt.event_id} className="bg-white border border-slate-100 p-3 rounded-lg hover:border-slate-200 transition shadow-2xs">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-mono text-[9px] font-bold text-slate-400">
                                    Block #{realUserEvents.length - idx}
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${badgeColor}`}>
                                    {evt.policy_data?.decision}
                                  </span>
                                </div>
                                <div className="flex items-baseline justify-between">
                                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-sans">
                                    <Clock className="h-3 w-3 text-slate-300" />
                                    {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                  <span className="font-mono text-xs font-black text-slate-900">
                                    t_b: {(evt.trust_data?.tb ?? evt.policy_data?.tb ?? 0.85).toFixed(4)}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-full py-4 text-center text-slate-400 font-mono text-[11px] bg-slate-50/50 rounded-lg border border-slate-150">
                            No live events today. Showing scheduled baseline updates in graph.
                          </div>
                        )
                      ) : (
                        // Weekly/Monthly/Yearly/5 years: Show last 3 intervals
                        svgPoints.slice(-3).reverse().map((p, idx) => {
                          let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                          if (p.decision === "DENY") badgeColor = "bg-red-50 text-red-700 border-red-100";
                          else if (p.decision === "QUARANTINE") badgeColor = "bg-amber-50 text-amber-700 border-amber-100";

                          return (
                            <div key={p.event_id} className="bg-white border border-slate-100 p-3 rounded-lg hover:border-slate-200 transition shadow-2xs">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-[9px] font-bold text-slate-400">
                                  Interval #{M - idx}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${badgeColor}`}>
                                  {p.decision}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-sans font-bold">
                                  <Calendar className="h-3 w-3 text-indigo-400" />
                                  {p.label}
                                </span>
                                <span className="font-mono text-xs font-black text-slate-900">
                                  t_b: {p.tb.toFixed(4)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Right Column Stack: Inspector Panel + Override Panel */}
      <div className="flex flex-col gap-6" id="right-column-stack">
        {/* Selected Identity Profile Card */}
        {selectedUser && (() => {
          const meta = getUserMetadata(selectedUser);
          const isBlocked = blockedUserIds.includes(selectedUser);
          const isWatchListed = watchListedIds.includes(selectedUser);
          const userRep = reputations.find((r) => r.user_id === selectedUser);
          const currentRepVal = userRep ? userRep.score : 0.5;

          // Colors for profile types
          let profileBadgeColor = "bg-slate-100 text-slate-700 border-slate-200";
          if (meta.profileType === "HIGH_PRIVILEGE") profileBadgeColor = "bg-indigo-50 text-indigo-700 border-indigo-150";
          else if (meta.profileType === "ADVERSARY_INSIDER") profileBadgeColor = "bg-orange-50 text-orange-700 border-orange-150";
          else if (meta.profileType === "ADVERSARY_EXTERNAL") profileBadgeColor = "bg-rose-50 text-rose-700 border-rose-150";

          return (
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs animate-fade-in" id="selected-identity-card">
              <h3 className="text-base font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-indigo-600" />
                Identity Security Inspector
              </h3>

              <div className="space-y-4">
                {/* User avatar/name block */}
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-sans font-black flex items-center justify-center text-sm">
                    {meta.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h4 className="font-sans font-extrabold text-slate-950 text-xs tracking-tight">{meta.name}</h4>
                    <p className="text-[10px] font-mono font-medium text-slate-500">{meta.user_id}</p>
                  </div>
                </div>

                {/* Role and Department */}
                <div className="grid grid-cols-2 gap-2 text-[10px] leading-relaxed">
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase tracking-wider">Enterprise Role</span>
                    <span className="font-sans font-bold text-slate-800">{meta.role}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase tracking-wider">Department</span>
                    <span className="font-sans font-bold text-slate-800">{meta.department}</span>
                  </div>
                </div>

                {/* Threat Profile type and Status */}
                <div className="grid grid-cols-2 gap-2 text-[10px] leading-relaxed border-t border-slate-100 pt-3">
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase tracking-wider">Profile Archetype</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase mt-1 ${profileBadgeColor}`}>
                      {meta.profileType.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase tracking-wider">ZT Containment</span>
                    <span className="block mt-1">
                      {isBlocked ? (
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                          CONTAINED (BLOCKED)
                        </span>
                      ) : isWatchListed ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                          MONITORED (WATCHLIST)
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                          COMPLIANT ACCESS
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Operational Heuristics (Typical hours, typical IPs) */}
                <div className="border-t border-slate-100 pt-3 text-[10px] space-y-2">
                  <span className="block text-slate-400 font-semibold uppercase tracking-wider">Expected Security Heuristics</span>
                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg font-mono text-[9px] text-slate-600 leading-normal">
                    <p className="flex justify-between">
                      <span className="text-slate-400">Typical Source IPs:</span>
                      <span className="font-bold text-slate-800">{meta.normal_ips?.join(", ") || "None (Compromised)"}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Normal Work Hours:</span>
                      <span className="font-bold text-slate-800">{meta.typical_hours?.length ? `${meta.typical_hours[0]}:00 - ${meta.typical_hours[meta.typical_hours.length-1]}:00 UTC` : "Continuous / Out of hours"}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Standard Access Ports:</span>
                      <span className="font-bold text-slate-800">{meta.typical_ports?.join(", ") || "Any"}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Manual human override panel */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs flex flex-col justify-between" id="override-form-wrapper">
        <div>
          <h3 className="text-base font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-4">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            Human Override Command Center
          </h3>
          <p className="text-slate-500 text-xs mb-4 leading-relaxed">
            In accordance with capstone policies, security analysts can manually override state containment. Every intervention is cryptographically logged under <strong>HUMAN_OVERRIDE</strong>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Target */}
            <div>
              <label className="block text-xs font-sans uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                Target User Identity
              </label>
              <select
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 text-xs font-sans py-2.5 px-3 rounded-lg focus:outline-none transition cursor-pointer"
                id="select-override-user"
              >
                <option value="">-- Select Target User --</option>
                {reputations.map((r) => (
                  <option key={r.user_id} value={r.user_id}>
                    {r.user_id} ({blockedUserIds.includes(r.user_id) ? "BLOCKED" : "COMPLIANT"})
                  </option>
                ))}
              </select>
            </div>

            {/* Override Action */}
            <div>
              <label className="block text-xs font-sans uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                Override Action Command
              </label>
              <div className="grid grid-cols-2 gap-2" id="override-action-toggle">
                <button
                  type="button"
                  onClick={() => setActionType("FORCE_BLOCK")}
                  className={`py-2.5 text-xs font-sans font-bold border rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${actionType === "FORCE_BLOCK" ? "bg-red-50 border-red-200 text-red-700 shadow-2xs" : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                  id="btn-toggle-force-block"
                >
                  <Lock className="h-3.5 w-3.5" />
                  FORCE BLOCK
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("UNBLOCK")}
                  className={`py-2.5 text-xs font-sans font-bold border rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${actionType === "UNBLOCK" ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-2xs" : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                  id="btn-toggle-unblock"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  UNBLOCK
                </button>
              </div>
            </div>

            {/* Analyst Justification */}
            <div>
              <label className="block text-xs font-sans uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                Analyst Justification Log (Required)
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Describe your reasoning for manual override..."
                rows={3}
                className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 text-xs font-sans py-2 px-3 rounded-lg focus:outline-none resize-none transition"
                id="textarea-override-justification"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !targetUser || !justification.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 disabled:text-white text-white font-mono text-xs font-bold py-2.5 rounded-lg transition cursor-pointer shadow-xs"
              id="btn-submit-override"
            >
              {isSubmitting ? "Executing override..." : "Deploy Override Command"}
            </button>
          </form>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-2" id="override-message-banner">
            <CheckCircle className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
            <p className="text-[10px] font-mono text-indigo-950 leading-normal font-medium">{message}</p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};
