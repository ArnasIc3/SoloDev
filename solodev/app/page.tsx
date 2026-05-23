"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SprintBoard } from "@/components/board/SprintBoard";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { StatCard } from "@/components/ui/StatCard";
import { CreateTaskModal } from "@/components/ui/CreateTaskModal";
import { TaskDrawer } from "@/components/ui/TaskDrawer";
import { BacklogView } from "@/components/backlog/BacklogView";
import { SprintManagementView } from "@/components/sprints/SprintManagementView";
import { CreateSprintModal } from "@/components/sprints/CreateSprintModal";
import { RetrospectiveModal } from "@/components/sprints/RetrospectiveModal";
import { ProjectContextModal, buildProjectContext } from "@/components/ui/ProjectContextModal";
import { TeamMeetingModal } from "@/components/ui/TeamMeetingModal";
import type { SavedMeeting } from "@/components/ui/TeamMeetingModal";
import { MeetingsView } from "@/components/meetings/MeetingsView";
import type { ProjectSettings } from "@/components/ui/ProjectContextModal";
import { aiSuggestions } from "@/data/mockData";
import type { Task, Sprint, TeamMember, TaskStatus } from "@/types";

const DEFAULT_SETTINGS: ProjectSettings = { id: 1, name: "My Project", techStack: "", domain: "", description: "" };

