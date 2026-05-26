"use client";

import * as React from "react";
import { Sparkles, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import type { Sprint, Task } from "@/types";
import type { ProjectSettings } from "@/components/ui/ProjectContextModal";

type Step = "welcome" | "project" | "structure" | "generating" | "done";

interface Props {
  open: boolean;
  onSkip: () => void;
  onComplete: (sprints: Sprint[], tasks: Task[], settings: Partial<ProjectSettings>) => void;
}

const SPRINT_OPTIONS = [1, 2, 3, 4, 5];
const TASKS_OPTIONS = [3, 5, 7, 10];

export function OnboardingModal({ open, onSkip, onComplete }: Props) {
  const [step, setStep]                   = React.useState<Step>("welcome");
  const [projectName, setProjectName]     = React.useState("");
  const [techStack, setTechStack]         = React.useState("");
  const [description, setDescription]     = React.useState("");
  const [sprintCount, setSprintCount]     = React.useState(3);
  const [tasksPerSprint, setTasksPerSprint] = React.useState(5);
  const [statusMsg, setStatusMsg]         = React.useState("");
  const [resultCounts, setResultCounts]   = React.useState({ sprints: 0, tasks: 0 });
  const [error, setError]                 = React.useState("");

  if (!open) return null;

  const handleGenerate = async () => {
    setStep("generating");
    setError("");

    try {
      setStatusMsg("Planning your workspace with AI...");
      const aiRes = await fetch("/api/ai/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: projectName || "My Project",
          techStack,
          description,
          sprintCount,
          tasksPerSprint,
        }),
      });
      if (!aiRes.ok) {
        const err = await aiRes.json().catch(() => ({}));
        throw new Error(err?.error ?? "AI generation failed");
      }
      const { sprints: aiSprints, tasks: aiTasks } = await aiRes.json();

      setStatusMsg("Saving project settings...");
      const settingsRes = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName || "My Project",
          techStack,
          description,
          domain: "",
        }),
      });
      const settingsData = await settingsRes.json();

      setStatusMsg(`Creating ${aiSprints.length} sprints...`);
      const createdSprints: Sprint[] = [];
      for (const s of aiSprints) {
        const res = await fetch("/api/sprints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: s.name, shortName: s.shortName, goal: s.goal }),
        });
        const data = await res.json();
        if (data.sprint) createdSprints.push(data.sprint);
      }

      setStatusMsg(`Creating ${aiTasks.length} tasks...`);
      const createdTasks: Task[] = [];
      for (const t of aiTasks) {
        const sprint = createdSprints[t.sprintIndex];
        if (!sprint) continue;
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: t.title,
            description: t.description,
            priority: t.priority,
            storyPoints: t.storyPoints,
            assignee: "AR",
            sprintId: sprint.id,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error ?? `Failed to create task: ${t.title}`);
        }
        const data = await res.json();
        if (data.task) createdTasks.push(data.task);
      }

      setResultCounts({ sprints: createdSprints.length, tasks: createdTasks.length });
      setStep("done");

      const finalSettings: Partial<ProjectSettings> = {
        name: projectName || "My Project",
        techStack,
        description,
        domain: "",
        ...(settingsData.settings ?? {}),
      };

      setTimeout(() => {
        onComplete(createdSprints, createdTasks, finalSettings);
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("structure");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {step === "welcome"    && <WelcomeStep onSkip={onSkip} onSetup={() => setStep("project")} />}
        {step === "project"    && (
          <ProjectStep
            projectName={projectName} setProjectName={setProjectName}
            techStack={techStack}     setTechStack={setTechStack}
            description={description} setDescription={setDescription}
            onBack={() => setStep("welcome")}
            onNext={() => setStep("structure")}
          />
        )}
        {step === "structure"  && (
          <StructureStep
            sprintCount={sprintCount}       setSprintCount={setSprintCount}
            tasksPerSprint={tasksPerSprint} setTasksPerSprint={setTasksPerSprint}
            error={error}
            onBack={() => setStep("project")}
            onGenerate={handleGenerate}
          />
        )}
        {step === "generating" && <GeneratingStep statusMsg={statusMsg} />}
        {step === "done"       && <DoneStep sprints={resultCounts.sprints} tasks={resultCounts.tasks} />}
      </div>
    </div>
  );
}

/* ── Step: Welcome ─────────────────────────────────────── */

