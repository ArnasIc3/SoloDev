"use client";

import * as React from "react";
import { Plus, Play, CheckCircle, Archive, AlertTriangle, FileText } from "lucide-react";
import type { Sprint, Task } from "@/types";

interface SprintManagementViewProps {
  sprints: Sprint[];
  tasks: Task[];
  onUpdateSprint: (sprintId: number, updates: Partial<Sprint>) => Promise<void>;
  onCreateSprint: () => void;
  onRetroSprint: (sprint: Sprint) => void;
}

const statusConfig: Record<string, { label: string; badge: string }> = {
  active:    { label: "Active",    badge: "bg-green-500/20 text-green-400 border border-green-500/25" },
  planned:   { label: "Planned",   badge: "bg-zinc-700/60 text-zinc-400 border border-zinc-700" },
  completed: { label: "Completed", badge: "bg-zinc-800 text-zinc-500 border border-zinc-700" },
};

function progressColor(pct: number): string {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 40) return "bg-blue-500";
  return "bg-amber-500";
}

function healthLabel(pct: number, status: string): { text: string; cls: string } {
  if (status === "completed") return { text: "Completed", cls: "text-zinc-500" };
  if (status === "planned")   return { text: "Not started", cls: "text-zinc-500" };
  if (pct >= 75) return { text: "On track", cls: "text-green-400" };
  if (pct >= 40) return { text: "In progress", cls: "text-blue-400" };
  return { text: "Behind", cls: "text-amber-400" };
}

interface SprintCardProps {
  sprint: Sprint;
  tasks: Task[];
  hasActiveSprint: boolean;
  onUpdateSprint: (sprintId: number, updates: Partial<Sprint>) => Promise<void>;
  onRetro: (sprint: Sprint) => void;
}

function SprintCard({ sprint, tasks, hasActiveSprint, onUpdateSprint, onRetro }: SprintCardProps) {
  const [confirming, setConfirming] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const totalTasks  = tasks.length;
  const doneTasks   = tasks.filter((t) => t.status === "Done").length;
  const totalSP     = tasks.reduce((s, t) => s + t.storyPoints, 0);
  const doneSP      = tasks.filter((t) => t.status === "Done").reduce((s, t) => s + t.storyPoints, 0);
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const cfg         = statusConfig[sprint.status] ?? statusConfig.planned;
  const health      = healthLabel(progressPct, sprint.status);

  const doUpdate = async (updates: Partial<Sprint>) => {
    setLoading(true);
    await onUpdateSprint(sprint.id, updates);
    setLoading(false);
    setConfirming(false);
  };

  return (
    <div className={`bg-zinc-900/60 border rounded-xl p-5 transition-all ${
      sprint.status === "active" ? "border-violet-500/30" : "border-zinc-800"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className={`text-[10px] font-medium ${health.cls}`}>
              {health.text}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-zinc-100">{sprint.name}</h3>
          {sprint.goal && (
            <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{sprint.goal}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          {sprint.status === "planned" && (
            hasActiveSprint ? (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                <AlertTriangle size={10} />
                Active sprint exists
              </div>
            ) : (
              <button
                onClick={() => doUpdate({ status: "active" })}
                disabled={loading}
                className="flex items-center gap-1.5 text-[11px] bg-green-600 hover:bg-green-500 disabled:opacity-60 transition px-3 py-1.5 rounded-lg font-medium"
              >
                <Play size={11} />
                {loading ? "Starting..." : "Start Sprint"}
              </button>
            )
          )}

          {sprint.status === "active" && !confirming && (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1.5 text-[11px] bg-zinc-700 hover:bg-zinc-600 transition px-3 py-1.5 rounded-lg font-medium text-zinc-200"
            >
              <CheckCircle size={11} />
              Complete Sprint
            </button>
          )}

          {sprint.status === "active" && confirming && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-400">Confirm?</span>
              <button
                onClick={() => doUpdate({ status: "completed" })}
                disabled={loading}
                className="text-[11px] bg-green-600 hover:bg-green-500 disabled:opacity-60 transition px-2.5 py-1.5 rounded-lg font-medium"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-[11px] bg-zinc-800 hover:bg-zinc-700 transition px-2.5 py-1.5 rounded-lg font-medium text-zinc-400"
              >
                No
              </button>
            </div>
          )}

          {sprint.status === "completed" && (
            <button
              onClick={() => onRetro(sprint)}
              className="flex items-center gap-1.5 text-[11px] bg-zinc-800 hover:bg-zinc-700 transition px-3 py-1.5 rounded-lg font-medium text-zinc-300"
            >
              <FileText size={11} />
              Retrospective
            </button>
          )}
        </div>
      </div>

      {/* Dates */}
      {(sprint.startDate || sprint.endDate) && (
        <p className="text-[10px] text-zinc-600 mb-3">
          {sprint.startDate ?? "—"} → {sprint.endDate ?? "—"}
        </p>
      )}

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
            <span>{doneTasks}/{totalTasks} tasks done</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor(progressPct)}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-[10px] text-zinc-500">
        <span>{totalTasks} task{totalTasks !== 1 ? "s" : ""}</span>
        {totalSP > 0 && (
          <span>{doneSP}/{totalSP} SP</span>
        )}
        {totalTasks === 0 && sprint.status !== "completed" && (
          <span className="text-zinc-600 italic">No tasks assigned</span>
        )}
      </div>
    </div>
  );
}

export function SprintManagementView({ sprints, tasks, onUpdateSprint, onCreateSprint, onRetroSprint }: SprintManagementViewProps) {
  const hasActiveSprint = sprints.some((s) => s.status === "active");

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Sprint Management</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {sprints.length} sprint{sprints.length !== 1 ? "s" : ""} · {hasActiveSprint ? "1 active" : "none active"}
          </p>
        </div>
        <button
          onClick={onCreateSprint}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 transition px-3.5 py-2 rounded-xl text-sm font-medium"
        >
          <Plus size={13} />
          New Sprint
        </button>
      </div>

      {/* Sprint cards */}
      <div className="space-y-3">
        {sprints.map((sprint) => (
          <SprintCard
            key={sprint.id}
            sprint={sprint}
            tasks={tasks.filter((t) => t.sprintId === sprint.id)}
            hasActiveSprint={hasActiveSprint && sprint.status !== "active"}
            onUpdateSprint={onUpdateSprint}
            onRetro={onRetroSprint}
          />
        ))}
        {sprints.length === 0 && (
          <div className="text-center py-16 text-zinc-600 text-sm">
            No sprints yet. Create your first sprint to get started.
          </div>
        )}
      </div>
    </div>
  );
}
