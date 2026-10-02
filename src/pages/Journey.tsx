import { useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { getCatalog, getConcepts } from "../engine/content";
import { lineStamps, visitsInOrder } from "../engine/journey";
import { useAppState } from "../state/AppState";
import { useAccount } from "../state/Account";
import { DEFAULT_LANG } from "../i18n";
import LineBullet from "../components/metro/LineBullet";
import LineStamp from "../components/metro/LineStamp";

export default function Journey() {
  const { t, i18n } = useTranslation();
  const { state, resetProgress } = useAppState();
  const { user, clearAccountProgress } = useAccount();
  const scenarios = getCatalog(DEFAULT_LANG);
  const concepts = getConcepts(DEFAULT_LANG);
  const visits = visitsInOrder(state.completed, scenarios);
  const stamps = lineStamps(
    visits,
    scenarios,
    concepts.map((c) => c.id),
  ).filter((s) => s.seen > 0);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState("");
  const [fallback, setFallback] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);
  const date = (day: string) =>
    new Date(`${day}T12:00:00`).toLocaleDateString(i18n.language, {
      day: "numeric",
      month: "long",
    });

  const short = (day: string) =>
    new Date(`${day}T12:00:00`)
      .toLocaleDateString(i18n.language, { day: "numeric", month: "short" })
      .toUpperCase();

  function summary(): string {
    const lines =
      stamps
        .map(
          (s) =>
            t(`lines.${s.concept}.name`) +
            (s.terminus ? ` (${t("journey.stamp.terminus").toLowerCase()})` : ""),
        )
        .join(", ") || t("journey.summary.none");
    return [
      t("journey.summary.head", { app: t("app.name") }),
      t("journey.count", { count: visits.length, total: scenarios.length }),
      t("journey.summary.lines", { lines }),
      "",
      ...visits.map((v) =>
        t("journey.summary.item", {
          title: v.scenario.title,
          line: t(`lines.${v.scenario.concept}.name`),
          level: t(`level.${v.completion.level}`),
        }),
      ),
      "",
      window.location.origin,
    ].join("\n");
  }

  function copy() {
    const text = summary();
    const manual = () => {
      setFallback(text);
      setNotice(t("journey.copyFallback"));
      requestAnimationFrame(() => area.current?.select());
    };
    try {
      navigator.clipboard.writeText(text).then(() => setNotice(t("journey.copied")), manual);
    } catch {
      manual();
    }
  }

  async function reset() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    if (!(await clearAccountProgress())) {
      setConfirming(false);
      setNotice(t("journey.resetFailed"));
      return;
    }
    resetProgress();
    setConfirming(false);
    setFallback("");
    setNotice(t("journey.resetDone"));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-3 font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
        {t("journey.title")}
      </h1>
      <p className="mb-7 max-w-[52ch] text-lg text-ink-soft">{t("journey.lede")}</p>

      <article
        aria-label={t("journey.ticket")}
        className="ticket-print overflow-hidden rounded-2xl border-[3px] border-ink bg-bg"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 bg-panel ring-1 ring-(--panel-ring) px-5 py-4 text-white sm:px-6">
          <p className="font-display text-xl font-extrabold sm:text-2xl">
            {t("journey.count", { count: visits.length, total: scenarios.length })}
          </p>
          <p className="font-display text-sm font-bold opacity-85">
            {new Date().toLocaleDateString(i18n.language, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <section className="px-5 py-5 sm:px-6">
          <h2 className="mb-3 font-display text-sm font-extrabold tracking-wide text-ink-soft uppercase">
            {t("journey.lines")}
          </h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-3 gap-y-5">
            {concepts.map((c, i) => {
              const stamp = stamps.find((x) => x.concept === c.id);
              return (
                <li key={c.id} className="grid min-w-0 justify-items-start">
                  {stamp ? (
                    <LineStamp stamp={stamp} index={i} date={date} short={short} />
                  ) : (
                    <p className="grid h-21 w-full max-w-37 content-center gap-1 rounded-md border-2 border-dashed border-line px-3.5 font-display text-ink-soft">
                      <span className="text-sm font-extrabold">{t(`lines.${c.id}.name`)}</span>
                      <span className="text-xs font-bold">{t("journey.lineUntouched")}</span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
        <div aria-hidden="true" className="mx-5 border-t-[3px] border-dashed border-line" />
        <section className="px-5 py-5 sm:px-6">
          <h2 className="mb-3 font-display text-sm font-extrabold tracking-wide text-ink-soft uppercase">
            {t("journey.stops")}
          </h2>
          {visits.length === 0 ? (
            <p>
              <Link to="/" className="font-bold underline underline-offset-4">
                {t("journey.empty")}
              </Link>
            </p>
          ) : (
            <ol className="grid gap-2.5">
              {visits.map((v, j) => (
                <li
                  key={v.scenario.id}
                  className="ticket-row grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
                  style={{ ["--j" as string]: j }}
                >
                  <LineBullet concept={v.scenario.concept} size="sm" />
                  <Link
                    to={`/s/${v.scenario.id}`}
                    className="font-bold underline-offset-4 hover:underline"
                  >
                    {v.scenario.title}
                  </Link>
                  <span className="text-right text-sm text-ink-soft">
                    {t(`level.${v.completion.level}`)}
                    <br />
                    {date(v.completion.at)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </article>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={copy}
          disabled={visits.length === 0}
          className="inline-flex min-h-12 items-center rounded-md bg-ink px-5 font-display font-extrabold text-bg transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 disabled:opacity-40"
        >
          {t("journey.copy")}
        </button>
        <Link
          to="/"
          className="inline-flex min-h-12 items-center rounded-md border-[3px] border-ink px-5 font-display font-extrabold transition-transform duration-200 ease-out-expo hover:-translate-y-0.5"
        >
          {t("journey.map")}
        </Link>
      </div>
      <p className="mt-3 min-h-6 font-display text-sm font-bold" role="status">
        {notice}
      </p>
      {fallback && (
        <textarea
          ref={area}
          id="journey-summary"
          readOnly
          value={fallback}
          aria-label={t("journey.copyArea")}
          className="mt-2 min-h-40 w-full rounded-lg border-2 border-line bg-bg p-3 text-sm"
        />
      )}

      {visits.length > 0 && (
        <div className="mt-10 border-t border-line pt-5">
          <p className="mb-3 text-sm text-ink-soft">
            {user ? t("journey.resetNoteAccount") : t("journey.resetNote")}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center rounded-md border-2 border-ink px-4 font-display text-sm font-bold"
            >
              {confirming ? t("journey.resetConfirm") : t("journey.reset")}
            </button>
            {confirming && (
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="inline-flex min-h-11 items-center rounded-md px-4 font-display text-sm font-bold underline underline-offset-4"
              >
                {t("journey.resetCancel")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
