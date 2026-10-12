import { useMemo, useState, type MouseEvent, type PointerEvent } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { Concept, ConceptId } from "../../schema/scenario.schema";
import { prefetchScenario, type CatalogEntry } from "../../engine/content";
import type { Completion } from "../../engine/storage";
import { buildNetwork, nearestLine, type Box, type Network } from "../../engine/network";
import { lineColor, lineInk, stopNumber } from "../../engine/lines";
import { DEFAULT_LANG } from "../../i18n";

type Props = {
  concepts: Concept[];
  scenarios: CatalogEntry[];
  completed: Record<string, Completion>;
  hereId: string | undefined;
  onLine: (id: ConceptId) => void;
};

type State = "here" | "done" | "todo";

const viewBox = (b: Box) => `${b.x} ${b.y} ${b.width} ${b.height}`;

export default function NetworkMap({ concepts, scenarios, completed, hereId, onLine }: Props) {
  const { t } = useTranslation();
  const net = useMemo(
    () =>
      buildNetwork(
        scenarios,
        concepts.map((c) => c.id),
      ),
    [scenarios, concepts],
  );
  const stateOf = (id: string): State =>
    id === hereId ? "here" : id in completed ? "done" : "todo";

  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const m = e.currentTarget.getScreenCTM();
    if (!m) return;
    const line = nearestLine(net, new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()));
    if (line) onLine(line);
  };

  return (
    <>
      <FullMap net={net} scenarios={scenarios} stateOf={stateOf} />
      <div className="rounded-xl bg-surface p-3 md:hidden">
        <svg
          viewBox={viewBox(net.core)}
          aria-hidden="true"
          data-testid="net-mini"
          onPointerUp={pick}
          className="net net-mini block h-auto w-full cursor-pointer"
        >
          <Lines net={net} stateOf={stateOf} mini />
          <Hub net={net} label={t("home.network.hub")} />
        </svg>
        <p
          aria-hidden="true"
          className="mt-2 text-center font-display text-sm font-bold text-ink-soft"
        >
          {t("home.network.miniHint")}
        </p>
      </div>
    </>
  );
}

function FullMap({
  net,
  scenarios,
  stateOf,
}: {
  net: Network;
  scenarios: CatalogEntry[];
  stateOf: (id: string) => State;
}) {
  const { t } = useTranslation();
  const [active, setActive] = useState<string | null>(null);
  const entry = scenarios.find((s) => s.id === active);

  return (
    <nav aria-label={t("home.network.label")} className="hidden md:block">
      <svg
        viewBox={viewBox(net.box)}
        className="net mx-auto block h-auto max-h-[max(34rem,calc(100svh-7rem))] w-full"
      >
        <Lines
          net={net}
          stateOf={stateOf}
          onActive={(id) => {
            setActive(id);
            prefetchScenario(DEFAULT_LANG, id);
          }}
        />
        <Hub net={net} label={t("home.network.hub")} />
      </svg>
      <p
        aria-hidden="true"
        className="mx-auto mt-3 min-h-[3.25rem] max-w-[62ch] text-center text-base text-ink-soft"
      >
        {entry ? (
          <>
            <b className="block font-display text-ink">
              {t("home.network.status", {
                line: t(`lines.${entry.concept}.name`),
                n: stopNumber(entry.id),
                title: entry.title,
              })}
              {entry.also?.length
                ? " · " +
                  t("home.network.change", {
                    lines: entry.also.map((c) => t(`lines.${c}.name`)).join(", "),
                  })
                : ""}
            </b>
            {entry.hook && (entry.hook.length > 150 ? `${entry.hook.slice(0, 150)}…` : entry.hook)}
          </>
        ) : (
          t("home.network.hint")
        )}
      </p>
    </nav>
  );
}

