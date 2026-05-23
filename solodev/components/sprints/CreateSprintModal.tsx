"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { Sprint } from "@/types";
import { inputClass } from "@/lib/styles";

interface CreateSprintModalProps {
  open: boolean;
  sprintCount: number;
  onClose: () => void;
  onCreateSprint: (sprint: Omit<Sprint, "id">) => Promise<void>;
}

export function CreateSprintModal({ open, sprintCount, onClose, onCreateSprint }: CreateSprintModalProps) {
  const nextNum = sprintCount;
  const [name, setName] = React.useState(`Sprint ${nextNum} – `);
  const [shortName, setShortName] = React.useState(`Sprint ${nextNum}`);
  const [goal, setGoal] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const n = sprintCount;
      setName(`Sprint ${n} – `);
      setShortName(`Sprint ${n}`);
      setGoal("");
      setStartDate("");
      setEndDate("");
    }
  }, [open, sprintCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortName.trim()) return;
    setSaving(true);
    await onCreateSprint({
      name: name.trim(),
      shortName: shortName.trim(),
      goal: goal.trim(),
      status: "planned",
      startDate: startDate || null,
      endDate: endDate || null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-sm font-semibold">Create Sprint</Dialog.Title>
            <Dialog.Description className="sr-only">Fill in the form to create a new sprint</Dialog.Description>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition">
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1.5">Sprint Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sprint 4 – Feature X"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1.5">Short Name *</label>
              <input
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="Sprint 4"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1.5">Sprint Goal</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What is the main objective of this sprint?"
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`${inputClass} [color-scheme:dark]`}
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`${inputClass} [color-scheme:dark]`}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 transition px-4 py-2 rounded-xl text-sm font-medium"
              >
                {saving ? "Creating..." : "Create Sprint"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
