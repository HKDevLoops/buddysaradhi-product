// Implements: docs/plans/ANIMATION_MODEL_BRIEF.md §6 + §8 (the `/story`
// route: a 50-beat scroll narrative in 3D).
//
// FM-13: the H1 below is server copy — in the static HTML with zero client JS,
// which tests/ssr.test.ts proves by reading the prerendered HTML. The stage
// overlay (StoryExperience) uses H2s: one H1 per document. All fifty beats
// render below as a static ordered list: the no-JS, no-WebGL and search
// surface. If WebGL fails, is disabled, or JS is off, the visitor has still
// read the entire story — that is the contract, not a fallback.

import Link from "next/link";
import { StoryExperience } from "@/components/story/story-experience";
import { STORY_BEATS } from "@/components/story/beats";
import {
  APP_SIGNUP_URL,
  FREE_SIGNUP_CTA,
  FREE_SIGNUP_NOTE,
} from "@/lib/access-request";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata = {
  title: "The story of one evening. BuddySaradhi.",
  description:
    "One evening in a tutor's life going wrong, and the same evening going right — fifty scrolls through the chaos of running a tuition, and the five screens that end it.",
};

const ACT_LABELS = ["Act I · The Hunt", "Act II · The Chaos", "Act III · The Turn", "Act IV · The Relief", "Act V · The Five Screens"] as const;

export default function StoryPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-6 pt-10">
        <p className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>
          A story in fifty scrolls
        </p>
        <h1 className="font-display mt-2 max-w-[22ch] text-4xl leading-tight font-bold text-balance md:text-5xl">
          One evening, twice.
        </h1>
        <p className="mt-4 max-w-[68ch] text-pretty text-[var(--text-secondary)]">
          The first evening goes wrong: listings with no names, registers in
          piles, forty-seven messages and nothing resolved. The second evening
          goes right, on five screens. Scroll — the camera, the seeker and the
          ledger move with you. If your device cannot draw 3D, the fifty beats
          below read the same.
        </p>
      </div>

      <StoryExperience />

      <section aria-labelledby="story-beats-heading" className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 id="story-beats-heading" className="font-display text-3xl font-bold text-balance md:text-4xl">
          The fifty beats
        </h2>
        <ol className="mt-10 overflow-hidden rounded-panel border border-[var(--border-default)]">
          {STORY_BEATS.map((b, i) => (
            <li
              key={b.id}
              id={`story-beat-${b.id}`}
              className="row grid gap-1 px-5 py-5 md:grid-cols-[12rem_1fr] md:gap-6"
            >
              <div className="font-display text-lg font-semibold">
                {`Beat ${i + 1} of ${STORY_BEATS.length}`}
                <span className="mt-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {ACT_LABELS[b.act - 1]}
                </span>
              </div>
              <div>
                <p className="font-semibold">{b.caption.title}</p>
                <p className="mt-1 text-pretty text-[var(--text-secondary)]">{b.caption.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="story-access"
        aria-label="Getting access"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl px-6 pb-20"
      >
        <div className="panel grid gap-8 p-8 md:grid-cols-[1.2fr_1fr] md:p-10">
          <div>
            <h2 className="font-display text-3xl font-bold text-balance md:text-4xl">
              Tonight's evening can be the short one.
            </h2>
            <p className="mt-4 max-w-[60ch] text-pretty text-[var(--text-secondary)]">
              The free plan needs no contract and nobody to reply to, so you can
              be inside the app today. Nothing is charged on this site and no
              card is ever asked for.
            </p>
          </div>
          <div className="flex flex-col items-start justify-center gap-3 md:items-stretch">
            <a href={APP_SIGNUP_URL} className="btn btn-primary w-full text-base" rel="noopener">
              {FREE_SIGNUP_CTA}
            </a>
            <p className="mt-1 text-sm text-pretty text-[var(--text-muted)]">{FREE_SIGNUP_NOTE}</p>
            <div className="mt-2 flex flex-col items-start gap-2 md:items-stretch">
              <Link href="/" className="action inline-flex min-h-[44px] items-center">
                Back to the product story
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
