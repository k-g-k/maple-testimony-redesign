// The site chrome: the MAPLE top bar this page sits under.

import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

const NAV = ["Ballot questions", "Bills", "Hearings", "Testimony", "About"];

/** Paper rather than a coloured slab: the page's material starts at the top. */
export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    // Not pinned on small screens. Two stacked sticky bars would eat a sixth of
    // a phone viewport, and the contents bar is the one worth keeping.
    <header className="relative lg:sticky lg:top-0 z-30 bg-ground/95 backdrop-blur border-b border-line">
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
        <button className="ml-auto hidden sm:inline-flex font-body font-semibold text-sm text-ink-inverse bg-brand hover:bg-brand-hover px-[16px] py-[8px] rounded-control cursor-pointer">
          Sign in
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
            <button className="sm:hidden mt-[12px] mb-[8px] font-body font-semibold text-base text-ink-inverse bg-brand px-[16px] py-[10px] rounded-control cursor-pointer">
              Sign in
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

