import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SETTINGS_ID = 1;

const DEFAULTS = {
  name:        "My Project",
  techStack:   "",
  domain:      "",
  description: "",
};

function format(s: { id: number; name: string; techStack: string; domain: string; description: string }) {
  return {
    id:          s.id,
    name:        s.name,
    techStack:   s.techStack,
    domain:      s.domain,
    description: s.description,
  };
}

export async function GET() {
  const settings = await prisma.projectSettings.upsert({
    where:  { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID, ...DEFAULTS },
  });
  return NextResponse.json({ settings: format(settings) });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { name, techStack, domain, description } = body;

  const settings = await prisma.projectSettings.upsert({
    where:  { id: SETTINGS_ID },
    update: {
      ...(name        !== undefined && { name }),
      ...(techStack   !== undefined && { techStack }),
      ...(domain      !== undefined && { domain }),
      ...(description !== undefined && { description }),
    },
    create: { id: SETTINGS_ID, ...DEFAULTS, ...body },
  });

  return NextResponse.json({ settings: format(settings) });
}
