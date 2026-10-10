import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { getCatalog, loadAuthors } from "../engine/content";
import { DEFAULT_LANG } from "../i18n";
import type { AuthorProfile, AuthorsData } from "../engine/authors";
import AuthorTimeline from "../components/AuthorTimeline";
import { schoolColor } from "../components/palette";

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

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-3 font-display text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
        {t("authors.title")}
      </h1>
      <p className="mb-9 max-w-2xl text-justify text-lg hyphens-auto text-ink-soft">
        {t("authors.lead")}
      </p>

      {groups.length > 0 && (
        <section aria-labelledby="timeline-heading" className="mb-12">
          <h2
            id="timeline-heading"
            className="mb-2 border-b-[3px] border-ink pb-2 font-display text-2xl font-extrabold"
          >
            {t("authors.timeline")}
          </h2>
          <AuthorTimeline authors={data!.authors} schools={data!.schools} life={life} />
        </section>
      )}

      {groups.map(({ school, authors }) => (
        <section key={school.id} aria-labelledby={`school-${school.id}`} className="mb-10">
          <h2
            id={`school-${school.id}`}
            className="mb-4 flex scroll-mt-32 items-center gap-3 border-b-[3px] border-ink pb-2 font-display text-2xl font-extrabold"
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-10 shrink-0 rounded-full"
              style={{ background: schoolColor(data!.schools, school.id) }}
            />
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
