import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
  );
  const data = await res.json();
  const names = data.models
    ?.filter((m: { supportedGenerationMethods?: string[] }) =>
      m.supportedGenerationMethods?.includes("generateContent"),
    )
    .map((m: { name: string }) => m.name);
  return NextResponse.json({ models: names });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { message, context } = await req.json();

  const prompt = `You are a concise AI project assistant embedded in a sprint management tool.

Current project context:
${context}

Respond ONLY with a JSON object in this exact shape:
{
  "reply": "2-4 sentence answer to the user's question, direct and actionable",
  "insights": [
    { "title": "short insight title", "description": "1-2 sentence actionable insight" },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." }
  ],
  "summaryNote": "1-2 sentence sprint health summary based on current task distribution"
}

Always return exactly 3 insights based on the current project context. Update them to reflect any advice from your reply.

User: ${message}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 600,
          temperature: 0.7,
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
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Invalid JSON from Gemini", raw }, { status: 500 });
  }
}
