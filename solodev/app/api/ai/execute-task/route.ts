import { NextRequest, NextResponse } from "next/server";

const AGENT_ROLES: Record<string, { name: string; role: string }> = {
  AI: { name: "Atlas AI", role: "AI Developer" },
  NV: { name: "Nova AI",  role: "AI Code Reviewer" },
};

const STATUS_NEXT: Record<string, string> = {
  "To Do":       "In Progress",
  "In Progress": "Review",
  "Review":      "Testing",
  "Testing":     "Done",
};

function buildAtlasPrompt(task: Record<string, unknown>, sprintContext: string): string {
  return `You are Atlas AI, an AI Developer advisor in SoloDev — a Scrum project management tool.

You are planning this task for the human developer (Arnas) to implement.
Your role is NOT to simulate doing the work — provide a clear, actionable implementation plan so Arnas can execute it efficiently.

TASK:
- ID: ${task.id}
- Title: ${task.title}
- Description: ${task.description || "No description provided"}
- Current status: ${task.status}
- Priority: ${task.priority}
- Story Points: ${task.storyPoints} SP

SPRINT CONTEXT:
${sprintContext}

Infer the tech domain from the task description. Be specific to THIS task.

Respond ONLY with a JSON object:
{
  "summary": "2-3 sentence overview of the recommended approach — what to build and why",
  "implementationSteps": [
    "Step 1: concrete action to take",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ..."
  ],
  "technicalApproach": "1-2 sentences on the key pattern or decision to follow",
  "potentialChallenges": ["Edge case or pitfall to watch for"],
  "estimatedComplexity": "Low",
  "nextStatus": "${STATUS_NEXT[task.status as string] ?? "In Progress"}",
  "reassignTo": "AR"
}`;
}

function buildNovaPrompt(task: Record<string, unknown>, sprintContext: string): string {
  return `You are Nova AI, an AI QA Reviewer in SoloDev — a Scrum project management tool.

Atlas AI has planned this task. Review it from a quality and testing perspective before Arnas implements it.

TASK:
- ID: ${task.id}
- Title: ${task.title}
- Description: ${task.description || "No description provided"}
- Current status: ${task.status}
- Priority: ${task.priority}
- Story Points: ${task.storyPoints} SP

SPRINT CONTEXT:
${sprintContext}

Respond ONLY with a JSON object:
{
  "summary": "2-3 sentence QA verdict — is the plan solid? main quality concern?",
  "qaChecklist": [
    { "item": "Specific thing to verify or test", "risk": "low", "note": "why this matters" },
    { "item": "...", "risk": "medium", "note": "..." },
    { "item": "...", "risk": "low", "note": "..." },
    { "item": "...", "risk": "high", "note": "..." }
  ],
  "testingFocus": "1-2 sentences on what to focus on most when testing",
  "risksIdentified": ["Specific risk to address"],
  "verdict": "ready_for_implementation",
  "nextStatus": "${STATUS_NEXT[task.status as string] ?? "Testing"}",
  "reassignTo": "AR"
}`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { task, sprintContext } = await req.json();

  const agent = AGENT_ROLES[task.assignee as string];
  if (!agent) {
    return NextResponse.json({ error: "Task is not assigned to an AI agent" }, { status: 400 });
  }

  const isAtlas = task.assignee === "AI";
  const prompt  = isAtlas
    ? buildAtlasPrompt(task, sprintContext)
    : buildNovaPrompt(task, sprintContext);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 700,
          temperature: 0.6,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.error?.message ?? "Gemini error" }, { status: 500 });
  }

  const data = await res.json();
  const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json({ ...parsed, agent, isAtlas });
  } catch {
    return NextResponse.json({ error: "Invalid JSON from AI" }, { status: 500 });
  }
}