function Lines({
  net,
  stateOf,
  mini = false,
  onActive,
}: {
  net: Network;
  stateOf: (id: string) => State;
  mini?: boolean;
  onActive?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const go = (e: MouseEvent, id: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(`/s/${id}`);
  };
  const k = mini ? 1.6 : 1;
  const size = mini ? 48 : 28;

  return (
    <>
      {net.lines.map((line, i) => (
        <g
          key={line.concept}
          className="net-line"
          style={{ ["--lc" as string]: lineColor(line.concept), ["--i" as string]: i }}
        >
          <path
            className="net-rail"
            pathLength={1}
            d={line.paths
              .map((path) => `M${path.map((q) => `${q.x} ${q.y}`).join(" L")}`)
              .join(" ")}
          />
          {line.termini.map((end) => (
            <g key={`${end.x},${end.y}`} className="net-term" aria-hidden="true">
              <rect
                x={end.x - size / 2}
                y={end.y - size / 2}
                width={size}
                height={size}
                rx={mini ? 10 : 7}
                fill={lineColor(line.concept)}
              />
              {!mini && (
                <text x={end.x} y={end.y + 5.5} textAnchor="middle" fill={lineInk(line.concept)}>
                  {t(`lines.${line.concept}.letter`)}
                </text>
              )}
            </g>
          ))}
        </g>
      ))}
      {net.lines.flatMap((line, i) =>
        line.stations.map((s, j) => {
          const state = stateOf(s.id);
          const change = s.also.length > 0;
          const r = (change ? 12 : 9) * k;
          const dot = (
            <>
              {state === "here" && <circle className="net-ping" cx={s.x} cy={s.y} r={r} />}
              {s.shape.kind === "pill" ? (
                <rect
                  className="net-dot net-change"
                  x={s.x - (s.shape.width + 2 * r - 4) / 2}
                  y={s.y - r}
                  width={s.shape.width + 2 * r - 4}
                  height={2 * r}
                  rx={r}
                  transform={s.shape.rotate ? `rotate(${s.shape.rotate} ${s.x} ${s.y})` : undefined}
                />
              ) : (
                <circle
                  className={change ? "net-dot net-change" : "net-dot"}
                  cx={s.x}
                  cy={s.y}
                  r={r}
                />
              )}
            </>
          );
          const style = {
            ["--lc" as string]: lineColor(line.concept),
            ["--i" as string]: i,
            ["--j" as string]: j,
          };
          if (mini) {
            return (
              <g key={s.id} className="net-stop" data-state={state} style={style}>
                {dot}
              </g>
            );
          }
          const changeText = change
            ? ", " +
              t("home.network.change", {
                lines: s.also.map((c) => t(`lines.${c}.name`)).join(", "),
              })
            : "";
          const { label } = s;
          return (
            <a
              key={s.id}
              href={`/s/${s.id}`}
              className="net-stop"
              data-state={state}
              style={style}
              aria-label={
                t("home.network.stop", {
                  n: stopNumber(s.id),
                  title: s.title,
                  line: t(`lines.${line.concept}.name`),
                  state: t(`home.network.state.${state}`),
                }) + changeText
              }
              onClick={(e) => go(e, s.id)}
              onMouseEnter={() => onActive?.(s.id)}
              onFocus={() => onActive?.(s.id)}
            >
              <circle className="net-hit" cx={s.x} cy={s.y} r={22} />
              {dot}
              <text
                className="net-label"
                x={label.x}
                y={label.y}
                textAnchor={label.anchor}
                transform={
                  label.rotate ? `rotate(${label.rotate} ${label.x} ${label.y})` : undefined
                }
              >
                {s.title}
              </text>
            </a>
          );
        }),
      )}
    </>
  );
}

function Hub({ net, label }: { net: Network; label: string }) {
  const { hub } = net;
  return (
    <g className="net-hub" aria-hidden="true">
      <rect
        x={hub.x - hub.width / 2}
        y={hub.y - hub.height / 2}
        width={hub.width}
        height={hub.height}
        rx={hub.height / 2}
      />
      {label && (
        <text x={hub.x} y={hub.y + 6.5} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}
