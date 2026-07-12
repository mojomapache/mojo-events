"use client";
import { useEffect, useMemo, useState } from "react";
import ThemeStyle from "@/components/ThemeStyle";
import Logo from "@/components/Logo";
import { THEMES, ThemeKey } from "@/lib/themes";
import { STRINGS, Lang } from "@/lib/i18n";
import { LABEL_DEFINITIONS, labelName } from "@/lib/labels";
import { getCookieLang, setCookieLang } from "@/lib/cookieLang";

type Strings = (typeof STRINGS)[Lang];

type Gathering = {
  title: string; hostName: string | null; address: string; theme: ThemeKey;
  foodPlan: "hosted" | "space" | "hybrid"; hostPicksLabel: string | null; moreNearbyLabel: string | null; tagline: string | null;
  logoMode: "day" | "night";
  isHost: boolean;
};
type Guest = { id: string; name: string; status: string; partySize: number; dietary: string | null; freeText: string | null; labels: string[] };
type Place = {
  id: string; name: string; address: string | null; tag: string | null; icon: string | null;
  rating: number | null; reviews: number | null; note: string | null; website: string | null;
  cashOnly: boolean; orderLabel: boolean;
};

export default function HostClient({ slug, hostKey }: { slug: string; hostKey: string }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const cookieLang = getCookieLang();
    if (cookieLang) setLang(cookieLang);
  }, []);
  const [gathering, setGathering] = useState<Gathering | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [addingPlace, setAddingPlace] = useState(false);
  const t = STRINGS[lang];

  async function loadAll() {
    const [gRes, rRes, pRes] = await Promise.all([
      fetch(`/api/gatherings/${slug}?key=${hostKey}`),
      fetch(`/api/gatherings/${slug}/rsvp`),
      fetch(`/api/gatherings/${slug}/places`)
    ]);
    if (!gRes.ok) { setUnauthorized(true); setLoading(false); return; }
    const g = await gRes.json();
    if (!g.isHost) { setUnauthorized(true); setLoading(false); return; }
    setGathering(g);
    const r = await rRes.json();
    setGuests(r.guests ?? []);
    const p = await pRes.json();
    setPlaces(p.hostPicks ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug, hostKey]);

  async function patchGathering(data: Partial<Gathering>) {
    const res = await fetch(`/api/gatherings/${slug}?key=${hostKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const updated = await res.json();
      setGathering((prev) => (prev ? { ...prev, ...updated } : prev));
    }
  }

  async function saveNote(placeId: string, note: string) {
    await fetch(`/api/gatherings/${slug}/places/${placeId}?key=${hostKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note })
    });
    setPlaces((prev) => prev.map((p) => (p.id === placeId ? { ...p, note } : p)));
    setEditingNoteId(null);
  }

  async function addPlace(data: {
    name: string; address: string; tag: string; icon: string; website: string; cashOnly: boolean; orderLabel: boolean; note: string;
  }) {
    const res = await fetch(`/api/gatherings/${slug}/places?key=${hostKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const { place } = await res.json();
      setPlaces((prev) => [...prev, place]);
      setAddingPlace(false);
    }
  }

  async function deletePlace(placeId: string) {
    await fetch(`/api/gatherings/${slug}/places/${placeId}?key=${hostKey}`, { method: "DELETE" });
    setPlaces((prev) => prev.filter((p) => p.id !== placeId));
  }

  const counts = useMemo(() => ({
    coming: guests.filter((g) => g.status === "coming").length,
    maybe: guests.filter((g) => g.status === "maybe").length,
    not: guests.filter((g) => g.status === "not").length
  }), [guests]);
  const totalGuests = useMemo(
    () => guests.filter((g) => g.status !== "not").reduce((s, g) => s + (g.partySize || 0), 0),
    [guests]
  );
  const labelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    guests.forEach((g) => g.labels.forEach((l) => { counts[l] = (counts[l] || 0) + 1; }));
    return counts;
  }, [guests]);
  const maxLabelCount = Math.max(1, ...Object.values(labelCounts));
  const dietaryNotes = guests.filter((g) => g.dietary && g.dietary.trim());

  if (loading) return <ThemeStyle themeKey="raccoon_bbq"><div className="p-8 text-center text-[var(--cream-dim)]">…</div></ThemeStyle>;
  if (unauthorized || !gathering) {
    return (
      <ThemeStyle themeKey="raccoon_bbq">
        <div className="max-w-md mx-auto p-8 text-center">
          <p className="font-disp text-xl mb-2">Host link required</p>
          <p className="text-[var(--cream-dim)] text-sm">This page needs a valid <code>?key=</code> from your private host link.</p>
        </div>
      </ThemeStyle>
    );
  }

  const base = typeof window !== "undefined" ? window.location.origin : "";
  const guestUrl = `${base}/g/${slug}`;

  return (
    <ThemeStyle themeKey={gathering.theme}>
      <div className="max-w-[880px] mx-auto px-5 pt-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2.5">
          <div className="font-disp text-xl font-semibold flex items-center gap-2"><Logo mode={gathering.logoMode} /> {t.appName} · {t.hostView}</div>
          <button onClick={() => { const next = lang === "en" ? "es" : "en"; setLang(next); setCookieLang(next); }} className="text-sm border border-[var(--border-strong)] rounded-full px-3.5 py-1.5 text-[var(--cream-dim)]">
            🌐 {t.langToggle}
          </button>
        </div>

        <SectionCard label={lang === "en" ? "Guest link" : "Enlace de invitados"}>
          <div className="flex items-center gap-2">
            <input readOnly value={guestUrl} className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs" />
            <button onClick={() => navigator.clipboard.writeText(guestUrl)} className="text-xs border border-[var(--border-strong)] rounded-lg px-3 py-2 text-[var(--cream-dim)]">{t.copyLink}</button>
          </div>
        </SectionCard>

        <h2 className="font-disp text-2xl font-semibold mt-6 mb-1">{t.dashTitle}</h2>
        <p className="text-[var(--cream-dim)] text-sm mb-4">{t.dashSub}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-7">
          <StatCard label={t.statComing} value={counts.coming} color="var(--sage)" />
          <StatCard label={t.statMaybe} value={counts.maybe} color="var(--accent)" />
          <StatCard label={t.statNot} value={counts.not} color="var(--clay)" />
          <StatCard label={t.statGuests} value={totalGuests} color="var(--cream)" />
        </div>

        <div className="mb-7">
          <label className="block text-[0.78rem] text-[var(--cream-dim)] mb-2">{t.themeLabel}</label>
          <select
            value={gathering.theme}
            onChange={(e) => patchGathering({ theme: e.target.value as ThemeKey })}
            className="bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm"
          >
            {Object.entries(THEMES).map(([key, th]) => <option key={key} value={key}>{th.label}</option>)}
          </select>
        </div>

        <div className="mb-7">
          <label className="block text-[0.78rem] text-[var(--cream-dim)] mb-2">{t.logoModeLabel}</label>
          <div className="flex gap-2">
            <button
              onClick={() => patchGathering({ logoMode: "day" })}
              className={`flex items-center gap-2 text-sm font-semibold rounded-full px-3.5 py-1.5 border ${gathering.logoMode === "day" ? "bg-[var(--cream)] text-[var(--bg)] border-[var(--cream)]" : "border-[var(--border-strong)] text-[var(--cream-dim)]"}`}
            >
              <Logo mode="day" size={18} /> {t.logoModeDay}
            </button>
            <button
              onClick={() => patchGathering({ logoMode: "night" })}
              className={`flex items-center gap-2 text-sm font-semibold rounded-full px-3.5 py-1.5 border ${gathering.logoMode === "night" ? "bg-[var(--cream)] text-[var(--bg)] border-[var(--cream)]" : "border-[var(--border-strong)] text-[var(--cream-dim)]"}`}
            >
              <Logo mode="night" size={18} /> {t.logoModeNight}
            </button>
          </div>
          <p className="text-[0.75rem] text-[var(--muted)] mt-2">{t.logoModeNote}</p>
        </div>

        <div className="mb-7">
          <label className="block text-[0.78rem] text-[var(--cream-dim)] mb-2">{t.titlesSection}</label>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-2.5">
            <TitleField label={t.eventTitleLabel} value={gathering.title} onSave={(v) => patchGathering({ title: v })} />
            <TitleField label={t.taglineLabel} value={gathering.tagline ?? ""} placeholder={t.defaultEventTagline} onSave={(v) => patchGathering({ tagline: v })} />
            <TitleField label={t.hostPicksLabelField} value={gathering.hostPicksLabel ?? ""} placeholder={t.hostPicksTitle} onSave={(v) => patchGathering({ hostPicksLabel: v })} />
            <TitleField label={t.moreNearbyLabelField} value={gathering.moreNearbyLabel ?? ""} placeholder={t.morePicksTitle} onSave={(v) => patchGathering({ moreNearbyLabel: v })} />
          </div>
        </div>

        <div className="mb-7">
          <label className="block text-[0.78rem] text-[var(--cream-dim)] mb-2">{t.addressLabel}</label>
          <TitleField value={gathering.address} onSave={(v) => patchGathering({ address: v })} fullWidthInput />
          <p className="text-[0.75rem] text-[var(--muted)] mt-2">{t.addressNote}</p>
        </div>

        <div className="mb-7">
          <label className="block text-[0.78rem] text-[var(--cream-dim)] mb-2">{t.foodPlanLabel}</label>
          <div className="flex gap-2 flex-wrap">
            {(["hosted", "space", "hybrid"] as const).map((k) => (
              <button
                key={k}
                onClick={() => patchGathering({ foodPlan: k })}
                className={`text-sm font-semibold rounded-full px-3.5 py-1.5 border ${gathering.foodPlan === k ? "bg-[var(--cream)] text-[var(--bg)] border-[var(--cream)]" : "border-[var(--border-strong)] text-[var(--cream-dim)]"}`}
              >
                {t.foodPlan[k]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-7">
          <h3 className="font-disp text-base font-semibold mb-3">{t.labelBreakdown}</h3>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-2.5">
            {Object.keys(labelCounts).length === 0 ? (
              <p className="text-[var(--muted)] text-sm">{t.emptyGuests}</p>
            ) : (
              Object.entries(labelCounts).sort((a, b) => b[1] - a[1]).map(([key, count]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>{labelName(key, lang)}</span>
                    <span className="font-mono text-[var(--accent)] text-xs">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-panel)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(count / maxLabelCount) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mb-7">
          <h3 className="font-disp text-base font-semibold mb-3">{t.dietarySummary}</h3>
          {dietaryNotes.length === 0 ? <p className="text-[var(--muted)] text-sm">{t.noDietary}</p> : (
            <div className="flex flex-col gap-2">
              {dietaryNotes.map((g) => (
                <div key={g.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-4 py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-sm">{g.name}</span>
                  <span className="text-[var(--clay)] text-sm">{g.dietary}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-7">
          <h3 className="font-disp text-base font-semibold mb-3">{t.guestNotesTitle}</h3>
          <div className="flex flex-col gap-2">
            {guests.filter((g) => g.freeText).map((g) => (
              <div key={g.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
                <div className="flex justify-between mb-1.5 flex-wrap gap-1.5">
                  <span className="font-semibold text-sm">{g.name}</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {g.labels.map((l) => (
                      <span key={l} className="text-[0.72rem] font-semibold rounded-full px-2.5 py-0.5 bg-[var(--sage-dim)] text-[var(--sage)] border border-[var(--sage)]">{labelName(l, lang)}</span>
                    ))}
                  </div>
                </div>
                <p className="font-disp italic text-sm text-[var(--cream-dim)]">"{g.freeText}" <span className="font-mono not-italic text-[0.7rem] text-[var(--muted)]">— {t.original}</span></p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-disp text-base font-semibold">{t.nearbyTitle}</h3>
            <button onClick={() => setAddingPlace((v) => !v)} className="text-xs border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-[var(--cream-dim)]">
              {addingPlace ? "×" : `+ ${t.addPlace}`}
            </button>
          </div>

          {addingPlace && <AddPlaceForm t={t} onSave={addPlace} onCancel={() => setAddingPlace(false)} />}

          <div className="flex flex-col gap-2.5 mt-3">
            {places.map((p) => (
              <div key={p.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-4 py-3.5 flex items-center gap-3.5 flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <p className="font-disp font-semibold text-sm">{p.icon ? `${p.icon} ` : ""}{p.name}</p>
                  <span className="text-[0.76rem] text-[var(--cream-dim)]">
                    {p.rating != null ? <>★ {p.rating} · {p.reviews ?? 0} {t.reviews}</> : p.tag}
                  </span>
                </div>
                <div className="flex-[2] min-w-[200px]">
                  {editingNoteId === p.id ? (
                    <NoteEditor initial={p.note ?? ""} onSave={(v) => saveNote(p.id, v)} />
                  ) : (
                    <button onClick={() => setEditingNoteId(p.id)} className="text-left text-[0.8rem] bg-transparent border-none p-0 text-[var(--cream-dim)]">
                      {p.note || `+ ${t.hostNote}`}
                    </button>
                  )}
                </div>
                <button onClick={() => deletePlace(p.id)} className="text-[0.72rem] text-[var(--clay)] bg-transparent border-none">
                  {t.remove}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ThemeStyle>
  );
}

function AddPlaceForm({
  t,
  onSave,
  onCancel
}: {
  t: Strings;
  onSave: (data: { name: string; address: string; tag: string; icon: string; website: string; cashOnly: boolean; orderLabel: boolean; note: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [tag, setTag] = useState("");
  const [icon, setIcon] = useState("📍");
  const [website, setWebsite] = useState("");
  const [cashOnly, setCashOnly] = useState(false);
  const [orderLabel, setOrderLabel] = useState(false);
  const [note, setNote] = useState("");
  const fieldClass = "w-full bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-2.5 mb-1">
      <div className="grid grid-cols-[64px_1fr] gap-2.5">
        <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🌮" className={fieldClass + " text-center"} />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.placeNamePh} className={fieldClass} />
      </div>
      <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.placeAddressPh} className={fieldClass} />
      <div className="grid grid-cols-2 gap-2.5">
        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder={t.placeTagPh} className={fieldClass} />
        <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder={t.placeWebsitePh} className={fieldClass} />
      </div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.hostNote} rows={2} className={fieldClass} />
      <div className="flex items-center gap-4 text-sm text-[var(--cream-dim)]">
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={cashOnly} onChange={(e) => setCashOnly(e.target.checked)} /> {t.cashOnly}</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={orderLabel} onChange={(e) => setOrderLabel(e.target.checked)} /> {t.orderOnline}</label>
      </div>
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => name.trim() && onSave({ name: name.trim(), address, tag, icon: icon || "📍", website, cashOnly, orderLabel, note })}
          className="bg-[var(--accent)] text-[#241900] rounded-lg px-4 py-2 text-sm font-bold"
        >
          {t.saveNote}
        </button>
        <button onClick={onCancel} className="text-sm text-[var(--cream-dim)] border border-[var(--border-strong)] rounded-lg px-4 py-2">
          {t.cancel}
        </button>
      </div>
    </div>
  );
}

function SectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <label className="block text-[0.78rem] text-[var(--cream-dim)] mb-2">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
      <p className="text-[0.72rem] text-[var(--cream-dim)] uppercase tracking-wide mb-1">{label}</p>
      <p className="font-mono text-2xl font-semibold" style={{ color }}>{value}</p>
    </div>
  );
}

function TitleField({ label, value, placeholder, onSave, fullWidthInput }: { label?: string; value: string; placeholder?: string; onSave: (v: string) => void; fullWidthInput?: boolean }) {
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);
  return (
    <div>
      {label && <label className="block text-[0.78rem] text-[var(--cream-dim)] mb-1">{label}</label>}
      <div className="flex gap-2">
        <input
          value={val}
          placeholder={placeholder}
          onChange={(e) => setVal(e.target.value)}
          className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <button onClick={() => onSave(val)} className="text-xs border border-[var(--border-strong)] rounded-lg px-3 py-2 text-[var(--cream-dim)]">Save</button>
      </div>
    </div>
  );
}

function NoteEditor({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [val, setVal] = useState(initial);
  return (
    <div className="flex gap-1.5">
      <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-sm" />
      <button onClick={() => onSave(val)} className="text-xs border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-[var(--cream-dim)]">Save</button>
    </div>
  );
}
