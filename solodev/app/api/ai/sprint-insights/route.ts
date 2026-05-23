import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { sprint, tasks, teamMembers, projectContext } = await req.json();

  const byStatus = (s: string) => tasks.filter((t: { status: string }) => t.status === s);
  const totalSP  = tasks.reduce((sum: number, t: { storyPoints: number }) => sum + t.storyPoints, 0);
  const doneSP   = byStatus("Done").reduce((sum: number, t: { storyPoints: number }) => sum + t.storyPoints, 0);

  const contextLines = [
    `Sprint: ${sprint.name}`,
    `Goal: ${sprint.goal || "No goal set"}`,
    `Status: ${sprint.status}`,
    `Dates: ${sprint.startDate ?? "?"} → ${sprint.endDate ?? "?"}`,
    ``,
    `Task distribution:`,
    `  To Do: ${byStatus("To Do").length}`,
    `  In Progress: ${byStatus("In Progress").length}`,
    `  Review: ${byStatus("Review").length}`,
    `  Testing: ${byStatus("Testing").length}`,
    `  Done: ${byStatus("Done").length}`,
    `  Total: ${tasks.length} tasks, ${doneSP}/${totalSP} SP completed`,
    ``,
    `Tasks detail:`,
    ...tasks.map((t: { id: string; title: string; status: string; priority: string; assignee: string; storyPoints: number }) =>
      `  [${t.id}] "${t.title}" | ${t.status} | ${t.priority} | ${t.assignee} | ${t.storyPoints}SP`
    ),
    ``,
    `Team: ${teamMembers.map((m: { name: string; id: string; isAI: boolean }) => `${m.name} (${m.id})${m.isAI ? " [AI]" : ""}`).join(", ")}`,
  ];

  const prompt = `You are Atlas AI, the Scrum Master AI in SoloDev. Analyze the current sprint health and identify real issues based on the actual task data.
${projectContext ? `\nPROJECT CONTEXT:\n${projectContext}\n` : ""}
${contextLines.join("\n")}

Look for real patterns: tasks stuck in Review/Testing, uneven workload, high-priority items blocked, velocity risks.

Respond ONLY with a JSON object:
{
  "health": "green" | "amber" | "red",
  "summary": "1-2 sentence sprint health assessment referencing specific task IDs and numbers",
  "bottlenecks": [
    { "title": "short issue title", "description": "specific description referencing task IDs", "severity": "low" | "medium" | "high" }
  ],
  "insights": [
    { "title": "short insight title", "description": "1-2 sentence actionable insight with specific task references" }
  ],
  "recommendations": [
    { "title": "action title", "action": "specific recommendation" }
  ]
}

Return 0-3 bottlenecks (only real ones, not generic), exactly 3 insights, 1-2 recommendations.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 700,
          temperature: 0.5,
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
