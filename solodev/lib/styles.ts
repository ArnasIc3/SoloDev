import type { TaskStatus } from "@/types";

export const priorityStyles: Record<string, string> = {
  High:   "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low:    "bg-gray-100 text-gray-500 border-gray-200",
};

export const assigneeColors: Record<string, string> = {
  AR: "bg-blue-600",
  AI: "bg-blue-600",
  NV: "bg-indigo-600",
};

export const columnDotColor: Record<TaskStatus, string> = {
  "To Do":       "bg-gray-400",
  "In Progress": "bg-blue-500",
  Review:        "bg-amber-500",
  Testing:       "bg-orange-500",
  Done:          "bg-green-500",
};

export const statCardColors = {
  violet: "text-blue-600 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
  blue:   "text-blue-700 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
  indigo: "text-indigo-700 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
  green:  "text-green-700 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
  zinc:   "text-gray-700 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
};

export const inputClass =
  "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-sm dark:shadow-none";
