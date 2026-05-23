import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const members = await prisma.teamMember.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ members });
}
