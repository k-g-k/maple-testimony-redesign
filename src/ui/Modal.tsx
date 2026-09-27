import { useEffect, useState } from "react";
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
// The header stays fixed across the top of the panel. Below it the body
// scrolls, with the footer sticky at its foot, so body content passes
// underneath the footer rather than stopping short. The footer bleeds to the
// panel edges and carries the panel's own background, which is what hides the
// content moving under it. With no footer the body simply ends at the panel's
// padding.
//
// `asidePinned` (default) makes the aside sticky at the top of the scrolling
// body, so actions stay put while a long body scrolls beside them.
//
// Below 950px the panel becomes a full-screen sheet. The columns stay side by
// side down to sm and stack below it: body then aside, or aside then body
// with `asideFirst`. `mainMinWidth` only applies from sm up, since a phone has
// no room to honour it.
const PAD = 20;
// The phone rail, from 391px up to sm: 24px of the sidebar's grey down the
// left edge, with the content's usual 20px padding measured from the rail
// rather than the edge. At 390px and below there is no room to spare for it.
// The padding overrides the inline padding, hence the important flag.
const RAIL =
  "min-[391px]:max-sm:bg-[linear-gradient(to_right,var(--color-sunken)_24px,var(--color-ground)_24px)] min-[391px]:max-sm:pl-[44px]!";

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
  headerClassName = "",
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
  /** Header and footer with their content centred in them, and a little
      space between the header and the body. */
  roomyBars?: boolean;
  /** A full-height column down the panel's left edge from sm up, below the
      header and beside the body and footer. Hidden on phones, so anything in
      it that phones need must also appear in the body. */
  sidebar?: ReactNode;
  /** Extra classes for the header bar, such as a phone-only background. */
  headerClassName?: string;
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

  // Below 950px the sheet is sized to the visible part of the screen, so when
  // the keyboard opens the panel shrinks above it and the sticky footer stays
  // in view. A fixed element otherwise keeps its full height, and iOS Safari
  // slides the keyboard over its bottom.
  const [visible, setVisible] = useState<{ top: number; height: number } | null>(
    null,
  );
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const narrow = window.matchMedia("(max-width: 949.98px)");
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 min-[950px]:p-[32px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        // The width cap and height floor apply from 950px up only: below that
        // the panel is a full-screen sheet filling the visible screen, which
        // the keyboard can make shorter than the floor.
        style={
          {
            "--panel-max": maxWidth,
            ...(minHeight ? { "--panel-min": minHeight } : {}),
          } as React.CSSProperties
        }
        // The panel clips to its rounded corners. The header runs the full
        // width across the top, over the sidebar too; below it, the column
        // beside the sidebar is what scrolls, with the footer sticking in it.
        className={`relative flex flex-col w-full h-full min-[950px]:h-auto max-h-full min-[950px]:max-w-[var(--panel-max)] ${
          minHeight ? "min-[950px]:min-h-[var(--panel-min)]" : ""
        } overflow-hidden bg-ground min-[950px]:rounded-panel shadow-[0_20px_60px_rgba(0,0,0,0.28)]`}
      >
        <div
          // Roomy, the header and footer content sits centred in them;
          // otherwise the inner edge is tighter, closing up to the body. With
          // nothing but the close button, the header is a slim bar so the body
          // starts close to the top.
          style={{
            padding: hasHeading
              ? `${PAD}px ${PAD}px ${roomyBars ? PAD : 12}px`
              : `16px ${PAD}px 8px`,
          }}
          className={`shrink-0 z-20 flex items-center gap-[12px] bg-ground ${headerClassName}`}
        >
          <div className="flex-1 min-w-0">{title}</div>
          <div className="shrink-0 flex items-center gap-[18px]">
            {headerActions}
            {closeButton}
          </div>
        </div>
        <div className="flex-1 min-h-0 flex">
          {sidebar && (
            <div className="hidden sm:block w-[240px] shrink-0 overflow-y-auto">
              {sidebar}
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">

            <div
              // Roomy, the body gets its own space below the header rather than
              // starting flush against it.
              style={{
                padding: `${roomyBars && hasHeading ? 8 : 0}px ${PAD}px ${
                  footer ? 0 : PAD
                }px`,
              }}
              // On phones, where the sidebar is hidden, a rail in its grey runs
              // down the left of the body and footer. It is painted as a
              // background rather than laid out as a column, so content that
              // bleeds to the panel edge can still run over it; everything
              // else is padded clear of it.
              className={`flex flex-1 items-stretch gap-[16px] ${
                sidebar ? RAIL : ""
              } ${
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
                  style={asidePinned ? { top: 0 } : undefined}
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
                className={`sticky bottom-0 z-20 mt-auto bg-ground ${
                  sidebar ? RAIL : ""
                }`}
              >
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
