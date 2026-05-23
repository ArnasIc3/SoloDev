"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import type { Task, TaskStatus } from "@/types";
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
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

export function TaskCard({ task, index, isProcessing = false, onMoveTask, onTaskClick }: TaskCardProps) {
  const currentIdx = WORKFLOW.indexOf(task.status);
  const canAdvance = currentIdx < WORKFLOW.length - 1;
  const nextStatus = canAdvance ? WORKFLOW[currentIdx + 1] : null;
  const avatarColor = assigneeColors[task.assignee] ?? "bg-zinc-600";
  const isAIAssigned = task.assignee === "AI" || task.assignee === "NV";

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => !snapshot.isDragging && onTaskClick(task)}
          className={`bg-zinc-800 border rounded-lg p-2.5 transition-all select-none cursor-pointer ${
            snapshot.isDragging
              ? "border-violet-500 shadow-xl shadow-violet-500/20 rotate-1 scale-[1.02]"
              : isProcessing
              ? "border-blue-500/40 shadow-md shadow-blue-500/10"
              : "border-zinc-700 hover:border-violet-500/40"
          }`}
        >
          {/* AI Processing indicator */}
          {isProcessing && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <Loader2 size={10} className="animate-spin text-blue-400 flex-shrink-0" />
              <span className="text-[9px] text-blue-400 font-medium">AI processing...</span>
            </div>
          )}

          {/* ID + Priority */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-zinc-500 font-mono">
              {task.id}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${priorityStyles[task.priority]}`}
            >
              {task.priority}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-[11px] font-medium text-zinc-100 mb-2 line-clamp-2 leading-relaxed">
            {task.title}
          </h4>

          {/* Footer */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 font-mono">
                {task.storyPoints} SP
              </span>
              {isAIAssigned && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
                  AI
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full ${avatarColor} flex items-center justify-center text-[8px] font-bold flex-shrink-0`}
                title={task.assignee}
              >
                {task.assignee.slice(0, 2)}
              </div>
              {canAdvance && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveTask(task.id, nextStatus!);
                  }}
                  title={`Move to ${nextStatus}`}
                  className="flex items-center justify-center w-5 h-5 rounded bg-zinc-900 border border-zinc-600 hover:bg-zinc-700 hover:border-zinc-500 transition"
                >
                  <ChevronRight size={9} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
