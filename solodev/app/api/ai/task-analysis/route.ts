import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { task, sprintContext } = await req.json();

  const prompt = `You are Atlas AI, a senior developer and Scrum master AI embedded in SoloSynq.ai — an AI-assisted Scrum platform for solo developers.

A developer has opened a task and needs AI analysis to accelerate development.

TASK:
- ID: ${task.id}
- Title: ${task.title}
- Description: ${task.description || "No description provided"}
- Status: ${task.status}
- Priority: ${task.priority}
- Story Points: ${task.storyPoints} SP
- Assignee: ${task.assignee}

SPRINT CONTEXT:
${sprintContext}

Analyze this task and provide actionable development guidance. Be specific and practical — not generic. Reference the task title/description directly.

Respond ONLY with a JSON object in this exact shape:
{
  "subtasks": ["3-5 specific implementation steps as action phrases"],
  "acceptanceCriteria": ["3-5 concrete, testable acceptance criteria starting with 'Given/When/Then' or 'User can...'"],
  "testingChecklist": ["3-5 specific test scenarios for this exact task"],
  "complexity": "Low" | "Medium" | "High",
  "implementationPlan": "2-3 sentence technical implementation plan referencing specific approaches",
  "riskNotes": ["0-2 risk items, omit if no real risks"],
  "suggestedSP": 1 | 2 | 3 | 5 | 8 | 13
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 800,
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
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  try {
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Invalid JSON from AI" }, { status: 500 });
  }
}
