import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify, generateHostKey } from "@/lib/slug";
import { geocodeAddress } from "@/lib/places";
import { THEMES, ThemeKey } from "@/lib/themes";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string" || typeof body.address !== "string") {
    return NextResponse.json({ error: "title and address are required" }, { status: 400 });
  }

  const theme: ThemeKey = THEMES[body.theme as ThemeKey] ? body.theme : "raccoon_bbq";
  const slug = slugify(body.title);
  const hostKey = generateHostKey();

  const geo = await geocodeAddress(body.address).catch(() => null);

  const gathering = await prisma.gathering.create({
    data: {
      slug,
      hostKey,
      title: body.title,
      hostName: body.hostName ?? null,
      eventDate: body.eventDate ? new Date(body.eventDate) : null,
      address: body.address,
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      theme
    }
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  return NextResponse.json({
    slug: gathering.slug,
    hostKey: gathering.hostKey,
    guestUrl: `${base}/g/${gathering.slug}`,
    hostUrl: `${base}/g/${gathering.slug}/host?key=${gathering.hostKey}`
  });
}
