"use client";
import { THEMES, ThemeKey } from "@/lib/themes";

export default function ThemeStyle({ themeKey, children }: { themeKey: ThemeKey; children: React.ReactNode }) {
  const theme = THEMES[themeKey] ?? THEMES.raccoon_bbq;
  const style = theme.vars as React.CSSProperties;

  if (theme.backgroundImage) {
    return (
      <div style={style} className="relative min-h-screen text-[var(--cream)] transition-colors">
        {/* Background photo, fixed so it doesn't scroll with content */}
        <div
          className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${theme.backgroundImage})` }}
        />
        {/* Dark overlay so text/cards stay legible over the photo */}
        <div
          className="fixed inset-0 -z-10"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, var(--bg) 55%, var(--bg) 100%)" }}
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
