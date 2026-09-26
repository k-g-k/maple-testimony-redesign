// Submitted-testimony UI. Each entry is renderable standalone (everything comes
// from the testimony record + its account), anticipating per-testimony URLs.

import { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  UserPlus,
  Flag,
  Users,
  Plus,
  Share,
} from "lucide-react";
import { Card, FilterChip, Modal, Pagination } from "../ui";
import type { DescriptorMode } from "../ui";
import {
  UserAvatar,
  UserTypeIcon,
  StanceChip,
  STANCE_CHIP,
} from "./accounts";
import { EndorseIcon, OpposeIcon, NeutralIcon } from "./stance-icons";
import {
  QUESTION,
  POSITION_USERS,
  testimonyFor,
  type TestimonyItem,
  type TestimonyStance,
  type PositionUserType,
} from "../data";

// Body text capped at six lines with an inline "Show more". A hidden measurer
// binary-searches the longest prefix that, with "… Show more" appended, still
// fits six lines at the current width; recomputed on resize.
function ClampedBody({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [cutoff, setCutoff] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const m = measureRef.current;
    if (!wrap || !m) return;
    const compute = () => {
      m.style.width = `${wrap.clientWidth}px`;
      const maxH = parseFloat(getComputedStyle(m).lineHeight) * 6 + 2;
      m.textContent = text;
      if (m.scrollHeight <= maxH) {
        setCutoff(null);
        return;
      }
      let lo = 0;
      let hi = text.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        m.textContent = text.slice(0, mid).trimEnd() + "… Show more";
        if (m.scrollHeight <= maxH) lo = mid;
        else hi = mid - 1;
      }
      setCutoff(lo);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [text]);

  const collapsed = !expanded && cutoff !== null;
  return (
    <div ref={wrapRef}>
      <p
        ref={measureRef}
        aria-hidden="true"
        className="font-body text-sm sm:text-base leading-[1.55] absolute invisible pointer-events-none"
      />
      {/* Smaller on phones, so the six-line clamp holds more of the
          testimony. */}
      <p className="font-body text-sm sm:text-base text-ink leading-[1.55]">
        {collapsed ? `${text.slice(0, cutoff).trimEnd()}… ` : `${text} `}
        {cutoff !== null && (
          <button
            onClick={(e) => {
              // Keep expand/collapse from triggering the row's click-through.
              e.stopPropagation();
              setExpanded((x) => !x);
            }}
            className="font-body font-semibold text-sm text-brand hover:text-alert cursor-pointer"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </p>
    </div>
  );
}

export function TestimonyEntry({
  t,
  showTypeIcon = true,
  showDescriptor = true,
  onOpen,
  fullBody = false,
  hideAvatar = false,
  compactHeaderNarrow = false,
}: {
  t: TestimonyItem;
  showTypeIcon?: boolean;
  showDescriptor?: DescriptorMode;
  /** Click-through to the testimony's own page (routing wired later). */
  onOpen?: (id: string) => void;
  /**
   * Render the body whole, without the six-line clamp and its Show more.
   * Used where the testimony is the point rather than one of a list.
   */
  fullBody?: boolean;
  /** Omit the avatar, for views that already show it above the card. */
  hideAvatar?: boolean;
  /** Below sm, move the date from the name line to the bottom right of the
      card, under the body, and hold the name line to one line, truncating the
      name with an ellipsis when it does not fit. */
  compactHeaderNarrow?: boolean;
}) {
  const user = POSITION_USERS.find((u) => u.id === t.userId);
  if (!user) return null;
  // The name, type icon and stance chip run as one line of text and wrap word
  // by word. The icon and chip are held to the name's last word, so they wrap
  // together with it and never land on a line alone.
  const words = user.name.split(" ");
  const lastWord = words.pop();
  const showDesc =
    showDescriptor === true ||
    (showDescriptor === "officials" && user.userType !== "organization");
  return (
    <div className="relative p-[16px] sm:p-[20px] rounded-control">
      <div className="relative flex items-start sm:items-center gap-[14px] sm:gap-[18px]">
        {!hideAvatar && <UserAvatar user={user} />}
        <div className="flex-1 min-w-0">
          {/* Name, type and stance wrap inside their own box; the date sits
              outside it so it always holds the top-right corner. */}
          <div className="flex items-center gap-[6px]">
            <div className="flex-1 min-w-0">
              {/* The name and descriptor are one block. On phones the date
                  sits beside it, lined up with the name; from sm up the date
                  sits in the corner beside the menu instead. */}
              <div className="flex items-baseline gap-[10px]">
                <div className="flex-1 min-w-0">
                  {/* Plain text for now. The name should be a link to the
                      testimony's own page, and it will be an anchor when that page
                      exists; a button that opens a modal is not that, and dressing
                      it as a link before there is a URL behind it teaches the wrong
                      thing about what clicking a name does. `onOpen` is kept so the
                      wiring is here when the route is. */}
                  {compactHeaderNarrow ? (
                    // One line on phones: the name gives way with an ellipsis
                    // so the icon and chip always stay beside it. The full
                    // name is in the title.
                    <p className="flex items-center gap-[6px] sm:flex-wrap font-body font-semibold text-base text-ink leading-[1.3]">
                      <span title={user.name} className="min-w-0 max-sm:truncate">
                        {user.name}
                      </span>
                      {showTypeIcon && (
                        <span className="shrink-0 flex">
                          <UserTypeIcon type={user.userType} />
                        </span>
                      )}
                      {t.stance !== "no-position" && (
                        <span className="shrink-0 flex">
                          <StanceChip stance={t.stance} />
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="font-body font-semibold text-base text-ink leading-[1.3]">
                      {words.length > 0 && `${words.join(" ")} `}
                      <span className="whitespace-nowrap">
                        {lastWord}
                        {showTypeIcon && (
                          <span className="inline-block align-middle ml-[6px]">
                            <UserTypeIcon type={user.userType} />
                          </span>
                        )}
                        {t.stance !== "no-position" && (
                          <span className="inline-block align-middle ml-[6px] -my-[2px]">
                            <StanceChip stance={t.stance} />
                          </span>
                        )}
                      </span>
                    </p>
                  )}
                  {/* Inside the name's own cell, not below the whole row: it
                      describes the account, so it belongs to the name, and the date
                      should centre against the pair rather than against the name
                      alone. */}
                  {showDesc && (
                    <p className="font-body text-xs text-ink-faint leading-[1.4] mt-[1px]">
                      {user.descriptor}
                    </p>
                  )}
                </div>
                <span
                  className={`sm:hidden shrink-0 font-body text-xs text-ink-muted whitespace-nowrap ${
                    compactHeaderNarrow ? "hidden" : ""
                  }`}
                >
                  {t.date}
                </span>
              </div>
            </div>
            <div className="shrink-0 self-start flex items-center gap-[2px] -mt-[5px] -mr-[6px]">
              <span className="hidden sm:inline font-body text-xs text-ink-muted whitespace-nowrap mr-[2px]">
                {t.date}
              </span>
              <EntryActions name={user.name} />
            </div>
          </div>
        </div>
      </div>
      {/* The body sits in the same two-column frame the header does, with an
          empty cell where the avatar is, so its first character lands under the
          name rather than under the avatar. A spacer rather than a left
          padding, because it is the avatar's own width and should change when
          that does. */}
      {/* Narrow, the spacer goes and the body takes the card's full width;
          a column of empty space under the avatar costs too much there. */}
      <div className="flex gap-[18px]">
        {!hideAvatar && (
          <div aria-hidden className="hidden sm:block w-[40px] shrink-0" />
        )}
        <div
          className={`flex-1 min-w-0 pt-[12px] sm:pt-[8px] sm:pr-[12px] pb-[8px] ${
            compactHeaderNarrow ? "max-sm:pb-[4px]" : ""
          }`}
        >
          {fullBody ? (
            <p className="font-body text-base text-ink leading-[1.55] whitespace-pre-line">
              {t.body}
            </p>
          ) : (
            <ClampedBody text={t.body} />
          )}
          {/* On phones the date closes the card, under the body on the right. */}
          {compactHeaderNarrow && (
            <p className="sm:hidden mt-[12px] text-right font-body text-xs text-ink-muted">
              {t.date}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Per-entry actions. A kebab rather than more visible buttons: following an
 * account and reporting a statement are both rare next to reading one, and a
 * row of controls beside every date would compete with the testimony itself.
 */
function EntryActions({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${name}`}
        className="flex items-center justify-center w-[30px] h-[30px] rounded-control text-ink-muted hover:text-ink hover:bg-wash cursor-pointer transition-colors"
      >
        <MoreVertical className="w-[19px] h-[19px]" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[180px] bg-surface border border-line rounded-control shadow-popover py-[4px]"
        >
          {[
            { label: "Share", Icon: Share },
            { label: "Follow user", Icon: UserPlus },
            { label: "Report testimony", Icon: Flag },
          ].map(({ label, Icon }) => (
            <button
              key={label}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-[9px] w-full text-left font-body text-sm text-ink px-[12px] py-[7px] cursor-pointer hover:bg-wash"
            >
              <Icon className="w-[15px] h-[15px] shrink-0 text-ink-muted" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TestimonyList({
  items,
  showTypeIcon = true,
  showDescriptor = true,
}: {
  items: TestimonyItem[];
  showTypeIcon?: boolean;
  showDescriptor?: DescriptorMode;
}) {
  return (
    <div>
      {items.map((t, i) => (
        <div key={t.id} className="mb-[14px] last:mb-0">
          {i > 0 && (
            <div className="border-t border-dotted border-line-strong mb-[14px]" />
          )}
          <TestimonyEntry
            t={t}
            showTypeIcon={showTypeIcon}
            showDescriptor={showDescriptor}
          />
        </div>
      ))}
    </div>
  );
}

// Filter chips appear only once the feed reaches FEED_CONTROLS_MIN.
const FEED_CONTROLS_MIN = 4;
export type StanceFilter = "all" | "endorsing" | "opposing" | "no-position";
// Rendered as a segmented control, so "All" is a real segment: stance is
// one-of, and an empty segmented control reads as broken where a pill does not.
type Stance = Exclude<StanceFilter, "all">;
const STANCE_FILTERS: {
  id: StanceFilter;
  label: string;
  /** Shown in place of the label in the parked segmented control. */
  glyph?: string;
}[] = [
  { id: "all", label: "All" },
  { id: "endorsing", label: "Endorsing", glyph: "\u{1F44D}" },
  { id: "opposing", label: "Opposing", glyph: "\u{1F44E}" },
  { id: "no-position", label: "Neutral" },
];

// EXPERIMENT: the same three positions as bare glyphs rather than a control.
// No border, no fill; the selected one is at full strength and the rest sit
// back, so the row reads as three marks instead of three buttons.
const STANCE_GLYPHS: {
  id: Stance;
  label: string;
  /** What the glyph means, spelled out. The label is for prose ("Endorsing
      Testimony"); this is for the tooltip and the accessible name. */
  tip: string;
  /** Optical offset. A transform rather than padding, so it moves what you see
      without moving anything around it. One value per glyph, used in every
      state, so selecting one never makes it jump. Empty where the artwork
      already sits right. */
  chipOffset?: string;
  glyph: string;
}[] = [
  {
    id: "endorsing",
    label: "Endorsing",
    tip: "Endorses",
    glyph: "\u{1F44D}",
  },
  {
    id: "opposing",
    label: "Opposing",
    tip: "Opposes",
    chipOffset: "translate-y-[2px]",
    glyph: "\u{1F44E}",
  },
  {
    id: "no-position",
    label: "Neutral",
    tip: "Neutral",
    glyph: "\u{1F4AC}",
  },
];

export type TypeFilter = "all" | PositionUserType;

// `short` replaces the label once the filter is selected, where the picker has
// less room than the dropdown list; the list always shows `label`.
const TYPE_FILTERS: {
  id: TypeFilter;
  label: string;
  short?: string;
  word?: string;
}[] = [
  { id: "all", label: "All Accounts" },
  { id: "individual", label: "Individuals", word: "Individual" },
  { id: "organization", label: "Organizations", word: "Organization" },
  {
    id: "government",
    label: "Government Officials",
    short: "Gov Officials",
    word: "Government",
  },
  { id: "legislator", label: "Legislators", word: "Legislator" },
];

// Single-select account-type chooser. A dropdown rather than more pills so the
// row does not read as one undifferentiated set of toggles: the shape says
// "pick one of these", where a pill says "on or off".
function TypeFilterMenu({
  value,
  onChange,
}: {
  value: TypeFilter;
  onChange: (v: TypeFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  const current = TYPE_FILTERS.find((t) => t.id === value) ?? TYPE_FILTERS[0];
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-[5px] font-body font-semibold text-xs px-[10px] py-[4px] rounded-pill border cursor-pointer transition-colors bg-brand-soft border-brand-edge text-brand-ink"
      >
        {current.id === "all" ? (
          <Users className="w-[13px] h-[13px]" />
        ) : (
          <UserTypeIcon type={current.id} size={13} />
        )}
        {current.short ?? current.label}
        <ChevronDown className="w-[12px] h-[12px]" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[190px] bg-surface border border-line rounded-control shadow-popover py-[4px]"
        >
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.id}
              role="option"
              aria-selected={t.id === value}
              onClick={() => {
                onChange(t.id);
                setOpen(false);
              }}
              className={`flex items-center gap-[8px] w-full text-left font-body text-sm px-[12px] py-[6px] cursor-pointer hover:bg-wash ${
                t.id === value ? "font-semibold text-brand" : "text-ink"
              }`}
            >
              <span className="w-[15px] shrink-0 flex items-center justify-center">
                {t.id === "all" ? (
                  <Users className="w-[15px] h-[15px]" />
                ) : (
                  <UserTypeIcon type={t.id} />
                )}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// The stance filter as a dropdown, for widths where the four-segment control
// no longer fits. Same shape and behaviour as TypeFilterMenu so the two read as
// a pair when both are collapsed.
function StanceFilterMenu({
  value,
  onChange,
}: {
  value: StanceFilter;
  onChange: (v: StanceFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  const current =
    STANCE_FILTERS.find((t) => t.id === value) ?? STANCE_FILTERS[0];
  // Standing alone in a dropdown, "All" has nothing to be all of. In the
  // segmented control the other three segments supply that context.
  const label = (t: (typeof STANCE_FILTERS)[number]) =>
    t.id === "all" ? "All Positions" : t.label;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-[5px] font-body font-semibold text-xs px-[10px] py-[4px] rounded-pill border cursor-pointer transition-colors bg-brand-soft border-brand-edge text-brand-ink"
      >
        {label(current)}
        <ChevronDown className="w-[12px] h-[12px]" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[160px] bg-surface border border-line rounded-control shadow-popover py-[4px]"
        >
          {STANCE_FILTERS.map((t) => (
            <button
              key={t.id}
              role="option"
              aria-selected={t.id === value}
              onClick={() => {
                onChange(t.id);
                setOpen(false);
              }}
              className={`flex items-center gap-[8px] w-full text-left font-body text-sm px-[12px] py-[6px] cursor-pointer hover:bg-wash ${
                t.id === value ? "font-semibold text-brand" : "text-ink"
              }`}
            >
              {label(t)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// The stance as a large mark for the modal header, borrowing the chip's own
// colours so the two agree at a glance.
// Outline in the chip's text colour, filled with the chip's border colour: a
// lighter tone of the same hue, so the shape stays readable at badge size.
// The stance as a mark for the modal header. The icon and the ring take the
// same colour, so the mark reads as one thing rather than a badge on a circle.
// Oppose is orange here rather than the chip's red: against the endorse green,
// orange separates far better for the common red-green colour blindness. The
// chips keep their own reds, since there the word carries the meaning.
const STANCE_MARK: Record<
  TestimonyStance,
  { Icon: typeof EndorseIcon; hex: string }
> = {
  endorse: { Icon: EndorseIcon, hex: "var(--color-positive-ink)" },
  oppose: { Icon: OpposeIcon, hex: "var(--color-caution-ink)" },
  "no-position": { Icon: NeutralIcon, hex: "var(--color-ink-muted)" },
};

// Opens a testimony in place. The body is the same TestimonyEntry the feed
// renders, so the card a reader clicked is literally the card they get. Later
// this gets its own route; the modal is the step before that.
function TestimonyModal({
  t,
  showTypeIcon,
  showDescriptor,
  onClose,
}: {
  t: TestimonyItem;
  showTypeIcon?: boolean;
  showDescriptor?: DescriptorMode;
  onClose: () => void;
}) {
  const user = POSITION_USERS.find((u) => u.id === t.userId);
  return (
    <Modal
      onClose={onClose}
      title={
        <div className="flex items-center gap-[12px]">
          {/* The stance alone, ringed in its own colour. The account's logo is
              in the card below, so this says what was said, not who said it. */}
          {(() => {
            const { Icon, hex } = STANCE_MARK[t.stance];
            return (
              <div
                // Inline width: Tailwind reads a bare border-[…] as a colour,
                // so an arbitrary pixel width compiles to nothing.
                style={{ borderColor: hex, color: hex, borderWidth: 3 }}
                className="w-[40px] h-[40px] shrink-0 rounded-full border-solid bg-surface flex items-center justify-center"
              >
                <Icon className="h-[18px] w-auto" />
              </div>
            );
          })()}
          <p className="font-body font-normal text-xl text-ink">
            Ballot Question {QUESTION.number} - {QUESTION.title}
          </p>
        </div>
      }
      headerActions={
        <button
          aria-label="Share this testimony"
          className="text-ink-muted hover:text-ink cursor-pointer"
        >
          <Share className="w-[19px] h-[19px]" />
        </button>
      }
      footer={
        // Deliberately empty: the bar is here so its slots have somewhere to
        // go, and so the scroll behaviour beneath it can be judged.
        <div className="h-[36px]" />
      }
      maxWidth="880px"
      minHeight="480px"
      mainMinWidth="600px"
      aside={
        // Everything that acts on this testimony rather than being part of it.
        <div className="bg-surface rounded-control p-[16px]">
          <p className="font-body font-semibold text-2xs text-ink-muted mb-[10px]">
            Actions
          </p>
          <div className="flex flex-col gap-[8px]">
            {["Follow This Account", "Add Your Perspective", "Report"].map(
              (label) => (
                <button
                  key={label}
                  className="w-full text-left font-body font-semibold text-sm text-brand hover:bg-wash rounded-control px-[8px] py-[6px] cursor-pointer"
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>
      }
    >
      <div className="bg-surface rounded-control">
        <TestimonyEntry
          t={t}
          showTypeIcon={showTypeIcon}
          showDescriptor={showDescriptor}
          fullBody
        />
      </div>
    </Modal>
  );
}

// Composing a submission. A best guess at the shape: who you are, where you
// stand, what you want to say, with the rules of the road beside it rather
// than buried under it. Nothing submits; this is the form, not the plumbing.
function AddPerspectiveModal({ onClose }: { onClose: () => void }) {
  const [stance, setStance] = useState<TestimonyStance>("endorse");
  const choices: { id: TestimonyStance; label: string }[] = [
    { id: "endorse", label: "I support it" },
    { id: "oppose", label: "I oppose it" },
    { id: "no-position", label: "No position" },
  ];
  return (
    <Modal
      onClose={onClose}
      maxWidth="860px"
      minHeight="520px"
      mainMinWidth="520px"
      asideFirst
      footer={
        <div className="flex items-center justify-end gap-[12px]">
          <button
            onClick={onClose}
            className="font-body font-semibold text-sm text-ink-muted hover:text-ink cursor-pointer px-[8px] py-[8px]"
          >
            Cancel
          </button>
          <button className="bg-brand text-ink-inverse font-body font-semibold text-sm px-[18px] py-[8px] rounded-control cursor-pointer hover:bg-brand-hover">
            Review and Post
          </button>
        </div>
      }
      title={
        <p className="font-body font-normal text-xl text-ink">
          Add your perspective on Ballot Question {QUESTION.number}
        </p>
      }
      aside={
        <div className="flex flex-col gap-[16px]">
          <div className="bg-surface rounded-control p-[20px]">
            <p className="font-body font-semibold text-2xs text-ink-muted mb-[8px]">
              Before you post
            </p>
            <ul className="list-disc list-outside pl-[16px] space-y-[8px] font-body text-xs text-ink-muted leading-[1.5] marker:text-ink-faint">
              <li>
                Write in your own words. MAPLE does not edit or rank what you
                say.
              </li>
              <li>Posting is public and stays attached to your account.</li>
              <li>
                You can revise it later; earlier versions stay on the record.
              </li>
            </ul>
          </div>
          {/* Both sit on the panel's grey rather than in cards: they point off
              this form rather than being part of it. */}
          <a
            href="https://www.mapletestimony.org/learn/writing-effective-testimony"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-xs text-ink-muted hover:text-brand px-[16px]"
          >
            Testimony writing tips
          </a>
          <button className="text-left font-body text-xs text-ink-muted hover:text-brand cursor-pointer px-[16px]">
            View our code of conduct
          </button>
        </div>
      }
    >
      <div className="bg-surface rounded-control p-[20px]">
        <p className="font-body font-semibold text-2xs text-ink-muted mb-[8px]">
          Your position
        </p>
        <div className="flex gap-[8px] flex-wrap mb-[20px]">
          {choices.map(({ id, label }) => {
            const { Icon } = STANCE_MARK[id];
            const c = STANCE_CHIP[id];
            const on = stance === id;
            return (
              <button
                key={id}
                onClick={() => setStance(id)}
                aria-pressed={on}
                // Selected, it wears the same colours the chip on a posted
                // testimony will, so the choice previews its own result.
                className={`inline-flex items-center gap-[8px] rounded-control border px-[14px] py-[8px] font-body font-semibold text-sm cursor-pointer transition-colors ${
                  on
                    ? `${c.bg} border-line-strong ${c.tx}`
                    : "bg-surface border-line-strong text-ink-muted hover:bg-wash"
                }`}
              >
                <Icon className="h-[16px] w-auto" />
                {label}
              </button>
            );
          })}
        </div>

        <textarea
          rows={10}
          placeholder="What do you want lawmakers and other voters to know about this question?"
          className="w-full resize-none border border-line-strong rounded-control p-[12px] font-body text-base text-ink leading-[1.55] placeholder:text-ink-muted focus:outline-none focus:border-brand"
        />
      </div>
    </Modal>
  );
}

/**
 * The account-type picker, sitting beside the heading rather than inside it.
 * It names its own selection and changes nothing else: the heading is a
 * heading, and this is the control next to it.
 */
/**
 * The three positions as bare glyphs. Exported so a page can put it beside its
 * own heading rather than inside the feed's controls.
 */
export function PositionPicker({
  value,
  onChange,
  locked = false,
  labeled = false,
  largeOnPhones = false,
}: {
  value: StanceFilter;
  onChange: (v: StanceFilter) => void;
  /** State the position without offering to change or clear it. */
  locked?: boolean;
  /** Keep the words beside the glyphs above 390px wide, instead of only
      from 730px up, and set them a size larger. */
  labeled?: boolean;
  /** Larger glyphs, words and tap targets below sm, with more space between
      the options. */
  largeOnPhones?: boolean;
}) {
  const rowH = largeOnPhones ? "h-[40px] sm:h-[34px]" : "h-[34px]";
  const glyphSize = largeOnPhones ? "text-[24px] sm:text-[20px]" : "text-[20px]";
  const wordSize = labeled
    ? "text-lg sm:text-base"
    : largeOnPhones
      ? "text-base sm:text-sm"
      : "text-sm";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = STANCE_GLYPHS.find((g) => g.id === value);

  // Locked and set: the glyph and the word, and nothing else. No chip, no
  // clear, no menu, because the view was opened at this position deliberately.
  if (locked) {
    if (!current) return null;
    return (
      <p className={`flex ${rowH} items-center gap-[8px]`}>
        <span
          aria-hidden
          className={`flex h-full items-center ${glyphSize} leading-none drop-shadow-[0_1px_1px_rgba(20,20,19,0.12)] ${
            current.chipOffset ?? ""
          }`}
        >
          {current.glyph}
        </span>
        <span className={`flex h-full items-center font-body font-semibold ${wordSize} leading-none text-ink whitespace-nowrap`}>
          {current.tip}
        </span>
      </p>
    );
  }

  // Nothing chosen: three labelled options, each one a direct pick.
  if (!current) {
    return (
      // Held at the selected chip's height, so picking one does not change the
      // row's height and step everything beside it down. No gap between the
      // options either: the buttons' own padding does the spacing, and they
      // stay edge to edge so the wash shows exactly where each one begins.
      <div
        role="group"
        aria-label="Filter by position"
        className={`flex ${rowH} items-center ${
          largeOnPhones ? "max-sm:gap-[12px]" : ""
        }`}
      >
        {STANCE_GLYPHS.map(({ id, tip, glyph, chipOffset }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-label={tip}
            className={`flex h-full items-center px-[9px] rounded-pill hover:bg-wash cursor-pointer transition-colors duration-150 ${
              labeled
                ? "gap-[8px] max-[391px]:gap-0"
                : "gap-0 min-[730px]:gap-[8px]"
            }`}
          >
            <span
              aria-hidden
              className={`flex h-full items-center ${glyphSize} leading-none drop-shadow-[0_1px_1px_rgba(20,20,19,0.12)] ${
                chipOffset ?? ""
              }`}
            >
              {glyph}
            </span>
            {/* Three labelled options are the widest thing on this row, so
                below 730 the words go and the gap goes with them. The glyph
                carries the meaning once you have seen it labelled, and the
                button's aria-label keeps the name for a screen reader. The
                selected chip keeps its word at every width: that one is
                stating the filter you are looking at. */}
            <span
              aria-hidden
              className={`${
                labeled ? "flex max-[391px]:hidden" : "hidden min-[730px]:flex"
              } h-full items-center font-body font-semibold ${wordSize} leading-none text-ink whitespace-nowrap`}
            >
              {tip}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // Chosen: the chip states the filter and carries two different actions. Its
  // body opens the other positions, because swapping is the likelier next move
  // than clearing; the X on the end clears, with its own round hover so the
  // two targets are legible before you commit to one.
  return (
    <div ref={ref} className="relative">
      {/* The wash lives on the chip, so anywhere on it lights the whole shape.
          The X then stacks its own round wash on top of that, which is how it
          reads as a second target inside the first rather than as a hole in
          it. */}
      <div className={`relative flex items-center ${rowH} pr-[4px] rounded-pill border border-line hover:bg-wash transition-colors`}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Position: ${current.tip}. Change`}
          className="flex h-full items-center gap-[8px] pl-[8px] pr-[7px] rounded-l-pill cursor-pointer"
        >
          {/* Each centred on the chip rather than sharing a baseline, so the
              word lines up with the X on the other end instead of following
              wherever the glyph's baseline falls. The glyph then carries its
              own optical offset, because that is a property of the artwork and
              nothing structural can derive it. */}
          <span
            aria-hidden
            className={`flex h-full items-center ${glyphSize} leading-none drop-shadow-[0_1px_1px_rgba(20,20,19,0.12)] ${
              current.chipOffset ?? ""
            }`}
          >
            {current.glyph}
          </span>
          <span className={`flex h-full items-center font-body font-semibold ${wordSize} leading-none text-ink whitespace-nowrap`}>
            {current.tip}
          </span>
        </button>
        <button
          onClick={() => onChange("all")}
          aria-label={`Clear the ${current.label} filter`}
          className="relative z-10 flex items-center justify-center w-[26px] h-[26px] rounded-full text-ink-muted hover:text-ink hover:bg-wash-strong cursor-pointer transition-colors"
        >
          <X aria-hidden className="w-[13px] h-[13px]" />
        </button>
      </div>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[190px] bg-surface border border-line rounded-control shadow-popover py-[4px]"
        >
          {/* Only the alternatives. The chip already names what is selected, so
              listing it again offers a choice that changes nothing. */}
          {STANCE_GLYPHS.filter((g) => g.id !== value).map(
            ({ id, tip, glyph, chipOffset }) => (
              <button
                key={id}
                role="option"
                aria-selected={false}
                onClick={() => {
                  onChange(id);
                  setOpen(false);
                }}
                className="flex items-center gap-[10px] w-full text-left font-body text-sm text-ink px-[12px] py-[10px] cursor-pointer hover:bg-wash"
              >
                <span
                  aria-hidden
                  className={`flex h-[22px] items-center text-[20px] leading-none ${
                    chipOffset ?? ""
                  }`}
                >
                  {glyph}
                </span>
                {tip}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function AccountTypePicker({
  value,
  onChange,
  locked = false,
  largeOnPhones = false,
  larger = false,
}: {
  value: TypeFilter;
  onChange: (v: TypeFilter) => void;
  /** State the filter without offering to change it. */
  locked?: boolean;
  /** Larger label and tap target below sm. */
  largeOnPhones?: boolean;
  /** A larger label on phones and larger text and icons in the dropdown list,
      to match a labeled PositionPicker beside it. */
  larger?: boolean;
}) {
  const size = larger
    ? "h-[40px] sm:h-[28px] text-[18px] sm:text-lg"
    : largeOnPhones
      ? "h-[40px] sm:h-[28px] text-lg"
      : "h-[28px] text-base sm:text-lg";
  // Icon and chevron track the label, so the larger label on phones gets them
  // a size up as well.
  const iconSize = larger ? "size-[19px] sm:size-[17px]" : "size-[17px]";
  const chevronSize = larger ? "size-[17px] sm:size-[15px]" : "size-[15px]";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = TYPE_FILTERS.find((t) => t.id === value) ?? TYPE_FILTERS[0];
  const label =
    current.id === "all" ? "All users" : (current.short ?? current.label);
  const icon =
    current.id === "all" ? (
      <Users className={iconSize} />
    ) : (
      // UserTypeIcon sizes its svg inline, so the phone size has to win over
      // that style.
      <span className={larger ? "flex max-sm:[&_svg]:size-[19px]!" : "flex"}>
        <UserTypeIcon type={current.id} size={17} />
      </span>
    );
  // Locked, it is a statement rather than a control: no chevron, no hover, and
  // not focusable, so nothing about it suggests it can be changed.
  if (locked) {
    return (
      <p className={`shrink-0 inline-flex ${size} items-center gap-[7px] font-display font-medium uppercase tracking-[0.08em] text-ink`}>
        {icon}
        {label}
      </p>
    );
  }
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-label="Filter by account type"
        aria-expanded={open}
        className={`inline-flex ${size} items-center gap-[7px] font-display font-medium uppercase tracking-[0.08em] text-ink hover:text-brand cursor-pointer transition-colors`}
      >
        {icon}
        {label}
        <ChevronDown className={chevronSize} />
      </button>
      {open && (
        <div
          role="listbox"
          className={`absolute left-0 top-[calc(100%+6px)] z-20 ${
            larger ? "min-w-[240px]" : "min-w-[200px]"
          } bg-surface border border-line rounded-control shadow-popover py-[4px]`}
        >
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.id}
              role="option"
              aria-selected={t.id === value}
              onClick={() => {
                onChange(t.id);
                setOpen(false);
              }}
              className={`flex items-center w-full text-left font-body px-[12px] py-[10px] cursor-pointer hover:bg-wash ${
                larger ? "gap-[10px] text-lg sm:text-base" : "gap-[8px] text-sm"
              } ${t.id === value ? "font-semibold text-brand" : "text-ink"}`}
            >
              <span
                className={`${
                  larger ? "w-[18px]" : "w-[15px]"
                } shrink-0 flex items-center justify-center`}
              >
                {t.id === "all" ? (
                  <Users
                    className={larger ? "w-[18px] h-[18px]" : "w-[15px] h-[15px]"}
                  />
                ) : (
                  <UserTypeIcon type={t.id} size={larger ? 18 : 15} />
                )}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TestimonyFeed({
  items,
  showTypeIcon = true,
  showDescriptor = true,
  includeFollowingFilter = false,
  initialFilter = "all",
  initialTypeFilter = "all",
  asCards = false,
  includeTypeFilter = false,
  title,
  stickyTop,
  hideAddButton = false,
  lockTypeFilter = false,
  pageSize,
  composeSignal = 0,
  positionRow = "inline",
  compactHeaderNarrow = false,
  typeFilter: controlledType,
  onTypeFilterChange,
  filter: controlledFilter,
  onFilterChange,
}: {
  items: TestimonyItem[];
  showTypeIcon?: boolean;
  showDescriptor?: DescriptorMode;
  /** Render each entry in its own card instead of as rows inside one. */
  asCards?: boolean;
  /** Add the account-type dropdown ahead of the stance chips. */
  includeTypeFilter?: boolean;
  /** Heading rendered inline at the head of the filter row. */
  title?: string;
  /** When set, the filter bar pins at this offset while the feed scrolls. */
  stickyTop?: string;
  /** Drop the bar's own add button, for pages that put one somewhere better. */
  hideAddButton?: boolean;
  /** State the account type without offering to change it, for a view opened
      on one kind of account. The position filter stays live, so a reader can
      still move between endorsing and opposing inside it. */
  lockTypeFilter?: boolean;
  /** Show this many at a time and page through the rest, for a view with a
      fixed height. Unpaged when omitted. */
  pageSize?: number;
  /** Bump to open the compose modal from outside the feed. Same pattern as the
      Maple leaf's nudge: a counter rather than a boolean, so repeat requests
      still register. */
  composeSignal?: number;
  /** Where the position picker sits: in the filter row, or on its own line
      beneath it, either collapsing to glyphs below 730px ("below") or keeping
      its words above 390px ("below-labeled"). */
  positionRow?: "inline" | "below" | "below-labeled";
  /** Passed to each card. See TestimonyEntry. */
  compactHeaderNarrow?: boolean;
  /** Add a "Following" toggle that narrows any stance filter to accounts the
      viewer follows. */
  includeFollowingFilter?: boolean;
  /** Stance filter to open with (e.g. when arriving from a Vote card). */
  initialFilter?: StanceFilter;
  /** Account-type filter to open with, alongside `initialFilter`. */
  initialTypeFilter?: TypeFilter;
  /** Drive the account-type filter from outside, for pages that render
      AccountTypePicker somewhere the feed cannot reach. Uncontrolled when
      omitted. */
  typeFilter?: TypeFilter;
  onTypeFilterChange?: (v: TypeFilter) => void;
  /** Same, for the position filter. */
  filter?: StanceFilter;
  onFilterChange?: (v: StanceFilter) => void;
}) {
  const [ownFilter, setOwnFilter] = useState<StanceFilter>(initialFilter);
  const filter = controlledFilter ?? ownFilter;
  const setFilter = onFilterChange ?? setOwnFilter;
  // Following is an overlay, not a stance: it combines with every stance chip.
  const [followingOnly, setFollowingOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  // Remember the value, not whether this is the first run. A boolean flag flips
  // on mount and then stays flipped, so anything that re-runs effects without
  // remounting (a hot reload, a StrictMode double-invoke) sees an already-used
  // flag and opens the composer for no reason. Comparing values only ever fires
  // when the number actually moved.
  const lastSignal = useRef(composeSignal);
  useEffect(() => {
    if (lastSignal.current === composeSignal) return;
    lastSignal.current = composeSignal;
    setComposing(true);
  }, [composeSignal]);
  const openItem = items.find((t) => t.id === openId);
  const [ownType, setOwnType] = useState<TypeFilter>(initialTypeFilter);
  const typeFilter = controlledType ?? ownType;
  const setTypeFilter = onTypeFilterChange ?? setOwnType;
  // The feed itself is masked so entries fade out in opacity as they rise
  // toward the pinned bar. The fade line is fixed to the viewport while the
  // feed scrolls, so its offset within the feed is recomputed on scroll and
  // handed to the mask as a CSS variable.
  const barRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = barRef.current;
    const feed = feedRef.current;
    if (!stickyTop || !bar || !feed) return;
    const onScroll = () => {
      const rect = bar.getBoundingClientRect();
      const feedTop = feed.getBoundingClientRect().top;
      feed.style.setProperty(
        "--fade-end",
        `${Math.max(0, rect.bottom - feedTop)}px`,
      );
      // Pinned, the bar is chrome over the list and wants to sit tight to it;
      // at rest it is a row in the page and wants the page's spacing. CSS has
      // no selector for "currently stuck", so the state is measured: the bar is
      // stuck once its top has reached the offset it sticks at.
      const stuckAt = parseFloat(getComputedStyle(bar).top) || 0;
      const wasStuck = bar.dataset.stuck === "true";
      // Two thresholds, not one: it takes 2px of scroll to leave the stuck
      // state and none to enter it, so the boundary cannot flutter.
      bar.dataset.stuck = String(
        wasStuck ? rect.top <= stuckAt + 3 : rect.top <= stuckAt + 1,
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [stickyTop]);

  const showFilters = items.length >= FEED_CONTROLS_MIN;
  const stanceMatched =
    !showFilters || filter === "all"
      ? items
      : items.filter((t) => {
          if (filter === "endorsing") return t.stance === "endorse";
          if (filter === "opposing") return t.stance === "oppose";
          return t.stance === "no-position";
        });
  const filtered =
    showFilters && followingOnly
      ? stanceMatched.filter(
          (t) =>
            POSITION_USERS.find((u) => u.id === t.userId)?.followedByViewer,
        )
      : stanceMatched;
  const shown =
    showFilters && includeTypeFilter && typeFilter !== "all"
      ? filtered.filter(
          (t) =>
            POSITION_USERS.find((u) => u.id === t.userId)?.userType ===
            typeFilter,
        )
      : filtered;
  // Paged, the feed fits a fixed height instead of scrolling inside one. The
  // page is clamped rather than reset, so narrowing the list while on a later
  // page lands on the last one that still has entries instead of an empty view.
  // Only an Individuals filter on its own means nobody has written yet; with
  // Following on, the empty list is about who you follow.
  const noIndividuals = typeFilter === "individual" && !followingOnly;
  const pageCount = pageSize ? Math.max(1, Math.ceil(shown.length / pageSize)) : 1;
  const current = Math.min(page, pageCount - 1);
  const paged = pageSize
    ? shown.slice(current * pageSize, current * pageSize + pageSize)
    : shown;

  return (
    <div>
      {/* Stuck, the bar needs the page colour behind it and a gap beneath, or
          white testimony cards scroll flush against the white filter card. */}
      {showFilters && (
        <div
          ref={barRef}
          style={stickyTop ? { top: stickyTop } : undefined}
          className={
            stickyTop
              ? "sticky z-[8] bg-ground pt-[16px] pb-[16px] data-[stuck=true]:pt-[24px] data-[stuck=true]:pb-[8px]"
              : "mb-[16px]"
          }
        >
          <div
            className={
              asCards ? "" : ""
            }
          >
            {/* One row above the cards: the two pickers on the left, Following
                pinned right. Following is an overlay on whatever they set
                rather than a third way to narrow, so it sits apart. */}
            <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[8px] mb-[12px]">
              <AccountTypePicker
                value={typeFilter}
                onChange={setTypeFilter}
                locked={lockTypeFilter}
                largeOnPhones={positionRow !== "inline"}
                larger={positionRow === "below-labeled"}
              />
              {positionRow === "inline" && (
                <PositionPicker value={filter} onChange={setFilter} />
              )}
              {/* Following and the action are one group pinned to the end of
                  the row, with their own spacing. Held together rather than
                  laid out as two more items in the filter row, so a wider
                  account picker or a selected position moves the filters on the
                  left without moving this pair or the gap inside it. */}
              <div className="ml-auto shrink-0 flex items-center gap-[8px]">
                {includeFollowingFilter && (
                  // Following is an overlay on whatever else is set rather than
                  // another way to narrow by position or account, so it reads
                  // better here than as the last item among the chips.
                  <FilterChip
                    active={followingOnly}
                    ariaPressed={followingOnly}
                    onClick={() => setFollowingOnly((f) => !f)}
                    title={
                      followingOnly
                        ? "Clear the Following filter"
                        : "Only accounts you follow"
                    }
                    className={`inline-flex items-center gap-[5px] ${
                      positionRow !== "inline"
                        ? "max-sm:text-sm max-sm:px-[14px] max-sm:py-[5px]"
                        : ""
                    }`}
                  >
                    Following
                    {followingOnly && <X className="w-[12px] h-[12px]" />}
                  </FilterChip>
                )}
                {!hideAddButton && (
                  <button
                    onClick={() => setComposing(true)}
                    className="shrink-0 inline-flex items-center gap-[5px] font-body font-semibold text-xs px-[10px] py-[4px] rounded-control border border-brand bg-brand text-ink-inverse hover:bg-brand-hover hover:border-brand-hover cursor-pointer transition-colors"
                  >
                    <Plus className="w-[13px] h-[13px]" />
                    {/* Two labels, one shown at a time: at narrow widths the
                        row needs the space more than the sentence. */}
                    <span className="max-[1010px]:hidden">
                      Add Your Perspective
                    </span>
                    <span className="hidden max-[1010px]:inline">Add</span>
                  </button>
                )}
              </div>
            </div>
            {positionRow !== "inline" && (
              <div className="flex mb-[12px]">
                <PositionPicker
                  value={filter}
                  onChange={setFilter}
                  labeled={positionRow === "below-labeled"}
                  largeOnPhones
                />
              </div>
            )}
            {/* Parked: the narrowing row that sat closest to the cards.
                Account type moved up to the picker and Following with it,
                so this held only the superseded stance controls. */}
            {false && (
              <div className="flex min-h-[30px] items-center gap-[6px] flex-wrap">
                <div className="flex items-center gap-[6px]">
                  {includeTypeFilter && (
                    <>
                      <TypeFilterMenu
                        value={typeFilter}
                        onChange={setTypeFilter}
                      />
                      <span
                        aria-hidden="true"
                        className="text-line-strong select-none mx-[2px]"
                      >
                        |
                      </span>
                    </>
                  )}
                  {/* Parked: the original position picker, a segmented
                      control at width and a dropdown below 1191px. The glyph
                      row above replaces it.

                  <div className="min-[1191px]:hidden">
                    <StanceFilterMenu value={filter} onChange={setFilter} />
                  </div>
                  <div
                    role="group"
                    aria-label="Filter by stance"
                    className="hidden min-[1191px]:inline-flex items-center rounded-pill border border-line-strong overflow-hidden"
                  >
                    {STANCE_FILTERS.map(({ id, label, glyph }) => (
                      <button
                        key={id}
                        onClick={() => setFilter(id)}
                        aria-pressed={filter === id}
                        aria-label={glyph ? label : undefined}
                        title={glyph ? label : undefined}
                        className={`font-body font-semibold text-xs px-[12px] py-[4px] cursor-pointer transition-colors border-l border-line first:border-l-0 ${
                          filter === id
                            ? "bg-brand-soft text-brand-ink"
                            : "text-ink-muted hover:bg-wash"
                        }`}
                      >
                        {glyph ? (
                          <span aria-hidden className="text-base leading-none">
                            {glyph}
                          </span>
                        ) : (
                          label
                        )}
                      </button>
                    ))}
                  </div>
                  */}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {shown.length > 0 ? (
        <>
        {asCards ? (
          <div
            ref={feedRef}
            style={
              stickyTop
                ? {
                    maskImage:
                      "linear-gradient(to bottom, transparent calc(var(--fade-end, 0px) - 44px), #000 var(--fade-end, 0px))",
                    WebkitMaskImage:
                      "linear-gradient(to bottom, transparent calc(var(--fade-end, 0px) - 44px), #000 var(--fade-end, 0px))",
                  }
                : undefined
            }
            className="flex flex-col gap-[20px]"
          >
            {paged.map((t) => (
              <div
                key={t.id}
                className="bg-surface rounded-control border border-line"
              >
                <TestimonyEntry
                  t={t}
                  showTypeIcon={showTypeIcon}
                  showDescriptor={showDescriptor}
                  onOpen={setOpenId}
                  compactHeaderNarrow={compactHeaderNarrow}
                />
              </div>
            ))}
          </div>
        ) : (
          <TestimonyList
            items={paged}
            showTypeIcon={showTypeIcon}
            showDescriptor={showDescriptor}
          />
        )}
        {pageSize && pageCount > 1 && (
          <Pagination page={current} pageCount={pageCount} onPage={setPage} />
        )}
        </>
      ) : (
        // Individuals is the one empty result a visitor can act on themselves,
        // so it keeps the invitation; every other empty result, including
        // Following with nobody followed in view, only offers a way back out
        // of the filters.
        <div className="border-[1.5px] border-dashed border-line-strong rounded-panel p-[22px] text-center bg-surface">
          <p className="font-body font-semibold text-lg text-ink mb-[4px]">
            {noIndividuals
              ? "No individual testimony yet"
              : "No testimony matches these filters"}
          </p>
          <p className="font-body text-sm text-ink-muted leading-[1.5] max-w-[560px] mx-auto">
            {noIndividuals
              ? "No residents have submitted testimony on this question yet. Be among the first to add your perspective."
              : "Try widening your selection to see submissions on this question."}
          </p>
          <div className="flex gap-[10px] justify-center mt-[14px] flex-wrap">
            {noIndividuals && (
              <button
                onClick={() => setComposing(true)}
                className="bg-brand text-ink-inverse font-body font-semibold text-sm px-[18px] py-[8px] rounded-pill cursor-pointer hover:bg-brand-hover"
              >
                Add Your Perspective
              </button>
            )}
            <button
              onClick={() => {
                setFilter("all");
                setTypeFilter("all");
                setFollowingOnly(false);
              }}
              className="bg-surface border border-brand text-brand font-body font-semibold text-sm px-[18px] py-[8px] rounded-pill cursor-pointer hover:bg-brand-soft/60"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
      {composing && <AddPerspectiveModal onClose={() => setComposing(false)} />}
      {openItem && (
        <TestimonyModal
          t={openItem}
          showTypeIcon={showTypeIcon}
          showDescriptor={showDescriptor}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

// Testimony from followed accounts — an infinite carousel showing one entry at
// a time, starting at a random one, with edge chevrons. Every entry is also an
// invisible sizer stacked in the same grid cell so the container holds the
// tallest (collapsed) height and cycling never shifts layout.
export function FollowedTestimonyCard() {
  const items = useMemo(
    () => testimonyFor((u) => Boolean(u.followedByViewer)),
    [],
  );
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * Math.max(1, items.length)),
  );
  if (items.length === 0) return null;
  const current = index % items.length;
  const step = (dir: 1 | -1) =>
    setIndex((i) => (i + dir + items.length) % items.length);
  return (
    <Card
      title="Featured Testimony"
      subtitle="Testimony of the organizations, officials, and individuals that you follow on MAPLE."
    >
      {/* Chevrons sit at the card edges and stretch the full height of the row
          for a large click target; the entry is width-capped and centered. */}
      <div className="flex items-stretch gap-[10px]">
        <button
          onClick={() => step(-1)}
          aria-label="Previous testimony"
          className="text-ink hover:text-alert hover:bg-wash cursor-pointer shrink-0 self-stretch flex items-center px-[14px] rounded-control"
        >
          <ChevronLeft className="w-[18px] h-[18px]" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="max-w-[760px] mx-auto grid">
            {items.map((t) => (
              <div
                key={t.id}
                aria-hidden="true"
                className="col-start-1 row-start-1 invisible pointer-events-none"
              >
                <TestimonyEntry t={t} showDescriptor="officials" />
              </div>
            ))}
            <div key={items[current].id} className="col-start-1 row-start-1">
              <TestimonyEntry t={items[current]} showDescriptor="officials" />
            </div>
          </div>
        </div>

        <button
          onClick={() => step(1)}
          aria-label="Next testimony"
          className="text-ink hover:text-alert hover:bg-wash cursor-pointer shrink-0 self-stretch flex items-center px-[14px] rounded-control"
        >
          <ChevronRight className="w-[18px] h-[18px]" />
        </button>
      </div>
    </Card>
  );
}

export function OrganizationTestimonyCard({
  initialFilter,
}: {
  initialFilter?: StanceFilter;
}) {
  return (
    <Card
      title="Organization Testimony"
      subtitle="Submitted by verified organization user accounts. Each account chose endorse, oppose, or no position before writing; testimony appears in the account's own words and is never edited."
    >
      <TestimonyFeed
        items={testimonyFor((u) => u.userType === "organization")}
        showDescriptor={false}
        includeFollowingFilter
        initialFilter={initialFilter}
      />
    </Card>
  );
}
