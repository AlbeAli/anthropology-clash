type Props = {
  id: string;
  text: string;
  onSelect: (id: string) => void;
  state?: "open" | "chosen" | "other";
};

const frame = {
  open: "border-line bg-surface hover:border-accent hover:bg-accent-soft active:bg-accent-soft",
  chosen: "border-accent bg-accent-soft",
  other: "border-line bg-surface text-ink-soft",
};

const badge = {
  open: "border-accent text-accent group-hover:bg-accent group-hover:text-surface",
  chosen: "border-accent bg-accent text-surface",
  other: "border-line text-ink-soft",
};

export default function ChoiceButton({ id, text, onSelect, state = "open" }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      disabled={state !== "open"}
      aria-pressed={state === "chosen"}
      className={`group flex w-full items-start gap-4 rounded-sm border px-4 py-4 text-left text-base leading-snug text-ink transition-colors ${frame[state]}`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm border font-mono text-xs font-medium uppercase transition-colors ${badge[state]}`}
      >
        {id}
      </span>
      <span>{text}</span>
    </button>
  );
}
