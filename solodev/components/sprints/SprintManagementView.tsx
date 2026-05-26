"use client";

import * as React from "react";
import { Plus, Play, CheckCircle, AlertTriangle, FileText, Pencil } from "lucide-react";
import type { Sprint, Task } from "@/types";
import { inputClass } from "@/lib/styles";

interface SprintManagementViewProps {
  sprints: Sprint[];
  tasks: Task[];
  onUpdateSprint: (sprintId: number, updates: Partial<Sprint>) => Promise<void>;
  onCreateSprint: () => void;
  onRetroSprint: (sprint: Sprint) => void;
}

const statusConfig: Record<string, { label: string; badge: string }> = {
  active:    { label: "Active",    badge: "bg-green-50 text-green-700 border border-green-200" },
  planned:   { label: "Planned",   badge: "bg-gray-100 text-gray-600 border border-gray-200" },
  completed: { label: "Completed", badge: "bg-gray-100 text-gray-400 border border-gray-200" },
};

function progressColor(pct: number): string {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 40) return "bg-blue-500";
  return "bg-amber-500";
}

function healthLabel(pct: number, status: string): { text: string; cls: string } {
  if (status === "completed") return { text: "Completed",   cls: "text-gray-400" };
  if (status === "planned")   return { text: "Not started", cls: "text-gray-400" };
  if (pct >= 75) return { text: "On track",    cls: "text-green-600" };
  if (pct >= 40) return { text: "In progress", cls: "text-blue-600" };
  return { text: "Behind", cls: "text-amber-600" };
}

interface SprintCardProps {
  sprint: Sprint;
  tasks: Task[];
  hasActiveSprint: boolean;
  onUpdateSprint: (sprintId: number, updates: Partial<Sprint>) => Promise<void>;
  onRetro: (sprint: Sprint) => void;
}

function SprintCard({ sprint, tasks, hasActiveSprint, onUpdateSprint, onRetro }: SprintCardProps) {
  const [confirming,    setConfirming]    = React.useState(false);
  const [loading,       setLoading]       = React.useState(false);
  const [editing,       setEditing]       = React.useState(false);
  const [editName,      setEditName]      = React.useState(sprint.name);
  const [editShortName, setEditShortName] = React.useState(sprint.shortName);
  const [editGoal,      setEditGoal]      = React.useState(sprint.goal ?? "");
  const [editStart,     setEditStart]     = React.useState(sprint.startDate ?? "");
  const [editEnd,       setEditEnd]       = React.useState(sprint.endDate ?? "");

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

  const handleEdit = () => {
    setEditName(sprint.name);
    setEditShortName(sprint.shortName);
    setEditGoal(sprint.goal ?? "");
    setEditStart(sprint.startDate ?? "");
    setEditEnd(sprint.endDate ?? "");
    setEditing(true);
  };

  const handleEditSave = async () => {
    if (!editName.trim() || !editShortName.trim()) return;
    await doUpdate({
      name:      editName.trim(),
      shortName: editShortName.trim(),
      goal:      editGoal.trim(),
      startDate: editStart || null,
      endDate:   editEnd || null,
    });
    setEditing(false);
  };

  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${
      sprint.status === "active" ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-200"
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
          <h3 className="text-sm font-semibold text-gray-900">{sprint.name}</h3>
          {sprint.goal && !editing && (
            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{sprint.goal}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {sprint.status === "planned" && !editing && (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-900 transition bg-white hover:bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg font-medium"
              >
                <Pencil size={10} />
                Edit
              </button>
              {hasActiveSprint ? (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                  <AlertTriangle size={10} />
                  Active sprint exists
                </div>
              ) : (
                <button
                  onClick={() => doUpdate({ status: "active" })}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-[11px] bg-green-600 hover:bg-green-700 disabled:opacity-60 transition px-3 py-1.5 rounded-lg font-medium text-white"
                >
                  <Play size={11} />
                  {loading ? "Starting..." : "Start Sprint"}
                </button>
              )}
            </>
          )}

          {sprint.status === "active" && !confirming && (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1.5 text-[11px] bg-white hover:bg-gray-50 border border-gray-200 transition px-3 py-1.5 rounded-lg font-medium text-gray-700"
            >
              <CheckCircle size={11} />
              Complete Sprint
            </button>
          )}

          {sprint.status === "active" && confirming && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500">Confirm?</span>
              <button
                onClick={() => doUpdate({ status: "completed" })}
                disabled={loading}
                className="text-[11px] bg-green-600 hover:bg-green-700 disabled:opacity-60 transition px-2.5 py-1.5 rounded-lg font-medium text-white"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-[11px] bg-white hover:bg-gray-50 border border-gray-200 transition px-2.5 py-1.5 rounded-lg font-medium text-gray-600"
              >
                No
              </button>
            </div>
          )}

          {sprint.status === "completed" && (
            <button
              onClick={() => onRetro(sprint)}
              className="flex items-center gap-1.5 text-[11px] bg-white hover:bg-gray-50 border border-gray-200 transition px-3 py-1.5 rounded-lg font-medium text-gray-700"
            >
              <FileText size={11} />
              Retrospective
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 font-medium mb-1">Sprint Name *</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-medium mb-1">Short Name *</label>
              <input value={editShortName} onChange={(e) => setEditShortName(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-medium mb-1">Sprint Goal</label>
            <textarea value={editGoal} onChange={(e) => setEditGoal(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 font-medium mb-1">Start Date</label>
              <input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-medium mb-1">End Date</label>
              <input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 transition px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSave}
              disabled={loading || !editName.trim() || !editShortName.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition px-3 py-1.5 rounded-lg text-[11px] font-medium text-white"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {(sprint.startDate || sprint.endDate) && (
            <p className="text-[10px] text-gray-400 mb-3">
              {sprint.startDate ?? "—"} → {sprint.endDate ?? "—"}
            </p>
          )}

          {totalTasks > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>{doneTasks}/{totalTasks} tasks done</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressColor(progressPct)}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-[10px] text-gray-500">
            <span>{totalTasks} task{totalTasks !== 1 ? "s" : ""}</span>
            {totalSP > 0 && <span>{doneSP}/{totalSP} SP</span>}
            {totalTasks === 0 && sprint.status !== "completed" && (
              <span className="text-gray-400 italic">No tasks assigned</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function SprintManagementView({ sprints, tasks, onUpdateSprint, onCreateSprint, onRetroSprint }: SprintManagementViewProps) {
  const hasActiveSprint = sprints.some((s) => s.status === "active");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Sprint Management</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {sprints.length} sprint{sprints.length !== 1 ? "s" : ""} · {hasActiveSprint ? "1 active" : "none active"}
          </p>
        </div>
        <button
          onClick={onCreateSprint}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 transition px-3.5 py-2 rounded-lg text-sm font-medium text-white shadow-sm"
        >
          <Plus size={13} />
          New Sprint
        </button>
      </div>

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
          <div className="text-center py-16 text-gray-400 text-sm">
            No sprints yet. Create your first sprint to get started.
          </div>
        )}
      </div>
    </div>
  );
}
