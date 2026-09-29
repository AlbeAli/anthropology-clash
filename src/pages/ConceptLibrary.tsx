import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { getCatalog, getConcepts } from "../engine/content";
import { lineColor, stopNumber } from "../engine/lines";
import { DEFAULT_LANG } from "../i18n";
import { useAppState } from "../state/AppState";
import LineBullet from "../components/metro/LineBullet";

export default function ConceptLibrary() {
  const { t } = useTranslation();
  const { state } = useAppState();
  const concepts = getConcepts(DEFAULT_LANG);
  const scenarios = getCatalog(DEFAULT_LANG);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-3 font-display text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
        {t("concepts.title")}
      </h1>
      <p className="mb-6 max-w-[58ch] text-lg text-ink-soft">{t("concepts.intro")}</p>
      <nav aria-label={t("concepts.jump")} className="mb-9 flex flex-wrap gap-2">
        {concepts.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink py-1 pr-4 pl-1 font-display text-sm font-bold transition-colors hover:bg-surface"
          >
            <LineBullet concept={c.id} size="sm" />
            {t(`lines.${c.id}.name`)}
          </a>
        ))}
      </nav>

      <ul className="grid gap-7">
        {concepts.map((c, i) => {
          const stops = scenarios.filter((s) => s.concept === c.id);
          const done = stops.filter((s) => s.id in state.completed).length;
          return (
            <li
              key={c.id}
              id={c.id}
              className="scroll-mt-32 overflow-hidden rounded-xl border-[3px] border-ink"
              style={{ ["--lc" as string]: lineColor(c.id), ["--i" as string]: i }}
            >
              <div className="flex items-center gap-4 bg-panel px-5 py-4 text-white sm:px-6">
                <LineBullet concept={c.id} />
                <div className="min-w-0">
                  <h2 className="font-display text-2xl leading-tight font-extrabold">
                    {t(`lines.${c.id}.name`)}
                  </h2>
                  <p className="text-sm opacity-85">{c.label}</p>
                </div>
              </div>
              <span aria-hidden="true" className="block h-1.5 bg-(--lc)" />
              <div className="p-5 sm:p-6">
                <p className="max-w-[65ch] leading-relaxed text-pretty">{c.definition}</p>
                <p className="mt-4 mb-3 font-display text-sm font-bold text-ink-soft">
                  {t("home.map.lineCount", { count: done, total: stops.length })}
                </p>
                {stops.length === 0 ? (
                  <p className="text-ink-soft">{t("concepts.noScenarios")}</p>
                ) : (
                  <ol className="metro-rail relative m-0 list-none py-0 pr-0 pl-5">
                    {stops.map((s, j) => {
                      const visit = state.completed[s.id];
                      return (
                        <li
                          key={s.id}
                          data-state={visit ? "done" : "todo"}
                          className="metro-stop relative pt-1 pb-4.5 pl-6.5"
                          style={{ ["--j" as string]: j }}
                        >
                          <span aria-hidden="true" className="metro-dot" />
                          <Link
                            to={`/s/${s.id}`}
                            className="inline-block leading-tight font-bold decoration-2 underline-offset-4 hover:underline"
                          >
                            {s.title}
                          </Link>
                          <small className="block text-sm text-ink-soft">
                            {visit
                              ? t("home.stop.visited", { level: t(`level.${visit.level}`) })
                              : t("home.stop.todo", { n: stopNumber(s.id) })}
                          </small>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
