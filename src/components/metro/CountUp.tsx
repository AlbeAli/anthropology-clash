import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../../engine/motion";

export default function CountUp({ to }: { to: number }) {
  const reduce = prefersReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 700);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [to, reduce]);

  return <>{reduce ? to : value}</>;
}
