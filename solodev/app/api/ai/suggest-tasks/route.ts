import { NextRequest, NextResponse } from "next/server";
import type { Sprint, Task, AITaskSuggestion, SprintRecommendation } from "@/types";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

function buildSprintSummary(sprint: Sprint, tasks: Task[]): string {
  const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
  const totalSP     = sprintTasks.reduce((s, t) => s + t.storyPoints, 0);
  const doneSP      = sprintTasks.filter((t) => t.status === "Done").reduce((s, t) => s + t.storyPoints, 0);
  const donePct     = sprintTasks.length > 0 ? Math.round((sprintTasks.filter((t) => t.status === "Done").length / sprintTasks.length) * 100) : 0;
  return `Sprint ID ${sprint.id}: "${sprint.name}" | Status: ${sprint.status} | Goal: ${sprint.goal || "None"} | Tasks: ${sprintTasks.length} | SP: ${doneSP}/${totalSP} done | Progress: ${donePct}%`;
}

function buildPrompt(
  activeSprint: Sprint | null,
  sprints: Sprint[],
  tasks: Task[],
  projectContext: string,
  userPrompt: string,
): string {
  const sprintLines = sprints.map((s) => buildSprintSummary(s, tasks));
  const unassigned  = tasks.filter((t) => t.sprintId === null);

  const activeTasks = activeSprint
    ? tasks.filter((t) => t.sprintId === activeSprint.id)
    : [];
  const activeWorkload = activeTasks.reduce((s, t) => s + t.storyPoints, 0);

  return `You are Atlas AI, a Scrum planning assistant inside SoloSynq.ai.
Your role: analyze the current sprint and suggest valuable new tasks the developer should consider.

${projectContext ? `Project context:\n${projectContext}\n` : ""}
${activeSprint ? `Active sprint: [ID: ${activeSprint.id}] "${activeSprint.name}"
Goal: ${activeSprint.goal || "Not defined"}
Dates: ${activeSprint.startDate ?? "?"} → ${activeSprint.endDate ?? "?"}
Current workload: ${activeWorkload} story points across ${activeTasks.length} tasks
` : "No active sprint.\n"}
All sprints:
${sprintLines.join("\n")}

Unassigned tasks: ${unassigned.length}

${userPrompt ? `Developer's focus for suggestions: "${userPrompt}"\n` : ""}
Generate 3-5 specific, actionable task suggestions. For each:
- Create a concrete task title (not vague like "improve X")
- Write a clear implementation description
- Evaluate fit for the active sprint or another sprint
- Give honest reasoning

Respond with JSON ONLY:
{
  "suggestions": [
    {
      "title": "Short actionable task title (max 70 chars)",
      "description": "What needs to be done and how — 2-4 sentences",
      "priority": "Low" | "Medium" | "High",
      "storyPoints": 1 | 2 | 3 | 5 | 8,
      "reasoning": "Why this task is valuable right now — 1-2 sentences",
      "recommendation": {
        "verdict": "fits-current" | "too-large" | "wrong-sprint" | "overloaded" | "backlog" | "planned-sprint",
        "label": "Short badge text (e.g. 'Fits Sprint 4', 'Move to backlog')",
        "reasoning": "Why this sprint placement — 1 sentence",
        "suggestedSprintId": null | <number>,
        "suggestedSprintName": null | "sprint name"
      }
    }
  ]
}

Verdicts:
- "fits-current": task fits active sprint goal and workload
- "too-large": task is too complex for current sprint (suggest backlog or next sprint)
- "wrong-sprint": task doesn't match current sprint theme
- "overloaded": sprint already has too many story points
- "backlog": no active sprint or task should go to backlog
- "planned-sprint": task fits a specific planned sprint (set suggestedSprintId)`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const {
    activeSprint = null,
    sprints = [],
    tasks = [],
    projectContext = "",
    userPrompt = "",
  }: {
    activeSprint: Sprint | null;
    sprints: Sprint[];
    tasks: Task[];
    projectContext: string;
    userPrompt: string;
  } = await req.json();

  const prompt = buildPrompt(activeSprint, sprints, tasks, projectContext, userPrompt);

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 1800,
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `Gemini error ${res.status}`);
    }

    const data = await res.json();
    const raw  = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();

    let suggestions: AITaskSuggestion[] = [];
    try {
      const parsed = JSON.parse(raw);
      suggestions = (parsed.suggestions ?? []).map((s: Omit<AITaskSuggestion, "id">, i: number) => ({
        id: `suggest-${Date.now()}-${i}`,
        title:          s.title       ?? "Untitled task",
        description:    s.description ?? "",
        priority:       s.priority    ?? "Medium",
        storyPoints:    s.storyPoints ?? 3,
        reasoning:      s.reasoning   ?? "",
        recommendation: {
          verdict:            (s.recommendation as SprintRecommendation)?.verdict           ?? "backlog",
          label:              (s.recommendation as SprintRecommendation)?.label             ?? "Backlog",
          reasoning:          (s.recommendation as SprintRecommendation)?.reasoning         ?? "",
          suggestedSprintId:  (s.recommendation as SprintRecommendation)?.suggestedSprintId ?? null,
          suggestedSprintName:(s.recommendation as SprintRecommendation)?.suggestedSprintName ?? null,
        } satisfies SprintRecommendation,
      }));
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ suggestions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
