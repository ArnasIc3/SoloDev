"use client";

import * as React from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import type { Task, Sprint, TeamMember, TaskStatus, TaskPriority } from "@/types";
import { priorityStyles, assigneeColors, columnDotColor } from "@/lib/styles";

interface BacklogViewProps {
  tasks: Task[];
  sprints: Sprint[];
  teamMembers: TeamMember[];
  onTaskClick: (task: Task) => void;
  onMoveTask?: (taskId: string, sprintId: number | null) => Promise<void>;
}

const STATUS_OPTIONS: ("all" | TaskStatus)[] = ["all", "To Do", "In Progress", "Review", "Testing", "Done"];
const PRIORITY_OPTIONS: ("all" | TaskPriority)[] = ["all", "High", "Medium", "Low"];

const sprintStatusBadge: Record<string, string> = {
  active:    "bg-green-50 text-green-700 border border-green-200",
  planned:   "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600",
  completed: "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600",
};

interface SprintGroupProps {
  sprint: Sprint | null;
  tasks: Task[];
  teamMembers: TeamMember[];
  onTaskClick: (task: Task) => void;
  defaultOpen?: boolean;
  isActiveSprint?: boolean;
  isDragOver?: boolean;
  draggedTaskId?: string | null;
  onTaskDragStart?: (taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

function SprintGroup({
  sprint, tasks, teamMembers, onTaskClick, defaultOpen = true,
  isActiveSprint = false, isDragOver = false, draggedTaskId,
  onTaskDragStart, onDragOver, onDragLeave, onDrop,
}: SprintGroupProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const totalSP = tasks.reduce((sum, t) => sum + t.storyPoints, 0);
  const doneSP  = tasks.filter((t) => t.status === "Done").reduce((sum, t) => sum + t.storyPoints, 0);

  return (
    <div
      className={`border rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm dark:shadow-none transition-all ${
        isDragOver ? "border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800 bg-blue-50/30 dark:bg-blue-900/10" : "border-gray-200 dark:border-gray-700"
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Group header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
      >
        {open
          ? <ChevronDown size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          : <ChevronRight size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
        }
        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate">
          {sprint ? sprint.name : "Unassigned"}
        </span>
        {sprint && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sprintStatusBadge[sprint.status]}`}>
            {sprint.status}
          </span>
        )}
        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          {totalSP > 0 && ` · ${doneSP}/${totalSP} SP`}
        </span>
      </button>

      {/* Tasks */}
      {open && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {tasks.length === 0 ? (
            <div className={`px-4 py-5 text-[11px] text-center transition-colors ${
              isDragOver ? "text-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : "text-gray-400 dark:text-gray-600"
            }`}>
              {isDragOver ? "Drop here" : "No tasks"}
            </div>
          ) : (
            tasks.map((task) => {
              const member      = teamMembers.find((m) => m.id === task.assignee);
              const avatarColor = assigneeColors[task.assignee] ?? "bg-gray-400";
              const isBeingDragged = task.id === draggedTaskId;
              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("taskId", task.id);
                    e.dataTransfer.effectAllowed = "move";
                    onTaskDragStart?.(task.id);
                  }}
                  onClick={() => onTaskClick(task)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left group select-none cursor-grab active:cursor-grabbing ${isBeingDragged ? "opacity-30" : ""}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${columnDotColor[task.status as TaskStatus]}`} />
                  <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 w-12 flex-shrink-0">{task.id}</span>
                  <span className="flex-1 text-[12px] text-gray-700 dark:text-gray-300 truncate group-hover:text-gray-900 dark:group-hover:text-gray-100 transition min-w-0">
                    {task.title}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 w-24 flex-shrink-0 hidden sm:block">{task.status}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 w-16 text-center ${priorityStyles[task.priority]}`}>
                    {task.priority}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full ${avatarColor} flex items-center justify-center text-[9px] font-bold flex-shrink-0 text-white`}
                    title={member?.name ?? task.assignee}
                  >
                    {task.assignee.slice(0, 2)}
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono w-10 text-right flex-shrink-0">
                    {task.storyPoints} SP
                  </span>
                </div>
              );
            })
          )}
          {tasks.length > 0 && isDragOver && (
            <div className="px-4 py-3 text-[11px] text-blue-500 text-center bg-blue-50/50 dark:bg-blue-900/10">
              Drop here to move
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BacklogView({ tasks, sprints, teamMembers, onTaskClick, onMoveTask }: BacklogViewProps) {
  const [search,         setSearch]         = React.useState("");
  const [filterPriority, setFilterPriority] = React.useState<"all" | TaskPriority>("all");
  const [filterAssignee, setFilterAssignee] = React.useState("all");
  const [filterStatus,   setFilterStatus]   = React.useState<"all" | TaskStatus>("all");
  const [draggedTaskId,  setDraggedTaskId]  = React.useState<string | null>(null);
  const [dragOverGroup,  setDragOverGroup]  = React.useState<number | "unassigned" | null>(null);

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterAssignee !== "all" && t.assignee !== filterAssignee) return false;
    if (filterStatus   !== "all" && t.status   !== filterStatus)   return false;
    return true;
  });

  const makeDragHandlers = (groupId: number | "unassigned", targetSprintId: number | null) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverGroup(groupId);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOverGroup(null);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("taskId");
      if (!taskId) { setDragOverGroup(null); return; }
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.sprintId === targetSprintId) { setDragOverGroup(null); return; }
      onMoveTask?.(taskId, targetSprintId);
      setDragOverGroup(null);
      setDraggedTaskId(null);
    },
  });

  const selectClass =
    "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 transition shadow-sm dark:shadow-none";

  return (
    <div
      className="flex flex-col gap-4 h-full"
      onDragEnd={() => { setDraggedTaskId(null); setDragOverGroup(null); }}
    >
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 transition shadow-sm dark:shadow-none"
          />
        </div>

        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as "all" | TaskPriority)} className={selectClass}>
          <option value="all">All priorities</option>
          {PRIORITY_OPTIONS.slice(1).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className={selectClass}>
          <option value="all">All assignees</option>
          {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "all" | TaskStatus)} className={selectClass}>
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-auto flex-shrink-0">
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Column headers */}
      <div className="hidden sm:flex items-center gap-3 px-4 pb-1 border-b border-gray-200 dark:border-gray-700">
        <span className="w-2 flex-shrink-0" />
        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium w-12 flex-shrink-0">ID</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium flex-1">Title</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium w-24 flex-shrink-0">Status</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium w-16 flex-shrink-0 text-center">Priority</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium w-6 flex-shrink-0" />
        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium w-10 text-right flex-shrink-0">SP</span>
      </div>

      {/* Sprint groups */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {sprints.map((sprint) => {
          const sprintTasks = filtered.filter((t) => t.sprintId === sprint.id);
          const isActive = sprint.status === "active";
          return (
            <SprintGroup
              key={sprint.id}
              sprint={sprint}
              tasks={sprintTasks}
              teamMembers={teamMembers}
              onTaskClick={onTaskClick}
              defaultOpen={isActive}
              isActiveSprint={isActive}
              isDragOver={dragOverGroup === sprint.id}
              draggedTaskId={draggedTaskId}
              onTaskDragStart={setDraggedTaskId}
              {...makeDragHandlers(sprint.id, sprint.id)}
            />
          );
        })}

        <SprintGroup
          sprint={null}
          tasks={filtered.filter((t) => t.sprintId === null)}
          teamMembers={teamMembers}
          onTaskClick={onTaskClick}
          defaultOpen={true}
          isActiveSprint={false}
          isDragOver={dragOverGroup === "unassigned"}
          draggedTaskId={draggedTaskId}
          onTaskDragStart={setDraggedTaskId}
          {...makeDragHandlers("unassigned", null)}
        />
      </div>
    </div>
  );
}
