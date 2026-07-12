// Thin wrapper around the Google Places API (New), following the plan in
// the project's original Part 1 doc: geocode once, then run a handful of
// category-scoped searchNearby calls and dedupe by place id.

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
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
  lat: number | null;
  lng: number | null;
};

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => null);

  // Geocoding API returns 200 even on logical failures (bad key, no results),
  // with the real error in the JSON body -- so check `status`, not just res.ok.
  if (!res.ok || !data || data.status !== "OK") {
    console.error("[geocodeAddress] failed", {
      httpStatus: res.status,
      apiStatus: data?.status,
      errorMessage: data?.error_message
    });
    return null;
  }

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
            rankPreference: "DISTANCE",
            locationRestriction: {
              circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters }
            }
          })
        });
        if (!res.ok) {
          const errorBody = await res.json().catch(() => null);
          console.error("[fetchNearbyPlaces] failed", {
            category: group.includedTypes[0],
            httpStatus: res.status,
            errorMessage: errorBody?.error?.message,
            errorStatus: errorBody?.error?.status
          });
          return [];
        }
        const data = await res.json();
        const places = (data?.places ?? []) as any[];
        return places.map((p) => normalizePlace(p, group));
      } catch (err) {
        console.error("[fetchNearbyPlaces] network error", { category: group.includedTypes[0], err: String(err) });
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

  // Each category call is individually distance-ranked by Google, but after
  // merging five separate category results together the combined list isn't
  // sorted overall -- so re-sort by actual distance from the gathering's
  // coordinates here. Places missing a location (shouldn't normally happen)
  // sort to the end rather than the front.
  deduped.sort((a, b) => {
    const distA = a.lat != null && a.lng != null ? haversineMeters(lat, lng, a.lat, a.lng) : Infinity;
    const distB = b.lat != null && b.lng != null ? haversineMeters(lat, lng, b.lat, b.lng) : Infinity;
    return distA - distB;
  });

  return deduped.slice(0, 20);
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
    mapUrl: p.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.displayName?.text ?? "")}`,
    lat: typeof p.location?.latitude === "number" ? p.location.latitude : null,
    lng: typeof p.location?.longitude === "number" ? p.location.longitude : null
  };
}
