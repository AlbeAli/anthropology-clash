import { useTranslation } from "react-i18next";
import type { ConceptId } from "../../schema/scenario.schema";
import { lineColor, lineInk } from "../../engine/lines";

type Props = { concept: ConceptId; size?: "sm" | "md" };

export default function LineBullet({ concept, size = "md" }: Props) {
  const { t } = useTranslation();
  return (
    <span
      aria-hidden="true"
      className={
        "inline-grid shrink-0 place-items-center font-display font-extrabold " +
        (size === "sm" ? "size-7 rounded-[5px] text-sm" : "size-11 rounded-md text-lg")
      }
      style={{ background: lineColor(concept), color: lineInk(concept) }}
    >
      {t(`lines.${concept}.letter`)}
    </span>
  );
}