export default function Home() {
  const [tasks, setTasks]             = React.useState<Task[]>([]);
  const [sprints, setSprints]         = React.useState<Sprint[]>([]);
  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
  const [projectSettings, setProjectSettings] = React.useState<ProjectSettings>(DEFAULT_SETTINGS);
  const [meetings, setMeetings]       = React.useState<SavedMeeting[]>([]);
  const [loading, setLoading]         = React.useState(true);
  const [processingTasks, setProcessingTasks] = React.useState<Set<string>>(new Set());
  const [showCreateTask, setShowCreateTask]     = React.useState(false);
  const [showCreateSprint, setShowCreateSprint] = React.useState(false);
  const [showSettings, setShowSettings]         = React.useState(false);
  const [retroSprint, setRetroSprint]   = React.useState<Sprint | null>(null);
  const [meetingTask, setMeetingTask]   = React.useState<Task | null>(null);
  const [showMeeting, setShowMeeting]   = React.useState(false);
  const [activeView, setActiveView]     = React.useState("dashboard");
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  // Stable refs to avoid stale closures in autoProcess
  const tasksRef    = React.useRef<Task[]>([]);
  const sprintsRef  = React.useRef<Sprint[]>([]);
  tasksRef.current   = tasks;
  sprintsRef.current = sprints;

  React.useEffect(() => {
    Promise.all([
      fetch("/api/sprints").then((r) => r.json()),
      fetch("/api/team").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/meetings").then((r) => r.json()),
    ]).then(([sprintsData, teamData, tasksData, settingsData, meetingsData]) => {
      setSprints(sprintsData.sprints);
      setTeamMembers(teamData.members);
      setTasks(tasksData.tasks);
      if (settingsData.settings) setProjectSettings(settingsData.settings);
      if (meetingsData.meetings) setMeetings(meetingsData.meetings);
      setLoading(false);
    });
  }, []);

  const activeSprint   = sprints.find((s) => s.status === "active") ?? sprints[0];
  const sprintTasks    = tasks.filter((t) => t.sprintId === activeSprint?.id);
  const projectContext = buildProjectContext(projectSettings);
  const hasProjectContext = !!(projectSettings.techStack || projectSettings.domain || projectSettings.description);

  const stats = {
    total:      sprintTasks.length,
    inProgress: sprintTasks.filter((t) => t.status === "In Progress").length,
    aiAssigned: sprintTasks.filter((t) => t.assignee === "AI" || t.assignee === "NV").length,
    done:       sprintTasks.filter((t) => t.status === "Done").length,
  };

  /* ── Helpers ───────────────────────────────────────── */

  const patchTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    setSelectedTask((prev) => (prev?.id === taskId ? { ...prev, ...updates } : prev));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  };

  const buildSprintContextForTask = (task: Task, ctx: string) => {
    const sprint = sprintsRef.current.find((s) => s.id === task.sprintId);
    const nearby = tasksRef.current
      .filter((t) => t.sprintId === task.sprintId && t.id !== task.id)
      .slice(0, 6);
    return [
      ctx ? `PROJECT CONTEXT:\n${ctx}` : "",
      sprint ? `Sprint: ${sprint.name} (${sprint.status})` : "",
      sprint?.goal ? `Goal: ${sprint.goal}` : "",
      `Other sprint tasks: ${nearby.map((t) => `[${t.id}] "${t.title}" — ${t.status}`).join(", ")}`,
    ].filter(Boolean).join("\n");
  };

  const callExecuteTask = async (task: Task): Promise<{ nextStatus: TaskStatus; reassignTo: string; aiOutput: string } | null> => {
    try {
      const res = await fetch("/api/ai/execute-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, sprintContext: buildSprintContextForTask(task, projectContext) }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        nextStatus: data.nextStatus as TaskStatus,
        reassignTo: data.reassignTo ?? "AR",
        aiOutput:   JSON.stringify({ ...data, type: task.assignee === "AI" ? "atlas" : "nova" }),
      };
    } catch {
      return null;
    }
  };

  /* ── Auto-process chain ────────────────────────────── */

  const autoProcess = async (taskId: string, newStatus: TaskStatus) => {
    setProcessingTasks((prev) => new Set([...prev, taskId]));
    try {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) return;

      if (newStatus === "In Progress") {
        // Phase 1: Atlas plans
        const atlasTask = { ...task, status: "In Progress" as TaskStatus, assignee: "AI" };
        await patchTask(taskId, { assignee: "AI" });

        const atlasResult = await callExecuteTask(atlasTask);
        if (!atlasResult) return;

        // Move to Review, assign Nova
        await patchTask(taskId, {
          status:   atlasResult.nextStatus,
          assignee: "NV",
          aiOutput: atlasResult.aiOutput,
        });

        // Phase 2: Nova QA
        const novaTask = { ...atlasTask, status: atlasResult.nextStatus, assignee: "NV" };
        const novaResult = await callExecuteTask(novaTask);
        if (!novaResult) return;

        // Move to Testing, reassign to AR
        await patchTask(taskId, {
          status:   novaResult.nextStatus,
          assignee: "AR",
          aiOutput: novaResult.aiOutput,
        });

      } else if (newStatus === "Review") {
        // Only Nova runs (manual move to Review)
        const novaTask = { ...task, status: "Review" as TaskStatus, assignee: "NV" };
        await patchTask(taskId, { assignee: "NV" });

        const novaResult = await callExecuteTask(novaTask);
        if (!novaResult) return;

        await patchTask(taskId, {
          status:   novaResult.nextStatus,
          assignee: "AR",
          aiOutput: novaResult.aiOutput,
        });

      } else if (newStatus === "Testing") {
        // Reassign to AR for human testing
        await patchTask(taskId, { assignee: "AR" });
      }
    } finally {
      setProcessingTasks((prev) => { const n = new Set(prev); n.delete(taskId); return n; });
    }
  };

  /* ── Task handlers ─────────────────────────────────── */

  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic status update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    // Fire-and-forget AI chain for relevant statuses
    if (newStatus === "In Progress" || newStatus === "Review" || newStatus === "Testing") {
      autoProcess(taskId, newStatus);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    await patchTask(taskId, updates);
  };

  const handleCreateTask = async (task: Task) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task.title, description: task.description,
        priority: task.priority, storyPoints: task.storyPoints,
        assignee: task.assignee, sprintId: task.sprintId,
      }),
    });
    const data = await res.json();
    if (data.task) setTasks((prev) => [data.task, ...prev]);
  };

  const handleAssignToAI = async (taskId: string) => {
    await patchTask(taskId, { assignee: "AI" });
  };

  /* ── Sprint handlers ───────────────────────────────── */

  const handleUpdateSprint = async (sprintId: number, updates: Partial<Sprint>) => {
    setSprints((prev) => prev.map((s) => (s.id === sprintId ? { ...s, ...updates } : s)));
    await fetch(`/api/sprints/${sprintId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  };

  const handleCreateSprint = async (sprint: Omit<Sprint, "id">) => {
    const res = await fetch("/api/sprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sprint),
    });
    const data = await res.json();
    if (data.sprint) setSprints((prev) => [...prev, data.sprint]);
  };

  /* ── Settings handler ──────────────────────────────── */

  const handleSaveSettings = async (updates: Omit<ProjectSettings, "id">) => {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.settings) setProjectSettings(data.settings);
  };

  /* ── Loading ───────────────────────────────────────── */

  if (loading) {
    return (
      <main className="h-screen bg-zinc-950 text-white flex items-center justify-center">
        <span className="text-zinc-500 text-sm">Loading...</span>
      </main>
    );
  }

  /* ── Render ────────────────────────────────────────── */

  return (
    <main className="h-screen bg-zinc-950 text-white flex overflow-hidden">
      <Sidebar
        activeSprint={activeSprint}
        teamMembers={teamMembers}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenSettings={() => setShowSettings(true)}
        hasProjectContext={hasProjectContext}
      />

      <section className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeSprint={activeSprint}
          onCreateTask={() => setShowCreateTask(true)}
          onMeeting={() => { setMeetingTask(null); setShowMeeting(true); }}
        />

        <div className="flex-1 p-5 overflow-auto min-h-0">
          {activeView === "meetings" && (
            <MeetingsView
              meetings={meetings}
              onDelete={(id) => setMeetings((prev) => prev.filter((m) => m.id !== id))}
            />
          )}

          {activeView === "backlog" && (
            <BacklogView
              tasks={tasks}
              sprints={sprints}
              teamMembers={teamMembers}
              onTaskClick={setSelectedTask}
            />
          )}

          {activeView === "sprint" && (
            <SprintManagementView
              sprints={sprints}
              tasks={tasks}
              onUpdateSprint={handleUpdateSprint}
              onCreateSprint={() => setShowCreateSprint(true)}
              onRetroSprint={setRetroSprint}
            />
          )}

          {(activeView === "dashboard" || activeView === "ai") && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <StatCard label="Sprint Tasks" value={stats.total} color="violet" />
                <StatCard label="In Progress" value={stats.inProgress} color="blue" />
                <StatCard label="AI Assigned" value={stats.aiAssigned} color="indigo" />
                <StatCard label="Done" value={stats.done} color="green" />
              </div>

              <div className="flex gap-4 min-w-0">
                <div className="flex-1 min-w-0">
                  <SprintBoard
                    tasks={sprintTasks}
                    onMoveTask={handleMoveTask}
                    onTaskClick={setSelectedTask}
                    processingTaskIds={processingTasks}
                  />
                </div>
                <div className="w-64 flex-shrink-0 flex flex-col" style={{ minHeight: "420px" }}>
                  <AIAssistantPanel
                    tasks={sprintTasks}
                    suggestions={aiSuggestions}
                    teamMembers={teamMembers}
                    activeSprint={activeSprint}
                    projectContext={projectContext}
                    onAssignToAI={handleAssignToAI}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {sprints.length > 0 && (
        <CreateTaskModal
          open={showCreateTask}
          onClose={() => setShowCreateTask(false)}
          onCreateTask={handleCreateTask}
          sprints={sprints}
          teamMembers={teamMembers}
        />
      )}

      <CreateSprintModal
        open={showCreateSprint}
        sprintCount={sprints.length}
        onClose={() => setShowCreateSprint(false)}
        onCreateSprint={handleCreateSprint}
      />

      <RetrospectiveModal
        sprint={retroSprint}
        tasks={tasks.filter((t) => t.sprintId === retroSprint?.id)}
        teamMembers={teamMembers}
        onClose={() => setRetroSprint(null)}
      />

      <TeamMeetingModal
        open={showMeeting}
        task={meetingTask}
        sprint={activeSprint ?? null}
        teamMembers={teamMembers}
        projectContext={projectContext}
        activeSprint={activeSprint}
        recentMeetings={meetings}
        onClose={() => setShowMeeting(false)}
        onMeetingSaved={(m) => setMeetings((prev) => [m, ...prev])}
        onTaskCreated={(t) => setTasks((prev) => [t, ...prev])}
      />

      <ProjectContextModal
        open={showSettings}
        settings={projectSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
      />

      <TaskDrawer
        task={selectedTask}
        sprints={sprints}
        teamMembers={teamMembers}
        allTasks={tasks}
        activeSprint={activeSprint}
        projectContext={projectContext}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
        onMeetingOpen={(t) => { setMeetingTask(t); setShowMeeting(true); }}
      />
    </main>
  );
}
