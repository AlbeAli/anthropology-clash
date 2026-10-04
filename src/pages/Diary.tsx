import { Suspense, use, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { getCatalog, loadScenario } from "../engine/content";
import { diaryEntries, diaryText, type DiaryEntry } from "../engine/diary";
import { stopNumber } from "../engine/lines";
import { NOTE_MAX, type Completion } from "../engine/storage";
import { DEFAULT_LANG } from "../i18n";
import { useAppState } from "../state/AppState";
import LineBullet from "../components/metro/LineBullet";

const button =
  "inline-flex min-h-12 items-center rounded-md border-[3px] border-ink px-5 font-display font-extrabold";

export default function Diary() {
  const { t, i18n } = useTranslation();
  const { state, persisted, setNote, clearNotes } = useAppState();
  const { hash } = useLocation();
  const target = decodeURIComponent(hash.slice(1));
  const entries = diaryEntries(state, getCatalog(DEFAULT_LANG));
  const hasNotes = entries.some((e) => e.note);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState("");

  const day = (at: string) =>
    new Date(`${at}T12:00:00`).toLocaleDateString(i18n.language, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  async function download() {
    const blocks = await Promise.all(
      entries
        .filter((e) => e.note)
        .map(async (e) => ({
          title: e.scenario.title,
          meta:
            t("diary.meta", {
              line: t(`lines.${e.scenario.concept}.name`),
              n: stopNumber(e.scenario.id),
            }) + (e.completion ? ` · ${t("diary.visitedOn", { date: day(e.completion.at) })}` : ""),
          choice: e.completion
            ? await choiceText(e.scenario.id, e.completion).then(
                (text) => text && t("diary.choice", { text }),
              )
            : undefined,
          text: e.note!.text,
        })),
    );
    const text = diaryText(t("diary.fileHead", { app: t("app.name") }), blocks);
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t("diary.fileName")}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function clear() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    clearNotes();
    setConfirming(false);
    setNotice(t("diary.cleared"));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-3 font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
        {t("diary.title")}
      </h1>
      <p className="mb-4 max-w-[52ch] text-lg text-ink-soft">{t("diary.lede")}</p>
      <p className="mb-8 rounded-lg bg-surface px-4 py-3 text-sm text-ink-soft">
        {persisted ? t("diary.privacy") : t("diary.noStorage")}
      </p>

      {entries.length === 0 ? (
        <p className="grid justify-items-start gap-4">
          <span>{t("diary.empty")}</span>
          <Link to="/" className={button}>
            {t("diary.emptyLink")}
          </Link>
        </p>
      ) : (
        <ol className="grid gap-8">
          {entries.map((e) => (
            <Entry
              key={e.scenario.id}
              entry={e}
              focus={e.scenario.id === target}
              meta={
                t("diary.meta", {
                  line: t(`lines.${e.scenario.concept}.name`),
                  n: stopNumber(e.scenario.id),
                }) +
                " · " +
                (e.completion
                  ? t("diary.visitedOn", { date: day(e.completion.at) })
                  : t("diary.notVisited"))
              }
              persisted={persisted}
              onSave={(text) => setNote(e.scenario.id, text)}
            />
          ))}
        </ol>
      )}

      {hasNotes && (
        <section className="mt-10 grid gap-3 border-t-2 border-ink pt-6">
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={download}
              className="inline-flex min-h-12 items-center rounded-md bg-ink px-5 font-display font-extrabold text-bg"
            >
              {t("diary.download")}
            </button>
            <button type="button" onClick={clear} className={button}>
              {confirming ? t("diary.clearConfirm") : t("diary.clear")}
            </button>
            {confirming && (
              <button type="button" onClick={() => setConfirming(false)} className={button}>
                {t("diary.clearCancel")}
              </button>
            )}
          </div>
          <p className="text-sm text-ink-soft">{t("diary.clearNote")}</p>
        </section>
      )}
      <p className="mt-3 min-h-6 font-display text-sm font-bold" role="status">
        {notice}
      </p>
    </div>
  );
}

async function choiceText(id: string, completion: Completion): Promise<string | undefined> {
  const scenario = await loadScenario(DEFAULT_LANG, id);
  return scenario?.levels[completion.level].choices.find((c) => c.id === completion.choice)?.text;
}

function Entry({
  entry,
  focus,
  meta,
  persisted,
  onSave,
}: {
  entry: DiaryEntry;
  focus: boolean;
  meta: string;
  persisted: boolean;
  onSave: (text: string) => void;
}) {
  const { t } = useTranslation();
  const { scenario, completion, note } = entry;
  const [open, setOpen] = useState(!!note || focus);
  const [text, setText] = useState(note?.text ?? "");
  const [status, setStatus] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);
  const item = useRef<HTMLLIElement>(null);
  const pending = useRef<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const save = useRef(onSave);
  useLayoutEffect(() => {
    save.current = onSave;
  });

  const flush = () => {
    window.clearTimeout(timer.current);
    if (pending.current === null) return;
    save.current(pending.current);
    pending.current = null;
    setStatus("done");
  };

  useEffect(() => {
    if (!focus) return;
    item.current?.scrollIntoView({ block: "start" });
    area.current?.focus();
  }, [focus]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (pending.current !== null) save.current(pending.current);
    },
    [],
  );

  const change = (value: string) => {
    setText(value);
    setStatus("");
    pending.current = value;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 500);
  };

  const id = `nota-${scenario.id}`;

  return (
    <li ref={item} id={scenario.id} className="grid scroll-mt-6 gap-3 border-t-2 border-ink pt-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
        <LineBullet concept={scenario.concept} size="sm" />
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-ink-soft">{meta}</p>
          <h2 className="font-display text-xl leading-snug font-extrabold">
            <Link to={`/s/${scenario.id}`} className="underline-offset-4 hover:underline">
              {scenario.title}
            </Link>
          </h2>
          {completion && (
            <Suspense fallback={null}>
              <Choice id={scenario.id} completion={completion} />
            </Suspense>
          )}
        </div>
      </div>
      {open ? (
        <div className="grid gap-2">
          <Suspense fallback={null}>
            <Prompts
              id={scenario.id}
              onPick={(q) => {
                change(text.trim() ? `${q}\n\n${text}` : `${q}\n\n`);
                area.current?.focus();
              }}
            />
          </Suspense>
          <label htmlFor={id} className="font-display text-sm font-bold">
            {t("diary.label", { title: scenario.title })}
          </label>
          <textarea
            ref={area}
            id={id}
            value={text}
            maxLength={NOTE_MAX}
            onChange={(e) => change(e.target.value)}
            onBlur={flush}
            className="min-h-40 w-full rounded-lg border-2 border-ink bg-bg p-3 leading-relaxed"
          />
          <p className="flex flex-wrap justify-between gap-2 font-display text-sm font-bold text-ink-soft">
            <span role="status">
              {status === "done" ? (persisted ? t("diary.saved") : t("diary.notSaved")) : ""}
            </span>
            {NOTE_MAX - text.length <= 200 && (
              <span>{t("diary.left", { count: NOTE_MAX - text.length })}</span>
            )}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            requestAnimationFrame(() => area.current?.focus());
          }}
          className="min-h-11 justify-self-start font-display font-bold underline underline-offset-4"
        >
          {t("diary.write")}
        </button>
      )}
    </li>
  );
}

function Choice({ id, completion }: { id: string; completion: Completion }) {
  const { t } = useTranslation();
  const scenario = use(loadScenario(DEFAULT_LANG, id));
  const text = scenario?.levels[completion.level].choices.find(
    (c) => c.id === completion.choice,
  )?.text;
  return text ? <p className="mt-1 text-ink-soft">{t("diary.choice", { text })}</p> : null;
}

function Prompts({ id, onPick }: { id: string; onPick: (question: string) => void }) {
  const { t } = useTranslation();
  const scenario = use(loadScenario(DEFAULT_LANG, id));
  if (!scenario?.discuss?.length) return null;
  return (
    <details className="rounded-lg bg-surface px-4 py-2">
      <summary className="min-h-10 cursor-pointer py-2 font-display text-sm font-bold">
        {t("diary.prompts")}
      </summary>
      <p className="mb-2 text-sm text-ink-soft">{t("diary.promptHint")}</p>
      <ul className="grid gap-2 pb-2">
        {scenario.discuss.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onPick(q)}
              className="w-full rounded-lg border-2 border-line bg-bg px-3 py-2 text-left text-sm hover:border-ink"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
