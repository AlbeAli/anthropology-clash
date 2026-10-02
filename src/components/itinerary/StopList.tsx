import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { Completion } from "../../engine/storage";
import { getEntry } from "../../engine/content";
import { stopNumber } from "../../engine/lines";
import { DEFAULT_LANG } from "../../i18n";
import LineBullet from "../metro/LineBullet";

type Props = { stops: string[]; search: string; completed: Record<string, Completion> };

export default function StopList({ stops, search, completed }: Props) {
  const { t } = useTranslation();
  return (
    <ol
      className="metro-rail relative m-0 list-none py-0 pr-0 pl-5"
      style={{ ["--lc" as string]: "var(--line)" }}
    >
      {stops.map((id, j) => {
        const s = getEntry(DEFAULT_LANG, id);
        if (!s) return null;
        const visit = completed[id];
        return (
          <li
            key={id}
            data-state={visit ? "done" : "todo"}
            className="metro-stop relative pt-1 pb-5 pl-6.5"
            style={{ ["--j" as string]: j }}
          >
            <span aria-hidden="true" className="metro-dot" />
            <span className="flex items-start gap-3">
              <LineBullet concept={s.concept} size="sm" />
              <span className="min-w-0">
                <Link
                  to={`/s/${id}${search}`}
                  className="inline-block leading-tight font-bold decoration-2 underline-offset-4 hover:underline"
                >
                  {t("itineraries.stop", { index: j + 1, title: s.title })}
                </Link>
                <small className="block text-sm text-ink-soft">
                  {t("itineraries.stopMeta", { line: t(`lines.${s.concept}.name`) })} ·{" "}
                  {visit
                    ? t("home.stop.visited", { level: t(`level.${visit.level}`) })
                    : t("home.stop.todo", { n: stopNumber(id) })}
                </small>
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
