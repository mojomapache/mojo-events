import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isHostAuthorized } from "@/lib/auth";

const EDITABLE_FIELDS = ["name", "address", "tag", "icon", "note", "website", "orderLabel", "cashOnly", "delivery", "sortOrder"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; placeId: string } }
) {
  const gathering = await prisma.gathering.findUnique({ where: { slug: params.slug } });
  if (!gathering) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isHostAuthorized(gathering.hostKey, req)) {
    return NextResponse.json({ error: "Host key required" }, { status: 401 });
  }

  const place = await prisma.place.findFirst({ where: { id: params.placeId, gatheringId: gathering.id } });
  if (!place) return NextResponse.json({ error: "Place not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }

  const updated = await prisma.place.update({ where: { id: place.id }, data });
  return NextResponse.json({ place: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; placeId: string } }
) {
  const gathering = await prisma.gathering.findUnique({ where: { slug: params.slug } });
  if (!gathering) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isHostAuthorized(gathering.hostKey, req)) {
    return NextResponse.json({ error: "Host key required" }, { status: 401 });
  }

  await prisma.place.deleteMany({ where: { id: params.placeId, gatheringId: gathering.id } });
  return NextResponse.json({ ok: true });
}
