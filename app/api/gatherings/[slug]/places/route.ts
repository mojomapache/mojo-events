import { NextRequest, NextResponse } from "next/server";
import type { Place } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isHostAuthorized } from "@/lib/auth";
import { fetchNearbyPlaces, NormalizedPlace } from "@/lib/places";

const CACHE_REFRESH_MS = 48 * 60 * 60 * 1000; // 48h, within the 24-72h window from the original plan

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const gathering = await prisma.gathering.findUnique({
    where: { slug: params.slug },
    include: { places: { orderBy: { sortOrder: "asc" } }, placesCache: true }
  });
  if (!gathering) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hostPicks = gathering.places.filter((p: Place) => p.hostPick);

  let autoPlaces: NormalizedPlace[] = [];
  const cache = gathering.placesCache;
  const isFresh = cache && Date.now() - cache.fetchedAt.getTime() < CACHE_REFRESH_MS;

  if (isFresh) {
    autoPlaces = cache!.rawJson as unknown as NormalizedPlace[];
  } else if (gathering.lat != null && gathering.lng != null) {
    autoPlaces = await fetchNearbyPlaces(gathering.lat, gathering.lng);
    // Exclude anything the host already curated by name, to avoid dupes.
    const hostNames = new Set(hostPicks.map((p: Place) => p.name.toLowerCase()));
    autoPlaces = autoPlaces.filter((p) => !hostNames.has(p.name.toLowerCase()));

    await prisma.placesCache.upsert({
      where: { gatheringId: gathering.id },
      update: { rawJson: autoPlaces as any, fetchedAt: new Date() },
      create: { gatheringId: gathering.id, rawJson: autoPlaces as any }
    });
  } else if (cache) {
    // No API key / no coordinates but we have a stale cache -- better than nothing.
    autoPlaces = cache.rawJson as unknown as NormalizedPlace[];
  }

  return NextResponse.json({
    hostPicks: hostPicks.map(toClientShape),
    morePicks: autoPlaces
  });
}

function toClientShape(p: any) {
  return {
    id: p.id,
    name: p.name,
    address: p.address,
    tag: p.tag,
    icon: p.icon,
    rating: p.rating,
    reviews: p.reviews,
    hours: p.hours,
    openNow: p.openNow,
    delivery: p.delivery,
    note: p.note,
    website: p.website,
    orderLabel: p.orderLabel,
    cashOnly: p.cashOnly
  };
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const gathering = await prisma.gathering.findUnique({ where: { slug: params.slug } });
  if (!gathering) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isHostAuthorized(gathering.hostKey, req)) {
    return NextResponse.json({ error: "Host key required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Place name is required" }, { status: 400 });
  }

  const place = await prisma.place.create({
    data: {
      gatheringId: gathering.id,
      name: body.name.trim(),
      address: body.address ?? null,
      tag: body.tag ?? null,
      icon: body.icon ?? "📍",
      rating: typeof body.rating === "number" ? body.rating : null,
      reviews: typeof body.reviews === "number" ? body.reviews : null,
      hours: body.hours ?? null,
      openNow: typeof body.openNow === "boolean" ? body.openNow : null,
      delivery: Boolean(body.delivery),
      note: body.note ?? null,
      website: body.website ?? null,
      orderLabel: Boolean(body.orderLabel),
      cashOnly: Boolean(body.cashOnly),
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      hostPick: true
    }
  });

  return NextResponse.json({ place: toClientShape(place) });
}
