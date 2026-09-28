import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAccount } from "../state/Account";

const primary =
  "inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-5 font-display font-extrabold text-bg transition-transform duration-200 ease-out-expo hover:-translate-y-0.5";
const secondary =
  "inline-flex min-h-12 items-center justify-center rounded-md border-[3px] border-ink px-5 font-display font-extrabold transition-transform duration-200 ease-out-expo hover:-translate-y-0.5";

export default function Profile() {
  const { t } = useTranslation();
  const { available, user, status, exportData, deleteAccount, signOut } = useAccount();
  const [notice, setNotice] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function download() {
    const json = await exportData();
    if (!json) {
      setNotice(t("account.exportFailed"));
      return;
    }
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = t("account.exportName");
    a.click();
    URL.revokeObjectURL(url);
    setNotice(t("account.exportDone"));
  }

  async function remove() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    const ok = await deleteAccount();
    setBusy(false);
    setConfirming(false);
    setNotice(ok ? t("account.deleted") : t("account.deleteFailed"));
  }

  async function leave() {
    await signOut();
    setNotice(t("account.signedOut"));
  }

  const method =
    user?.provider === "email" || user?.provider === "google" ? user.provider : "other";

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-7 font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
        {t("account.titleSignedIn")}
      </h1>

      {!available || !user ? (
        <div className="grid gap-4">
          <p className="text-lg">
            {available ? t("account.notSignedIn") : t("account.unavailable")}
          </p>
          {available && (
            <Link to="/accedi" className={primary + " justify-self-start"}>
              {t("account.goSignIn")}
            </Link>
          )}
        </div>
      ) : (
        <>
          <section className="rounded-2xl border-[3px] border-ink p-5 sm:p-6">
            <p className="mb-1 text-lg font-bold">
              {user.email
                ? t("account.signedInAs", { email: user.email })
                : t("account.signedInNoEmail")}
            </p>
            <p className="mb-2 text-ink-soft">{t(`account.method.${method}`)}</p>
            <p className="mb-5 text-ink-soft" role="status">
              {t(`account.status.${status}`)}
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link to="/viaggio" className={primary}>
                {t("account.journey")}
              </Link>
              <button type="button" onClick={download} className={secondary}>
                {t("account.export")}
              </button>
              <button type="button" onClick={leave} className={secondary}>
                {t("account.signOut")}
              </button>
            </div>
          </section>

          <section className="mt-10 border-t border-line pt-5">
            <h2 className="mb-2 font-display text-xl font-extrabold">{t("account.deleteTitle")}</h2>
            <p className="mb-3 max-w-[60ch] text-sm text-ink-soft">{t("account.deleteNote")}</p>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="inline-flex min-h-11 items-center rounded-md border-2 border-ink px-4 font-display text-sm font-bold disabled:opacity-40"
              >
                {confirming ? t("account.deleteConfirm") : t("account.delete")}
              </button>
              {confirming && (
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="inline-flex min-h-11 items-center rounded-md px-4 font-display text-sm font-bold underline underline-offset-4"
                >
                  {t("account.deleteCancel")}
                </button>
              )}
            </div>
          </section>
        </>
      )}

      <p className="mt-4 min-h-6 font-display font-bold" aria-live="polite">
        {notice}
      </p>

      <p className="mt-6 text-sm">
        <Link to="/privacy" className="font-bold underline underline-offset-4">
          {t("account.privacyLink")}
        </Link>
      </p>
    </div>
  );
}
