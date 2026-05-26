import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { projectName, techStack, description, sprintCount, tasksPerSprint } = await req.json();

  const prompt = `You are Atlas AI, a Scrum planning assistant for SoloSynq.ai.

A new developer just registered. Generate a realistic boilerplate workspace for their project.

Project:
- Name: "${projectName || "My Project"}"
- Tech Stack: "${techStack || "Not specified"}"
- Description: "${description || "A software project"}"

Requirements:
- Create exactly ${sprintCount} sprints
- Create exactly ${tasksPerSprint} tasks per sprint (${sprintCount * tasksPerSprint} tasks total)
- Sprint themes should build logically on each other (e.g. Foundation → Core Features → Polish → Launch)
- Tasks must be specific and actionable for the given tech stack
- Mix priorities: ~30% High, ~50% Medium, ~20% Low
- Story points must be one of: 1, 2, 3, 5, or 8
- Assignee for all tasks: "AR"
- sprintIndex is 0-based (0 = first sprint)

RESPOND WITH VALID JSON ONLY. No markdown fences, no explanation.

{
  "sprints": [
    {
      "name": "Sprint 1: Project Foundation",
      "shortName": "S1",
      "goal": "Set up the core project infrastructure and development environment"
    }
  ],
  "tasks": [
    {
      "title": "Initialize project repository and CI pipeline",
      "description": "Set up the Git repository, configure branch protection rules, and add a basic CI pipeline with linting and type checking.",
      "priority": "High",
      "storyPoints": 2,
      "sprintIndex": 0
    }
  ]
}`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 4000,
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
    const raw = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();

    const parsed = JSON.parse(raw);
    return NextResponse.json({
      sprints: parsed.sprints ?? [],
      tasks:   parsed.tasks   ?? [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
