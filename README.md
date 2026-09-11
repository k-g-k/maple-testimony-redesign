# MAPLE testimony redesign

A redesign of the testimony feed for [MAPLE](https://www.mapletestimony.org), the
Massachusetts platform that collects and publishes public testimony on pending
legislation and ballot questions.

This repository holds one screen, extracted from a larger ballot-question
prototype so the feed can be read and worked on by itself. It runs, with real
data, on the 2026 Chapter 62F ballot question.

![screenshot placeholder](docs/screenshot.png)

## What it is

Testimony on a ballot question is filed by organizations and by individual
residents, from every position, over months. The problem the design has to solve
is letting someone find the part of that record they came for without implying
that the record is a poll.

What that turns into here:

- **Filters that state rather than argue.** Position and account type narrow the
  list. Counts never appear beside a position, because a count next to a side
  starts reading as a score on a platform that takes none.
- **Provenance carried on every entry.** Who filed, what kind of account they
  are, where they stand, and when, all before the statement itself.
- **A control that only appears when it would find something.** The Following
  filter is hidden when nobody in the current list is followed, rather than
  offering a button whose only outcome is an empty state.
- **Long statements, clamped honestly.** Bodies run to a few hundred words, so
  they are cut to six lines with the real text behind "Show more", never
  summarized.

## Running it

```
npm install
npm run dev
```

`npm run build` type-checks and builds.

## About the data

The statements from organizations are **real public positions**, taken from
Ballotpedia and Massachusetts news outlets and recast as MAPLE submissions.
Submission dates are placeholders.

The statements from individuals are **invented**. No such person filed them.
They exist so the account-type and no-position filters have something to find,
and so a question decided by voters does not read as a fight between ten
organizations. Both files say so at the top of the block.

Nothing here should be quoted as evidence of what anyone said.

## Layout

```
src/
  App.tsx            the page
  feed/              the testimony feed, its entries, and account presentation
  ui/                the primitives it is built from: Card, Modal, FilterChip,
                     Pagination, Chapter, the site bar, source context
  data/              accounts, testimony, sources, the question itself
  styles/            design tokens and the Tailwind entry
```

Design tokens live in `src/styles/theme.css` and are real Tailwind theme keys, so
`--color-ink-muted` generates `text-ink-muted`. Changing the palette is a
one-file job.
