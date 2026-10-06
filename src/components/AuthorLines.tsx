import { Fragment } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { AuthorProfile, AuthorsData } from "../engine/authors";

type School = AuthorsData["schools"][number];
export type AuthorGroup = { school: School; authors: AuthorProfile[] };

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

type StopProps = { author: AuthorProfile; note: string; j: number; color?: string };

function Stop({ author, note, j, color }: StopProps) {
  return (
    <li
      className="metro-stop relative pt-1 pb-3.5 pl-7"
      style={{ ["--j" as string]: j, ["--tc" as string]: color }}
    >
      <span aria-hidden="true" className="metro-tick" />
      <Link
        to={{ hash: author.id }}
        className="inline-block py-0.5 leading-snug font-bold decoration-2 underline-offset-4 hover:underline"
      >
        {author.name}
      </Link>
      <small className="block text-sm text-ink-soft tabular-nums">{note}</small>
    </li>
  );
}

type Props = {
  groups: AuthorGroup[];
  schools: School[];
  life: (a: AuthorProfile) => string;
  variant: "filoni" | "tempo";
};

export default function AuthorLines({ groups, schools, life, variant }: Props) {
  const { t } = useTranslation();
  if (variant === "filoni") {
    return groups.map(({ school, authors }, i) => (
      <div
        key={school.id}
        className="mb-4"
        style={{ ["--lc" as string]: schoolColor(schools, school.id) }}
      >
        <h3 className="mb-1 flex items-center gap-3 font-display text-lg font-extrabold">
          <span aria-hidden="true" className="h-2 w-9 shrink-0 rounded-full bg-(--lc)" />
          {school.label}
        </h3>
        <ol
          className="metro-rail relative m-0 list-none py-0 pr-0 pl-5"
          style={{ ["--i" as string]: i }}
        >
          {authors.map((a, j) => (
            <Stop key={a.id} author={a} note={life(a)} j={j} />
          ))}
        </ol>
      </div>
    ));
  }

  const label = new Map(schools.map((s) => [s.id, s.label]));
  const sorted = groups.flatMap((g) => g.authors).sort((a, b) => a.born - b.born);
  const band = (a: AuthorProfile) => Math.floor(a.born / STEP) * STEP;

  return (
    <>
      <p className="mb-3 text-sm text-ink-soft">{t("authors.order")}</p>
      <ul className="mb-5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
        {groups.map(({ school }) => (
          <li key={school.id} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-1.5 w-5 rounded-full"
              style={{ background: schoolColor(schools, school.id) }}
            />
            {school.label}
          </li>
        ))}
      </ul>
      <ol
        className="metro-rail relative m-0 list-none py-0 pr-0 pl-5"
        style={{ ["--lc" as string]: "var(--ink)" }}
      >
        {sorted.map((a, j) => (
          <Fragment key={a.id}>
            {(j === 0 || band(sorted[j - 1]) !== band(a)) && (
              <li aria-hidden="true" className="relative min-h-9">
                <span className="metro-year">{band(a)}</span>
              </li>
            )}
            <Stop
              author={a}
              note={`${life(a)} · ${label.get(a.school)}`}
              j={j}
              color={schoolColor(schools, a.school)}
            />
          </Fragment>
        ))}
      </ol>
    </>
  );
}
