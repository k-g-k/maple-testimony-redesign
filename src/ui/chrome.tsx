// The site chrome: the MAPLE top bar this page sits under.

import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

const NAV = ["Ballot questions", "Bills", "Hearings", "Testimony", "About"];

/** Paper rather than a coloured slab: the page's material starts at the top. */
export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    // Not pinned at all here: the feed's own filter bar is the thing worth
    // keeping in view, and two stacked sticky bars eat the top of the window.
    <header className="relative z-30 bg-ground border-b border-line">
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
          className="ml-auto hidden sm:inline-flex items-center gap-[10px] cursor-pointer group"
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
          className="ml-auto lg:hidden inline-flex items-center justify-center w-[40px] h-[40px] -mr-[8px] rounded-control text-ink hover:bg-wash cursor-pointer"
        >
          {open ? (
            <X className="w-[20px] h-[20px]" />
          ) : (
            <Menu className="w-[20px] h-[20px]" />
          )}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-line">
          <nav className="mx-auto max-w-[1180px] px-[20px] sm:px-[32px] py-[8px] flex flex-col">
            {NAV.map((n) => (
              <button
                key={n}
                className="text-left font-body text-lg text-ink py-[10px] border-b border-line last:border-0 cursor-pointer"
              >
                {n}
              </button>
            ))}
            {/* The open menu has room for words, so it keeps them; only the
                collapsed bar trades the label for the mark. */}
            <button className="sm:hidden mt-[12px] mb-[8px] font-body font-semibold text-base text-brand border border-brand px-[16px] py-[10px] rounded-control cursor-pointer">
              Sign in
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

