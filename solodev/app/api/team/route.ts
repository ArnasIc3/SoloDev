import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const [members, session] = await Promise.all([
    prisma.teamMember.findMany({ orderBy: { id: "asc" } }),
    getSession(),
  ]);

  return NextResponse.json({
    members: members.map((m) => {
      if (m.id === "AR" && session) {
        const parts = session.name.trim().split(/\s+/);
        const initials = parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
        return { ...m, name: session.name, initials };
      }
      return m;
    }),
  });
}
