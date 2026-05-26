"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Send, Loader2, Users, BookmarkPlus, Check, PlusCircle } from "lucide-react";
import type { Task, Sprint, TeamMember } from "@/types";
import { inputClass } from "@/lib/styles";

export interface MeetingMessage {
  speaker: "AR" | "AI" | "NV" | "SYSTEM";
  text: string;
  taskCreated?: { id: string; title: string };
}

export interface SavedMeeting {
  id: number;
  name: string;
  description?: string;
  taskId?: string;
  taskTitle?: string;
  sprintName?: string;
  messages: MeetingMessage[];
  createdAt: string;
}

const SPEAKERS = {
  AR: { initials: "AR", bg: "bg-blue-600",   text: "text-blue-600",   align: "items-end"   },
  AI: { initials: "AI", bg: "bg-blue-600",   text: "text-blue-600",   align: "items-start" },
  NV: { initials: "NV", bg: "bg-indigo-600", text: "text-indigo-600", align: "items-start" },
};

interface TeamMeetingModalProps {
  open: boolean;
  task: Task | null;
  sprint: Sprint | null;
  teamMembers: TeamMember[];
  projectContext: string;
  activeSprint?: Sprint | null;
  recentMeetings?: SavedMeeting[];
  user?: { name: string; email: string };
  onClose: () => void;
  onMeetingSaved?: (meeting: SavedMeeting) => void;
  onTaskCreated?: (task: Task) => void;
}

