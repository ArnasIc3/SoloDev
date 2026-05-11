"use client";

import * as React from "react";
import { Bot, Zap, BarChart2, Users, MessageSquare, Send } from "lucide-react";
import type { Task, TeamMember, AISuggestion } from "@/types";

interface AIAssistantPanelProps {
  tasks: Task[];
  suggestions: AISuggestion[];
  teamMembers: TeamMember[];
  onAssignToAI: (taskId: string) => void;
}

type Mode = "suggestions" | "summary" | "team" | "chat";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

const modes: { id: Mode; label: string; icon: React.ElementType }[] = [
  { id: "suggestions", label: "Insights", icon: Zap },
  { id: "summary", label: "Summary", icon: BarChart2 },
  { id: "team", label: "Team", icon: Users },
  { id: "chat", label: "Chat", icon: MessageSquare },
];

function buildContext(tasks: Task[], teamMembers: TeamMember[]): string {
  const byStatus = (status: string) =>
    tasks.filter((t) => t.status === status);

  const lines = [
    `Total sprint tasks: ${tasks.length}`,
    `To Do: ${byStatus("To Do").length}`,
    `In Progress: ${byStatus("In Progress").length}`,
    `Review: ${byStatus("Review").length}`,
    `Testing: ${byStatus("Testing").length}`,
    `Done: ${byStatus("Done").length}`,
    "",
    "Tasks:",
    ...tasks.map(
      (t) =>
        `- [${t.id}] "${t.title}" | ${t.status} | ${t.priority} priority | assigned: ${t.assignee} | ${t.storyPoints} SP`,
    ),
    "",
    "Team:",
    ...teamMembers.map(
      (m) => `- ${m.name} (${m.id})${m.isAI ? " [AI agent]" : ""}: ${m.role}`,
    ),
  ];

  return lines.join("\n");
}

export function AIAssistantPanel({
  tasks,
  suggestions,
  teamMembers,
  onAssignToAI,
}: AIAssistantPanelProps) {
  const [mode, setMode] = React.useState<Mode>("suggestions");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [aiInsights, setAiInsights] = React.useState<AISuggestion[] | null>(null);
  const [aiSummaryNote, setAiSummaryNote] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const done = tasks.filter((t) => t.status === "Done").length;
  const inTesting = tasks.filter((t) => t.status === "Testing").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const aiTasks = tasks.filter(
    (t) => t.assignee === "AI" || t.assignee === "NV",
  ).length;

  const firstUnassigned = tasks.find(
    (t) => t.assignee === "AR" && t.status !== "Done",
  );

  const bars = [
    { label: "Done", value: done, color: "bg-green-500" },
    { label: "In Progress", value: inProgress, color: "bg-blue-500" },
    { label: "In Testing", value: inTesting, color: "bg-orange-500" },
    { label: "AI Handled", value: aiTasks, color: "bg-indigo-500" },
  ];

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: buildContext(tasks, teamMembers),
        }),
      });

      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: "ai", text: `Error: ${data.error}` }]);
        return;
      }

      setMessages((prev) => [...prev, { role: "ai", text: data.reply as string }]);

      if (Array.isArray(data.insights) && data.insights.length > 0) {
        setAiInsights(
          data.insights.map(
            (ins: { title: string; description: string }, i: number) => ({
              id: `ai-${i}`,
              title: ins.title,
              description: ins.description,
            }),
          ),
        );
      }
      if (typeof data.summaryNote === "string" && data.summaryNote) {
        setAiSummaryNote(data.summaryNote);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Failed to reach AI. Check your API key." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
          <Bot size={13} className="text-blue-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-zinc-100">AI Assistant</h3>
          <p className="text-[10px] text-zinc-500">Atlas · Nova</p>
        </div>
        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20 flex-shrink-0">
          Live
        </span>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-2 border-b border-zinc-800 flex-shrink-0">
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition ${
              mode === id
                ? "bg-violet-600 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Icon size={10} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-y-auto min-h-0">
        {mode === "suggestions" && (
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-500 mb-3">
              {aiInsights ? "AI-generated insights:" : "Based on current sprint signals:"}
            </p>
            {(aiInsights ?? suggestions).map((s) => (
              <div
                key={s.id}
                className="bg-zinc-800 border border-zinc-700/60 rounded-xl p-3"
              >
                <p className="text-[11px] font-medium text-zinc-100 mb-1">
                  {s.title}
                </p>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  {s.description}
                </p>
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

        {mode === "summary" && (
          <div className="space-y-3">
            <p className="text-[10px] text-zinc-500 mb-3">
              {aiSummaryNote ? "Sprint pulse · AI analysis:" : "Sprint pulse (simulated):"}
            </p>

            <div className="space-y-3">
              {bars.map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>{label}</span>
                    <span>
                      {value}/{tasks.length}
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{
                        width:
                          tasks.length > 0
                            ? `${(value / tasks.length) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 mt-1">
              <p className="text-[10px] text-zinc-300 leading-relaxed">
                {aiSummaryNote ?? "Sprint progress looks healthy. Prioritize moving Review items to Testing before sprint end."}
              </p>
            </div>
          </div>
        )}

        {mode === "team" && (
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-500 mb-3">
              Active team members:
            </p>
            {teamMembers.map((member) => {
              const memberTasks = tasks.filter((t) => t.assignee === member.id);
              const doneTasks = memberTasks.filter(
                (t) => t.status === "Done",
              ).length;
              return (
                <div
                  key={member.id}
                  className="bg-zinc-800 border border-zinc-700/60 rounded-xl p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-7 h-7 rounded-full ${member.color} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}
                    >
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-zinc-100">
                        {member.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {member.isAI && (
                          <span className="text-blue-400">AI · </span>
                        )}
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span>{memberTasks.length} tasks assigned</span>
                    {doneTasks > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-green-400">{doneTasks} done</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mode === "chat" && (
          <div className="flex flex-col gap-2">
            {messages.length === 0 && (
              <p className="text-[10px] text-zinc-500 text-center py-6">
                Ask anything about the current sprint.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600/20 text-violet-100 self-end max-w-[85%] ml-auto"
                    : "bg-zinc-800 border border-zinc-700/60 text-zinc-200 self-start max-w-[95%]"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 self-start">
                <span className="text-[11px] text-zinc-500 animate-pulse">
                  Thinking...
                </span>
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
            disabled={loading}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-[11px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
          >
            <Send size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
