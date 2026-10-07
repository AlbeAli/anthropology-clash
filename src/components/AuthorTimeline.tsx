import { useRef } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { AuthorProfile, AuthorsData } from "../engine/authors";
import { schoolColor } from "./palette";

type Stop = { a: AuthorProfile; at: number };

function layout(sorted: AuthorProfile[]) {
  const stops: Stop[] = [];
  const breaks: number[] = [];
  for (const a of sorted) {
    const prev = stops.at(-1);
    if (!prev) {
      stops.push({ a, at: PAD + LEAD });
      continue;
    }
    const natural = (a.born - prev.a.born) * PX;
    const step = Math.min(Math.max(natural, GAP), MAX);
    if (natural > MAX) breaks.push(prev.at + step / 2);
    stops.push({ a, at: prev.at + step });
  }
  const first = stops[0];
  const last = stops.at(-1)!;
  const x = (year: number) => {
    if (year <= first.a.born) return first.at - ((first.a.born - year) * PX) / 2;
    if (year >= last.a.born) return last.at + (year - last.a.born) * PX;
    const i = stops.findIndex((s) => s.a.born > year);
    const [p, n] = [stops[i - 1], stops[i]];
    return p.at + ((year - p.a.born) / (n.a.born - p.a.born)) * (n.at - p.at);
  };
  const ticks: { year: number; at: number }[] = [];
  for (let d = Math.floor(first.a.born / 10) * 10; d <= Math.ceil(last.a.born / 10) * 10; d += 10) {
    const at = x(d);
    if (at >= PAD && at - (ticks.at(-1)?.at ?? -Infinity) >= 40) ticks.push({ year: d, at });
  }
  const width = Math.max(ticks.at(-1)?.at ?? 0, last.at + 110) + PAD;
  return { stops, breaks, ticks, width };
}

type Props = {
  authors: AuthorProfile[];
  schools: AuthorsData["schools"];
  life: (a: AuthorProfile) => string;
};

const PX = 12;
const PAD = 32;
const GAP = 26;
const MAX = 84;
const LEAD = 56;
const RAIL = 132;
const HEIGHT = 176;

export default function AuthorTimeline({ authors, schools, life }: Props) {
  const { t } = useTranslation();
  const track = useRef<HTMLDivElement>(null);
  const sorted = [...authors].sort((a, b) => a.born - b.born);
  if (sorted.length === 0) return null;

  const { stops, breaks, ticks, width } = layout(sorted);
  const used = schools.filter((s) => authors.some((a) => a.school === s.id));

  function slide(direction: 1 | -1) {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: "smooth" });
  }

  return (
    <>
      <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
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
      <div className="relative">
        <div
          ref={track}
          className="overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,transparent,#000_24px,#000_calc(100%-24px),transparent)] [scrollbar-width:thin]"
        >
          <ol className="relative m-0 list-none p-0" style={{ width, height: HEIGHT }}>
            <span
              aria-hidden="true"
              className="metro-rail-x absolute h-2 rounded-full bg-ink"
              style={{ left: PAD - 8, width: width - 2 * PAD + 16, top: RAIL - 4 }}
            />
            {breaks.map((at) => (
              <span
                key={at}
                aria-hidden="true"
                className="absolute h-4 w-3 -skew-x-[20deg] border-x-[3px] border-bg"
                style={{ left: at - 6, top: RAIL - 8 }}
              />
            ))}
            {ticks.map(({ year: d, at }) => (
              <span
                key={d}
                aria-hidden="true"
                className="absolute -translate-x-1/2 font-mono text-xs font-bold text-ink-soft tabular-nums"
                style={{ left: at, top: RAIL + 16 }}
              >
                <span className="mx-auto mb-0.5 block h-2 w-0.5 bg-ink-soft" />
                {d}
              </span>
            ))}
            {stops.map(({ a, at }, j) => (
              <li
                key={a.id}
                className="metro-stop absolute top-0"
                style={{ left: at, height: HEIGHT, ["--j" as string]: j }}
              >
                <Link
                  to={{ hash: a.id }}
                  aria-label={t("authors.stop", { name: a.name, life: life(a) })}
                  className="group block"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-[3px] h-6 w-1.5 rounded-sm transition-transform duration-300 ease-out-expo group-hover:scale-y-150 group-focus-visible:scale-y-150"
                    style={{ top: RAIL - 12, background: schoolColor(schools, a.school) }}
                  />
                  <span
                    className="absolute left-0 origin-bottom-left -rotate-45 font-bold whitespace-nowrap decoration-2 underline-offset-4 group-hover:underline"
                    style={{ bottom: HEIGHT - RAIL + 18 }}
                  >
                    {a.surname}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => slide(dir)}
              aria-label={t(dir < 0 ? "authors.earlier" : "authors.later")}
              className="inline-grid size-11 cursor-pointer place-items-center rounded-md border-2 border-ink font-display text-xl font-extrabold hover:bg-ink hover:text-bg"
            >
              <span aria-hidden="true">{dir < 0 ? "‹" : "›"}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
