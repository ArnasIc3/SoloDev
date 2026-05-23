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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await req.json();
  const { status, assignee, sprintId, title, description, priority, storyPoints, aiOutput } = body;

  const task = await prisma.task.update({
    where: { taskId: id },
    data: {
      ...(status !== undefined && { status }),
      ...(assignee !== undefined && { assignee }),
      ...(sprintId !== undefined && { sprintId: sprintId === null ? null : Number(sprintId) }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(priority !== undefined && { priority }),
      ...(storyPoints !== undefined && { storyPoints: Number(storyPoints) }),
      ...(aiOutput !== undefined && { aiOutput }),
    },
  });

  return NextResponse.json({ task: formatTask(task) });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  await prisma.task.delete({ where: { taskId: id } });
  return NextResponse.json({ success: true });
}
