"use client";

import { Droppable } from "@hello-pangea/dnd";
import type { Task, TaskStatus } from "@/types";
import { TaskCard } from "./TaskCard";
import { columnDotColor } from "@/lib/styles";

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  processingTaskIds?: Set<string>;
}

export function BoardColumn({ status, tasks, onMoveTask, onTaskClick, processingTaskIds }: BoardColumnProps) {
  const dot = columnDotColor[status];

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col min-h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />
          <h3 className="text-[11px] font-semibold text-zinc-200">{status}</h3>
        </div>
        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
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
              snapshot.isDraggingOver ? "bg-violet-500/5" : ""
            }`}
          >
            {tasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                isProcessing={processingTaskIds?.has(task.id)}
                onMoveTask={onMoveTask}
                onTaskClick={onTaskClick}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center text-[10px] text-zinc-700 py-10 select-none">
                No tasks
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
