import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function CopyLink({ url }: { url: string }) {
  const { t } = useTranslation();
  const [notice, setNotice] = useState("");
  const [fallback, setFallback] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function copy() {
    const manual = () => {
      setFallback(true);
      setNotice(t("itineraries.builder.copyFallback"));
      requestAnimationFrame(() => input.current?.select());
    };
    try {
      navigator.clipboard
        .writeText(url)
        .then(() => setNotice(t("itineraries.builder.copied")), manual);
    } catch {
      manual();
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-12 items-center justify-self-start rounded-md border-[3px] border-ink px-5 font-display font-extrabold transition-transform duration-200 ease-out-expo hover:-translate-y-0.5"
      >
        {t("itineraries.builder.copy")}
      </button>
      <p role="status" className="min-h-5 text-sm text-ink-soft">
        {notice}
      </p>
      {fallback && (
        <input
          ref={input}
          readOnly
          value={url}
          aria-label={t("itineraries.builder.linkLabel")}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-md border-2 border-ink bg-bg px-3 py-2 font-mono text-sm"
        />
      )}
    </div>
  );
}
