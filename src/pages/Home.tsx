import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { getScenarios } from "../engine/content";
import { DEFAULT_LANG } from "../i18n";

export default function Home() {
  const { t } = useTranslation();
  const first = getScenarios(DEFAULT_LANG)[0];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl font-semibold">{t("app.name")}</h1>
      <p className="text-lg text-stone-700">{t("app.tagline")}</p>
      {first && (
        <Link
          to={`/s/${first.id}`}
          className="inline-block rounded bg-teal-800 px-5 py-3 text-white hover:bg-teal-900"
        >
          {t("home.start")}
        </Link>
      )}
    </div>
  );
}
