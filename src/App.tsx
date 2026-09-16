import { useState } from "react";
import { Route, Routes, Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { Level } from "./schema/scenario.schema";
import LevelToggle from "./components/LevelToggle";
import Home from "./pages/Home";
import ScenarioPage from "./pages/Scenario";

export default function App() {
  const { t } = useTranslation();
  const [level, setLevel] = useState<Level>("neofita");

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="font-serif text-lg font-semibold">
            {t("app.name")}
          </Link>
          <LevelToggle level={level} onChange={setLevel} />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/s/:id" element={<ScenarioPage level={level} />} />
        </Routes>
      </main>
    </div>
  );
}
