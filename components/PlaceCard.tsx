"use client";
import { useState } from "react";
import { Lang, STRINGS } from "@/lib/i18n";

export type PlaceCardData = {
  id?: string;
  name: string;
  address?: string | null;
  tag?: string | null;
  icon?: string | null;
  rating?: number | null;
  reviews?: number | null;
  hours?: string | null;
  openNow?: boolean | null;
  delivery?: boolean;
  note?: string | null;
  website?: string | null;
  orderLabel?: boolean;
  cashOnly?: boolean;
  hostPick?: boolean;
};

export default function PlaceCard({ place, lang }: { place: PlaceCardData; lang: Lang }) {
  const t = STRINGS[lang];
  const [copied, setCopied] = useState(false);

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    place.address ? `${place.name}, ${place.address}` : place.name
  )}`;

  async function copyName() {
    try {
      await navigator.clipboard.writeText(place.name);
    } catch {
      // Fallback for browsers without Clipboard API permission.
      const ta = document.createElement("textarea");
      ta.value = place.name;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative min-w-[240px] rounded-t border-t-[3px] border-t-[var(--accent)] bg-[var(--bg-card)] border border-[var(--border)] rounded-b-xl p-4 hover:bg-[var(--bg-card-hover)] transition-colors">
      {place.hostPick && (
        <span className="absolute bottom-2 right-2 rounded-full bg-[var(--accent)] text-[#241900] text-[0.66rem] font-bold px-2.5 py-0.5 z-10">★</span>
      )}
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-[34px] h-[34px] rounded-lg bg-[var(--bg-panel)] flex items-center justify-center shrink-0 text-[17px]">
          {place.icon ?? "📍"}
        </div>
        <div className="min-w-0">
          <a href={mapUrl} target="_blank" rel="noreferrer" className="no-underline text-inherit">
            <p className="font-disp font-semibold text-[1.02rem] leading-tight underline decoration-[var(--border-strong)] underline-offset-4">
              {place.name}
            </p>
          </a>
          <div className="flex items-center gap-1 mt-0.5 text-[0.8rem] text-[var(--cream-dim)]">
            <span className="text-[var(--accent)]">★</span>
            <span>{place.rating ?? "—"} · {place.reviews ?? 0} {t.reviews}</span>
          </div>
          {place.tag && (
            <span className="inline-block mt-1 text-[0.68rem] font-semibold text-[var(--cream-dim)] bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-full px-2.5 py-0.5">
              {place.tag}
            </span>
          )}
          {place.cashOnly && (
            <span className="inline-block mt-1 ml-1 text-[0.68rem] font-bold text-[var(--clay)] bg-[var(--clay-dim)] border border-[var(--clay)] rounded-full px-2.5 py-0.5">
              💵 {t.cashOnly}
            </span>
          )}
        </div>
      </div>

      {place.hours && (
        <div className={`flex items-center gap-1.5 text-[0.78rem] mb-1 ${place.openNow ? "text-[var(--sage)]" : "text-[var(--muted)]"}`}>
          🕐 <span>{place.openNow ? t.openNow : t.closedNow} · {place.hours}</span>
        </div>
      )}

      <div className={`flex items-center gap-1.5 text-[0.78rem] ${place.delivery ? "text-[var(--cream-dim)]" : "text-[var(--muted)]"} ${place.note ? "mb-2" : "mb-2.5"}`}>
        🚚 <span>{place.delivery ? t.delivery : t.noDelivery}</span>
      </div>

      {place.note && (
        <p className="text-[0.78rem] text-[var(--cream-dim)] bg-[var(--bg-panel)] rounded-lg px-2.5 py-1.5 mb-2.5">{place.note}</p>
      )}

      <div className="flex items-center gap-3.5 flex-wrap">
        <button onClick={copyName} className={`inline-flex items-center gap-1.5 text-[0.78rem] font-semibold bg-transparent border-none p-0 ${copied ? "text-[var(--sage)]" : "text-[var(--accent)]"}`}>
          {copied ? t.copied : `📋 ${t.copyName}`}
        </button>
        <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-[var(--cream-dim)] no-underline">
          {t.viewOnMap} ↗
        </a>
        {place.website && (
          <a href={place.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-[var(--cream-dim)] no-underline">
            {place.orderLabel ? t.orderOnline : t.website} ↗
          </a>
        )}
      </div>
    </div>
  );
}
