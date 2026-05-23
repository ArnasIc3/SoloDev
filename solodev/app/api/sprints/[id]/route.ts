import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatSprint(s: {
  id: number;
  name: string;
  shortName: string;
  goal: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
}) {
  return {
    id: s.id,
    name: s.name,
    shortName: s.shortName,
    goal: s.goal ?? "",
    status: s.status,
    startDate: s.startDate?.toISOString().split("T")[0] ?? null,
    endDate: s.endDate?.toISOString().split("T")[0] ?? null,
  };
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await req.json();
  const { status, name, shortName, goal, startDate, endDate } = body;

  const sprint = await prisma.sprint.update({
    where: { id: Number(id) },
    data: {
      ...(status !== undefined && { status }),
      ...(name !== undefined && { name }),
      ...(shortName !== undefined && { shortName }),
      ...(goal !== undefined && { goal }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
    },
  });

  return NextResponse.json({ sprint: formatSprint(sprint) });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  await prisma.sprint.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
