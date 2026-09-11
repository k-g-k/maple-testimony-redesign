// A titled section: the question, an optional action opposite it, and the
// body beneath. One of the reusable blocks the ballot pages are built from.

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
  action,
  adornment,
  answer,
  band,
  children,
}: {
  id: string;
  question: string;
  /** Sits opposite the question, for the one thing you can do in the chapter. */
  action?: ReactNode;
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
  children?: ReactNode;
}) {
  const heading = (
    <>
      <div className="flex items-start justify-between gap-[20px]">
        <div className="flex items-baseline gap-[14px] flex-wrap min-w-0">
          <h2
            id={`${id}-q`}
            className="font-display font-medium text-xl sm:text-2xl lg:text-3xl tracking-display text-ink max-w-[20ch] text-balance"
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
        band ? "" : "pt-[28px] sm:pt-[40px]"
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
          {body && <div className="mt-[28px] sm:mt-[40px]">{body}</div>}
        </>
      ) : (
        <>
          {heading}
          {body && <div className="mt-[28px] sm:mt-[40px]">{body}</div>}
        </>
      )}
    </section>
  );
}