function WelcomeStep({ onSkip, onSetup }: { onSkip: () => void; onSetup: () => void }) {
  return (
    <div className="p-8">
      <div className="flex justify-center mb-5">
        <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
          <Sparkles size={22} className="text-violet-600 dark:text-violet-400" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
        Welcome to SoloSynq.ai
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 leading-relaxed">
        Would you like a head start? Atlas AI can generate a ready-to-go
        workspace with sprints and tasks tailored to your project.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onSkip}
          className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
        >
          <span className="text-2xl">🚀</span>
          <span className="text-sm font-medium">Start blank</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 text-center">Set up manually</span>
        </button>

        <button
          onClick={onSetup}
          className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-violet-500 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-700 dark:text-violet-300 transition-colors"
        >
          <span className="text-2xl">✨</span>
          <span className="text-sm font-medium">AI setup</span>
          <span className="text-xs text-violet-500 dark:text-violet-400 text-center">Generate workspace</span>
        </button>
      </div>
    </div>
  );
}

/* ── Step: Project ─────────────────────────────────────── */

interface ProjectStepProps {
  projectName: string; setProjectName: (v: string) => void;
  techStack: string;   setTechStack:   (v: string) => void;
  description: string; setDescription: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}

function ProjectStep({ projectName, setProjectName, techStack, setTechStack, description, setDescription, onBack, onNext }: ProjectStepProps) {
  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500";

  return (
    <div className="p-8">
      <StepHeader step={1} total={2} title="Tell us about your project" />

      <div className="space-y-4 mt-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Project name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. My Awesome App"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tech stack</label>
          <input
            type="text"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            placeholder="e.g. Next.js, TypeScript, PostgreSQL"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Short description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you building? A few sentences is enough."
            rows={3}
            className={inputClass + " resize-none"}
          />
        </div>
      </div>

      <StepFooter onBack={onBack} onNext={onNext} nextLabel="Next" />
    </div>
  );
}

/* ── Step: Structure ───────────────────────────────────── */

interface StructureStepProps {
  sprintCount: number;     setSprintCount:     (v: number) => void;
  tasksPerSprint: number;  setTasksPerSprint:  (v: number) => void;
  error: string;
  onBack: () => void;
  onGenerate: () => void;
}

function StructureStep({ sprintCount, setSprintCount, tasksPerSprint, setTasksPerSprint, error, onBack, onGenerate }: StructureStepProps) {
  const total = sprintCount * tasksPerSprint;

  return (
    <div className="p-8">
      <StepHeader step={2} total={2} title="Set up your workspace" />

      <div className="space-y-5 mt-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Number of sprints
          </label>
          <div className="flex gap-2">
            {SPRINT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setSprintCount(n)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  sprintCount === n
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Tasks per sprint
          </label>
          <div className="flex gap-2">
            {TASKS_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setTasksPerSprint(n)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  tasksPerSprint === n
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Atlas will generate{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{sprintCount} sprint{sprintCount !== 1 ? "s" : ""}</span>
            {" "}with{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{tasksPerSprint} tasks each</span>
            {" "}— that is{" "}
            <span className="font-semibold text-violet-600 dark:text-violet-400">{total} tasks total</span>
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <button
          onClick={onGenerate}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
        >
          <Sparkles size={14} />
          Generate workspace
        </button>
      </div>
    </div>
  );
}

/* ── Step: Generating ──────────────────────────────────── */

function GeneratingStep({ statusMsg }: { statusMsg: string }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[280px]">
      <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mb-5">
        <Loader2 size={24} className="text-violet-600 dark:text-violet-400 animate-spin" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Atlas is working...
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{statusMsg}</p>
    </div>
  );
}

/* ── Step: Done ────────────────────────────────────────── */

function DoneStep({ sprints, tasks }: { sprints: number; tasks: number }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[280px]">
      <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-5">
        <CheckCircle2 size={24} className="text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Workspace ready!
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        Created <span className="font-medium text-gray-700 dark:text-gray-300">{sprints} sprint{sprints !== 1 ? "s" : ""}</span> and{" "}
        <span className="font-medium text-gray-700 dark:text-gray-300">{tasks} task{tasks !== 1 ? "s" : ""}</span>.
        Loading your dashboard...
      </p>
    </div>
  );
}

/* ── Shared UI ─────────────────────────────────────────── */

function StepHeader({ step, total, title }: { step: number; total: number; title: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-violet-500 dark:text-violet-400 mb-1">
        Step {step} of {total}
      </p>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
    </div>
  );
}

function StepFooter({ onBack, onNext, nextLabel }: { onBack: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>
      <button
        onClick={onNext}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
      >
        {nextLabel}
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
