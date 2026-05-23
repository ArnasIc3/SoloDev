import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  const { searchParams } = new URL(req.url);
  const sprintId = searchParams.get("sprintId");

  const tasks = await prisma.task.findMany({
    where: sprintId ? { sprintId: Number(sprintId) } : undefined,
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ tasks: tasks.map(formatTask) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, priority, storyPoints, assignee, sprintId } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const allIds = await prisma.task.findMany({ select: { taskId: true } });
  const maxNum = allIds.reduce((max, t) => {
    const n = parseInt(t.taskId.replace("SM-", ""), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const taskId = `SM-${maxNum + 1}`;

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
    },
  });

  return NextResponse.json({ task: formatTask(task) }, { status: 201 });
}
