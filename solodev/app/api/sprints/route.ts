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

export async function GET() {
  const sprints = await prisma.sprint.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ sprints: sprints.map(formatSprint) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, shortName, goal, startDate, endDate } = body;

  if (!name || !shortName) {
    return NextResponse.json({ error: "name and shortName are required" }, { status: 400 });
  }

  const sprint = await prisma.sprint.create({
    data: {
      name,
      shortName,
      goal: goal ?? null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: "planned",
    },
  });

  return NextResponse.json({ sprint: formatSprint(sprint) }, { status: 201 });
}
