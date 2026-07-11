"use client";
import { useState } from "react";
import ThemeStyle from "@/components/ThemeStyle";
import { THEMES, ThemeKey } from "@/lib/themes";
import { STRINGS, Lang } from "@/lib/i18n";

export default function CreateGatheringPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<ThemeKey>("raccoon_bbq");
  const [title, setTitle] = useState("");
  const [hostName, setHostName] = useState("");
  const [address, setAddress] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ guestUrl: string; hostUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = STRINGS[lang];

  async function createGathering() {
    if (!title.trim() || !address.trim()) {
      setError(lang === "en" ? "Event title and address are required." : "Se requieren el título del evento y la dirección.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gatherings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, hostName, address, eventDate: eventDate || undefined, theme })
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError(lang === "en" ? "Something went wrong. Try again." : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemeStyle themeKey={theme}>
      <div className="max-w-[560px] mx-auto px-5 pt-10">
        <div className="flex justify-between items-center mb-6">
          <div className="font-disp text-2xl font-semibold flex items-center gap-2">
            {THEMES[theme].heroEmoji} {t.appName}
          </div>
          <button
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className="text-sm border border-[var(--border-strong)] rounded-full px-3.5 py-1.5 text-[var(--cream-dim)]"
          >
            🌐 {t.langToggle}
          </button>
        </div>

        {!result ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
            <h1 className="font-disp text-2xl font-semibold mb-1">{t.createTitle}</h1>
            <p className="text-[var(--cream-dim)] text-sm mb-6">{t.createSubtitle}</p>

            <div className="flex flex-col gap-3.5">
              <Field label={t.eventTitleLabel}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.eventTitlePh} className={inputClass} />
              </Field>
              <Field label={t.hostLinkLabel.split(" ")[0] === "Your" ? "Your name" : "Tu nombre"}>
                <input value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder={t.hostNamePh} className={inputClass} />
              </Field>
              <Field label={t.addressLabel}>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.addressPh} className={inputClass} />
              </Field>
              <Field label={lang === "en" ? "Date" : "Fecha"}>
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} />
              </Field>
              <Field label={t.themeLabel}>
                <select value={theme} onChange={(e) => setTheme(e.target.value as ThemeKey)} className={inputClass}>
                  {Object.entries(THEMES).map(([key, th]) => (
                    <option key={key} value={key}>{th.label}</option>
                  ))}
                </select>
              </Field>

              {error && <p className="text-[var(--clay)] text-sm">{error}</p>}

              <button
                onClick={createGathering}
                disabled={loading}
                className="bg-[var(--accent)] text-[#241900] rounded-xl py-3 font-bold text-sm mt-1 disabled:opacity-60"
              >
                {loading ? "…" : t.createButton}
              </button>
            </div>
          </div>
        ) : (
          <ResultCard result={result} t={t} />
        )}
      </div>
    </ThemeStyle>
  );
}

const inputClass = "w-full bg-[var(--bg-panel)] border border-[var(--border-strong)] text-[var(--cream)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.78rem] text-[var(--cream-dim)] mb-1">{label}</label>
      {children}
    </div>
  );
}

function ResultCard({ result, t }: { result: { guestUrl: string; hostUrl: string }; t: (typeof STRINGS)["en"] }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4">
      <h2 className="font-disp text-xl font-semibold">🎉 {t.createButton}</h2>
      <LinkRow label={t.guestLinkLabel} url={result.guestUrl} t={t} />
      <LinkRow label={t.hostLinkLabel} url={result.hostUrl} t={t} />
      <a href={result.hostUrl} className="text-center bg-[var(--accent)] text-[#241900] rounded-xl py-3 font-bold text-sm no-underline">
        {t.hostView} →
      </a>
    </div>
  );
}

function LinkRow({ label, url, t }: { label: string; url: string; t: (typeof STRINGS)["en"] }) {
  return (
    <div>
      <p className="text-[0.78rem] text-[var(--cream-dim)] mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <input readOnly value={url} className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--cream)]" />
        <button
          onClick={() => navigator.clipboard.writeText(url)}
          className="text-xs border border-[var(--border-strong)] rounded-lg px-3 py-2 text-[var(--cream-dim)]"
        >
          {t.copyLink}
        </button>
      </div>
    </div>
  );
}
