import { useTranslation } from "react-i18next";

type Section = { title: string; body: string[] };

export default function Privacy() {
  const { t } = useTranslation();
  const contact = t("privacyPage.contact");
  const sections = t("privacyPage.sections", { returnObjects: true, contact }) as Section[];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-3 font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
        {t("privacyPage.title")}
      </h1>
      <p className="mb-8 text-ink-soft">{t("privacyPage.updated")}</p>
      {sections.map((s) => (
        <section key={s.title} className="mb-7">
          <h2 className="mb-2 font-display text-xl font-extrabold">{s.title}</h2>
          {s.body.map((p, i) => (
            <p key={i} className="mb-3 max-w-[65ch] leading-relaxed">
              {p}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
