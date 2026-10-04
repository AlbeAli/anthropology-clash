import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { CatalogEntry } from "../engine/content";
import { lineColor, stopNumber } from "../engine/lines";
import LineBullet from "./metro/LineBullet";
import SplitFlap from "./metro/SplitFlap";

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
      className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-t border-white/20 px-4 pt-3.5 pb-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-5 sm:px-5"
    >
      <LineBullet concept={stop.concept} />
      <div className="min-w-0">
        <p id="daily-label" className="mb-1 font-display text-sm font-bold opacity-80">
          {t("daily.label", { date })} · {t("daily.line", { line, n: stopNumber(stop.id) })}
          {visited && ` · ${t("daily.visited")}`}
        </p>
        <SplitFlap text={stop.title} className="text-lg leading-snug sm:text-2xl" />
        <p className={"font-display text-sm font-bold" + (notice ? " mt-2" : "")} role="status">
          {notice}
        </p>
      </div>
      <div className="col-span-2 flex flex-wrap gap-2.5 sm:col-span-1">
        <Link
          to={`/s/${stop.id}`}
          className="inline-flex min-h-12 items-center rounded-md border-2 border-white px-5 font-display font-extrabold"
        >
          {t("daily.open")}
        </Link>
        <button
          type="button"
          onClick={share}
          className="inline-flex min-h-12 items-center rounded-md border-2 border-white px-5 font-display font-extrabold"
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
          className="col-span-2 w-full rounded-lg border-2 border-line bg-bg p-3 text-sm text-ink sm:col-span-3"
        />
      )}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1"
        style={{ background: lineColor(stop.concept) }}
      />
    </section>
  );
}
