import { useState } from "react";
import { Plus } from "lucide-react";
import { SOURCES, testimonyFor } from "./data";
import { Chapter, SiteNav, SourcesProvider } from "./ui";
import {
  TestimonyFeed,
  type StanceFilter,
  type TypeFilter,
} from "./feed/TestimonyFeed";

/**
 * The testimony feed, on its own.
 *
 * Lifted out of a larger ballot-question page so the feed can be looked at and
 * worked on without eight other sections around it. The filters are held here
 * rather than inside the feed because on the original page other components
 * set them too; here nothing else does, and the wiring is kept so the two stay
 * comparable.
 */
export default function App() {
  const [stance, setStance] = useState<StanceFilter>("all");
  const [accountType, setAccountType] = useState<TypeFilter>("all");
  // A counter rather than a boolean: the button can ask for the composer again
  // after it has been closed, which a boolean would swallow.
  const [composeSignal, setComposeSignal] = useState(0);

  return (
    <SourcesProvider value={SOURCES}>
      <div className="bg-ground min-h-screen font-body text-ink overflow-x-clip">
        <SiteNav />
        {/* Nothing is pinned above the feed here, so its own sticky filter bar
            sticks to the top of the window. */}
        <main className="mx-auto max-w-[1180px] px-[20px] sm:px-[32px] pt-[20px] sm:pt-[32px] pb-[96px] [--pinned-h:0px]">
          <Chapter
            id="testimony"
            question="What is the public saying?"
            action={
              <button
                onClick={() => setComposeSignal((n) => n + 1)}
                className="inline-flex items-center gap-[5px] font-body font-semibold text-xs px-[10px] py-[4px] rounded-control border border-brand text-brand hover:bg-brand-soft cursor-pointer transition-colors"
              >
                <Plus className="w-[13px] h-[13px]" />
                Add your perspective
              </button>
            }
          >
            <TestimonyFeed
              filter={stance}
              onFilterChange={setStance}
              typeFilter={accountType}
              onTypeFilterChange={setAccountType}
              hideAddButton
              composeSignal={composeSignal}
              items={testimonyFor(() => true)}
              stickyTop="var(--pinned-h)"
              includeFollowingFilter
              includeTypeFilter
              asCards
            />
          </Chapter>
        </main>
      </div>
    </SourcesProvider>
  );
}
