"use client";

import * as React from "react";
import { Bot, Zap, BarChart2, Users, MessageSquare, Send, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import type { Task, TeamMember, AISuggestion, Sprint } from "@/types";

interface AIAssistantPanelProps {
  tasks: Task[];
  suggestions: AISuggestion[];
  teamMembers: TeamMember[];
  activeSprint?: Sprint | null;
  projectContext?: string;
  onAssignToAI: (taskId: string) => void;
}

type Mode = "suggestions" | "summary" | "team" | "chat";

interface ChatMessage { role: "user" | "ai"; text: string; }

interface SprintInsight {
  health: "green" | "amber" | "red";
  summary: string;
  bottlenecks: { title: string; description: string; severity: "low" | "medium" | "high" }[];
  insights: { title: string; description: string }[];
  recommendations: { title: string; action: string }[];
}

const modes: { id: Mode; label: string; icon: React.ElementType }[] = [
  { id: "suggestions", label: "Insights", icon: Zap },
  { id: "summary",     label: "Summary",  icon: BarChart2 },
  { id: "team",        label: "Team",     icon: Users },
  { id: "chat",        label: "Chat",     icon: MessageSquare },
];

const healthConfig = {
  green: { dot: "bg-green-500", label: "Healthy",  badge: "bg-green-500/20 text-green-400 border-green-500/25" },
  amber: { dot: "bg-amber-500", label: "At Risk",  badge: "bg-amber-500/20 text-amber-400 border-amber-500/25" },
  red:   { dot: "bg-red-500",   label: "Critical", badge: "bg-red-500/20 text-red-400 border-red-500/25" },
};

const severityIcon = { low: "text-zinc-500", medium: "text-amber-400", high: "text-red-400" };

function buildChatContext(tasks: Task[], teamMembers: TeamMember[]): string {
  const byStatus = (s: string) => tasks.filter((t) => t.status === s);
  return [
    `Total sprint tasks: ${tasks.length}`,
    `To Do: ${byStatus("To Do").length} | In Progress: ${byStatus("In Progress").length} | Review: ${byStatus("Review").length} | Testing: ${byStatus("Testing").length} | Done: ${byStatus("Done").length}`,
    "",
    "Tasks:",
    ...tasks.map((t) => `- [${t.id}] "${t.title}" | ${t.status} | ${t.priority} | ${t.assignee} | ${t.storyPoints}SP`),
    "",
    "Team:",
    ...teamMembers.map((m) => `- ${m.name} (${m.id})${m.isAI ? " [AI agent]" : ""}: ${m.role}`),
  ].join("\n");
}

export function AIAssistantPanel({ tasks, suggestions, teamMembers, activeSprint, projectContext = "", onAssignToAI }: AIAssistantPanelProps) {
  const [mode, setMode]             = React.useState<Mode>("suggestions");
  const [messages, setMessages]     = React.useState<ChatMessage[]>([]);
  const [input, setInput]           = React.useState("");
  const [chatLoading, setChatLoading] = React.useState(false);
  const [sprintInsights, setSprintInsights] = React.useState<SprintInsight | null>(null);
  const [insightsLoading, setInsightsLoading] = React.useState(false);
  const [insightsFetched, setInsightsFetched] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const done       = tasks.filter((t) => t.status === "Done").length;
  const inTesting  = tasks.filter((t) => t.status === "Testing").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const aiTasks    = tasks.filter((t) => t.assignee === "AI" || t.assignee === "NV").length;
  const firstUnassigned = tasks.find((t) => t.assignee === "AR" && t.status !== "Done");

  const bars = [
    { label: "Done",       value: done,       color: "bg-green-500" },
    { label: "In Progress", value: inProgress, color: "bg-blue-500" },
    { label: "In Testing",  value: inTesting,  color: "bg-orange-500" },
    { label: "AI Handled",  value: aiTasks,    color: "bg-indigo-500" },
  ];

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const fetchSprintInsights = React.useCallback(async () => {
    if (!activeSprint || tasks.length === 0) return;
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/ai/sprint-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprint: activeSprint, tasks, teamMembers, projectContext }),
      });
      const data = await res.json();
      if (!data.error) { setSprintInsights(data); setInsightsFetched(true); }
    } catch {
      /* silent fail — fall back to static suggestions */
    } finally {
      setInsightsLoading(false);
    }
  }, [activeSprint, tasks, teamMembers]);

  // Auto-fetch insights when tab is opened the first time
  React.useEffect(() => {
    if (mode === "suggestions" && !insightsFetched && !insightsLoading) {
      fetchSprintInsights();
    }
  }, [mode, insightsFetched, insightsLoading, fetchSprintInsights]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || chatLoading) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context: buildChatContext(tasks, teamMembers), projectContext }),
      });
      const data = await res.json();
      if (data.error) { setMessages((prev) => [...prev, { role: "ai", text: `Error: ${data.error}` }]); return; }
      setMessages((prev) => [...prev, { role: "ai", text: data.reply as string }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Failed to reach AI. Check your API key." }]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const health = sprintInsights ? healthConfig[sprintInsights.health] : null;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
          <Bot size={13} className="text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-semibold text-zinc-100">AI Assistant</h3>
          <p className="text-[10px] text-zinc-500">Atlas · Nova</p>
        </div>
        {health ? (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-1 flex-shrink-0 ${health.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
            {health.label}
          </span>
        ) : (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20 flex-shrink-0">Live</span>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-2 border-b border-zinc-800 flex-shrink-0">
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition ${
              mode === id ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Icon size={10} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-y-auto min-h-0">

        {/* ── Insights ── */}
        {mode === "suggestions" && (
          <div className="space-y-2">
            {/* Health summary */}
            {sprintInsights && (
              <div className={`rounded-xl p-3 mb-3 border text-[11px] leading-relaxed ${health!.badge}`}>
                {sprintInsights.summary}
              </div>
            )}

            {/* Refresh / loading */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-500">
                {sprintInsights ? "AI sprint analysis:" : insightsLoading ? "Analyzing sprint..." : "Sprint signals:"}
              </p>
              <button
                onClick={fetchSprintInsights}
                disabled={insightsLoading}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 transition flex items-center gap-1 disabled:opacity-40"
              >
                <RefreshCw size={9} className={insightsLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {insightsLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={18} className="animate-spin text-blue-400" />
              </div>
            )}

            {/* Bottlenecks */}
            {(sprintInsights?.bottlenecks?.length ?? 0) > 0 && (
              <div className="space-y-1.5 mb-2">
                {sprintInsights!.bottlenecks.map((b, i) => (
                  <div key={i} className="bg-zinc-800 border border-zinc-700/60 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle size={11} className={`mt-0.5 flex-shrink-0 ${severityIcon[b.severity]}`} />
                    <div>
                      <p className="text-[11px] font-medium text-zinc-100 mb-0.5">{b.title}</p>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Insights */}
            {(sprintInsights?.insights ?? suggestions).map((s, i) => (
              <div key={i} className="bg-zinc-800 border border-zinc-700/60 rounded-xl p-3">
                <p className="text-[11px] font-medium text-zinc-100 mb-1">{s.title}</p>
                <p className="text-[10px] text-zinc-400 leading-relaxed">{s.description}</p>
              </div>
            ))}

            {firstUnassigned && (
              <button
                onClick={() => onAssignToAI(firstUnassigned.id)}
                className="w-full mt-1 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 hover:border-blue-500/40 transition px-3 py-2.5 rounded-xl text-[11px] font-medium text-blue-300 flex items-center justify-center gap-2"
              >
                <Bot size={11} />
                Assign {firstUnassigned.id} to Atlas AI
              </button>
            )}
          </div>
        )}

        {/* ── Summary ── */}
        {mode === "summary" && (
          <div className="space-y-3">
            <p className="text-[10px] text-zinc-500 mb-3">Sprint pulse:</p>
            <div className="space-y-3">
              {bars.map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>{label}</span>
                    <span>{value}/{tasks.length}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: tasks.length > 0 ? `${(value / tasks.length) * 100}%` : "0%" }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 mt-1">
              <p className="text-[10px] text-zinc-300 leading-relaxed">
                {sprintInsights?.summary ?? "Run AI analysis in Insights tab to get a smart sprint summary."}
              </p>
            </div>
            {sprintInsights?.recommendations?.map((r, i) => (
              <div key={i} className="bg-zinc-800/60 border border-zinc-700/40 rounded-xl p-3">
                <p className="text-[11px] font-medium text-blue-300 mb-0.5">{r.title}</p>
                <p className="text-[10px] text-zinc-400">{r.action}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Team ── */}
        {mode === "team" && (
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-500 mb-3">Active team members:</p>
            {teamMembers.map((member) => {
              const mt   = tasks.filter((t) => t.assignee === member.id);
              const done = mt.filter((t) => t.status === "Done").length;
              return (
                <div key={member.id} className="bg-zinc-800 border border-zinc-700/60 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-full ${member.color} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-zinc-100">{member.name}</p>
                      <p className="text-[10px] text-zinc-500">{member.isAI && <span className="text-blue-400">AI · </span>}{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span>{mt.length} tasks assigned</span>
                    {done > 0 && <><span>·</span><span className="text-green-400">{done} done</span></>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Chat ── */}
        {mode === "chat" && (
          <div className="flex flex-col gap-2">
            {messages.length === 0 && (
              <p className="text-[10px] text-zinc-500 text-center py-6">Ask anything about the current sprint.</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet-600/20 text-violet-100 self-end max-w-[85%] ml-auto"
                  : "bg-zinc-800 border border-zinc-700/60 text-zinc-200 self-start max-w-[95%]"
              }`}>
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 self-start">
                <span className="text-[11px] text-zinc-500 animate-pulse">Thinking...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Chat input */}
      {mode === "chat" && (
        <div className="p-3 border-t border-zinc-800 flex-shrink-0 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the sprint..."
            disabled={chatLoading}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-[11px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || chatLoading}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
          >
            <Send size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
