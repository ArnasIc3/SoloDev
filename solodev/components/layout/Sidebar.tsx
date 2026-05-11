"use client";

import { LayoutDashboard, Kanban, ListTodo, Bot } from "lucide-react";
import type { Sprint, TeamMember } from "@/types";

interface SidebarProps {
  activeSprint: Sprint;
  teamMembers: TeamMember[];
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sprint", label: "Sprint Board", icon: Kanban },
  { id: "backlog", label: "Backlog", icon: ListTodo },
  { id: "ai", label: "AI Assistant", icon: Bot },
];

export function Sidebar({
  activeSprint,
  teamMembers,
  activeView,
  onViewChange,
}: SidebarProps) {
  return (
    <aside className="w-60 border-r border-zinc-800 bg-zinc-900/60 flex-col hidden lg:flex flex-shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-xs font-bold">
            SD
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">SoloDev</h1>
            <p className="text-zinc-500 text-[10px]">AI-assisted management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-0.5 flex-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              activeView === id
                ? "bg-violet-600 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </nav>

      {/* Active Sprint */}
      <div className="p-3 border-t border-zinc-800">
        <div className="bg-zinc-800/60 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Active Sprint
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
              Active
            </span>
          </div>
          <p className="text-xs font-semibold text-white mb-1">
            {activeSprint.shortName}
          </p>
          <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
            {activeSprint.goal}
          </p>
          <p className="text-[10px] text-zinc-600 mt-1.5">
            Ends {activeSprint.endDate}
          </p>
        </div>
      </div>

      {/* Team */}
      <div className="p-3 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 px-1">
          Team
        </p>
        <div className="space-y-0.5">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/60 transition cursor-default"
            >
              <div
                className={`w-6 h-6 rounded-full ${member.color} flex items-center justify-center text-[9px] font-bold flex-shrink-0`}
              >
                {member.initials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-200 truncate">
                  {member.name}
                </div>
                <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                  {member.isAI && (
                    <span className="text-blue-400">AI ·</span>
                  )}
                  <span className="truncate">{member.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
