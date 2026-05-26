"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Kanban, ListTodo, MessageSquare, Settings, LogOut, ChevronUp, Sun, Moon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useTheme } from "@/components/ui/ThemeProvider";
import type { Sprint, TeamMember } from "@/types";

interface SidebarUser {
  name: string;
  email: string;
}

interface SidebarProps {
  activeSprint: Sprint | undefined;
  teamMembers: TeamMember[];
  activeView: string;
  onViewChange: (view: string) => void;
  onOpenSettings: () => void;
  hasProjectContext: boolean;
  user?: SidebarUser;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sprint",    label: "Sprints",   icon: Kanban },
  { id: "backlog",   label: "Backlog",   icon: ListTodo },
  { id: "meetings",  label: "Meetings",  icon: MessageSquare },
];

export function Sidebar({
  activeSprint,
  teamMembers,
  activeView,
  onViewChange,
  onOpenSettings,
  hasProjectContext,
  user,
}: SidebarProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-60 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-col hidden lg:flex flex-shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <Logo height={36} />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100">SoloSynq.ai</h1>
            <p className="text-gray-400 dark:text-gray-500 text-[10px]">AI-assisted workflow</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-0.5 flex-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === id
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </nav>

      {/* Active Sprint */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
          {activeSprint ? (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Active Sprint</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">Active</span>
              </div>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">{activeSprint.shortName}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{activeSprint.goal}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">Ends {activeSprint.endDate}</p>
            </>
          ) : (
            <>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Active Sprint</span>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">No active sprint</p>
            </>
          )}
        </div>
      </div>

      {/* Project Context button */}
      <div className="px-3 pb-2 border-t border-gray-100 dark:border-gray-800 pt-2">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <Settings size={14} />
          <span className="flex-1 text-left">Project Context</span>
          {hasProjectContext ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-medium">Set</span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">Empty</span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>

      {/* AI Team */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium mb-2 px-1">AI Team</p>
        <div className="space-y-0.5">
          {teamMembers.filter((m) => m.isAI).map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-default"
            >
              <div className={`w-6 h-6 rounded-full ${member.color} flex items-center justify-center text-[9px] font-bold flex-shrink-0 text-white`}>
                {member.initials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{member.name}</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  {member.isAI && <span className="text-blue-500">AI{' · '}</span>}
                  <span className="truncate">{member.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User profile */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 relative">
        <button
          onClick={() => setShowUserMenu((v) => !v)}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
          </div>
          <ChevronUp
            size={12}
            className={`text-gray-400 dark:text-gray-500 transition-transform flex-shrink-0 ${showUserMenu ? "" : "rotate-180"}`}
          />
        </button>

        {showUserMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg">
            <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <LogOut size={12} />
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
