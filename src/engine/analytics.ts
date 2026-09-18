type EventName = "level_chosen" | "scenario_started" | "scenario_completed";
type EventData = Record<string, string | number>;

type Umami = { track: (name: string, data?: EventData) => void };

declare global {
  interface Window {
    umami?: Umami;
  }
}

export function analyticsEnabled(): boolean {
  return Boolean(import.meta.env.VITE_UMAMI_WEBSITE_ID && import.meta.env.VITE_UMAMI_SRC);
}

export function loadAnalytics(): void {
  const src = import.meta.env.VITE_UMAMI_SRC;
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
  if (!src || !websiteId || document.querySelector("script[data-website-id]")) return;
  const script = document.createElement("script");
  script.defer = true;
  script.src = src;
  script.dataset.websiteId = websiteId;
  document.head.appendChild(script);
}

export function track(name: EventName, data?: EventData): void {
  try {
    window.umami?.track(name, data);
  } catch {
    /* analytics non deve mai rompere l'app */
  }
}
