import { NextRequest, NextResponse } from "next/server";

// Countries where Spanish should be the default. Not exhaustive of every
// Spanish-speaking place, but covers the large ones. Only affects the
// *default* -- the in-app language toggle always overrides this.
const SPANISH_DEFAULT_COUNTRIES = new Set([
  "ES", "MX", "AR", "CO", "PE", "VE", "CL", "EC", "GT", "CU",
  "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR", "GQ"
]);

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Only set a default once -- if the visitor already has a lang cookie
  // (from a previous visit or from using the in-app toggle), never override it.
  if (req.cookies.get("lang")) return res;

  // Vercel sets this header automatically at the edge based on the
  // visitor's IP; it's empty/absent when running locally with `next dev`.
  const country = req.headers.get("x-vercel-ip-country") ?? "";
  const lang = SPANISH_DEFAULT_COUNTRIES.has(country) ? "es" : "en";

  res.cookies.set("lang", lang, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/"
  });

  return res;
}

export const config = {
  // Run on normal page routes; skip static assets and API routes.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|backgrounds).*)"]
};
