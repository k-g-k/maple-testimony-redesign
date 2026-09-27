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
  sidebar,
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
  /** Floor for the panel from sm up, so a short body still gets a
      substantial modal. */
  minHeight?: string;
  /** Floor for the body column. Widen `maxWidth` to match, or the aside gets
   *  squeezed to make room for it. */
  mainMinWidth?: string;
  /** Header and footer with their content centred in them, and space between
      the header and the body. */
  roomyBars?: boolean;
  /** A full-height column down the panel's left edge from sm up, beside the
      header, body and footer rather than inside them. Hidden on phones, so
      anything in it that phones need must also appear in the body. */
  sidebar?: ReactNode;
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

  // On phones the panel is sized to the visible part of the screen, so when
  // the keyboard opens the panel shrinks above it and the sticky footer stays
  // in view. A fixed element otherwise keeps its full height, and iOS Safari
  // slides the keyboard over its bottom.
  const [visible, setVisible] = useState<{ top: number; height: number } | null>(
    null,
  );
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const narrow = window.matchMedia("(max-width: 639.98px)");
    const update = () =>
      setVisible(
        narrow.matches ? { top: vv.offsetTop, height: vv.height } : null,
      );
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    narrow.addEventListener("change", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      narrow.removeEventListener("change", update);
    };
  }, []);

  const hasHeading = Boolean(title || headerActions);
  const closeButton = (
    <button
      onClick={onClose}
      aria-label="Close"
      // Below 440px, larger like the form's buttons, with padding for a thumb
      // that the negative margin keeps out of the layout.
      className="text-ink-muted hover:text-ink cursor-pointer max-[440px]:p-[8px] max-[440px]:-m-[8px]"
    >
      <X className="size-[19px] max-[440px]:size-[24px]" />
    </button>
  );

  // Rendered into <body> so no ancestor's stacking context can hold it
  // beneath the page: it sits above the nav, the sticky filter bar and the
  // floating add button.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={
        visible
          ? { top: visible.top, height: visible.height, bottom: "auto" }
          : undefined
      }
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 sm:p-[32px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        // The height floor applies from sm up only: on a phone the panel fills
        // the visible screen, which the keyboard can make shorter than it.
        style={
          {
            maxWidth,
            ...(minHeight ? { "--panel-min": minHeight } : {}),
          } as React.CSSProperties
        }
        // The panel clips to its rounded corners; the column beside the
        // sidebar is what scrolls, so its header and footer stick within it.
        className={`relative flex w-full h-full sm:h-auto max-h-full ${
          minHeight ? "sm:min-h-[var(--panel-min)]" : ""
        } overflow-hidden bg-ground sm:rounded-panel shadow-[0_20px_60px_rgba(0,0,0,0.28)]`}
      >
        {sidebar && (
          <div className="hidden sm:block w-[240px] shrink-0 overflow-y-auto">
            {sidebar}
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          <div
            ref={headerRef}
            // Roomy, the header and footer content sits centred in them;
            // otherwise the inner edge is tighter, closing up to the body. With
            // nothing but the close button, the header is a slim bar so the body
            // starts close to the top.
            style={{
              padding: hasHeading
                ? `${PAD}px ${PAD}px ${roomyBars ? PAD : 12}px`
                : `16px ${PAD}px 8px`,
            }}
            className="sticky top-0 z-20 flex items-center gap-[12px] bg-ground"
          >
            <div className="flex-1 min-w-0">{title}</div>
            <div className="shrink-0 flex items-center gap-[18px]">
              {headerActions}
              {closeButton}
            </div>
          </div>

          <div
            // Roomy, the body gets its own space below the header rather than
            // starting flush against it.
            style={{
              padding: `${roomyBars && hasHeading ? PAD : 0}px ${PAD}px ${
                footer ? 0 : PAD
              }px`,
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
              className="sticky bottom-0 z-20 mt-auto bg-ground"
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
