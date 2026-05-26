import { Plus, Users } from "lucide-react";
import type { Sprint } from "@/types";

interface HeaderProps {
  activeSprint: Sprint | undefined;
  onCreateTask: () => void;
  onMeeting?: () => void;
}

export function Header({ activeSprint, onCreateTask, onMeeting }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
      <div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-gray-400 dark:text-gray-500 text-[11px]">SoloSynq.ai</span>
          {activeSprint ? (
            <>
              <span className="text-gray-300 dark:text-gray-600 text-[11px]">/</span>
              <span className="text-gray-500 dark:text-gray-400 text-[11px]">{activeSprint.shortName}</span>
              <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                Active
              </span>
            </>
          ) : (
            <span className="text-gray-300 dark:text-gray-600 text-[11px]">/ No active sprint</span>
          )}
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {activeSprint?.name ?? "Dashboard"}
        </h2>
        {activeSprint?.goal && (
          <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-0.5 line-clamp-1">{activeSprint.goal}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {activeSprint && (
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Sprint ends</p>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{activeSprint.endDate}</p>
          </div>
        )}
        {onMeeting && (
          <button
            onClick={onMeeting}
            className="flex items-center gap-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:text-blue-600 transition px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 shadow-sm"
          >
            <Users size={13} />
            Team Meeting
          </button>
        )}
        <button
          onClick={onCreateTask}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 transition px-3.5 py-2 rounded-lg text-sm font-medium text-white shadow-sm"
        >
          <Plus size={13} />
          Create Task
        </button>
      </div>
    </header>
  );
}
