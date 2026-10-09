import { useTranslation } from "react-i18next";
import type { GlossaryEntry } from "../schema/scenario.schema";

type Props = { entries: GlossaryEntry[]; className?: string };

export default function ContextNotes({ entries, className = "" }: Props) {
  const { t } = useTranslation();
  return (
    <dl className={"grid gap-4 " + className}>
      {entries.map((e) => (
        <div key={e.id} className="sheet-block">
          <dt className="font-display font-extrabold">{e.term}</dt>
          <dd className="mt-1 leading-relaxed">{e.text}</dd>
          <dd className="mt-1 text-sm text-ink-soft">
            <span className="font-bold">{t("glossary.source", { count: e.source.length })}:</span>{" "}
            {e.source.join("; ")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
