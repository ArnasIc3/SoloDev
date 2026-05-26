import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function formatTask(t: {
  taskId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee: string;
  storyPoints: number;
  sprintId: number | null;
  aiOutput?: string | null;
}) {
  return {
    id: t.taskId,
    title: t.title,
    description: t.description ?? undefined,
    status: t.status,
    priority: t.priority,
    assignee: t.assignee,
    storyPoints: t.storyPoints,
    sprintId: t.sprintId,
    aiOutput: t.aiOutput ?? undefined,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sprintId = searchParams.get("sprintId");

    const tasks = await prisma.task.findMany({
      where: {
        userId: session.userId,
        ...(sprintId ? { sprintId: Number(sprintId) } : {}),
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ tasks: tasks.map(formatTask) });
  } catch (err) {
    console.error("[tasks GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, priority, storyPoints, assignee, sprintId } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const allIds = await prisma.task.findMany({ select: { taskId: true } });
    const maxNum = allIds.reduce((max, t) => {
      const n = parseInt(t.taskId.replace("SM-", ""), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const taskId = `SM-${maxNum + 1}`;

    try {
      const task = await prisma.task.create({
        data: {
          taskId,
          title: title.trim(),
          description: description?.trim() || null,
          priority: priority ?? "Medium",
          storyPoints: storyPoints ?? 2,
          assignee: assignee ?? "AR",
          status: "To Do",
          sprintId: sprintId ? Number(sprintId) : null,
          userId: session.userId,
        },
      });
      return NextResponse.json({ task: formatTask(task) }, { status: 201 });
    } catch (err: unknown) {
      const isUniqueViolation = err && typeof err === "object" && "code" in err && err.code === "P2002";
      if (!isUniqueViolation) throw err;
      // Another request grabbed this ID — refetch and retry
    }
  }

  return NextResponse.json({ error: "Failed to generate unique task ID, please try again" }, { status: 500 });
}
