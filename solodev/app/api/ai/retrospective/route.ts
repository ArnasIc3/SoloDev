import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { sprint, tasks, teamMembers } = await req.json();

  const totalSP   = tasks.reduce((s: number, t: { storyPoints: number }) => s + t.storyPoints, 0);
  const doneTasks = tasks.filter((t: { status: string }) => t.status === "Done");
  const doneSP    = doneTasks.reduce((s: number, t: { storyPoints: number }) => s + t.storyPoints, 0);
  const byAssignee = (id: string) => tasks.filter((t: { assignee: string }) => t.assignee === id);

  const contextLines = [
    `Sprint: ${sprint.name}`,
    `Goal: ${sprint.goal || "No goal set"}`,
    `Dates: ${sprint.startDate ?? "?"} → ${sprint.endDate ?? "?"}`,
    ``,
    `Results:`,
    `  Completed: ${doneTasks.length}/${tasks.length} tasks (${totalSP > 0 ? Math.round((doneSP / totalSP) * 100) : 0}% of SP)`,
    `  Story points: ${doneSP}/${totalSP} SP`,
    ``,
    `Tasks:`,
    ...tasks.map((t: { id: string; title: string; status: string; assignee: string; storyPoints: number }) =>
      `  [${t.id}] "${t.title}" — ${t.status} | ${t.assignee} | ${t.storyPoints}SP`
    ),
    ``,
    `Team contributions:`,
    ...teamMembers.map((m: { id: string; name: string; isAI: boolean }) => {
      const mt = byAssignee(m.id);
      const done = mt.filter((t: { status: string }) => t.status === "Done").length;
      return `  ${m.name}${m.isAI ? " [AI]" : ""}: ${done}/${mt.length} tasks done`;
    }),
  ];

  const prompt = `You are Atlas AI, the Scrum Master AI in SoloSynq.ai. Generate a sprint retrospective based on actual sprint data.

${contextLines.join("\n")}

Write a realistic retrospective grounded in the actual task data — reference specific tasks, patterns, and team contributions.

Respond ONLY with a JSON object:
{
  "summary": "2-3 sentence executive summary of the sprint outcome referencing actual metrics",
  "wentWell": ["3-4 specific things that went well, referencing actual tasks or patterns"],
  "improvements": ["2-3 specific improvement areas based on what actually happened"],
  "aiContribution": "1-2 sentence summary of AI agent (Atlas/Nova) contributions this sprint",
  "nextSprintFocus": ["2-3 concrete recommendations for the next sprint based on this sprint's outcomes"],
  "velocityNote": "1 sentence about velocity — was the SP load realistic?"
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
          temperature: 0.65,
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
