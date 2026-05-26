import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const DEFAULTS = {
  name:        "My Project",
  techStack:   "",
  domain:      "",
  description: "",
};

function format(s: { id: number; name: string; techStack: string; domain: string; description: string }) {
  return { id: s.id, name: s.name, techStack: s.techStack, domain: s.domain, description: s.description };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await prisma.projectSettings.upsert({
      where:  { userId: session.userId },
      update: {},
      create: { userId: session.userId, ...DEFAULTS },
    });
    return NextResponse.json({ settings: format(settings) });
  } catch (err) {
    console.error("[settings GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, techStack, domain, description } = body;

  const settings = await prisma.projectSettings.upsert({
    where:  { userId: session.userId },
    update: {
      ...(name        !== undefined && { name }),
      ...(techStack   !== undefined && { techStack }),
      ...(domain      !== undefined && { domain }),
      ...(description !== undefined && { description }),
    },
    create: { userId: session.userId, ...DEFAULTS, ...body },
  });

  return NextResponse.json({ settings: format(settings) });
}
