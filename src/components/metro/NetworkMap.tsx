import { useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { Concept, ConceptId } from "../../schema/scenario.schema";
import { prefetchScenario, type CatalogEntry } from "../../engine/content";
import type { Completion } from "../../engine/storage";
import { buildNetwork, type Box, type Network } from "../../engine/network";
import { lineColor, lineInk, stopNumber } from "../../engine/lines";
import { DEFAULT_LANG } from "../../i18n";

type Props = {
  concepts: Concept[];
  scenarios: CatalogEntry[];
  completed: Record<string, Completion>;
  hereId: string | undefined;
  filter: ConceptId | null;
  onFilter: (id: ConceptId | null) => void;
};

type State = "here" | "done" | "todo";

const viewBox = (b: Box) => `${b.x} ${b.y} ${b.width} ${b.height}`;

export default function NetworkMap({
  concepts,
  scenarios,
  completed,
  hereId,
  filter,
  onFilter,
}: Props) {
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

  const cycle = () => {
    const i = concepts.findIndex((c) => c.id === filter);
    onFilter(i === concepts.length - 1 ? null : concepts[i + 1].id);
  };

  return (
    <>
      <FullMap net={net} scenarios={scenarios} stateOf={stateOf} filter={filter} />
      <button
        type="button"
        onClick={cycle}
        aria-label={
          t("home.network.mini") +
          (filter ? " " + t("home.network.miniCurrent", { line: t(`lines.${filter}.name`) }) : "")
        }
        className="block w-full rounded-xl bg-surface p-3 md:hidden"
      >
        <svg
          viewBox={viewBox(net.core)}
          aria-hidden="true"
          className="net net-mini block h-auto w-full"
        >
          <Lines net={net} stateOf={stateOf} filter={filter} mini />
          <Hub net={net} label={t("home.network.hub")} />
        </svg>
      </button>
    </>
  );
}

function FullMap({
  net,
  scenarios,
  stateOf,
  filter,
}: {
  net: Network;
  scenarios: CatalogEntry[];
  stateOf: (id: string) => State;
  filter: ConceptId | null;
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
          filter={filter}
          onActive={(id) => {
            setActive(id);
            prefetchScenario(DEFAULT_LANG, id);
          }}
        />
        <Hub net={net} label={t("home.network.hub")} />
      </svg>
      <p
        aria-hidden="true"
        className="mx-auto mt-3 min-h-[3.25rem] max-w-[62ch] text-center text-[15px] text-ink-soft"
      >
        {entry ? (
          <>
            <b className="block font-display text-ink">
              {t("home.network.status", {
                line: t(`lines.${entry.concept}.name`),
                n: stopNumber(entry.id),
                title: entry.title,
              })}
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
  filter,
  mini = false,
  onActive,
}: {
  net: Network;
  stateOf: (id: string) => State;
  filter: ConceptId | null;
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
  const r = mini ? 15 : 9;
  const size = mini ? 48 : 28;

  return net.lines.map((line, i) => (
    <g
      key={line.concept}
      className="net-line"
      data-dim={filter && filter !== line.concept ? "" : undefined}
      style={{ ["--lc" as string]: lineColor(line.concept), ["--i" as string]: i }}
    >
      <path
        className="net-rail"
        pathLength={1}
        d={`M${line.path.map((p) => `${p.x} ${p.y}`).join(" L")}`}
      />
      <g className="net-term" aria-hidden="true">
        <rect
          x={line.terminus.x - size / 2}
          y={line.terminus.y - size / 2}
          width={size}
          height={size}
          rx={mini ? 10 : 7}
          fill={lineColor(line.concept)}
        />
        {!mini && (
          <text
            x={line.terminus.x}
            y={line.terminus.y + 5.5}
            textAnchor="middle"
            fill={lineInk(line.concept)}
          >
            {t(`lines.${line.concept}.letter`)}
          </text>
        )}
      </g>
      {line.stations.map((s, k) => {
        const state = stateOf(s.id);
        const dot = (
          <>
            {state === "here" && <circle className="net-ping" cx={s.x} cy={s.y} r={r} />}
            <circle className="net-dot" cx={s.x} cy={s.y} r={r} />
          </>
        );
        if (mini) {
          return (
            <g key={s.id} className="net-stop" data-state={state} style={{ ["--j" as string]: k }}>
              {dot}
            </g>
          );
        }
        const { label } = s;
        return (
          <a
            key={s.id}
            href={`/s/${s.id}`}
            className="net-stop"
            data-state={state}
            style={{ ["--j" as string]: k }}
            aria-label={t("home.network.stop", {
              n: stopNumber(s.id),
              title: s.title,
              line: t(`lines.${line.concept}.name`),
              state: t(`home.network.state.${state}`),
            })}
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
              transform={label.rotate ? `rotate(${label.rotate} ${label.x} ${label.y})` : undefined}
            >
              {s.title}
            </text>
          </a>
        );
      })}
    </g>
  ));
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
