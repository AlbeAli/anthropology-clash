import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { getCatalog, loadAuthors } from "../engine/content";
import { DEFAULT_LANG } from "../i18n";
import type { AuthorProfile, AuthorsData } from "../engine/authors";

const STEP = 20;

function span(data: AuthorsData) {
  const now = new Date().getFullYear();
  const years = data.authors.flatMap((a) => [
    a.born,
    a.died ?? now,
    ...a.works.flatMap((w) => w.year ?? []),
  ]);
  const start = Math.floor(Math.min(...years) / STEP) * STEP;
  const end = Math.ceil(Math.max(...years) / STEP) * STEP;
  return { start, end, now };
}

export default function Authors() {
  const { t } = useTranslation();
  const { hash } = useLocation();
  const [data, setData] = useState<AuthorsData | null>(null);
  const scenarios = getCatalog(DEFAULT_LANG);
  const current = decodeURIComponent(hash.slice(1));

  useEffect(() => {
    let live = true;
    loadAuthors(DEFAULT_LANG)
      .then((d) => live && setData(d))
      .catch(() => live && setData({ schools: [], authors: [] }));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!data || !current) return;
    document.getElementById(current)?.scrollIntoView();
  }, [data, current]);

  const life = (a: AuthorProfile) =>
    a.died
      ? t("authors.life", { born: a.born, died: a.died })
      : t("authors.lifeOpen", { born: a.born });

  const groups = (data?.schools ?? [])
    .map((school) => ({
      school,
      authors: data!.authors.filter((a) => a.school === school.id).sort((a, b) => a.born - b.born),
    }))
    .filter((g) => g.authors.length > 0)
    .sort((a, b) => a.authors[0].born - b.authors[0].born);

  const range = data && data.authors.length > 0 ? span(data) : null;
  const pos = (year: number) =>
    range ? `${((year - range.start) / (range.end - range.start)) * 100}%` : "0%";
  const ticks = range
    ? Array.from({ length: (range.end - range.start) / STEP + 1 }, (_, i) => range.start + i * STEP)
    : [];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-3 font-display text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
        {t("authors.title")}
      </h1>
      <p className="mb-9 max-w-2xl text-justify text-lg hyphens-auto text-ink-soft">
        {t("authors.lead")}
      </p>

      {range && (
        <section aria-labelledby="timeline-heading" className="mb-12">
          <h2
            id="timeline-heading"
            className="mb-2 border-b-[3px] border-ink pb-2 font-display text-2xl font-extrabold"
          >
            {t("authors.timeline")}
          </h2>
          <p className="mb-5 text-sm text-ink-soft">{t("authors.legend")}</p>
          <div className="relative">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              {ticks.map((year, i) => (
                <span
                  key={year}
                  className={
                    "absolute top-0 bottom-0 border-l border-line " + (i % 2 ? "max-sm:hidden" : "")
                  }
                  style={{ left: pos(year) }}
                />
              ))}
            </div>
            <div aria-hidden="true" className="relative mb-3 h-5">
              {ticks.map((year, i) => (
                <span
                  key={year}
                  className={
                    "absolute -translate-x-1/2 font-mono text-xs text-ink-soft tabular-nums first:translate-x-0 last:-translate-x-full " +
                    (i % 2 ? "max-sm:hidden" : "")
                  }
                  style={{ left: pos(year) }}
                >
                  {year}
                </span>
              ))}
            </div>
            {groups.map(({ school, authors }) => (
              <div key={school.id} className="relative mb-4">
                <h3 className="mb-1 inline-block bg-bg pr-2 font-display text-sm font-extrabold tracking-wide uppercase">
                  {school.label}
                </h3>
                <ul className="grid gap-2">
                  {authors.map((a) => (
                    <li key={a.id}>
                      <Link
                        to={{ hash: a.id }}
                        aria-label={t("authors.row", {
                          name: a.name,
                          life: life(a),
                          years: a.works.map((w) => w.year).join(", "),
                        })}
                        className="group block rounded-sm py-1"
                      >
                        <span
                          className="block text-sm whitespace-nowrap"
                          style={{ paddingLeft: `min(${pos(a.born)}, calc(100% - 11rem))` }}
                        >
                          <span className="bg-bg font-bold group-hover:text-accent">
                            {a.surname}
                          </span>{" "}
                          <span className="bg-bg text-xs text-ink-soft tabular-nums">
                            {life(a)}
                          </span>
                        </span>
                        <span className="relative mt-1 block h-3">
                          <span
                            className="absolute inset-y-0.5 rounded-full bg-ink-soft/40 group-hover:bg-accent/50"
                            style={{
                              left: pos(a.born),
                              width: `calc(${pos(a.died ?? range.now)} - ${pos(a.born)})`,
                            }}
                          />
                          {a.works.map(
                            (w) =>
                              w.year && (
                                <span
                                  key={w.ref}
                                  className="absolute top-0 size-3 -translate-x-1/2 rounded-full bg-accent ring-2 ring-bg"
                                  style={{ left: pos(w.year) }}
                                />
                              ),
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {groups.map(({ school, authors }) => (
        <section key={school.id} aria-labelledby={`school-${school.id}`} className="mb-10">
          <h2
            id={`school-${school.id}`}
            className="mb-4 border-b-[3px] border-ink pb-2 font-display text-2xl font-extrabold"
          >
            {school.label}
          </h2>
          <ul className="grid gap-6">
            {authors.map((a) => (
              <li
                key={a.id}
                id={a.id}
                data-current={a.id === current || undefined}
                className="scroll-mt-32 rounded-lg data-current:-mx-4 data-current:bg-surface data-current:px-4 data-current:py-3 data-current:shadow-[inset_4px_0_0_var(--color-accent)]"
              >
                <h3 className="font-display text-xl font-extrabold">{a.name}</h3>
                <p className="font-mono text-sm text-ink-soft tabular-nums">{life(a)}</p>
                <p className="mt-2 max-w-2xl text-justify leading-relaxed hyphens-auto">{a.text}</p>
                <p className="mt-2 text-sm">
                  <span className="font-bold">{t("authors.works")}:</span>{" "}
                  {a.works
                    .map((w) =>
                      w.ref.startsWith(`${a.surname}, `)
                        ? w.ref.slice(a.surname.length + 2)
                        : w.ref,
                    )
                    .join("; ")}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-bold">{t("authors.usedIn")}:</span>{" "}
                  {a.scenarios.map((id, i) => (
                    <span key={id}>
                      {i > 0 && ", "}
                      <Link
                        to={`/s/${id}`}
                        className="font-bold underline decoration-2 underline-offset-4 hover:text-accent"
                      >
                        {scenarios.find((s) => s.id === id)?.title ?? id}
                      </Link>
                    </span>
                  ))}
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  <span className="font-bold">
                    {t("authors.source", { count: a.source.length })}:
                  </span>{" "}
                  {a.source.join("; ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
