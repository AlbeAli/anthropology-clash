import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAccount, type LinkResult } from "../state/Account";
import { callbackError, fetchProviders, isAuthCallback, type Providers } from "../engine/account";

type Notice = LinkResult | "googleError" | "callbackError" | "signedOut" | "";

const primary =
  "inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-5 font-display font-extrabold text-bg transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 disabled:opacity-40";
const secondary =
  "inline-flex min-h-12 items-center justify-center rounded-md border-[3px] border-ink px-5 font-display font-extrabold transition-transform duration-200 ease-out-expo hover:-translate-y-0.5";

export default function SignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { available, user, status, sendLink, signInWithGoogle, signOut } = useAccount();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState<Providers>({ google: false });
  const [notice, setNotice] = useState<Notice>(() =>
    callbackError(window.location) ? "callbackError" : "",
  );
  const [pending, setPending] = useState(
    () => isAuthCallback(window.location) && !callbackError(window.location),
  );

  useEffect(() => {
    if (available) void fetchProviders().then(setProviders);
  }, [available]);

  const waiting = pending && !user;

  useEffect(() => {
    if (user && (window.location.search || window.location.hash)) {
      navigate("/accedi", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => {
      setPending(false);
      setNotice("callbackError");
    }, 8000);
    return () => clearTimeout(timer);
  }, [waiting]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(await sendLink(email.trim()));
    setBusy(false);
  }

  async function google() {
    if (!(await signInWithGoogle())) setNotice("googleError");
  }

  async function leave() {
    await signOut();
    setNotice("signedOut");
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-3 font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
        {user ? t("account.titleSignedIn") : t("account.title")}
      </h1>
      <p className="mb-7 max-w-[52ch] text-lg text-ink-soft">{t("account.lede")}</p>

      {!available ? (
        <p className="font-bold">{t("account.unavailable")}</p>
      ) : user ? (
        <section className="rounded-2xl border-[3px] border-ink p-5 sm:p-6">
          <p className="mb-2 text-lg font-bold">
            {user.email
              ? t("account.signedInAs", { email: user.email })
              : t("account.signedInNoEmail")}
          </p>
          <p className="mb-5 text-ink-soft" role="status">
            {t(`account.status.${status}`)}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link to="/viaggio" className={primary}>
              {t("account.journey")}
            </Link>
            <button type="button" onClick={leave} className={secondary}>
              {t("account.signOut")}
            </button>
          </div>
        </section>
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

      <p className="mt-8 border-t border-line pt-5 text-sm text-ink-soft">{t("account.privacy")}</p>
    </div>
  );
}
