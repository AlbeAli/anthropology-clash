import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { CatalogEntry } from "../engine/content";
import { stopNumber } from "../engine/lines";
import LineBullet from "./metro/LineBullet";

type Props = { stop: CatalogEntry; visited: boolean };

export default function DailyStop({ stop, visited }: Props) {
  const { t, i18n } = useTranslation();
  const [notice, setNotice] = useState("");
  const [fallback, setFallback] = useState("");
  const date = new Date().toLocaleDateString(i18n.language, { day: "numeric", month: "long" });
  const line = t(`lines.${stop.concept}.name`);

  async function share() {
    const url = `${window.location.origin}/s/${stop.id}`;
    const text = t("daily.shareText", { date, title: stop.title });
    try {
      if ("share" in navigator) {
        await navigator.share({ title: stop.title, text, url });
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setFallback("");
      setNotice(t("daily.copied"));
    } catch {
      setFallback(url);
      setNotice(t("daily.copyFallback"));
    }
  }

  return (
    <section
      aria-labelledby="daily-label"
      className="grid gap-3 rounded-xl border-[3px] border-ink p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:p-5"
    >
      <LineBullet concept={stop.concept} />
      <div className="min-w-0">
        <p
          id="daily-label"
          className="font-display text-sm font-extrabold tracking-wide text-ink-soft uppercase"
        >
          {t("daily.label", { date })}
        </p>
        <p className="font-display text-xl leading-snug font-extrabold">
          <Link to={`/s/${stop.id}`} className="underline-offset-4 hover:underline">
            {stop.title}
          </Link>
        </p>
        <p className="text-sm text-ink-soft">
          {t("daily.line", { line, n: stopNumber(stop.id) })}
          {visited && ` · ${t("daily.visited")}`}
        </p>
        <p className="font-display text-sm font-bold" role="status">
          {notice}
        </p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Link
          to={`/s/${stop.id}`}
          className="inline-flex min-h-12 items-center rounded-md bg-ink px-5 font-display font-extrabold text-bg"
        >
          {t("daily.open")}
        </Link>
        <button
          type="button"
          onClick={share}
          className="inline-flex min-h-12 items-center rounded-md border-[3px] border-ink px-5 font-display font-extrabold"
        >
          {t("daily.share")}
        </button>
      </div>
      {fallback && (
        <input
          readOnly
          value={fallback}
          aria-label={t("daily.linkArea")}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg border-2 border-line bg-bg p-3 text-sm sm:col-span-3"
        />
      )}
    </section>
  );
}
