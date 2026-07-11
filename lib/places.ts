// Thin wrapper around the Google Places API (New), following the plan in
// the project's original Part 1 doc: geocode once, then run a handful of
// category-scoped searchNearby calls and dedupe by place id.

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.primaryType",
  "places.types",
  "places.rating",
  "places.userRatingCount",
  "places.regularOpeningHours",
  "places.currentOpeningHours",
  "places.delivery",
  "places.googleMapsUri"
].join(",");

const CATEGORY_GROUPS: { includedTypes: string[]; icon: string; tag: string }[] = [
  { includedTypes: ["restaurant"], icon: "🍽️", tag: "Restaurant" },
  { includedTypes: ["cafe"], icon: "☕", tag: "Cafe" },
  { includedTypes: ["bar"], icon: "🍹", tag: "Bar" },
  { includedTypes: ["grocery_or_supermarket"], icon: "🛒", tag: "Grocery" },
  { includedTypes: ["liquor_store"], icon: "🍺", tag: "Liquor store" }
];

export type NormalizedPlace = {
  googlePlaceId: string;
  name: string;
  address: string;
  tag: string;
  icon: string;
  rating: number | null;
  reviews: number | null;
  hours: string | null;
  openNow: boolean | null;
  delivery: boolean;
  mapUrl: string;
};

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const loc = data?.results?.[0]?.geometry?.location;
  return loc ? { lat: loc.lat, lng: loc.lng } : null;
}

export async function fetchNearbyPlaces(lat: number, lng: number, radiusMeters = 1500): Promise<NormalizedPlace[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const results = await Promise.all(
    CATEGORY_GROUPS.map(async (group) => {
      try {
        const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": FIELD_MASK
          },
          body: JSON.stringify({
            includedTypes: group.includedTypes,
            maxResultCount: 8,
            rankPreference: "POPULARITY",
            locationRestriction: {
              circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters }
            }
          })
        });
        if (!res.ok) return [];
        const data = await res.json();
        const places = (data?.places ?? []) as any[];
        return places.map((p) => normalizePlace(p, group));
      } catch {
        return [];
      }
    })
  );

  const flat = results.flat();
  const seen = new Set<string>();
  const deduped: NormalizedPlace[] = [];
  for (const place of flat) {
    if (seen.has(place.googlePlaceId)) continue;
    seen.add(place.googlePlaceId);
    deduped.push(place);
  }
  return deduped.slice(0, 20);
}

function normalizePlace(p: any, group: { icon: string; tag: string }): NormalizedPlace {
  const hoursToday = p.currentOpeningHours?.weekdayDescriptions?.[0] ?? p.regularOpeningHours?.weekdayDescriptions?.[0] ?? null;
  return {
    googlePlaceId: p.id,
    name: p.displayName?.text ?? "Unknown",
    address: p.formattedAddress ?? "",
    tag: group.tag,
    icon: group.icon,
    rating: typeof p.rating === "number" ? p.rating : null,
    reviews: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
    hours: hoursToday,
    openNow: typeof p.currentOpeningHours?.openNow === "boolean" ? p.currentOpeningHours.openNow : null,
    delivery: Boolean(p.delivery),
    mapUrl: p.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.displayName?.text ?? "")}`
  };
}
