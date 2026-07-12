"use client";
import { THEMES, ThemeKey } from "@/lib/themes";

export default function ThemeStyle({ themeKey, children }: { themeKey: ThemeKey; children: React.ReactNode }) {
  const theme = THEMES[themeKey] ?? THEMES.raccoon_bbq;
  const style = theme.vars as React.CSSProperties;

  if (theme.backgroundImage) {
    return (
      <div style={style} className="relative min-h-screen text-[var(--cream)] transition-colors">
        {/* Background photo, fixed so it doesn't scroll with content. Positioned toward the upper-middle band (where the string lights and raccoons sit) rather than dead-center, so wide screens don't crop toward the plain dark sky. */}
        <div
          className="fixed inset-0 -z-20 bg-cover bg-no-repeat"
          style={{ backgroundImage: `url(${theme.backgroundImage})`, backgroundPosition: "center 30%" }}
        />
        {/* Fades the photo into the normal solid background further down the page, so long scrolling content (RSVP form, dashboard) doesn't sit on a stretched/tiled image. No darkening near the top -- the photo shows at full brightness. */}
        <div
          className="fixed inset-0 -z-10"
          style={{ background: "linear-gradient(180deg, transparent 0%, transparent 40%, var(--bg) 70%, var(--bg) 100%)" }}
        />
        {children}
      </div>
    );
  }

  return (
    <div style={style} className="bg-[var(--bg)] text-[var(--cream)] min-h-screen transition-colors">
      {children}
    </div>
  );
}
