type Props = {
  id: string;
  text: string;
  onSelect: (id: string) => void;
};

export default function ChoiceButton({ id, text, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="group flex w-full items-start gap-4 rounded-sm border border-line bg-surface px-4 py-4 text-left text-base leading-snug text-ink transition-colors hover:border-accent hover:bg-accent-soft active:bg-accent-soft"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm border border-accent font-mono text-xs font-medium uppercase text-accent transition-colors group-hover:bg-accent group-hover:text-surface"
      >
        {id}
      </span>
      <span>{text}</span>
    </button>
  );
}
