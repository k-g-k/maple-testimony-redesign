import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";

// Layout variants of the same page, for comparing the filter row side by side.
// /test puts the position picker on its own line; /test2 does the same and
// keeps its words above 390px.
const DEFAULT = { positionRow: "inline" } as const;
const VARIANTS = {
  "/test": { positionRow: "below" },
  "/test2": { positionRow: "below-labeled" },
} as const;
const path = window.location.pathname.replace(/\/$/, "");
const variant = VARIANTS[path as keyof typeof VARIANTS] ?? DEFAULT;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App {...variant} />
  </StrictMode>,
);
