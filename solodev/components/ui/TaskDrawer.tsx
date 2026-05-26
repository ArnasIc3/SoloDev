"use client";

import * as React from "react";
import {
  X, ChevronRight, Bot, Loader2, CheckSquare, ListChecks,
  AlertTriangle, Zap, Play, Users, Trash2,
} from "lucide-react";
import type { Task, TaskStatus, TaskPriority, Sprint, TeamMember } from "@/types";
import { priorityStyles, assigneeColors, columnDotColor, inputClass } from "@/lib/styles";

const WORKFLOW: TaskStatus[] = ["To Do", "In Progress", "Review", "Testing", "Done"];

const AI_AGENTS: Record<string, { name: string; color: string; avatarBg: string }> = {
  AI: { name: "Atlas AI", color: "text-blue-600",   avatarBg: "bg-blue-600" },
  NV: { name: "Nova AI",  color: "text-indigo-600", avatarBg: "bg-indigo-600" },
};

interface AIAnalysis {
  subtasks: string[];
  acceptanceCriteria: string[];
  testingChecklist: string[];
  complexity: "Low" | "Medium" | "High";
  implementationPlan: string;
  riskNotes: string[];
  suggestedSP: number;
}

interface AtlasPlan {
  type: "atlas";
  summary: string;
  implementationSteps: string[];
  technicalApproach: string;
  potentialChallenges: string[];
  estimatedComplexity: "Low" | "Medium" | "High";
  nextStatus: string;
  reassignTo: string;
  agent: { name: string };
}

interface NovaQAReview {
  type: "nova";
  summary: string;
  qaChecklist: { item: string; risk: "low" | "medium" | "high"; note?: string }[];
  testingFocus: string;
  risksIdentified: string[];
  verdict: "ready_for_implementation" | "needs_clarification";
  nextStatus: string;
  reassignTo: string;
  agent: { name: string };
}

type AgentOutput = AtlasPlan | NovaQAReview;

const complexityColor: Record<string, string> = {
  Low:    "text-green-700 bg-green-50 border-green-200",
  Medium: "text-amber-700 bg-amber-50 border-amber-200",
  High:   "text-red-700 bg-red-50 border-red-200",
};

const riskColor: Record<string, string> = {
  low:    "text-gray-500 bg-gray-100 border-gray-200",
  medium: "text-amber-700 bg-amber-50 border-amber-200",
  high:   "text-red-700 bg-red-50 border-red-200",
};

const verdictConfig = {
  ready_for_implementation: { label: "Ready for implementation", cls: "text-green-700 bg-green-50 border-green-200" },
  needs_clarification:      { label: "Needs clarification",      cls: "text-amber-700 bg-amber-50 border-amber-200" },
};

interface TaskDrawerProps {
  task: Task | null;
  sprints: Sprint[];
  teamMembers: TeamMember[];
  allTasks?: Task[];
  activeSprint?: Sprint | null;
  projectContext?: string;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  onMeetingOpen?: (task: Task) => void;
}

