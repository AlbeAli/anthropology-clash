import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { AuthorProfile, AuthorsData } from "../engine/authors";

type School = AuthorsData["schools"][number];

const PALETTE = ["#00838f", "#a0522d", "#c2185b", "#5d6d7e", "#6b8e23", "#283593"];
const STEP = 10;

export function schoolColor(schools: School[], id: string): string {
  return PALETTE[
    Math.max(
      0,
      schools.findIndex((s) => s.id === id),
    ) % PALETTE.length
  ];
}

type Props = {
  authors: AuthorProfile[];
  schools: School[];
  life: (a: AuthorProfile) => string;
};

export default function AuthorLines({ authors, schools, life }: Props) {
  const { t } = useTranslation();
  const sorted = [...authors].sort((a, b) => a.born - b.born);
  const shared = new Set(
    sorted
      .filter((a, i) => sorted.findIndex((b) => b.surname === a.surname) !== i)
      .map((a) => a.surname),
  );
  const decades = new Map<number, AuthorProfile[]>();
  for (const a of sorted) {
    const decade = Math.floor(a.born / STEP) * STEP;
    decades.set(decade, [...(decades.get(decade) ?? []), a]);
  }
  const used = schools.filter((s) => authors.some((a) => a.school === s.id));

  return (
    <>
      <p className="mb-3 text-sm text-ink-soft">{t("authors.order")}</p>
      <ul className="mb-6 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
        {used.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-1.5 w-5 rounded-full"
              style={{ background: schoolColor(schools, s.id) }}
            />
            {s.label}
          </li>
        ))}
      </ul>
      <ol
        className="metro-rail relative m-0 list-none py-0 pr-0 pl-5"
        style={{ ["--lc" as string]: "var(--ink)" }}
      >
        {[...decades].map(([decade, group], j) => (
          <li
            key={decade}
            className="metro-stop relative pb-5 pl-12"
            style={{ ["--j" as string]: j }}
          >
            <span className="metro-year">{t("authors.decade", { decade })}</span>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 pt-0.5">
              {group.map((a) => (
                <li key={a.id}>
                  <Link
                    to={{ hash: a.id }}
                    aria-label={t("authors.stop", { name: a.name, life: life(a) })}
                    className="group inline-flex items-center gap-2 font-bold"
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-4 shrink-0 rounded-full transition-[width] duration-300 ease-out-expo group-hover:w-6"
                      style={{ background: schoolColor(schools, a.school) }}
                    />
                    <span className="decoration-2 underline-offset-4 group-hover:underline">
                      {shared.has(a.surname) ? a.name : a.surname}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}