function buildPreviousMeetingsContext(meetings: SavedMeeting[], userName: string): string {
  if (!meetings.length) return "";
  const lines: string[] = ["PREVIOUS MEETINGS (reference for context):"];
  meetings.slice(0, 4).forEach((m) => {
    const date = new Date(m.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    lines.push(`\n[${date}] "${m.name}"${m.taskId ? ` (about task ${m.taskId}: ${m.taskTitle ?? ""})` : ""}${m.description ? ` — ${m.description}` : ""}`);
    const relevant = m.messages.filter((msg) => msg.speaker !== "SYSTEM").slice(0, 8);
    relevant.forEach((msg) => {
      const name = msg.speaker === "AR" ? userName : msg.speaker === "AI" ? "Atlas AI" : "Nova AI";
      const truncated = msg.text.length > 180 ? msg.text.slice(0, 177) + "..." : msg.text;
      lines.push(`  ${name}: ${truncated}`);
    });
    const tasks = m.messages.filter((msg) => msg.taskCreated);
    if (tasks.length) {
      lines.push(`  → Tasks created: ${tasks.map((t) => `${t.taskCreated!.id} "${t.taskCreated!.title}"`).join(", ")}`);
    }
  });
  return lines.join("\n");
}

function buildMeetingContext(task: Task | null, sprint: Sprint | null): string {
  const lines: string[] = [];
  if (task) {
    lines.push(`Task: [${task.id}] "${task.title}"`);
    if (task.description) lines.push(`Description: ${task.description}`);
    lines.push(`Status: ${task.status} | Priority: ${task.priority} | ${task.storyPoints} SP`);
  }
  if (sprint) {
    lines.push(`Sprint: ${sprint.name} (${sprint.status})`);
    if (sprint.goal) lines.push(`Sprint goal: ${sprint.goal}`);
  }
  return lines.join("\n");
}

export function TeamMeetingModal({ open, task, sprint, teamMembers, projectContext, activeSprint, recentMeetings = [], user, onClose, onMeetingSaved, onTaskCreated }: TeamMeetingModalProps) {
  const userName = user?.name ?? teamMembers.find((m) => m.id === "AR")?.name ?? "Developer";
  const userInitials = userName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "ME";
  const [history,      setHistory]      = React.useState<MeetingMessage[]>([]);
  const [input,        setInput]        = React.useState("");
  const [loading,      setLoading]      = React.useState(false);
  const [error,        setError]        = React.useState<string | null>(null);
  const [showSaveForm,     setShowSaveForm]     = React.useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);
  const [saveName,         setSaveName]         = React.useState("");
  const [saveDesc,         setSaveDesc]         = React.useState("");
  const [saving,           setSaving]           = React.useState(false);
  const [saved,            setSaved]            = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputRef  = React.useRef<HTMLInputElement>(null);

  const meetingContext = buildMeetingContext(task, sprint);

  const defaultName = task
    ? `Meeting: ${task.id} — ${task.title}`
    : sprint
    ? `Sprint Meeting — ${sprint.shortName}`
    : "Team Meeting";

  React.useEffect(() => {
    if (open) {
      setHistory([]);
      setInput("");
      setError(null);
      setShowSaveForm(false);
      setShowCloseConfirm(false);
      setSaveName(defaultName);
      setSaveDesc("");
      setSaved(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: MeetingMessage = { speaker: "AR", text };
    setHistory((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const previousMeetingsContext = buildPreviousMeetingsContext(recentMeetings, userName);
      const res = await fetch("/api/ai/meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: [...history, userMsg], meetingContext, projectContext, previousMeetingsContext, userName }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }

      const newMessages: MeetingMessage[] = [
        { speaker: "AI", text: data.atlasReply },
        { speaker: "NV", text: data.novaReply },
      ];

      const atlasClaimedCreation = /creat\w*\s+(?:a\s+|the\s+)?task/i.test(data.atlasReply ?? "");
      const taskActuallyCreating = !!data.createTask;
      if (atlasClaimedCreation && !taskActuallyCreating) {
        newMessages.push({ speaker: "SYSTEM", text: "Atlas mentioned creating a task but didn't include one. Try: \"Atlas, create a task: [task name]\"" });
      }

      if (data.createTask) {
        const ct = data.createTask as { title: string; description?: string; summary?: string; priority?: string; storyPoints?: number };
        const fullDescription = [ct.description, ct.summary ? `\n**Done when:** ${ct.summary}` : ""].filter(Boolean).join("");
        try {
          const taskRes = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: ct.title, description: fullDescription || undefined, priority: ct.priority ?? "Medium", storyPoints: ct.storyPoints ?? 3, assignee: "AR", sprintId: activeSprint?.id ?? null }),
          });
          const taskData = await taskRes.json();
          if (taskData.task) {
            onTaskCreated?.(taskData.task);
            newMessages.push({ speaker: "SYSTEM", text: `Task ${taskData.task.id} created: "${ct.title}"`, taskCreated: { id: taskData.task.id, title: ct.title } });
          }
        } catch {
          newMessages.push({ speaker: "SYSTEM", text: "Failed to create task — try again." });
        }
      }

      setHistory((prev) => [...prev, ...newMessages]);
    } catch {
      setError("Failed to reach AI. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveName.trim(), description: saveDesc.trim() || undefined, taskId: task?.id, taskTitle: task?.title, sprintName: sprint?.name, messages: history }),
      });
      const data = await res.json();
      if (data.meeting) { setSaved(true); setShowSaveForm(false); onMeetingSaved?.(data.meeting); }
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const handleCloseRequest = () => {
    if (history.length > 0 && !saved) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const title    = task ? `${task.id} — ${task.title}` : "Team Meeting";
  const subtitle = task ? `${task.status} · ${task.priority}` : sprint ? sprint.shortName : "General discussion";

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && handleCloseRequest()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-2xl w-full max-w-xl h-[620px] flex flex-col shadow-xl overflow-hidden">

          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
            <div className="min-w-0 flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <Users size={13} className="text-blue-600 flex-shrink-0" />
                <span className="text-[11px] text-blue-600 font-medium">Team Meeting</span>
              </div>
              <Dialog.Title className="text-sm font-semibold text-gray-900 truncate">{title}</Dialog.Title>
              <Dialog.Description className="text-[11px] text-gray-500 mt-0.5">{subtitle}</Dialog.Description>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              {history.length > 0 && !saved && (
                <button
                  onClick={() => { setSaveName(defaultName); setShowSaveForm((s) => !s); }}
                  className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-blue-600 transition bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 px-2.5 py-1.5 rounded-lg"
                >
                  <BookmarkPlus size={12} />
                  Save
                </button>
              )}
              {saved && (
                <span className="flex items-center gap-1 text-[11px] text-green-600">
                  <Check size={12} /> Saved
                </span>
              )}
              <button onClick={handleCloseRequest} className="text-gray-400 hover:text-gray-600 transition">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Close confirmation */}
          {showCloseConfirm && (
            <div className="px-5 py-3 border-b border-gray-100 bg-amber-50 flex-shrink-0 space-y-2">
              <p className="text-[12px] font-medium text-amber-800">Close and discard this conversation?</p>
              <div className="flex gap-2">
                <button onClick={() => setShowCloseConfirm(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 transition px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-700">
                  Keep meeting
                </button>
                <button onClick={onClose} className="flex-1 bg-red-500 hover:bg-red-600 transition px-3 py-1.5 rounded-lg text-[11px] font-medium text-white">
                  Close anyway
                </button>
              </div>
            </div>
          )}

          {/* Save form */}
          {showSaveForm && (
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0 space-y-2">
              <p className="text-[11px] text-gray-600 font-medium">Save this meeting</p>
              <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Meeting name..." className={inputClass} autoFocus />
              <input value={saveDesc} onChange={(e) => setSaveDesc(e.target.value)} placeholder="Short description (optional)..." className={inputClass} />
              <div className="flex gap-2">
                <button onClick={() => setShowSaveForm(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 transition px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-700">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !saveName.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition px-3 py-1.5 rounded-lg text-[11px] font-medium text-white">
                  {saving ? "Saving..." : "Save Meeting"}
                </button>
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-100 bg-gray-50 flex-shrink-0 flex-wrap">
            {(["AR", "AI", "NV"] as const).map((id, i) => {
              const s      = SPEAKERS[id];
              const member = teamMembers.find((m) => m.id === id);
              return (
                <div key={id} className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full ${s.bg} flex items-center justify-center text-[8px] font-bold flex-shrink-0 text-white`}>
                    {id === "AR" ? userInitials : s.initials}
                  </div>
                  <span className={`text-[10px] font-medium ${s.text}`}>{member?.name ?? id}</span>
                  {i < 2 && <span className="text-gray-300 text-[10px] ml-1">·</span>}
                </div>
              );
            })}
            {recentMeetings.length > 0 && (
              <span className="ml-auto text-[10px] text-gray-400 flex items-center gap-1 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                {recentMeetings.length} previous meeting{recentMeetings.length !== 1 ? "s" : ""} in context
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-[#F5F7FB]">
            {history.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="flex -space-x-2">
                  {(["AR", "AI", "NV"] as const).map((id) => (
                    <div key={id} className={`w-8 h-8 rounded-full ${SPEAKERS[id].bg} flex items-center justify-center text-[10px] font-bold border-2 border-white text-white`}>
                      {id === "AR" ? userInitials : id}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 max-w-56">
                  {task
                    ? `Start the meeting about ${task.id}. Ask anything — Atlas and Nova will both respond.`
                    : "Start the team meeting. Ask about the sprint, blockers, or any topic."}
                </p>
              </div>
            )}

            {history.map((msg, i) => {
              if (msg.speaker === "SYSTEM") {
                const isSuccess = !!msg.taskCreated;
                return (
                  <div key={i} className="flex items-center justify-center">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium border ${
                      isSuccess ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                    }`}>
                      {isSuccess ? <><PlusCircle size={12} /> {msg.text}</> : msg.text}
                    </div>
                  </div>
                );
              }

              const s      = SPEAKERS[msg.speaker as "AR" | "AI" | "NV"];
              const isUser = msg.speaker === "AR";
              const label  = isUser ? userName : (teamMembers.find((m) => m.id === msg.speaker)?.name ?? (msg.speaker === "AI" ? "Atlas AI" : "Nova AI"));
              return (
                <div key={i} className={`flex flex-col gap-1 ${s.align}`}>
                  <span className={`text-[10px] font-medium ${s.text} ${isUser ? "text-right" : ""}`}>{label}</span>
                  <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-6 h-6 rounded-full ${s.bg} flex items-center justify-center text-[9px] font-bold flex-shrink-0 text-white`}>
                      {msg.speaker === "AR" ? userInitials : s.initials}
                    </div>
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
                      isUser             ? "bg-blue-50 border border-blue-200 text-blue-900 rounded-tr-sm"
                      : msg.speaker === "AI" ? "bg-white border border-blue-100 text-gray-700 rounded-tl-sm shadow-sm"
                      :                    "bg-white border border-indigo-100 text-gray-700 rounded-tl-sm shadow-sm"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="space-y-3">
                {(["AI", "NV"] as const).map((id) => (
                  <div key={id} className={`flex flex-col gap-1 ${SPEAKERS[id].align}`}>
                    <span className={`text-[10px] font-medium ${SPEAKERS[id].text}`}>{id === "AI" ? "Atlas AI" : "Nova AI"}</span>
                    <div className="flex items-start gap-2">
                      <div className={`w-6 h-6 rounded-full ${SPEAKERS[id].bg} flex items-center justify-center text-[9px] font-bold flex-shrink-0 text-white`}>{id}</div>
                      <div className={`rounded-2xl rounded-tl-sm px-3 py-2 border bg-white shadow-sm ${id === "AI" ? "border-blue-100" : "border-indigo-100"}`}>
                        <Loader2 size={13} className="animate-spin text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 flex gap-2 flex-shrink-0 bg-white">
            <div className={`w-6 h-6 rounded-full ${SPEAKERS.AR.bg} flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-1.5 text-white`}>{userInitials}</div>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder={loading ? "Waiting for Atlas and Nova..." : "Say something to the team..."}
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 shadow-sm"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
