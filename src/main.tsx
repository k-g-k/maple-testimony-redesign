import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";

// Layout variants of the same page, for comparing side by side. /test puts
// the position picker on its own line and, at 390px and below, each card's
// date and menu on a line above the name; /test2 puts the picker on its own
// line and keeps its words above 390px; /test3 puts the picker on its own line
// and, at 440px and below, each card's stance chip on a line under the avatar
// and name; /test4 is the main page with each card's date on its own line
// above the body, aligned right, and the name held to one line with an
// ellipsis, on phones.
const DEFAULT = {
  positionRow: "inline",
  stackControlsNarrow: false,
  chipBelowHeaderNarrow: false,
  dateAboveBodyNarrow: false,
} as const;
const VARIANTS = {
  "/test": { ...DEFAULT, positionRow: "below", stackControlsNarrow: true },
  "/test2": { ...DEFAULT, positionRow: "below-labeled" },
  "/test3": { ...DEFAULT, positionRow: "below", chipBelowHeaderNarrow: true },
  "/test4": { ...DEFAULT, dateAboveBodyNarrow: true },
} as const;
const path = window.location.pathname.replace(/\/$/, "");
const variant = VARIANTS[path as keyof typeof VARIANTS] ?? DEFAULT;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App {...variant} />
  </StrictMode>,
);
