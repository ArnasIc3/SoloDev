"use client";

import * as React from "react";
import {
  Bot, Zap, BarChart2, Users, MessageSquare, Send, Loader2,
  AlertTriangle, RefreshCw, ClipboardList, CheckCircle2, X,
  ChevronDown, ChevronUp, Sparkles, ArrowRight,
} from "lucide-react";
import type { Task, TeamMember, AISuggestion, Sprint, AITaskSuggestion, SprintRecommendationVerdict } from "@/types";

interface AIAssistantPanelProps {
  tasks: Task[];
  allTasks: Task[];
  sprints: Sprint[];
  suggestions: AISuggestion[];
  teamMembers: TeamMember[];
  activeSprint?: Sprint | null;
  projectContext?: string;
  onAssignToAI: (taskId: string) => void;
  onAcceptSuggestion: (s: AITaskSuggestion, sprintId: number | null) => void;
}

type Mode = "suggestions" | "planner" | "summary" | "team" | "chat";

interface ChatMessage { role: "user" | "ai"; text: string; }

interface SprintInsight {
  health: "green" | "amber" | "red";
  summary: string;
  bottlenecks: { title: string; description: string; severity: "low" | "medium" | "high" }[];
  insights: { title: string; description: string }[];
  recommendations: { title: string; action: string }[];
}

const modes: { id: Mode; label: string; icon: React.ElementType }[] = [
  { id: "suggestions", label: "Insights",  icon: Zap },
  { id: "planner",     label: "Planner",   icon: ClipboardList },
  { id: "summary",     label: "Summary",   icon: BarChart2 },
  { id: "team",        label: "Team",      icon: Users },
  { id: "chat",        label: "Chat",      icon: MessageSquare },
];

const healthConfig = {
  green: { dot: "bg-green-500", label: "Healthy",  badge: "bg-green-50 text-green-700 border-green-200" },
  amber: { dot: "bg-amber-500", label: "At Risk",  badge: "bg-amber-50 text-amber-700 border-amber-200" },
  red:   { dot: "bg-red-500",   label: "Critical", badge: "bg-red-50 text-red-700 border-red-200" },
};

const severityIcon = {
  low:    "text-gray-400",
  medium: "text-amber-600",
  high:   "text-red-600",
};

