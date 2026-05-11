"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SprintBoard } from "@/components/board/SprintBoard";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { StatCard } from "@/components/ui/StatCard";
import { CreateTaskModal } from "@/components/ui/CreateTaskModal";
import {
  initialTasks,
  sprints,
  teamMembers,
  aiSuggestions,
} from "@/data/mockData";
import type { Task, TaskStatus } from "@/types";

export default function Home() {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [activeView, setActiveView] = React.useState("dashboard");

  const activeSprint =
    sprints.find((s) => s.status === "active") ?? sprints[1];
  const sprintTasks = tasks.filter((t) => t.sprintId === activeSprint.id);

  const stats = {
    total: sprintTasks.length,
    inProgress: sprintTasks.filter((t) => t.status === "In Progress").length,
    aiAssigned: sprintTasks.filter(
      (t) => t.assignee === "AI" || t.assignee === "NV",
    ).length,
    done: sprintTasks.filter((t) => t.status === "Done").length,
  };

  const handleMoveTask = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
  };

  const handleCreateTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const handleAssignToAI = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignee: "AI" } : t)),
    );
  };

  return (
    <main className="h-screen bg-zinc-950 text-white flex overflow-hidden">
      <Sidebar
        activeSprint={activeSprint}
        teamMembers={teamMembers}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <section className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeSprint={activeSprint}
          onCreateTask={() => setShowCreateModal(true)}
        />

        <div className="flex-1 p-5 overflow-auto min-h-0">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <StatCard label="Sprint Tasks" value={stats.total} color="violet" />
            <StatCard
              label="In Progress"
              value={stats.inProgress}
              color="blue"
            />
            <StatCard
              label="AI Assigned"
              value={stats.aiAssigned}
              color="indigo"
            />
            <StatCard label="Done" value={stats.done} color="green" />
          </div>

          {/* Board + AI Panel */}
          <div className="flex gap-4 min-w-0">
            <div className="flex-1 min-w-0">
              <SprintBoard
                tasks={sprintTasks}
                onMoveTask={handleMoveTask}
              />
            </div>
            <div className="w-64 flex-shrink-0 flex flex-col" style={{ minHeight: "420px" }}>
              <AIAssistantPanel
                tasks={sprintTasks}
                suggestions={aiSuggestions}
                teamMembers={teamMembers}
                onAssignToAI={handleAssignToAI}
              />
            </div>
          </div>
        </div>
      </section>

      <CreateTaskModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateTask={handleCreateTask}
        sprints={sprints}
        teamMembers={teamMembers}
        existingTaskCount={tasks.length}
      />
    </main>
  );
}
