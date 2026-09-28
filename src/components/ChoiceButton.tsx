type Props = {
  id: string;
  number: number;
  text: string;
  onSelect: (id: string) => void;
  state?: "open" | "chosen" | "other";
};

export default function ChoiceButton({ id, number, text, onSelect, state = "open" }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      disabled={state !== "open"}
      aria-pressed={state === "chosen"}
      className={
        "group relative grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 overflow-hidden rounded-xl border-[3px] p-4 text-left text-[1.05rem] leading-snug font-bold transition-[border-color,background-color,transform] duration-200 ease-out-expo " +
        (state === "open"
          ? "border-transparent bg-surface hover:translate-x-1 hover:border-ink active:scale-[0.99]"
          : state === "chosen"
            ? "exit-chosen border-ink bg-bg"
            : "border-transparent bg-surface text-ink-soft")
      }
    >
      <span
        aria-hidden="true"
        className={
          "relative inline-grid size-11 place-items-center rounded-md font-display text-lg font-extrabold " +
          (state === "other" ? "border-[3px] border-ink bg-bg text-ink" : "bg-ink text-bg")
        }
      >
        {number}
      </span>
      <span className="relative">{text}</span>
      <span
        aria-hidden="true"
        className={
          "relative font-display text-xl font-extrabold transition-[opacity,transform] duration-200 ease-out-expo " +
          (state === "chosen"
            ? "opacity-100"
            : "-translate-x-1.5 opacity-0 group-hover:translate-x-0 group-hover:opacity-100")
        }
      >
        →
      </span>
    </button>
  );
}
