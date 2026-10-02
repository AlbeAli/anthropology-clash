import { useEffect, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { getCatalog, getConcepts, getEntry } from "../engine/content";
import {
  MAX_STOPS,
  customTrip,
  decodeStops,
  encodeStops,
  getItineraries,
} from "../engine/itineraries";
import { DEFAULT_LANG } from "../i18n";
import { useAppState } from "../state/AppState";
import LineBullet from "../components/metro/LineBullet";
import CopyLink from "../components/itinerary/CopyLink";

const outline =
  "inline-flex min-h-12 items-center rounded-md border-[3px] border-ink px-5 font-display font-extrabold transition-transform duration-200 ease-out-expo hover:-translate-y-0.5";

export default function Itineraries() {
  const { t } = useTranslation();
  const { state } = useAppState();
  const { hash } = useLocation();
  const [params, setParams] = useSearchParams();
  const builder = useRef<HTMLElement>(null);
  const concepts = getConcepts(DEFAULT_LANG);
  const catalog = getCatalog(DEFAULT_LANG);
  const selected = decodeStops(DEFAULT_LANG, params.get("f")).stops;
  const trip = customTrip(selected);
  const full = selected.length >= MAX_STOPS;

  useEffect(() => {
    if (hash === "#componi") builder.current?.scrollIntoView();
  }, [hash]);

  function update(stops: string[]) {
    setParams(stops.length > 0 ? { f: encodeStops(stops) } : {}, {
      replace: true,
      preventScrollReset: true,
    });
  }

  function toggle(id: string) {
    update(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  const status =
    selected.length === 0
      ? t("itineraries.builder.empty")
      : selected.length === 1
        ? t("itineraries.builder.needMore")
        : full
          ? t("itineraries.builder.full", { max: MAX_STOPS })
          : "";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-3 font-display text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
        {t("itineraries.title")}
      </h1>
      <p className="mb-9 max-w-[58ch] text-lg text-ink-soft">{t("itineraries.lede")}</p>

      <section aria-labelledby="curated-heading" className="mb-12">
        <h2 id="curated-heading" className="mb-4 font-display text-2xl font-extrabold">
          {t("itineraries.curated")}
        </h2>
        <ul className="grid gap-4">
          {getItineraries(DEFAULT_LANG).map((it) => {
            const done = it.stops.filter((s) => s in state.completed).length;
            return (
              <li key={it.id} className="rounded-xl border-[3px] border-ink p-5 sm:p-6">
                <h3 className="mb-2 font-display text-xl leading-tight font-extrabold">
                  <Link
                    to={`/percorso/${it.id}`}
                    className="decoration-2 underline-offset-4 hover:underline"
                  >
                    {it.title}
                  </Link>
                </h3>
                <p className="mb-3 max-w-[62ch] leading-relaxed text-pretty">{it.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span aria-hidden="true" className="flex gap-1">
                    {it.stops.map((s) => {
                      const concept = getEntry(DEFAULT_LANG, s)?.concept;
                      return concept ? <LineBullet key={s} concept={concept} size="sm" /> : null;
                    })}
                  </span>
                  <span className="font-display text-sm font-bold text-ink-soft">
                    {t("itineraries.stops", { count: it.stops.length })} ·{" "}
                    {t("itineraries.progress", { count: done, total: it.stops.length })}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        ref={builder}
        id="componi"
        aria-labelledby="builder-heading"
        className="scroll-mt-32"
      >
        <h2 id="builder-heading" className="mb-2 font-display text-2xl font-extrabold">
          {t("itineraries.builder.title")}
        </h2>
        <p className="mb-6 max-w-[62ch] text-ink-soft">
          {t("itineraries.builder.intro", { max: MAX_STOPS })}
        </p>

        <div className="mb-8 rounded-xl bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-lg font-extrabold">
            {t("itineraries.builder.selected")}
          </h3>
          {selected.length > 0 && (
            <ol className="mb-3 grid gap-2">
              {selected.map((id, k) => {
                const s = getEntry(DEFAULT_LANG, id);
                if (!s) return null;
                return (
                  <li key={id} className="flex items-center gap-3">
                    <LineBullet concept={s.concept} size="sm" />
                    <span className="min-w-0 flex-1 leading-tight font-bold">
                      {t("itineraries.stop", { index: k + 1, title: s.title })}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      aria-label={t("itineraries.builder.remove", { title: s.title })}
                      className="inline-grid size-11 shrink-0 place-items-center rounded-md border-2 border-ink font-display text-lg font-extrabold"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          <p aria-live="polite" className="mb-4 text-[15px] text-ink-soft empty:hidden">
            {status}
          </p>
          {trip && (
            <div className="flex flex-wrap items-start gap-2.5">
              <Link
                to={trip.href}
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-ink px-5 font-display font-extrabold text-bg transition-transform duration-200 ease-out-expo hover:-translate-y-0.5"
              >
                {t("itineraries.builder.open")}
                <span aria-hidden="true">→</span>
              </Link>
              <CopyLink key={trip.href} url={`${window.location.origin}${trip.href}`} />
            </div>
          )}
          {selected.length > 0 && (
            <button type="button" onClick={() => update([])} className={`${outline} mt-2`}>
              {t("itineraries.builder.clear")}
            </button>
          )}
        </div>

        <h3 className="mb-4 font-display text-lg font-extrabold">
          {t("itineraries.builder.pick")}
        </h3>
        <div className="grid gap-6">
          {concepts.map((c) => (
            <div key={c.id}>
              <p className="mb-2 flex items-center gap-2 font-display font-bold">
                <LineBullet concept={c.id} size="sm" />
                {t("home.map.lineLabel", { line: t(`lines.${c.id}.name`) })}
              </p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {catalog
                  .filter((s) => s.concept === c.id)
                  .map((s) => {
                    const position = selected.indexOf(s.id);
                    const on = position >= 0;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          aria-pressed={on}
                          disabled={!on && full}
                          onClick={() => toggle(s.id)}
                          className="flex min-h-11 w-full items-center gap-2.5 rounded-md border-2 border-line px-3 py-2 text-left leading-tight font-bold transition-colors hover:border-ink disabled:opacity-50 aria-pressed:border-ink aria-pressed:bg-surface"
                        >
                          <span
                            aria-hidden="true"
                            className={
                              "inline-grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink font-display text-sm tabular-nums " +
                              (on ? "bg-ink text-bg" : "")
                            }
                          >
                            {on ? position + 1 : ""}
                          </span>
                          {s.title}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
