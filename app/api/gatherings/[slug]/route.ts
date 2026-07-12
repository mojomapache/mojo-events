import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { classifyFreeText } from "@/lib/ai";

const VALID_STATUSES = new Set(["coming", "maybe", "not"]);

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const gathering = await prisma.gathering.findUnique({ where: { slug: params.slug } });
  if (!gathering) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const guests = await prisma.guest.findMany({
    where: { gatheringId: gathering.id },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ guests });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const gathering = await prisma.gathering.findUnique({ where: { slug: params.slug } });
  if (!gathering) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const status = VALID_STATUSES.has(body.status) ? body.status : "coming";
  const freeText = typeof body.freeText === "string" ? body.freeText.trim() : "";

  // Original guest text is always kept as-is; labels are a derived,
  // host-editable annotation on top of it, never a replacement for it.
  const labels = status === "not" ? [] : await classifyFreeText(freeText);

  const guest = await prisma.guest.create({
    data: {
      gatheringId: gathering.id,
      name: body.name.trim(),
      status,
      partySize: Number.isFinite(Number(body.partySize)) ? Number(body.partySize) : 0,
      dietary: typeof body.dietary === "string" ? body.dietary.trim() : null,
      freeText: freeText || null,
      labels
    }
  });

  return NextResponse.json({ guest });
}
