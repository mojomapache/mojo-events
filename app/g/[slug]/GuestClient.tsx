"use client";
import { useEffect, useState } from "react";
import ThemeStyle from "@/components/ThemeStyle";
import PlaceCard, { PlaceCardData } from "@/components/PlaceCard";
import { THEMES, ThemeKey } from "@/lib/themes";
import { STRINGS, Lang } from "@/lib/i18n";

type Gathering = {
  title: string; hostName: string | null; eventDate: string | null; address: string;
  theme: ThemeKey; foodPlan: "hosted" | "space" | "hybrid";
  hostPicksLabel: string | null; moreNearbyLabel: string | null;
};
type Guest = { id: string; name: string; status: string; partySize: number };

export default function GuestClient({ slug }: { slug: string }) {
  const [lang, setLang] = useState<Lang>("en");
  const [gathering, setGathering] = useState<Gathering | null>(null);
  const [hostPicks, setHostPicks] = useState<PlaceCardData[]>([]);
  const [morePicks, setMorePicks] = useState<PlaceCardData[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [showAddress, setShowAddress] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({ name: "", status: "coming", partySize: 1, dietary: "", freeText: "" });
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const t = STRINGS[lang];

  async function loadAll() {
    const [gRes, pRes, rRes] = await Promise.all([
      fetch(`/api/gatherings/${slug}`),
      fetch(`/api/gatherings/${slug}/places`),
      fetch(`/api/gatherings/${slug}/rsvp`)
    ]);
    if (!gRes.ok) { setNotFound(true); setLoading(false); return; }
    const g = await gRes.json();
    const p = await pRes.json();
    const r = await rRes.json();
    setGathering(g);
    setHostPicks(p.hostPicks ?? []);
    setMorePicks(p.morePicks ?? []);
    setGuests(r.guests ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug]);

  async function submitRsvp() {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/gatherings/${slug}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const { guest } = await res.json();
        setGuests((prev) => [guest, ...prev]);
        setForm({ name: "", status: "coming", partySize: 1, dietary: "", freeText: "" });
        setJustSubmitted(true);
        setTimeout(() => setJustSubmitted(false), 2500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <ThemeStyle themeKey="raccoon_bbq"><div className="p-8 text-center text-[var(--cream-dim)]">…</div></ThemeStyle>;
  if (notFound || !gathering) return <ThemeStyle themeKey="raccoon_bbq"><div className="p-8 text-center">Gathering not found.</div></ThemeStyle>;

  const theme = THEMES[gathering.theme] ?? THEMES.raccoon_bbq;
  const tagline = theme.tagline ? theme.tagline[lang] : t.tagline;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gathering.address)}`;

  return (
    <ThemeStyle themeKey={gathering.theme}>
      <div className="max-w-[880px] mx-auto px-5 pt-6">
        <div className="flex justify-between items-center mb-5 flex-wrap gap-2.5">
          <div className="font-disp text-xl font-semibold flex items-center gap-2">
            <span>{theme.heroEmoji}</span> {t.appName}
          </div>
          <button onClick={() => setLang(lang === "en" ? "es" : "en")} className="text-sm border border-[var(--border-strong)] rounded-full px-3.5 py-1.5 text-[var(--cream-dim)]">
            🌐 {t.langToggle}
          </button>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden mb-6">
          <div className="lights" />
          <div className="px-7 pt-6 pb-6">
            <p className="font-mono text-[0.72rem] tracking-wide text-[var(--accent)] uppercase mb-1.5">{tagline}</p>
            <h1 className="font-disp text-[2.1rem] font-semibold leading-tight mb-2.5">{theme.heroEmoji} {gathering.title}</h1>
            <p className="text-[var(--cream-dim)] text-[0.95rem] mb-4">
              {gathering.hostName && <>{t.hostedBy} {gathering.hostName} &middot; </>}
              {gathering.eventDate && new Date(gathering.eventDate).toLocaleDateString(lang, { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <div className="flex items-center gap-2.5 flex-wrap">
              <button onClick={() => setShowAddress((s) => !s)} className="bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-full px-3.5 py-2 flex items-center gap-2 text-sm font-semibold">
                📍 {showAddress ? t.hideAddress : t.showAddress}
              </button>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.78rem] font-semibold border border-[var(--border-strong)] text-[var(--cream-dim)]">
                {t.foodPlan[gathering.foodPlan]}
              </span>
            </div>
            {showAddress && (
              <div className="mt-3.5 pt-3.5 border-t border-[var(--border)] flex justify-between items-center flex-wrap gap-2.5">
                <span className="font-mono text-sm">{gathering.address}</span>
                <a href={mapUrl} target="_blank" rel="noreferrer" className="text-[var(--accent)] text-[0.82rem] font-semibold no-underline">{t.getDirections} ↗</a>
              </div>
            )}
          </div>
        </div>

        {gathering.foodPlan !== "hosted" && (
          <div className="mb-6">
            <h2 className="font-disp text-lg font-semibold mb-1">{t.nearbyTitle}</h2>

            <p className="font-mono text-[0.7rem] tracking-wide text-[var(--accent)] uppercase mt-3.5 mb-2">
              {gathering.hostPicksLabel || t.hostPicksTitle}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {hostPicks.map((p) => <PlaceCard key={p.id} place={{ ...p, hostPick: true }} lang={lang} />)}
            </div>

            <button onClick={() => setMoreOpen((o) => !o)} className="flex items-center gap-1.5 bg-transparent border-none p-0 mt-3.5 mb-2">
              <span className="font-mono text-[0.7rem] tracking-wide text-[var(--cream-dim)] uppercase">{gathering.moreNearbyLabel || t.morePicksTitle}</span>
              <span className={`text-[0.7rem] text-[var(--muted)] transition-transform ${moreOpen ? "rotate-180" : ""}`}>▾</span>
            </button>
            {moreOpen && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {morePicks.map((p, i) => <PlaceCard key={p.name + i} place={p} lang={lang} />)}
              </div>
            )}
          </div>
        )}

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 mb-6">
          <h2 className="font-disp text-lg font-semibold mb-4">{t.rsvpTitle}</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[0.78rem] text-[var(--cream-dim)] mb-1">{t.yourName}</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t.yourName} className={inputClass} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["coming", "maybe", "not"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={`text-[0.78rem] font-semibold rounded-full px-3 py-1.5 border ${
                    form.status === s
                      ? s === "coming" ? "bg-[var(--sage-dim)] border-[var(--sage)] text-[var(--sage)]"
                      : s === "maybe" ? "bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--clay-dim)] border-[var(--clay)] text-[var(--clay)]"
                      : "border-[var(--border-strong)] text-[var(--cream-dim)]"
                  }`}
                >
                  {form.status === s && "✓ "}{t.status[s]}
                </button>
              ))}
            </div>
            {form.status !== "not" && (
              <>
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <div>
                    <label className="block text-[0.78rem] text-[var(--cream-dim)] mb-1">{t.partySize}</label>
                    <input type="number" min={0} value={form.partySize} onChange={(e) => setForm((f) => ({ ...f, partySize: Number(e.target.value) }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[0.78rem] text-[var(--cream-dim)] mb-1">{t.dietary}</label>
                    <input value={form.dietary} onChange={(e) => setForm((f) => ({ ...f, dietary: e.target.value }))} placeholder={t.dietaryPh} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-[0.78rem] text-[var(--cream-dim)] mb-1">{t.bringing}</label>
                  <textarea rows={2} value={form.freeText} onChange={(e) => setForm((f) => ({ ...f, freeText: e.target.value }))} placeholder={t.bringingPh} className={inputClass} />
                  <p className="text-[0.72rem] text-[var(--muted)] mt-1">{lang === "en" ? "We'll tag this automatically once you submit." : "Lo etiquetaremos automáticamente al enviar."}</p>
                </div>
              </>
            )}
            <button onClick={submitRsvp} disabled={submitting} className="bg-[var(--accent)] text-[#241900] rounded-xl py-3 font-bold text-sm mt-1 disabled:opacity-60">
              {justSubmitted ? t.submitted : submitting ? "…" : t.submit}
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-disp text-base font-semibold mb-2.5">{t.recentGuests}</h3>
          {guests.length === 0 ? (
            <p className="text-[var(--muted)] text-sm">{t.emptyGuests}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {guests.slice(0, 6).map((g) => (
                <div key={g.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
                  <span className={`text-[0.7rem] font-semibold rounded-full px-2 py-0.5 border ${
                    g.status === "coming" ? "bg-[var(--sage-dim)] border-[var(--sage)] text-[var(--sage)]"
                    : g.status === "maybe" ? "bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]"
                    : "bg-[var(--clay-dim)] border-[var(--clay)] text-[var(--clay)]"
                  }`}>
                    {t.status[g.status as "coming" | "maybe" | "not"]}
                  </span>
                  <span className="font-semibold text-sm">{g.name}</span>
                  {g.partySize > 0 && <span className="text-[0.78rem] text-[var(--muted)]">×{g.partySize}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ThemeStyle>
  );
}

const inputClass = "w-full bg-[var(--bg-panel)] border border-[var(--border-strong)] text-[var(--cream)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]";
