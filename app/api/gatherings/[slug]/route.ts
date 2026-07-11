import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isHostAuthorized } from "@/lib/auth";
import { geocodeAddress } from "@/lib/places";
import { THEMES, ThemeKey } from "@/lib/themes";

// Fields any visitor (guest or host) can see. hostKey is intentionally
// never included in this response.
function publicShape(g: any) {
  return {
    slug: g.slug,
    title: g.title,
    hostName: g.hostName,
    eventDate: g.eventDate,
    address: g.address,
    lat: g.lat,
    lng: g.lng,
    theme: g.theme,
    foodPlan: g.foodPlan,
    hostPicksLabel: g.hostPicksLabel,
    moreNearbyLabel: g.moreNearbyLabel
  };
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const gathering = await prisma.gathering.findUnique({ where: { slug: params.slug } });
  if (!gathering) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isHost = isHostAuthorized(gathering.hostKey, req);
  return NextResponse.json({ ...publicShape(gathering), isHost });
}

const EDITABLE_FIELDS = ["title", "hostName", "eventDate", "address", "theme", "foodPlan", "hostPicksLabel", "moreNearbyLabel"] as const;

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const gathering = await prisma.gathering.findUnique({ where: { slug: params.slug } });
  if (!gathering) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isHostAuthorized(gathering.hostKey, req)) {
    return NextResponse.json({ error: "Host key required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }
  if (typeof data.theme === "string" && !THEMES[data.theme as ThemeKey]) delete data.theme;
  if (typeof data.eventDate === "string") data.eventDate = new Date(data.eventDate);

  // Address changed -> re-geocode so the directions link / places search
  // stay accurate. This does not automatically refresh the places cache;
  // that happens lazily on the next GET /places call past the refresh window.
  if (typeof data.address === "string" && data.address !== gathering.address) {
    const geo = await geocodeAddress(data.address).catch(() => null);
    data.lat = geo?.lat ?? null;
    data.lng = geo?.lng ?? null;
  }

  const updated = await prisma.gathering.update({ where: { slug: params.slug }, data });
  return NextResponse.json({ ...publicShape(updated), isHost: true });
}
