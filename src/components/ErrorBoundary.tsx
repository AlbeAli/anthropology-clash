import { Component, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

type Props = { resetKey: string; children: ReactNode };
type State = { failed: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidUpdate(prev: Props) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? <ErrorPage /> : this.props.children;
  }
}

function ErrorPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
        {t("error.title")}
      </h1>
      <p className="max-w-prose text-lg text-ink-soft">{t("error.body")}</p>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex min-h-12 items-center rounded-sm bg-accent px-5 font-display font-bold text-bg transition-colors hover:bg-accent-strong"
        >
          {t("error.reload")}
        </button>
        <a
          href="/"
          className="inline-flex min-h-12 items-center rounded-sm border-[3px] border-ink px-5 font-display font-bold"
        >
          {t("error.home")}
        </a>
      </div>
    </div>
  );
}
