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
}

const STATUS_OPTIONS: ("all" | TaskStatus)[] = ["all", "To Do", "In Progress", "Review", "Testing", "Done"];
const PRIORITY_OPTIONS: ("all" | TaskPriority)[] = ["all", "High", "Medium", "Low"];

const sprintStatusBadge: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border border-green-500/20",
  planned: "bg-zinc-700/60 text-zinc-400 border border-zinc-700",
  completed: "bg-zinc-800 text-zinc-500 border border-zinc-700",
};

interface SprintGroupProps {
  sprint: Sprint | null;
  tasks: Task[];
  teamMembers: TeamMember[];
  onTaskClick: (task: Task) => void;
  defaultOpen?: boolean;
}

function SprintGroup({ sprint, tasks, teamMembers, onTaskClick, defaultOpen = true }: SprintGroupProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const totalSP = tasks.reduce((sum, t) => sum + t.storyPoints, 0);
  const doneSP = tasks.filter((t) => t.status === "Done").reduce((sum, t) => sum + t.storyPoints, 0);

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/80 hover:bg-zinc-800/60 transition text-left"
      >
        {open ? <ChevronDown size={13} className="text-zinc-500 flex-shrink-0" /> : <ChevronRight size={13} className="text-zinc-500 flex-shrink-0" />}
        <span className="text-xs font-semibold text-zinc-200 flex-1 min-w-0 truncate">
          {sprint ? sprint.name : "Unassigned"}
        </span>
        {sprint && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sprintStatusBadge[sprint.status]}`}>
            {sprint.status}
          </span>
        )}
        <span className="text-[10px] text-zinc-500 flex-shrink-0 ml-2">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          {totalSP > 0 && ` · ${doneSP}/${totalSP} SP`}
        </span>
      </button>

      {/* Tasks */}
      {open && (
        <div className="divide-y divide-zinc-800/60">
          {tasks.length === 0 ? (
            <div className="px-4 py-4 text-[11px] text-zinc-600 text-center">
              No tasks
            </div>
          ) : (
            tasks.map((task) => {
              const member = teamMembers.find((m) => m.id === task.assignee);
              const avatarColor = assigneeColors[task.assignee] ?? "bg-zinc-600";
              return (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/50 transition text-left group"
                >
                  {/* Status dot */}
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${columnDotColor[task.status as TaskStatus]}`} />

                  {/* ID */}
                  <span className="text-[10px] font-mono text-zinc-500 w-12 flex-shrink-0">{task.id}</span>

                  {/* Title */}
                  <span className="flex-1 text-[12px] text-zinc-200 truncate group-hover:text-white transition min-w-0">
                    {task.title}
                  </span>

                  {/* Status label */}
                  <span className="text-[10px] text-zinc-500 w-24 flex-shrink-0 hidden sm:block">{task.status}</span>

                  {/* Priority */}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 w-16 text-center ${priorityStyles[task.priority]}`}>
                    {task.priority}
                  </span>

                  {/* Assignee avatar */}
                  <div
                    className={`w-6 h-6 rounded-full ${avatarColor} flex items-center justify-center text-[9px] font-bold flex-shrink-0`}
                    title={member?.name ?? task.assignee}
                  >
                    {task.assignee.slice(0, 2)}
                  </div>

                  {/* Story points */}
                  <span className="text-[10px] text-zinc-500 font-mono w-10 text-right flex-shrink-0">
                    {task.storyPoints} SP
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function BacklogView({ tasks, sprints, teamMembers, onTaskClick }: BacklogViewProps) {
  const [search, setSearch] = React.useState("");
  const [filterPriority, setFilterPriority] = React.useState<"all" | TaskPriority>("all");
  const [filterAssignee, setFilterAssignee] = React.useState("all");
  const [filterStatus, setFilterStatus] = React.useState<"all" | TaskStatus>("all");

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterAssignee !== "all" && t.assignee !== filterAssignee) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    return true;
  });

  const selectClass =
    "bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500 transition";

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition"
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

        <span className="text-[11px] text-zinc-500 ml-auto flex-shrink-0">
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Column headers */}
      <div className="hidden sm:flex items-center gap-3 px-4 pb-1 border-b border-zinc-800">
        <span className="w-2 flex-shrink-0" />
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider w-12 flex-shrink-0">ID</span>
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider flex-1">Title</span>
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider w-24 flex-shrink-0">Status</span>
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider w-16 flex-shrink-0 text-center">Priority</span>
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider w-6 flex-shrink-0" />
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider w-10 text-right flex-shrink-0">SP</span>
      </div>

      {/* Sprint groups */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {sprints.map((sprint) => {
          const sprintTasks = filtered.filter((t) => t.sprintId === sprint.id);
          return (
            <SprintGroup
              key={sprint.id}
              sprint={sprint}
              tasks={sprintTasks}
              teamMembers={teamMembers}
              onTaskClick={onTaskClick}
              defaultOpen={sprint.status === "active"}
            />
          );
        })}

        {/* Unassigned */}
        <SprintGroup
          sprint={null}
          tasks={filtered.filter((t) => t.sprintId === null)}
          teamMembers={teamMembers}
          onTaskClick={onTaskClick}
          defaultOpen={false}
        />
      </div>
    </div>
  );
}
