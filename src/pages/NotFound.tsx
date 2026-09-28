import { Link } from "react-router";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
        {t("notFound.title")}
      </h1>
      <p className="max-w-prose text-lg text-ink-soft">{t("notFound.body")}</p>
      <Link
        to="/"
        className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-accent px-5 font-display font-bold text-bg transition-colors hover:bg-accent-strong"
      >
        {t("notFound.home")}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
