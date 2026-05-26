"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import type { Task, TaskStatus, TeamMember } from "@/types";
import { priorityStyles, assigneeColors } from "@/lib/styles";

const WORKFLOW: TaskStatus[] = [
  "To Do",
  "In Progress",
  "Review",
  "Testing",
  "Done",
];

interface TaskCardProps {
  task: Task;
  index: number;
  isProcessing?: boolean;
  teamMembers?: TeamMember[];
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

export function TaskCard({ task, index, isProcessing = false, teamMembers, onMoveTask, onTaskClick }: TaskCardProps) {
  const currentIdx  = WORKFLOW.indexOf(task.status);
  const canAdvance  = currentIdx < WORKFLOW.length - 1;
  const nextStatus  = canAdvance ? WORKFLOW[currentIdx + 1] : null;
  const avatarColor = assigneeColors[task.assignee] ?? "bg-gray-400";
  const isAIAssigned = task.assignee === "AI" || task.assignee === "NV";
  const member = teamMembers?.find((m) => m.id === task.assignee);
  const displayInitials = member?.initials ?? task.assignee.slice(0, 2);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => !snapshot.isDragging && onTaskClick(task)}
          className={`bg-white dark:bg-gray-800 border rounded-lg p-2.5 transition-all select-none cursor-pointer ${
            snapshot.isDragging
              ? "border-blue-400 shadow-lg shadow-blue-500/10 rotate-1 scale-[1.02]"
              : isProcessing
              ? "border-blue-300 shadow-sm shadow-blue-100"
              : "border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
          }`}
        >
          {/* AI Processing indicator */}
          {isProcessing && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <Loader2 size={10} className="animate-spin text-blue-600 flex-shrink-0" />
              <span className="text-[9px] text-blue-600 font-medium">AI processing...</span>
            </div>
          )}

          {/* ID + Priority */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
              {task.id}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${priorityStyles[task.priority]}`}>
              {task.priority}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-[11px] font-medium text-gray-800 dark:text-gray-200 mb-2 line-clamp-2 leading-relaxed">
            {task.title}
          </h4>

          {/* Footer */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                {task.storyPoints} SP
              </span>
              {isAIAssigned && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-200 dark:border-blue-800">
                  AI
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full ${avatarColor} flex items-center justify-center text-[8px] font-bold flex-shrink-0 text-white`}
                title={member?.name ?? task.assignee}
              >
                {displayInitials}
              </div>
              {canAdvance && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveTask(task.id, nextStatus!);
                  }}
                  title={`Move to ${nextStatus}`}
                  className="flex items-center justify-center w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-300 transition"
                >
                  <ChevronRight size={9} className="text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
