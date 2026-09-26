// The site chrome: the MAPLE top bar this page sits under.

import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

const NAV = ["Ballot questions", "Bills", "Hearings", "Testimony", "About"];

/** Paper rather than a coloured slab: the page's material starts at the top. */
export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    // Pinned below lg only, where the menu button is the way around the site
    // and needs to stay in reach. On wider screens the feed's own filter bar is
    // the thing worth keeping in view, and two stacked sticky bars eat the top
    // of the window. App sets --pinned-h to match, so the filter bar sticks
    // under the nav rather than behind it.
    <header className="sticky top-0 lg:relative z-30 bg-ground border-b border-line">
      <div className="mx-auto max-w-[1180px] px-[20px] sm:px-[32px] h-[var(--nav-h)] flex items-center gap-[32px]">
        <span className="font-display font-semibold text-xl text-brand tracking-heading">
          MAPLE
        </span>
        <nav className="hidden lg:flex items-center gap-[22px]">
          {NAV.map((n) => (
            <button
              key={n}
              className="font-body text-base text-ink-muted hover:text-ink cursor-pointer"
            >
              {n}
            </button>
          ))}
        </nav>
        {/* Drawn the way an account without a picture is drawn in the feed
            below, but hollow until you reach it: the pale brand edge and the
            initials in brand ink, with the soft fill arriving on hover. Signing
            in is the way into an account rather than the page's own action, so
            it wears an account's clothes and not a button's.
 */}
        <button
          aria-label="Account"
          className="ml-auto inline-flex items-center gap-[10px] cursor-pointer group"
        >
          <span className="inline-flex items-center justify-center w-[36px] h-[36px] rounded-full border border-brand-edge group-hover:bg-brand-soft group-hover:border-brand transition-colors">
            <span
              style={{ fontSize: 12 }}
              className="font-body font-semibold text-brand-ink tracking-[0.02em]"
            >
              GK
            </span>
          </span>
        </button>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="lg:hidden inline-flex items-center justify-center w-[40px] h-[40px] -mr-[8px] rounded-control text-ink hover:bg-wash cursor-pointer"
        >
          {open ? (
            <X className="w-[20px] h-[20px]" />
          ) : (
            <Menu className="w-[20px] h-[20px]" />
          )}
        </button>
      </div>
      {open && (
        // Laid over the page, so opening the menu doesn't move what you were
        // reading. The header's bottom rule sits above it.
        <div className="lg:hidden absolute inset-x-0 top-full bg-ground border-b border-line shadow-popover">
          <nav className="mx-auto max-w-[1180px] px-[20px] sm:px-[32px] py-[12px] flex flex-col">
            {NAV.map((n) => (
              <button
                key={n}
                className="text-left font-body text-lg text-ink-muted hover:text-ink py-[12px] cursor-pointer"
              >
                {n}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