const verdictConfig: Record<SprintRecommendationVerdict, { badge: string; dot: string }> = {
  "fits-current":  { badge: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500" },
  "too-large":     { badge: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-500" },
  "wrong-sprint":  { badge: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  "overloaded":    { badge: "bg-red-50 text-red-700 border-red-200",        dot: "bg-red-500" },
  "backlog":       { badge: "bg-gray-100 text-gray-600 border-gray-200",    dot: "bg-gray-400" },
  "planned-sprint":{ badge: "bg-blue-50 text-blue-700 border-blue-200",     dot: "bg-blue-500" },
};

const priorityDot: Record<string, string> = {
  High:   "bg-red-500",
  Medium: "bg-amber-500",
  Low:    "bg-gray-400",
};

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

function SuggestionCard({
  suggestion,
  sprints,
  activeSprint,
  onAccept,
  onDismiss,
}: {
  suggestion: AITaskSuggestion;
  sprints: Sprint[];
  activeSprint: Sprint | null | undefined;
  onAccept: (sprintId: number | null) => void;
  onDismiss: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const rec  = suggestion.recommendation;
  const vc   = verdictConfig[rec.verdict] ?? verdictConfig.backlog;

  const suggestedSprint = rec.suggestedSprintId
    ? sprints.find((s) => s.id === rec.suggestedSprintId)
    : null;

  const canMoveToSuggested = !!suggestedSprint && suggestedSprint.id !== activeSprint?.id;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm dark:shadow-none overflow-hidden">
      {/* Recommendation badge strip */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium border-b ${vc.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${vc.dot}`} />
        {rec.label}
      </div>

      <div className="p-3 space-y-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 leading-tight flex-1">{suggestion.title}</p>
          <button onClick={onDismiss} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition flex-shrink-0 mt-0.5">
            <X size={11} />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[suggestion.priority] ?? "bg-gray-400"}`} />
          <span>{suggestion.priority}</span>
          <span className="text-gray-300 dark:text-gray-600">{'·'}</span>
          <span>{suggestion.storyPoints} SP</span>
        </div>

        {/* Description (expandable) */}
        <div>
          <p className={`text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
            {suggestion.description}
          </p>
          {suggestion.description.length > 120 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition mt-0.5"
            >
              {expanded ? <><ChevronUp size={9} /> Less</> : <><ChevronDown size={9} /> More</>}
            </button>
          )}
        </div>

        {/* AI reasoning */}
        {suggestion.reasoning && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 italic leading-relaxed border-l-2 border-gray-200 dark:border-gray-700 pl-2">
            {suggestion.reasoning}
          </p>
        )}

        {/* Sprint recommendation reasoning */}
        {rec.reasoning && (
          <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
            {rec.reasoning}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => onAccept(activeSprint?.id ?? null)}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg"
          >
            <CheckCircle2 size={10} />
            Accept
          </button>

          {canMoveToSuggested && (
            <button
              onClick={() => onAccept(rec.suggestedSprintId)}
              className="flex items-center gap-1 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700 hover:border-blue-300 transition text-blue-700 dark:text-blue-400 text-[10px] font-medium px-2.5 py-1.5 rounded-lg"
            >
              <ArrowRight size={10} />
              {rec.suggestedSprintName ?? suggestedSprint.shortName}
            </button>
          )}

          {!activeSprint && !canMoveToSuggested && (
            <button
              onClick={() => onAccept(null)}
              className="flex items-center gap-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition text-gray-600 dark:text-gray-400 text-[10px] font-medium px-2.5 py-1.5 rounded-lg"
            >
              + Backlog
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AIAssistantPanel({
  tasks, allTasks, sprints, suggestions, teamMembers,
  activeSprint, projectContext = "", onAssignToAI, onAcceptSuggestion,
}: AIAssistantPanelProps) {
  const [mode,             setMode]             = React.useState<Mode>("suggestions");
  const [messages,         setMessages]         = React.useState<ChatMessage[]>([]);
  const [input,            setInput]            = React.useState("");
  const [chatLoading,      setChatLoading]      = React.useState(false);
  const [sprintInsights,   setSprintInsights]   = React.useState<SprintInsight | null>(null);
  const [insightsLoading,  setInsightsLoading]  = React.useState(false);
  const [insightsFetched,  setInsightsFetched]  = React.useState(false);
  const [plannerPrompt,    setPlannerPrompt]    = React.useState("");
  const [plannerLoading,   setPlannerLoading]   = React.useState(false);
  const [plannerSuggestions, setPlannerSuggestions] = React.useState<AITaskSuggestion[]>([]);
  const [plannerError,     setPlannerError]     = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const done        = tasks.filter((t) => t.status === "Done").length;
  const inTesting   = tasks.filter((t) => t.status === "Testing").length;
  const inProgress  = tasks.filter((t) => t.status === "In Progress").length;
  const aiTasks     = tasks.filter((t) => t.assignee === "AI" || t.assignee === "NV").length;
  const firstUnassigned = tasks.find((t) => t.assignee === "AR" && t.status !== "Done");

  const bars = [
    { label: "Done",        value: done,       color: "bg-green-500" },
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
      if (!data.error) setSprintInsights(data);
    } catch { /* silent */ } finally {
      setInsightsLoading(false);
      setInsightsFetched(true);
    }
  }, [activeSprint, tasks, teamMembers, projectContext]);

  React.useEffect(() => {
    if (mode === "suggestions" && !insightsFetched && !insightsLoading) {
      fetchSprintInsights();
    }
  }, [mode, insightsFetched, insightsLoading, fetchSprintInsights]);

  const fetchPlannerSuggestions = async () => {
    setPlannerLoading(true);
    setPlannerError(null);
    try {
      const res = await fetch("/api/ai/suggest-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeSprint: activeSprint ?? null,
          sprints,
          tasks: allTasks,
          projectContext,
          userPrompt: plannerPrompt.trim(),
        }),
      });
      const data = await res.json();
      if (data.error) { setPlannerError(data.error); return; }
      setPlannerSuggestions(data.suggestions ?? []);
    } catch {
      setPlannerError("Failed to reach AI. Check your API key.");
    } finally {
      setPlannerLoading(false);
    }
  };

  const dismissSuggestion = (id: string) => {
    setPlannerSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

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
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col h-full shadow-sm dark:shadow-none">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center flex-shrink-0">
          <Bot size={13} className="text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h3>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">Atlas{' · '}Nova</p>
        </div>
        {health ? (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-1 flex-shrink-0 ${health.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
            {health.label}
          </span>
        ) : (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-200 dark:border-blue-800 flex-shrink-0 font-medium">Live</span>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-0.5 p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition ${
              mode === id
                ? "bg-white dark:bg-gray-800 text-blue-600 shadow-sm border border-gray-200 dark:border-gray-700"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60"
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
            {sprintInsights && (
              <div className={`rounded-xl p-3 mb-3 border text-[11px] leading-relaxed font-medium ${health!.badge}`}>
                {sprintInsights.summary}
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                {sprintInsights ? "AI sprint analysis:" : insightsLoading ? "Analyzing sprint..." : "Sprint signals:"}
              </p>
              <button
                onClick={fetchSprintInsights}
                disabled={insightsLoading}
                className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition flex items-center gap-1 disabled:opacity-40"
              >
                <RefreshCw size={9} className={insightsLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
            {insightsLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={18} className="animate-spin text-blue-600" />
              </div>
            )}
            {(sprintInsights?.bottlenecks?.length ?? 0) > 0 && (
              <div className="space-y-1.5 mb-2">
                {sprintInsights!.bottlenecks.map((b, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex items-start gap-2 shadow-sm dark:shadow-none">
                    <AlertTriangle size={11} className={`mt-0.5 flex-shrink-0 ${severityIcon[b.severity]}`} />
                    <div>
                      <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 mb-0.5">{b.title}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(sprintInsights?.insights ?? suggestions).map((s, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm dark:shadow-none">
                <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 mb-1">{s.title}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{s.description}</p>
              </div>
            ))}
            {firstUnassigned && (
              <button
                onClick={() => onAssignToAI(firstUnassigned.id)}
                className="w-full mt-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 hover:border-blue-300 transition px-3 py-2.5 rounded-xl text-[11px] font-medium text-blue-700 dark:text-blue-400 flex items-center justify-center gap-2"
              >
                <Bot size={11} />
                Assign {firstUnassigned.id} to Atlas
              </button>
            )}
          </div>
        )}

        {/* ── Planner ── */}
        {mode === "planner" && (
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={11} className="text-blue-600 dark:text-blue-400" />
                <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">Sprint Planner</p>
              </div>
              <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed">
                Atlas analyzes your sprint and suggests tasks with placement recommendations.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                value={plannerPrompt}
                onChange={(e) => setPlannerPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") fetchPlannerSuggestions(); }}
                placeholder="Focus area (optional)..."
                disabled={plannerLoading}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-2 text-[11px] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 shadow-sm dark:shadow-none"
              />
              <button
                onClick={fetchPlannerSuggestions}
                disabled={plannerLoading}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition text-white text-[10px] font-medium px-3 py-2 rounded-lg flex-shrink-0"
              >
                {plannerLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {plannerLoading ? "Thinking..." : "Suggest"}
              </button>
            </div>

            {plannerError && (
              <p className="text-[11px] text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {plannerError}
              </p>
            )}

            {plannerSuggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{plannerSuggestions.length} suggestion{plannerSuggestions.length !== 1 ? "s" : ""} from Atlas:</p>
                  <button
                    onClick={() => setPlannerSuggestions([])}
                    className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                  >
                    Clear all
                  </button>
                </div>
                {plannerSuggestions.map((s) => (
                  <SuggestionCard
                    key={s.id}
                    suggestion={s}
                    sprints={sprints}
                    activeSprint={activeSprint}
                    onAccept={(sprintId) => {
                      onAcceptSuggestion(s, sprintId);
                      dismissSuggestion(s.id);
                    }}
                    onDismiss={() => dismissSuggestion(s.id)}
                  />
                ))}
              </div>
            )}

            {plannerSuggestions.length === 0 && !plannerLoading && !plannerError && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                <ClipboardList size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-[11px]">Click Suggest to get AI task recommendations</p>
              </div>
            )}
          </div>
        )}

        {/* ── Summary ── */}
        {mode === "summary" && (
          <div className="space-y-3">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">Sprint pulse:</p>
            <div className="space-y-3">
              {bars.map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                    <span>{label}</span>
                    <span>{value}/{tasks.length}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: tasks.length > 0 ? `${(value / tasks.length) * 100}%` : "0%" }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-1">
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {sprintInsights?.summary ?? "Run AI analysis in Insights tab to get a smart sprint summary."}
              </p>
            </div>
            {sprintInsights?.recommendations?.map((r, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm dark:shadow-none">
                <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mb-0.5">{r.title}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{r.action}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Team ── */}
        {mode === "team" && (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">Active team members:</p>
            {teamMembers.map((member) => {
              const mt   = tasks.filter((t) => t.assignee === member.id);
              const done = mt.filter((t) => t.status === "Done").length;
              return (
                <div key={member.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-full ${member.color} flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white`}>
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200">{member.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{member.isAI && <span className="text-blue-500">AI{' · '}</span>}{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                    <span>{mt.length} tasks assigned</span>
                    {done > 0 && <><span>{'·'}</span><span className="text-green-600 dark:text-green-400">{done} done</span></>}
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
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center py-6">Ask anything about the current sprint.</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 self-end max-w-[85%] ml-auto"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 self-start max-w-[95%] shadow-sm dark:shadow-none"
              }`}>
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 self-start shadow-sm dark:shadow-none">
                <span className="text-[11px] text-gray-400 dark:text-gray-500 animate-pulse">Thinking...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Chat input */}
      {mode === "chat" && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the sprint..."
            disabled={chatLoading}
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-[11px] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 shadow-sm dark:shadow-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || chatLoading}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
          >
            <Send size={12} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
