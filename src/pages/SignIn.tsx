import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAccount, type LinkResult } from "../state/Account";
import { callbackError, fetchProviders, isAuthCallback, type Providers } from "../engine/account";

type Notice = LinkResult | "googleError" | "callbackError" | "";

const primary =
  "inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-5 font-display font-extrabold text-bg transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 disabled:opacity-40";
const secondary =
  "inline-flex min-h-12 items-center justify-center rounded-md border-[3px] border-ink px-5 font-display font-extrabold transition-transform duration-200 ease-out-expo hover:-translate-y-0.5";

export default function SignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { available, user, sendLink, signInWithGoogle } = useAccount();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState<Providers>({ google: false });
  const [notice, setNotice] = useState<Notice>(() =>
    callbackError(window.location) ? "callbackError" : "",
  );
  const [pending, setPending] = useState(
    () => isAuthCallback(window.location) && !callbackError(window.location),
  );
  const waiting = pending || Boolean(user);

  useEffect(() => {
    if (available) void fetchProviders().then(setProviders);
  }, [available]);

  useEffect(() => {
    if (user) navigate("/profilo", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!pending || user) return;
    const timer = setTimeout(() => {
      setPending(false);
      setNotice("callbackError");
    }, 8000);
    return () => clearTimeout(timer);
  }, [pending, user]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(await sendLink(email.trim()));
    setBusy(false);
  }

  async function google() {
    if (!(await signInWithGoogle())) setNotice("googleError");
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-3 font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
        {t("account.title")}
      </h1>
      <p className="mb-7 max-w-[52ch] text-lg text-ink-soft">{t("account.lede")}</p>

      {!available ? (
        <p className="font-bold">{t("account.unavailable")}</p>
      ) : waiting ? (
        <p className="font-display text-lg font-bold" role="status">
          {t("account.checking")}
        </p>
      ) : (
        <section>
          <form onSubmit={submit} className="grid gap-3">
            <label htmlFor="account-email" className="font-display font-bold">
              {t("account.emailLabel")}
            </label>
            <input
              id="account-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("account.emailPlaceholder")}
              className="min-h-12 w-full rounded-md border-[3px] border-ink bg-bg px-3 text-lg"
            />
            <button type="submit" disabled={busy} className={primary + " sm:justify-self-start"}>
              {busy ? t("account.sending") : t("account.send")}
            </button>
          </form>
          {providers.google && (
            <>
              <p className="my-4 font-display text-sm font-bold text-ink-soft uppercase">
                {t("account.or")}
              </p>
              <button type="button" onClick={google} className={secondary}>
                {t("account.google")}
              </button>
            </>
          )}
        </section>
      )}

      <p className="mt-4 min-h-6 font-display font-bold" aria-live="polite">
        {notice ? t(`account.${notice}`) : ""}
      </p>

      <p className="mt-8 border-t border-line pt-5 text-sm text-ink-soft">
        {t("account.privacy")}{" "}
        <Link to="/privacy" className="font-bold underline underline-offset-4">
          {t("account.privacyLink")}
        </Link>
      </p>
    </div>
  );
}
