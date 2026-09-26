// A titled section: the question, an optional action opposite it, and the
// body beneath. One of the reusable blocks the ballot pages are built from.

import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * One question a voter actually asks, answered before any evidence appears.
 *
 * The scale gap is the scaffolding: the question and its answer are set large
 * enough to be the only thing a hurried reader takes in, and the evidence
 * underneath is deliberately quieter. Stopping early still leaves you with
 * something true.
 */
export function Chapter({
  id,
  question,
  eyebrow,
  action,
  adornment,
  answer,
  band,
  fullWidth,
  children,
}: {
  id: string;
  question: string;
  /** Sits opposite the question, for the one thing you can do in the chapter. */
  action?: ReactNode;
  /** A quiet line above the question, read before the heading. */
  eyebrow?: ReactNode;
  /** Sits directly beside the question, for a control that qualifies it. */
  adornment?: ReactNode;
  /** The plain-language answer. Large, and the first thing after the question. */
  answer?: ReactNode;
  /**
   * Material that shares a full-bleed white band with the question itself.
   *
   * A band is not a card. A card says "this is one object on the page"; the
   * band says "for this stretch, the page itself is a different surface", so
   * the heading sits inside it rather than above it and the white runs to the
   * window edge. `children` continue below on the ground, which is what lets a
   * chapter open at hero weight and then drop back to reading weight.
   */
  band?: ReactNode;
  /**
   * Lets the question run the full width of the column instead of the 20ch
   * measure. Below sm it is sized to fill the width on one line, up to the
   * desktop size; from sm up it steps between fixed sizes and wraps only when
   * the window runs out of room.
   */
  fullWidth?: boolean;
  children?: ReactNode;
}) {
  // Below sm the question is set at a reference size, measured, and scaled to
  // fill the row. It is measured again once the webfont loads, since the
  // fallback font runs a different width.
  const rowRef = useRef<HTMLDivElement>(null);
  const qRef = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const row = rowRef.current;
    const q = qRef.current;
    if (!fullWidth || !row || !q) return;
    const narrow = window.matchMedia("(max-width: 639.98px)");
    const fit = () => {
      q.style.fontSize = "";
      q.style.whiteSpace = "";
      if (!narrow.matches) return;
      q.style.whiteSpace = "nowrap";
      q.style.fontSize = "100px";
      const size = Math.min(36, (100 * row.clientWidth) / q.scrollWidth);
      q.style.fontSize = `${Math.floor(size * 2) / 2}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(row);
    return () => ro.disconnect();
  }, [fullWidth, question]);

  const heading = (
    <>
      {eyebrow && <div className="mb-[10px]">{eyebrow}</div>}
      <div
        ref={rowRef}
        className="flex items-start justify-between gap-[20px]"
      >
        <div className="flex items-baseline gap-[14px] flex-wrap min-w-0">
          <h2
            ref={qRef}
            id={`${id}-q`}
            className={`font-display font-medium tracking-display text-ink ${
              fullWidth
                ? "text-2xl lg:text-3xl max-sm:leading-[1.25]"
                : "text-xl sm:text-2xl lg:text-3xl max-w-[20ch] text-balance"
            }`}
          >
            {question}
          </h2>
          {adornment}
        </div>
        {action && <div className="shrink-0 mt-[4px]">{action}</div>}
      </div>
      {answer && <div className="mt-[16px]">{answer}</div>}
    </>
  );
  const body = children && (
    <div className="flex flex-col gap-[28px] sm:gap-[40px]">{children}</div>
  );
  return (
    <section
      id={id}
      aria-labelledby={`${id}-q`}
      // Clears whatever is pinned: the contents bar alone on narrow, the nav
      // and the bar together once the nav becomes sticky at lg.
      className={`scroll-mt-[64px] lg:scroll-mt-[120px] ${
        band ? "" : "pt-[16px] sm:pt-[24px]"
      }`}
    >
      {band ? (
        <>
          {/* Out of the centred column and back into it: the white runs to
              the window edge, the words stay on the same measure as every
              other chapter. `w-screen` can exceed the content box where the
              scrollbar takes width, so the page root clips the overflow rather
              than gaining a horizontal scroll. */}
          <div className="ml-[calc(50%-50vw)] w-screen">
            <div className="mx-auto max-w-[1180px] px-[20px] sm:px-[32px] pt-[28px] sm:pt-[40px] pb-[32px] sm:pb-[44px]">
              {heading}
              <div className="mt-[28px] sm:mt-[40px]">{band}</div>
            </div>
          </div>
          {body && <div className="mt-[16px] sm:mt-[24px]">{body}</div>}
        </>
      ) : (
        <>
          {heading}
          {body && <div className="mt-[16px] sm:mt-[24px]">{body}</div>}
        </>
      )}
    </section>
  );
}

