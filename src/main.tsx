import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "@fontsource/archivo/latin-500.css";
import "@fontsource/archivo/latin-700.css";
import "@fontsource/archivo/latin-800.css";
import "@fontsource/atkinson-hyperlegible/latin-400.css";
import "@fontsource/atkinson-hyperlegible/latin-400-italic.css";
import "@fontsource/atkinson-hyperlegible/latin-700.css";
import "./i18n";
import "./index.css";
import App from "./App";
import { loadAnalytics } from "./engine/analytics";

loadAnalytics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
