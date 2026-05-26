"use client";

import { Droppable } from "@hello-pangea/dnd";
import type { Task, TaskStatus, TeamMember } from "@/types";
import { TaskCard } from "./TaskCard";
import { columnDotColor } from "@/lib/styles";

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  teamMembers?: TeamMember[];
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  processingTaskIds?: Set<string>;
}

export function BoardColumn({ status, tasks, teamMembers, onMoveTask, onTaskClick, processingTaskIds }: BoardColumnProps) {
  const dot = columnDotColor[status];

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col min-h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />
          <h3 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{status}</h3>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-medium shadow-sm">
          {tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 space-y-1.5 transition-colors rounded-b-xl ${
              snapshot.isDraggingOver ? "bg-blue-50 dark:bg-blue-900/20" : ""
            }`}
          >
            {tasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                isProcessing={processingTaskIds?.has(task.id)}
                teamMembers={teamMembers}
                onMoveTask={onMoveTask}
                onTaskClick={onTaskClick}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center text-[10px] text-gray-300 dark:text-gray-600 py-10 select-none">
                No tasks
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
