import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { LineStamp as Stamp } from "../../engine/journey";
import { lineColor, lineInk } from "../../engine/lines";

const TILT = [-3, 2.5, -2, 3, -2.5];
const HOLES = Array.from({ length: 7 }, (_, k) => 6 + k * 12);

type Props = {
  stamp: Stamp;
  index: number;
  date: (day: string) => string;
  short: (day: string) => string;
};

export default function LineStamp({ stamp, index, date, short }: Props) {
  const { t } = useTranslation();
  const mask = `punch-${useId().replace(/:/g, "")}`;
  const { concept, terminus } = stamp;
  const day = (terminus ? stamp.last : stamp.first) as string;
  const name = t(`lines.${concept}.name`);
  const ink = lineInk(concept);
  return (
    <svg
      role="img"
      aria-label={t(terminus ? "journey.stamp.terminusAria" : "journey.stamp.touchedAria", {
        line: name,
        date: date(day),
      })}
      viewBox="0 0 148 84"
      className="punch h-auto w-full max-w-37 font-display font-extrabold"
      style={{ rotate: `${TILT[index % TILT.length]}deg`, ["--j" as string]: index }}
    >
      <defs>
        <mask id={mask}>
          <rect width="148" height="84" fill="#fff" />
          {HOLES.map((y) => (
            <circle key={y} cx="0" cy={y} r="3.2" />
          ))}
          {terminus ? (
            <rect x="109" y="14" width="18" height="18" rx="2.5" />
          ) : (
            <circle cx="118" cy="23" r="9" />
          )}
        </mask>
      </defs>
      <rect width="148" height="84" rx="6" fill={lineColor(concept)} mask={`url(#${mask})`} />
      {terminus && <rect x="136" y="10" width="5" height="64" rx="1" fill={ink} />}
      <g fill={ink}>
        <text x="14" y="28" fontSize="11" letterSpacing="1">
          {t(terminus ? "journey.stamp.terminus" : "journey.stamp.touched").toUpperCase()}
        </text>
        <text x="14" y="52" fontSize="14" letterSpacing=".5">
          {name.toUpperCase()}
        </text>
        <text x="14" y="70" fontSize="11" letterSpacing="1">
          {short(day)}
        </text>
      </g>
    </svg>
  );
}
