import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { Level } from "../schema/scenario.schema";
import { getScenario } from "../engine/content";
import { DEFAULT_LANG } from "../i18n";
import ScenarioCard from "../components/ScenarioCard";

type Props = { level: Level };

export default function ScenarioPage({ level }: Props) {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const scenario = getScenario(DEFAULT_LANG, id);

  if (!scenario) {
    return <p className="text-stone-600">{t("scenario.notFound")}</p>;
  }

  return <ScenarioCard scenario={scenario} level={level} onSelect={() => {}} />;
}
