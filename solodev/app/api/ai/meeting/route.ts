import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

interface HistoryMessage {
  speaker: "AR" | "AI" | "NV" | "SYSTEM";
  text: string;
}

function formatHistory(history: HistoryMessage[], userName: string): string {
  if (!history.length) return "No previous messages.";
  return history
    .filter((m) => m.speaker !== "SYSTEM")
    .map((m) => {
      const name = m.speaker === "AR" ? userName : m.speaker === "AI" ? "Atlas AI" : "Nova AI";
      return `${name}: ${m.text}`;
    })
    .join("\n");
}

const TASK_CREATION_KEYWORDS = [
  "create a task", "create task", "add a task", "add task",
  "make a task", "make task", "new task",
  "schedule a task", "schedule task", "add to backlog", "put in backlog",
  "log a task", "log task", "create a ticket", "add a ticket", "new ticket",
  "add to sprint", "put in sprint", "add this to the sprint",
  "track this", "track it", "let's track",
  "sukurk task", "pridek task", "pridėk task", "sukurk užduotį",
  "pridek i backlog", "pridėk į backlogą",
];

export function messageRequestsTaskCreation(message: string): boolean {
  const lower = message.toLowerCase();
  return TASK_CREATION_KEYWORDS.some((kw) => lower.includes(kw));
}

function buildAtlasPrompt(
  message: string,
  history: HistoryMessage[],
  meetingContext: string,
  projectContext: string,
  previousMeetingsContext: string,
  allowTaskCreation: boolean,
  userName: string,
): string {
  const taskSection = allowTaskCreation ? `
You have ONE special capability in this message: if ${userName} asked you to create/add a task, include a "createTask" field.

CRITICAL RULES about task creation:
- If you include "createTask" in JSON → your reply text MUST say "I'm creating task: [title]"
- If you do NOT include "createTask" → your reply MUST NOT say "I created", "I will create", "I'm creating", or any similar phrase
- Never claim to create a task unless createTask is actually in your JSON response
- The system will handle the actual task creation — you just need to include the field

Respond with JSON ONLY:
{
  "reply": "your 2-4 sentence conversational response (only mention task creation if createTask is included)",
  "createTask": {
    "title": "concise task title (max 60 chars)",
    "description": "detailed description of what needs to be done and how",
    "summary": "1-2 sentence acceptance criteria — what done looks like",
    "priority": "Low" | "Medium" | "High",
    "storyPoints": 1 | 2 | 3 | 5 | 8 | 13
  }
}

If you decide NOT to create a task, omit "createTask" entirely:
{ "reply": "your response (no mention of creating tasks)" }` : `
Respond with JSON ONLY: { "reply": "your 2-4 sentence conversational response" }`;

  return `You are Atlas AI, an AI Developer participating in a team meeting inside SoloSynq.ai — a Scrum project management tool.

Meeting participants: ${userName} (Developer), Atlas AI (you — Developer), Nova AI (Reviewer).
${projectContext ? `\nProject context:\n${projectContext}\n` : ""}${previousMeetingsContext ? `\n${previousMeetingsContext}\n` : ""}
Current meeting topic / context:
${meetingContext || "General sprint discussion"}

Current conversation:
${formatHistory(history, userName)}

${userName} just said: "${message}"

Respond as Atlas AI from a developer's perspective. Be concrete, practical, and direct. Keep it to 2-4 sentences.
${taskSection}`;
}

function buildNovaPrompt(
  message: string,
  history: HistoryMessage[],
  meetingContext: string,
  projectContext: string,
  previousMeetingsContext: string,
  atlasReply: string,
  userName: string,
): string {
  return `You are Nova AI, an AI Code Reviewer participating in a team meeting inside SoloSynq.ai.

Meeting participants: ${userName} (Developer), Atlas AI (Developer), Nova AI (you — Reviewer).
${projectContext ? `\nProject context:\n${projectContext}\n` : ""}${previousMeetingsContext ? `\n${previousMeetingsContext}\n` : ""}
Current meeting topic / context:
${meetingContext || "General sprint discussion"}

Current conversation:
${formatHistory(history, userName)}

${userName} just said: "${message}"
Atlas AI just responded: "${atlasReply}"

Respond as Nova AI from a quality/review perspective. Add a complementary viewpoint, flag risks, or validate Atlas's approach.
Be direct. 2-3 sentences max.
Reply with ONLY plain text, no JSON, no formatting.`;
}

async function callGemini(apiKey: string, prompt: string, json = false): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
        ...(json && { responseMimeType: "application/json" }),
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Gemini error ${res.status}`);
  }
  const data = await res.json();
  return (data.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const {
    message,
    history = [],
    meetingContext = "",
    projectContext = "",
    previousMeetingsContext = "",
    userName = "Developer",
  } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const allowTaskCreation = messageRequestsTaskCreation(message);

  try {
    const atlasRaw = await callGemini(
      apiKey,
      buildAtlasPrompt(message, history, meetingContext, projectContext, previousMeetingsContext, allowTaskCreation, userName),
      true,
    );

    let atlasReply = atlasRaw;
    let createTask: Record<string, unknown> | undefined;

    try {
      const parsed = JSON.parse(atlasRaw);
      atlasReply = parsed.reply ?? atlasRaw;
      if (allowTaskCreation && parsed.createTask && typeof parsed.createTask === "object") {
        createTask = parsed.createTask;
      }
    } catch {
      // Atlas returned plain text — no task creation
    }

    const novaReply = await callGemini(
      apiKey,
      buildNovaPrompt(message, history, meetingContext, projectContext, previousMeetingsContext, atlasReply, userName),
    );

    return NextResponse.json({ atlasReply, novaReply, createTask });
  } catch {
    return NextResponse.json({ error: "AI meeting failed" }, { status: 500 });
  }
}
