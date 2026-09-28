import { useEffect, type RefObject } from "react";
import { prefersReducedMotion } from "../../engine/motion";

export function useRouteLights(ref: RefObject<HTMLElement | null>, stage: string): void {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const legs = Array.from(root.querySelectorAll<HTMLElement>(".leg"));
    const fill = root.querySelector<HTMLElement>(".route-fill");

    const update = () => {
      if (!fill) return;
      const lit = legs.filter((l) => l.hasAttribute("data-lit") && l.hasAttribute("data-main"));
      const last = lit[lit.length - 1];
      const top = last ? last.getBoundingClientRect().top - root.getBoundingClientRect().top : 0;
      fill.style.height = last ? `${Math.max(0, top + 4)}px` : "0px";
    };
    const light = (leg: HTMLElement) => {
      leg.setAttribute("data-lit", "");
      leg.removeAttribute("data-pre");
    };

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      legs.forEach(light);
      update();
      return;
    }

    legs.forEach((leg) => {
      if (leg.hasAttribute("data-lit")) return;
      if (leg.getBoundingClientRect().top < window.innerHeight * 0.9) light(leg);
      else leg.setAttribute("data-pre", "");
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            light(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        });
        update();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    legs.forEach((leg) => {
      if (!leg.hasAttribute("data-lit")) io.observe(leg);
    });
    const safety = window.setTimeout(() => {
      legs.forEach(light);
      update();
    }, 6000);
    let frame = 0;
    const onMove = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("resize", onMove);
    update();
    return () => {
      io.disconnect();
      window.clearTimeout(safety);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onMove);
      window.removeEventListener("resize", onMove);
    };
  }, [ref, stage]);
}
