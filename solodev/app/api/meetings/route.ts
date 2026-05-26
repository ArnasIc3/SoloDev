import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function format(m: {
  id: number;
  name: string;
  description: string | null;
  taskId: string | null;
  taskTitle: string | null;
  sprintName: string | null;
  messages: string;
  createdAt: Date;
}) {
  return {
    id:          m.id,
    name:        m.name,
    description: m.description ?? undefined,
    taskId:      m.taskId ?? undefined,
    taskTitle:   m.taskTitle ?? undefined,
    sprintName:  m.sprintName ?? undefined,
    messages:    JSON.parse(m.messages),
    createdAt:   m.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const meetings = await prisma.meeting.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ meetings: meetings.map(format) });
  } catch (err) {
    console.error("[meetings GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, taskId, taskTitle, sprintName, messages } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages are required" }, { status: 400 });
  }

  const meeting = await prisma.meeting.create({
    data: {
      name:        name.trim(),
      description: description?.trim() || null,
      taskId:      taskId ?? null,
      taskTitle:   taskTitle ?? null,
      sprintName:  sprintName ?? null,
      messages:    JSON.stringify(messages),
      userId:      session.userId,
    },
  });

  return NextResponse.json({ meeting: format(meeting) }, { status: 201 });
}