export function TaskDrawer({ task, sprints, teamMembers, allTasks = [], activeSprint, projectContext = "", onClose, onUpdate, onDelete, onMeetingOpen }: TaskDrawerProps) {
  const [title,       setTitle]       = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority,    setPriority]    = React.useState<TaskPriority>("Medium");
  const [assignee,    setAssignee]    = React.useState("AR");
  const [sprintId,    setSprintId]    = React.useState<number | null>(null);
  const [storyPoints, setStoryPoints] = React.useState(2);
  const [saving,         setSaving]         = React.useState(false);
  const [dirty,          setDirty]          = React.useState(false);
  const [activeTab,      setActiveTab]      = React.useState<"details" | "ai" | "work">("details");
  const [confirmDelete,  setConfirmDelete]  = React.useState(false);
  const [deleting,       setDeleting]       = React.useState(false);

  const [aiAnalysis,  setAiAnalysis]  = React.useState<AIAnalysis | null>(null);
  const [aiLoading,   setAiLoading]   = React.useState(false);
  const [aiError,     setAiError]     = React.useState<string | null>(null);

  const [agentOutput, setAgentOutput] = React.useState<AgentOutput | null>(null);
  const [execLoading, setExecLoading] = React.useState(false);
  const [execError,   setExecError]   = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setAssignee(task.assignee);
    setSprintId(task.sprintId);
    setStoryPoints(task.storyPoints);
    setDirty(false);
    setConfirmDelete(false);
    setAiAnalysis(null);
    setAiError(null);
    setExecError(null);

    if (task.aiOutput) {
      try {
        const parsed = JSON.parse(task.aiOutput);
        const isOldFormat = "workLog" in parsed || "checklist" in parsed;
        if (isOldFormat) {
          setAgentOutput(null);
          setActiveTab("details");
        } else {
          setAgentOutput(parsed as AgentOutput);
          setActiveTab("work");
        }
      } catch {
        setAgentOutput(null);
        setActiveTab("details");
      }
    } else {
      setAgentOutput(null);
      setActiveTab("details");
    }
  }, [task?.id]);

  if (!task) return null;

  const currentIdx      = WORKFLOW.indexOf(task.status);
  const avatarColor     = assigneeColors[task.assignee] ?? "bg-gray-400";
  const assigneeMember  = teamMembers.find((m) => m.id === task.assignee);
  const displayInitials = assigneeMember?.initials ?? task.assignee.slice(0, 2);
  const agentInfo       = AI_AGENTS[task.assignee];
  const outputAgentInfo = agentOutput
    ? agentOutput.type === "atlas" ? AI_AGENTS.AI : AI_AGENTS.NV
    : null;
  const activeAgentInfo = agentInfo ?? outputAgentInfo;
  const isAITask        = (!!agentInfo || !!agentOutput) && task.status !== "Done";

  const buildSprintContext = () => {
    const sprint = sprints.find((s) => s.id === task.sprintId);
    const nearby = allTasks.filter((t) => t.sprintId === task.sprintId && t.id !== task.id).slice(0, 6);
    return [
      projectContext ? `PROJECT CONTEXT:\n${projectContext}\n` : "",
      sprint ? `Sprint: ${sprint.name} (${sprint.status})` : "No sprint",
      sprint?.goal ? `Goal: ${sprint.goal}` : "",
      `Other sprint tasks: ${nearby.map((t) => `[${t.id}] "${t.title}" — ${t.status} (${t.assignee})`).join(", ")}`,
      `Team: ${teamMembers.map((m) => `${m.name} (${m.id})`).join(", ")}`,
    ].filter(Boolean).join("\n");
  };

  const handleExecuteAgent = async () => {
    setExecLoading(true);
    setExecError(null);
    setActiveTab("work");
    try {
      const res = await fetch("/api/ai/execute-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, sprintContext: buildSprintContext() }),
      });
      const data = await res.json();
      if (data.error) { setExecError(data.error); return; }
      const output: AgentOutput = { ...data, type: task.assignee === "AI" ? "atlas" : "nova" };
      setAgentOutput(output);
      await onUpdate(task.id, { aiOutput: JSON.stringify(output), status: data.nextStatus as TaskStatus, assignee: data.reassignTo ?? "AR" });
    } catch {
      setExecError("Failed to reach AI agent. Check your API key.");
    } finally {
      setExecLoading(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    setActiveTab("ai");
    try {
      const res = await fetch("/api/ai/task-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, sprintContext: buildSprintContext() }),
      });
      const data = await res.json();
      if (data.error) { setAiError(data.error); return; }
      setAiAnalysis(data);
    } catch {
      setAiError("Failed to reach AI. Check your API key.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleStatusClick = async (status: TaskStatus) => onUpdate(task.id, { status });

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(task.id, { title, description: description || undefined, priority, assignee, sprintId, storyPoints });
    setSaving(false);
    setDirty(false);
  };

  const mark = () => setDirty(true);

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(task.id);
    setDeleting(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40" onClick={onClose} />

      <aside className="fixed right-0 top-0 h-full w-[460px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 block mb-0.5">{task.id}</span>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">{task.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition mt-0.5 flex-shrink-0">
            <X size={15} />
          </button>
        </div>

        {/* Status workflow */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-1 flex-wrap">
            {WORKFLOW.map((s, i) => {
              const isCurrent = s === task.status;
              const isPast    = i < currentIdx;
              return (
                <React.Fragment key={s}>
                  <button
                    onClick={() => handleStatusClick(s)}
                    className={`text-[10px] px-2 py-1 rounded-lg font-medium transition border ${
                      isCurrent ? "bg-blue-600 border-blue-600 text-white"
                      : isPast   ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                      :            "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${columnDotColor[s]}`} />
                    {s}
                  </button>
                  {i < WORKFLOW.length - 1 && <ChevronRight size={10} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 py-2.5 text-[11px] font-medium transition ${activeTab === "details" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
          >
            Details
          </button>
          {isAITask && (
            <button
              onClick={() => setActiveTab("work")}
              className={`flex-1 py-2.5 text-[11px] font-medium transition flex items-center justify-center gap-1.5 ${activeTab === "work" ? `${activeAgentInfo?.color ?? "text-blue-600"} border-b-2 border-current` : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              <Bot size={11} />
              {task.assignee === "AI" ? "AI Plan" : "QA Review"}
              {agentOutput && <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />}
            </button>
          )}
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex-1 py-2.5 text-[11px] font-medium transition flex items-center justify-center gap-1.5 ${activeTab === "ai" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
          >
            Analysis
            {aiAnalysis && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* ── Details tab ── */}
          {activeTab === "details" && (
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1.5">Title</label>
                <input value={title} onChange={(e) => { setTitle(e.target.value); mark(); }} className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => { setDescription(e.target.value); mark(); }} rows={4} placeholder="No description..." className={`${inputClass} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1.5">Priority</label>
                  <select value={priority} onChange={(e) => { setPriority(e.target.value as TaskPriority); mark(); }} className={inputClass}>
                    <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1.5">Story Points</label>
                  <select value={storyPoints} onChange={(e) => { setStoryPoints(Number(e.target.value)); mark(); }} className={inputClass}>
                    {[1,2,3,5,8,13].map((v) => <option key={v} value={v}>{v} SP</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1.5">Assignee</label>
                  <select value={assignee} onChange={(e) => { setAssignee(e.target.value); mark(); }} className={inputClass}>
                    {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}{m.isAI ? " (AI)" : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1.5">Sprint</label>
                  <select value={sprintId ?? ""} onChange={(e) => { setSprintId(e.target.value ? Number(e.target.value) : null); mark(); }} className={inputClass}>
                    <option value="">Unassigned</option>
                    {sprints.map((s) => <option key={s.id} value={s.id}>{s.shortName}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-[10px] font-bold text-white`}>
                  {displayInitials}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${priorityStyles[task.priority]}`}>{task.priority}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{task.storyPoints} SP</span>
              </div>

              {isAITask && (
                <button
                  onClick={handleExecuteAgent}
                  disabled={execLoading}
                  className={`w-full flex items-center justify-center gap-2 border disabled:opacity-50 transition px-3 py-2.5 rounded-xl text-[11px] font-medium ${
                    task.assignee === "AI"
                      ? "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:border-blue-300 text-blue-700 dark:text-blue-400"
                      : "bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 text-indigo-700 dark:text-indigo-400"
                  }`}
                >
                  {execLoading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                  {execLoading
                    ? `${activeAgentInfo?.name ?? "AI"} is planning...`
                    : agentOutput
                    ? `Re-run ${activeAgentInfo?.name ?? "AI"}`
                    : task.assignee === "AI"
                    ? `▶ Atlas — Plan implementation`
                    : `▶ Nova — QA review plan`}
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleGenerateAnalysis}
                  disabled={aiLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 disabled:opacity-50 transition px-3 py-2 rounded-xl text-[11px] font-medium text-gray-600 dark:text-gray-400"
                >
                  {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                  {aiLoading ? "Analyzing..." : aiAnalysis ? "Regenerate" : "AI Analysis"}
                </button>
                {onMeetingOpen && (
                  <button
                    onClick={() => { onClose(); onMeetingOpen(task); }}
                    className="flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:border-blue-300 transition px-3 py-2 rounded-xl text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 flex-shrink-0"
                  >
                    <Users size={12} />
                    Meet
                  </button>
                )}
              </div>

              {onDelete && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 hover:text-red-600 transition"
                    >
                      <Trash2 size={11} />
                      Delete task
                    </button>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 space-y-2">
                      <p className="text-[11px] font-medium text-red-700 dark:text-red-400">Delete <span className="font-mono">{task.id}</span>? This cannot be undone.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-600 dark:text-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 transition px-3 py-1.5 rounded-lg text-[11px] font-medium text-white"
                        >
                          {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                          {deleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Agent Work tab ── */}
          {activeTab === "work" && (
            <div className="p-5 space-y-4">
              {execLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className={`w-10 h-10 rounded-full ${activeAgentInfo?.avatarBg ?? "bg-blue-600"} flex items-center justify-center`}>
                    <Loader2 size={18} className="animate-spin text-white" />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{activeAgentInfo?.name} is working on this task...</p>
                </div>
              )}

              {execError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-[11px] text-red-700 dark:text-red-400">{execError}</div>
              )}

              {!execLoading && !agentOutput && !execError && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Bot size={22} className={activeAgentInfo?.color ?? "text-blue-600"} />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-48">
                    Click {'"'}▶ Run {activeAgentInfo?.name}{'"'} in Details to execute this agent on the task.
                  </p>
                </div>
              )}

              {agentOutput && !execLoading && (
                <>
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                    agentOutput.type === "atlas" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                  }`}>
                    <div className={`w-8 h-8 rounded-full ${agentOutput.type === "atlas" ? "bg-blue-600" : "bg-indigo-600"} flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white`}>
                      {agentOutput.type === "atlas" ? "AI" : "NV"}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-semibold ${agentOutput.type === "atlas" ? "text-blue-700 dark:text-blue-400" : "text-indigo-700 dark:text-indigo-400"}`}>
                        {agentOutput.agent.name}{' · '}{agentOutput.type === "atlas" ? "Implementation Plan" : "QA Review"} Ready
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {'->'} <span className="text-gray-700 dark:text-gray-300">{agentOutput.nextStatus}</span>
                        {' · '}Reassigned to <span className="text-blue-600 dark:text-blue-400">{teamMembers.find((m) => m.id === "AR")?.name ?? "Developer"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                    <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">{agentOutput.summary}</p>
                  </div>

                  {agentOutput.type === "atlas" && (() => {
                    const a = agentOutput as AtlasPlan;
                    return (
                      <>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium ${complexityColor[a.estimatedComplexity]}`}>
                            {a.estimatedComplexity} complexity
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
                            <ListChecks size={10} /> Implementation Steps
                          </p>
                          <div className="space-y-2">
                            {(a.implementationSteps ?? []).map((step, i) => (
                              <div key={i} className="flex items-start gap-2.5 text-[11px] text-gray-700 dark:text-gray-300">
                                <span className="text-blue-600 dark:text-blue-400 font-mono font-bold mt-0.5 flex-shrink-0 w-4">{i + 1}.</span>
                                <span className="leading-relaxed">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mb-1">Technical approach</p>
                          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{a.technicalApproach}</p>
                        </div>
                        {(a.potentialChallenges?.length ?? 0) > 0 && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mb-2 flex items-center gap-1.5">
                              <AlertTriangle size={10} /> Watch out for
                            </p>
                            {(a.potentialChallenges ?? []).map((c, i) => (
                              <p key={i} className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{c}</p>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {agentOutput.type === "nova" && (() => {
                    const n = agentOutput as NovaQAReview;
                    const vc = verdictConfig[n.verdict] ?? verdictConfig.ready_for_implementation;
                    return (
                      <>
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium ${vc.cls}`}>
                          {vc.label}
                        </span>
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
                            <CheckSquare size={10} /> QA Checklist
                          </p>
                          <div className="space-y-2">
                            {(n.qaChecklist ?? []).map((item, i) => (
                              <div key={i} className="flex items-start gap-2 text-[11px]">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 mt-0.5 ${riskColor[item.risk]}`}>
                                  {item.risk}
                                </span>
                                <div>
                                  <span className="text-gray-700 dark:text-gray-300">{item.item}</span>
                                  {item.note && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{item.note}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mb-1">Testing focus</p>
                          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{n.testingFocus}</p>
                        </div>
                        {(n.risksIdentified?.length ?? 0) > 0 && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mb-2 flex items-center gap-1.5">
                              <AlertTriangle size={10} /> Risks identified
                            </p>
                            {(n.risksIdentified ?? []).map((r, i) => (
                              <p key={i} className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{r}</p>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* ── AI Analysis tab ── */}
          {activeTab === "ai" && (
            <div className="p-5 space-y-4">
              {aiLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Analyzing task...</p>
                </div>
              )}
              {aiError && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-[11px] text-red-700 dark:text-red-400">{aiError}</div>}
              {!aiLoading && !aiAnalysis && !aiError && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Zap size={28} className="text-gray-300 dark:text-gray-600" />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-48">Click {'"'}AI Analysis{'"'} in Details to get subtasks, acceptance criteria, and testing checklist.</p>
                </div>
              )}
              {aiAnalysis && !aiLoading && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium ${complexityColor[aiAnalysis.complexity]}`}>
                      {aiAnalysis.complexity} complexity
                    </span>
                    {aiAnalysis.suggestedSP !== task.storyPoints && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Zap size={10} className="text-amber-500" />
                        Atlas suggests {aiAnalysis.suggestedSP} SP
                      </span>
                    )}
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mb-1.5 flex items-center gap-1.5"><Bot size={10} /> Implementation Plan</p>
                    <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">{aiAnalysis.implementationPlan}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5"><ListChecks size={10} /> Suggested Subtasks</p>
                    {aiAnalysis.subtasks.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-gray-700 dark:text-gray-300 mb-1.5">
                        <span className="text-gray-300 dark:text-gray-600 font-mono mt-0.5 flex-shrink-0">{i + 1}.</span><span>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5"><CheckSquare size={10} /> Acceptance Criteria</p>
                    {aiAnalysis.acceptanceCriteria.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-gray-700 dark:text-gray-300 mb-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0">✓</span><span>{c}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5"><CheckSquare size={10} /> Testing Checklist</p>
                    {aiAnalysis.testingChecklist.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-gray-700 dark:text-gray-300 mb-1.5">
                        <span className="text-orange-500 mt-0.5 flex-shrink-0">{'□'}</span><span>{c}</span>
                      </div>
                    ))}
                  </div>
                  {aiAnalysis.riskNotes?.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mb-2 flex items-center gap-1.5"><AlertTriangle size={10} /> Risk Notes</p>
                      {aiAnalysis.riskNotes.map((r, i) => <p key={i} className="text-[11px] text-gray-600 dark:text-gray-400">{r}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save footer */}
        {dirty && activeTab === "details" && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-2 flex-shrink-0">
            <button
              onClick={() => {
                if (task) { setTitle(task.title); setDescription(task.description ?? ""); setPriority(task.priority); setAssignee(task.assignee); setSprintId(task.sprintId); setStoryPoints(task.storyPoints); setDirty(false); }
              }}
              className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
            >Revert</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition px-4 py-2 rounded-lg text-sm font-medium text-white">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
