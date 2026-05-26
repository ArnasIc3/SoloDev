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
  const [name,      setName]      = React.useState(`Sprint ${nextNum} – `);
  const [shortName, setShortName] = React.useState(`Sprint ${nextNum}`);
  const [goal,      setGoal]      = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate,   setEndDate]   = React.useState("");
  const [saving,    setSaving]    = React.useState(false);
  const [error,     setError]     = React.useState("");

  React.useEffect(() => {
    if (open) {
      const n = sprintCount;
      setName(`Sprint ${n} – `);
      setShortName(`Sprint ${n}`);
      setGoal("");
      setStartDate("");
      setEndDate("");
      setError("");
    }
  }, [open, sprintCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortName.trim() || !goal.trim() || !startDate || !endDate) {
      setError("Please fill in all required fields: name, goal, start date, and end date.");
      return;
    }
    if (endDate < startDate) {
      setError("End date must be after the start date.");
      return;
    }
    setError("");
    setSaving(true);
    await onCreateSprint({
      name:      name.trim(),
      shortName: shortName.trim(),
      goal:      goal.trim(),
      status:    "planned",
      startDate: startDate,
      endDate:   endDate,
    });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-sm font-semibold text-gray-900">Create Sprint</Dialog.Title>
            <Dialog.Description className="sr-only">Fill in the form to create a new sprint</Dialog.Description>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] text-gray-500 font-medium mb-1.5">Sprint Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint 4 – Feature X" className={inputClass} />
            </div>

            <div>
              <label className="block text-[11px] text-gray-500 font-medium mb-1.5">Short Name *</label>
              <input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="Sprint 4" className={inputClass} />
            </div>

            <div>
              <label className="block text-[11px] text-gray-500 font-medium mb-1.5">Sprint Goal *</label>
              <textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What is the main objective of this sprint?" rows={2} className={`${inputClass} resize-none`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1.5">Start Date *</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1.5">End Date *</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
              </div>
            </div>

            {error && (
              <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 transition px-4 py-2 rounded-lg text-sm font-medium text-gray-700">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition px-4 py-2 rounded-lg text-sm font-medium text-white">
                {saving ? "Creating..." : "Create Sprint"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
