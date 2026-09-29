import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { getEntry } from "../engine/content";
import { curatedTrip, customTrip, decodeStops } from "../engine/itineraries";
import { lineColor } from "../engine/lines";
import { DEFAULT_LANG } from "../i18n";
import { useAppState } from "../state/AppState";
import CopyLink from "../components/itinerary/CopyLink";
import StopList from "../components/itinerary/StopList";
import NotFound from "./NotFound";

const primary =
  "inline-flex min-h-12 items-center gap-2 rounded-md bg-ink px-5 font-display font-extrabold text-bg transition-transform duration-200 ease-out-expo hover:-translate-y-0.5";
const outline =
  "inline-flex min-h-12 items-center rounded-md border-[3px] border-ink px-5 font-display font-extrabold transition-transform duration-200 ease-out-expo hover:-translate-y-0.5";

export default function ItineraryPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [params] = useSearchParams();
  const { state } = useAppState();
  const decoded = id ? { stops: [], dropped: 0 } : decodeStops(DEFAULT_LANG, params.get("f"));
  const trip = id ? curatedTrip(DEFAULT_LANG, id) : customTrip(decoded.stops);
  const title = trip ? (trip.title ?? t("itineraries.custom.title")) : t("notFound.title");

  useEffect(() => {
    document.title = `${title} · ${t("app.name")}`;
  }, [title, t]);

  if (!trip && id) return <NotFound />;

  if (!trip) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="font-display text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
          {t("itineraries.custom.title")}
        </h1>
        <p className="text-lg text-ink-soft">{t("itineraries.custom.invalid")}</p>
        <Link to="/percorsi#componi" className={primary}>
          {t("itineraries.custom.compose")}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  const done = trip.stops.filter((s) => s in state.completed).length;
  const firstTodo = trip.stops.find((s) => !(s in state.completed));
  const target = firstTodo ?? trip.stops[0];
  const action = done === 0 ? "start" : firstTodo ? "continue" : "again";

  return (
    <div className="mx-auto max-w-3xl">
      <header className="relative mb-6 overflow-hidden rounded-xl bg-panel px-5 pt-5 pb-7 text-white ring-1 ring-(--panel-ring) sm:px-6">
        <p className="font-display text-sm font-bold opacity-85">
          {t("itineraries.banner")} · {t("itineraries.stops", { count: trip.stops.length })}
        </p>
        <h1 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 flex h-1.5">
          {trip.stops.map((s) => {
            const concept = getEntry(DEFAULT_LANG, s)?.concept;
            return (
              <i
                key={s}
                className="flex-1"
                style={{ background: concept ? lineColor(concept) : undefined }}
              />
            );
          })}
        </span>
      </header>

      <p className="mb-4 max-w-[62ch] text-lg leading-relaxed text-pretty">
        {trip.description ?? t("itineraries.custom.description")}
      </p>
      {decoded.dropped > 0 && (
        <p className="mb-4 rounded-md border-2 border-dashed border-ink px-4 py-3 text-[15px]">
          {t("itineraries.custom.dropped", { count: decoded.dropped })}
        </p>
      )}
      <p className="mb-5 font-display text-sm font-bold text-ink-soft">
        {t("itineraries.progress", { count: done, total: trip.stops.length })}
      </p>

      <div className="mb-8 flex flex-wrap items-start gap-2.5">
        <Link to={`/s/${target}${trip.search}`} className={primary}>
          {t(`itineraries.${action}`)}
          <span aria-hidden="true">→</span>
        </Link>
        {!trip.id && (
          <>
            <Link to={`/percorsi${trip.search}#componi`} className={outline}>
              {t("itineraries.custom.edit")}
            </Link>
            <CopyLink url={`${window.location.origin}${trip.href}`} />
          </>
        )}
      </div>

      <h2 className="mb-4 font-display text-2xl font-extrabold">{t("itineraries.stopsHeading")}</h2>
      <StopList stops={trip.stops} search={trip.search} completed={state.completed} />

      <Link
        to="/percorsi"
        className="mt-4 inline-block font-display font-bold underline decoration-2 underline-offset-4 hover:text-accent"
      >
        {t("itineraries.all")}
      </Link>
    </div>
  );
}
