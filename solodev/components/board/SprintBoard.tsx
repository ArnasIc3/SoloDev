"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type { Task, TaskStatus, TeamMember } from "@/types";
import { BoardColumn } from "./BoardColumn";

const COLUMNS: TaskStatus[] = [
  "To Do",
  "In Progress",
  "Review",
  "Testing",
  "Done",
];

interface SprintBoardProps {
  tasks: Task[];
  teamMembers?: TeamMember[];
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  processingTaskIds?: Set<string>;
}

export function SprintBoard({ tasks, teamMembers, onMoveTask, onTaskClick, processingTaskIds }: SprintBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as TaskStatus;
    if (newStatus === result.source.droppableId) return;
    onMoveTask(result.draggableId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-5 gap-3">
        {COLUMNS.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
            teamMembers={teamMembers}
            onMoveTask={onMoveTask}
            onTaskClick={onTaskClick}
            processingTaskIds={processingTaskIds}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
