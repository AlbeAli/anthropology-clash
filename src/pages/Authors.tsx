import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { getCatalog, loadAuthors } from "../engine/content";
import { DEFAULT_LANG } from "../i18n";
import type { AuthorProfile, AuthorsData } from "../engine/authors";
import AuthorTimeline from "../components/AuthorTimeline";
import { schoolColor } from "../components/palette";

const byBorn = (a: AuthorProfile, b: AuthorProfile) =>
  (a.born ?? Infinity) === (b.born ?? Infinity)
    ? 0
    : (a.born ?? Infinity) < (b.born ?? Infinity)
      ? -1
      : 1;

export default function Authors() {
  const { t } = useTranslation();
  const { hash, search, key } = useLocation();
  const navigate = useNavigate();
  const [far, setFar] = useState(false);
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
    const el = document.getElementById(current);
    el?.scrollIntoView();
    if (current === "timeline-heading") el?.focus({ preventScroll: true });
  }, [data, current, key]);

  useEffect(() => {
    const onScroll = () => setFar(window.scrollY > window.innerHeight * 1.5);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const life = (a: AuthorProfile) =>
    a.born === undefined
      ? t("authors.lifeUnknown")
      : a.died
        ? t("authors.life", { born: a.born, died: a.died })
        : t("authors.lifeOpen", { born: a.born });

  const asked = new URLSearchParams(search).get("filone");
  const currentAuthor = data?.authors.find((a) => a.id === current);
  const active =
    asked &&
    data?.schools.some((s) => s.id === asked) &&
    (!currentAuthor || currentAuthor.school === asked)
      ? asked
      : null;
  const pick = (school: string | null) =>
    navigate({ search: school ? `?filone=${school}` : "", hash: "" });

  const groups = (data?.schools ?? [])
    .map((school) => ({
      school,
      authors: data!.authors.filter((a) => a.school === school.id).sort(byBorn),
    }))
    .filter((g) => g.authors.length > 0)
    .sort((a, b) => byBorn(a.authors[0], b.authors[0]));
  const shown = groups.filter((g) => !active || g.school.id === active);
  const shownCount = shown.reduce((n, g) => n + g.authors.length, 0);

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
            tabIndex={-1}
            className="mb-2 scroll-mt-32 border-b-[3px] outline-none border-ink pb-2 font-display text-2xl font-extrabold"
          >
            {t("authors.timeline")}
          </h2>
          <AuthorTimeline
            authors={data!.authors}
            schools={data!.schools}
            life={life}
            active={active}
            search={search}
            onPick={pick}
          />
          <p className="sr-only" aria-live="polite">
            {active
              ? t("authors.shown", {
                  count: shownCount,
                  school: shown[0]?.school.label ?? "",
                })
              : t("authors.shownAll", { count: shownCount })}
          </p>
        </section>
      )}

      {shown.map(({ school, authors }) => (
        <section key={school.id} aria-labelledby={`school-${school.id}`} className="mb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b-[3px] border-ink pb-2">
            <h2
              id={`school-${school.id}`}
              className="flex scroll-mt-32 items-center gap-3 font-display text-2xl font-extrabold"
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-10 shrink-0 rounded-full"
                style={{ background: schoolColor(data!.schools, school.id) }}
              />
              {school.label}
            </h2>
            <Link
              to={{ search, hash: "timeline-heading" }}
              className="text-sm font-bold underline decoration-2 underline-offset-4 hover:text-accent"
            >
              <span aria-hidden="true">↑ </span>
              {t("authors.backToTimeline")}
            </Link>
          </div>
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
      {far && (
        <Link
          to={{ search, hash: "timeline-heading" }}
          className="fixed right-4 bottom-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-md border-2 border-ink bg-bg px-4 font-display text-sm font-extrabold shadow-[0_4px_14px_rgb(0_0_0/0.2)] hover:bg-ink hover:text-bg"
        >
          <span aria-hidden="true">↑</span>
          {t("authors.toTop")}
        </Link>
      )}
    </div>
  );
}
