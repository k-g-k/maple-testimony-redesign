import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// The overlay panel every modal on the page is built from. Grey ground with
// white cards on it, the same relationship the page itself uses, so a modal
// reads as a small page rather than a floating card.
//
// Slots, all optional except `children`:
//
//   title          the left of the header row
//   headerActions  buttons at the far right of that row; close is always last
//   children       the body, and the part that scrolls. It stretches to the
//                  panel's full height, so a short body still fills the modal
//   aside          a narrower second column beside the body, right by default
//   footer         a bar at the foot of the panel
//
// The whole panel scrolls as one, with the header and footer sticky inside it,
// so body content passes underneath them rather than stopping short. Both bleed
// to the panel edges and carry the panel's own background, which is what hides
// the content moving under them. With no footer the body simply ends at the
// panel's padding.
//
// `asidePinned` (default) makes the aside sticky under the header, so actions
// stay put while a long body scrolls beside them.
//
// Below sm the panel becomes a full-screen sheet and the columns stack: body
// then aside, or aside then body with `asideFirst`. `mainMinWidth` only
// applies from sm up, since a phone has no room to honour it.
const PAD = 20;

export function Modal({
  onClose,
  title,
  headerActions,
  aside,
  asidePinned = true,
  asideFirst = false,
  footer,
  maxWidth = "760px",
  minHeight,
  mainMinWidth,
  roomyBars = false,
  children,
}: {
  onClose: () => void;
  title?: ReactNode;
  headerActions?: ReactNode;
  aside?: ReactNode;
  asidePinned?: boolean;
  /**
   * Put the aside on the left, or above the body where the columns stack. It
   * stays second in the DOM either way, so the body is still what a screen
   * reader and the tab order reach first.
   */
  asideFirst?: boolean;
  footer?: ReactNode;
  maxWidth?: string;
  /** Floor for the panel, so a short body still gets a substantial modal. */
  minHeight?: string;
  /** Floor for the body column. Widen `maxWidth` to match, or the aside gets
   *  squeezed to make room for it. */
  mainMinWidth?: string;
  /** Header and footer with their content centred in them, and space between
      the header and the body. */
  roomyBars?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // The aside pins directly beneath the header, so it has to know how tall the
  // header actually is rather than assuming.
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerH, setHeaderH] = useState(0);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeaderH(el.offsetHeight));
    observer.observe(el);
    setHeaderH(el.offsetHeight);
    return () => observer.disconnect();
  }, []);

  // Rendered into <body> so no ancestor's stacking context can hold it
  // beneath the page: it sits above the nav, the sticky filter bar and the
  // floating add button.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 sm:p-[32px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, minHeight }}
        className={`relative flex w-full h-full sm:h-auto max-h-full flex-col overflow-y-auto bg-ground sm:rounded-panel shadow-[0_20px_60px_rgba(0,0,0,0.28)]`}
      >
        <div
          ref={headerRef}
          // Roomy, the header and footer content sits centred in them;
          // otherwise the inner edge is tighter, closing up to the body.
          style={{ padding: `${PAD}px ${PAD}px ${roomyBars ? PAD : 12}px` }}
          className="sticky top-0 z-20 flex items-center gap-[12px] bg-ground sm:rounded-t-panel"
        >
          <div className="flex-1 min-w-0">{title}</div>
          <div className="shrink-0 flex items-center gap-[18px]">
            {headerActions}
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-ink-muted hover:text-ink cursor-pointer"
            >
              <X className="w-[19px] h-[19px]" />
            </button>
          </div>
        </div>

        <div
          // Roomy, the body gets its own space below the header rather than
          // starting flush against it.
          style={{
            padding: `${roomyBars ? PAD : 0}px ${PAD}px ${footer ? 0 : PAD}px`,
          }}
          className={`flex flex-1 items-stretch gap-[16px] ${
            asideFirst
              ? "flex-col-reverse sm:flex-row-reverse"
              : "flex-col sm:flex-row"
          }`}
        >
          <div
            style={
              mainMinWidth
                ? ({ "--main-min": mainMinWidth } as React.CSSProperties)
                : undefined
            }
            className={`flex-1 min-w-0 ${
              mainMinWidth ? "sm:min-w-[var(--main-min)]" : ""
            }`}
          >
            {children}
          </div>
          {aside && (
            <div
              style={asidePinned ? { top: headerH } : undefined}
              className={`w-full sm:w-[200px] shrink-0 self-start ${
                asidePinned ? "sm:sticky" : ""
              }`}
            >
              {aside}
            </div>
          )}
        </div>

        {footer && (
          <div
            style={{ padding: `${roomyBars ? PAD : 12}px ${PAD}px ${PAD}px` }}
            className="sticky bottom-0 z-20 mt-auto bg-ground sm:rounded-b-panel"
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
