import { NextRequest } from "next/server";

// Host access is a possession-based secret link, not a login. Whoever has
// the hostKey (from the private URL) can manage the gathering. Accept it
// either as a query param (?key=...) or an "x-host-key" header so the
// client can use it in both page loads and fetch() calls.
export function getHostKeyFromRequest(req: NextRequest): string | null {
  const fromHeader = req.headers.get("x-host-key");
  if (fromHeader) return fromHeader;
  const fromQuery = req.nextUrl.searchParams.get("key");
  return fromQuery ?? null;
}

export function isHostAuthorized(gatheringHostKey: string, req: NextRequest): boolean {
  const provided = getHostKeyFromRequest(req);
  return Boolean(provided) && provided === gatheringHostKey;
}
