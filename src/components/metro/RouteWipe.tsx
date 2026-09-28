import { useLocation } from "react-router";
import { getConcepts } from "../../engine/content";
import { lineColor } from "../../engine/lines";
import { prefersReducedMotion } from "../../engine/motion";
import { DEFAULT_LANG } from "../../i18n";

export default function RouteWipe() {
  const { key } = useLocation();
  if (key === "default" || prefersReducedMotion()) return null;
  return (
    <div key={key} className="metro-wipe" aria-hidden="true">
      {getConcepts(DEFAULT_LANG).map((c, i) => (
        <i key={c.id} style={{ background: lineColor(c.id), animationDelay: `${i * 0.035}s` }} />
      ))}
    </div>
  );
}
