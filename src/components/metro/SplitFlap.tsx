import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../engine/motion";

const GLYPHS = "ABCDEFGHILMNOPQRSTUVZ";

export default function SplitFlap({ text, className = "" }: { text: string; className?: string }) {
  const root = useRef<HTMLSpanElement>(null);
  const words = text.toUpperCase().split(" ");

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const cells = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-c]"));
    const timers = cells.map((cell, i) => {
      const final = cell.dataset.c ?? "";
      const stop = 5 + i * 1.1 + Math.random() * 4;
      let n = 0;
      cell.classList.add("flap-spin");
      const id = window.setInterval(() => {
        n += 1;
        if (n >= stop) {
          cell.textContent = final;
          cell.classList.remove("flap-spin");
          window.clearInterval(id);
        } else {
          cell.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }, 55);
      return id;
    });
    return () => {
      timers.forEach((id) => window.clearInterval(id));
      cells.forEach((cell) => {
        cell.textContent = cell.dataset.c ?? "";
        cell.classList.remove("flap-spin");
      });
    };
  }, [text]);

  return (
    <span ref={root} className={"flap " + className}>
      <span className="sr-only">{text}</span>
      {words.map((word, w) => (
        <span key={w} aria-hidden="true" className="flap-word">
          {Array.from(word).map((c, i) => (
            <span key={i} data-c={c} className="flap-cell">
              {c}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
