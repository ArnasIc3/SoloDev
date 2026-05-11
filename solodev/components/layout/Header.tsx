import { Plus } from "lucide-react";
import type { Sprint } from "@/types";

interface HeaderProps {
  activeSprint: Sprint;
  onCreateTask: () => void;
}

export function Header({ activeSprint, onCreateTask }: HeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-900/40 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
      <div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-zinc-500 text-[11px]">SoloDev</span>
          <span className="text-zinc-700 text-[11px]">/</span>
          <span className="text-zinc-400 text-[11px]">
            {activeSprint.shortName}
          </span>
          <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
            Active
          </span>
        </div>
        <h2 className="text-base font-semibold">{activeSprint.name}</h2>
        <p className="text-zinc-500 text-[11px] mt-0.5 line-clamp-1">
          {activeSprint.goal}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <p className="text-[10px] text-zinc-500">Sprint ends</p>
          <p className="text-xs font-medium text-zinc-300">
            {activeSprint.endDate}
          </p>
        </div>
        <button
          onClick={onCreateTask}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 transition px-3.5 py-2 rounded-xl text-sm font-medium"
        >
          <Plus size={13} />
          Create Task
        </button>
      </div>
    </header>
  );
}
