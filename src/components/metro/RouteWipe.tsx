import { useState } from "react";
import { useLocation } from "react-router";
import { getConcepts } from "../../engine/content";
import { lineColor } from "../../engine/lines";
import { prefersReducedMotion } from "../../engine/motion";
import { DEFAULT_LANG } from "../../i18n";

export default function RouteWipe() {
  const { key, pathname } = useLocation();
  const [shown, setShown] = useState({ pathname, key });
  if (pathname !== shown.pathname) setShown({ pathname, key });
  if (shown.key === "default" || prefersReducedMotion()) return null;
  return (
    <div key={shown.key} className="metro-wipe" aria-hidden="true">
      {getConcepts(DEFAULT_LANG).map((c, i) => (
        <i key={c.id} style={{ background: lineColor(c.id), animationDelay: `${i * 0.035}s` }} />
      ))}
    </div>
  );
}
