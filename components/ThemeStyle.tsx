"use client";
import { THEMES, ThemeKey } from "@/lib/themes";

export default function ThemeStyle({ themeKey, children }: { themeKey: ThemeKey; children: React.ReactNode }) {
  const theme = THEMES[themeKey] ?? THEMES.raccoon_bbq;
  const style = theme.vars as React.CSSProperties;
  return (
    <div style={style} className="bg-[var(--bg)] text-[var(--cream)] min-h-screen transition-colors">
      {children}
    </div>
  );
}
