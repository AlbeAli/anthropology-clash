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
      className="w-full rounded border border-stone-300 bg-white px-4 py-3 text-left hover:border-teal-800 focus-visible:outline-2 focus-visible:outline-teal-800"
    >
      <span className="mr-2 font-mono text-sm uppercase text-teal-800">{id}</span>
      {text}
    </button>
  );
}
