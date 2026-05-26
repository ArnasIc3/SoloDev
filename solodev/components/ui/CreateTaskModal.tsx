"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { Task, TaskPriority, Sprint, TeamMember } from "@/types";
import { inputClass } from "@/lib/styles";

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreateTask: (task: Task) => void;
  sprints: Sprint[];
  teamMembers: TeamMember[];
}

export function CreateTaskModal({ open, onClose, onCreateTask, sprints, teamMembers }: CreateTaskModalProps) {
  const [title,       setTitle]       = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority,    setPriority]    = React.useState<TaskPriority>("Medium");
  const [assignee,    setAssignee]    = React.useState("AR");
  const [storyPoints, setStoryPoints] = React.useState(2);
  const [sprintId,    setSprintId]    = React.useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateTask({ id: "", title: title.trim(), description: description.trim() || undefined, status: "To Do", priority, assignee, storyPoints, sprintId });
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setAssignee("AR");
    setStoryPoints(2);
    setSprintId(null);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-sm font-semibold text-gray-900">Create Task</Dialog.Title>
            <Dialog.Description className="sr-only">Fill in the form to create a new task</Dialog.Description>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] text-gray-500 font-medium mb-1.5">Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title..." required className={inputClass} />
            </div>

            <div>
              <label className="block text-[11px] text-gray-500 font-medium mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." rows={2} className={`${inputClass} resize-none`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1.5">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={inputClass}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1.5">Story Points</label>
                <select value={storyPoints} onChange={(e) => setStoryPoints(Number(e.target.value))} className={inputClass}>
                  {[1, 2, 3, 5, 8, 13].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1.5">Assignee</label>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={inputClass}>
                  {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}{m.isAI ? " (AI)" : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1.5">Sprint</label>
                <select value={sprintId ?? ""} onChange={(e) => setSprintId(e.target.value ? Number(e.target.value) : null)} className={inputClass}>
                  <option value="">Unassigned</option>
                  {sprints.map((s) => <option key={s.id} value={s.id}>{s.shortName}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 transition px-4 py-2 rounded-lg text-sm font-medium text-gray-700">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg text-sm font-medium text-white">
                Create Task
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
