import type { TaskStatus } from "@/types";

export const priorityStyles: Record<string, string> = {
  High: "bg-red-500/15 text-red-400 border-red-500/25",
  Medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Low: "bg-zinc-700/40 text-zinc-400 border-zinc-600/30",
};

export const assigneeColors: Record<string, string> = {
  AR: "bg-violet-600",
  AI: "bg-blue-600",
  NV: "bg-indigo-600",
};

export const columnDotColor: Record<TaskStatus, string> = {
  "To Do": "bg-zinc-500",
  "In Progress": "bg-blue-400",
  Review: "bg-amber-400",
  Testing: "bg-orange-400",
  Done: "bg-green-400",
};

export const statCardColors = {
  violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  green: "text-green-400 bg-green-500/10 border-green-500/20",
  zinc: "text-zinc-300 bg-zinc-800/60 border-zinc-700/50",
};

export const inputClass =
  "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition";
