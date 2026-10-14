// Implements: docs/plans/ANIMATION_MODEL_BRIEF.md §6 (story experience).
//
// THE STAGE CONTRACT, mirrored from tour-experience.tsx so the two routes
// cannot disagree: a tall section (here 5000vh — ~100vh of scroll per beat,
// because the brief demands a story that takes at least fifty scrolls), a
// sticky 100dvh stage, a GSAP scrub proxy driving one 0..1 progress ref, DOM
// buttons that scrollTo (never scroll-jack), `?beat=` deep links with push on
// explicit visits / replace on scrub / popstate for back-forward, a Poster
// veil until first frame, frameloop suspended off-screen, and an sr-only
// live region. Overlay headings are H2 — the H1 lives in the server page.

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Poster } from "@/components/product-3d/Poster";
import {
  useLowEnd,
  useReducedMotion,
  useSceneTokens,
  useWebGLAvailable,
  useWideDesktop,
} from "@/components/product-3d/hooks";
import {
  beatIdToIndex,
  beatIndexToId,
  resolveBeatIndex,
} from "@/components/product-3d/scene-tiers";
import { STORY_BEATS, STORY_IDS } from "./beats";

const StoryCanvas = dynamic(() => import("./story-canvas").then((m) => m.StoryCanvas), {
  ssr: false,
});

const ACTS = [
  { act: 1, label: "Act I · The Hunt", firstBeat: 0 },
  { act: 2, label: "Act II · The Chaos", firstBeat: 9 },
  { act: 3, label: "Act III · The Turn", firstBeat: 20 },
  { act: 4, label: "Act IV · The Relief", firstBeat: 30 },
  { act: 5, label: "Act V · The Five Screens", firstBeat: 40 },
] as const;

function actOfBeat(index: number): (typeof ACTS)[number] {
  let current: (typeof ACTS)[number] = ACTS[0];
  for (const a of ACTS) {
    if (index >= a.firstBeat) current = a;
    else break;
  }
  return current;
}

function BeatTitle({ text, beat }: { text: string; beat: number }) {
  const words = text.split(" ");
  let charIndex = 0;
  return (
    <h2
      key={beat}
      className="scatter-in font-display text-3xl leading-tight font-bold text-balance md:text-5xl"
      style={{ color: "var(--text-primary)" }}
    >
      <span aria-hidden="true">
        {words.map((word, wi) => {
          const start = charIndex;
          charIndex += word.length + 1;
          return (
            <Fragment key={wi}>
              <span className="scatter-word">
                {word.split("").map((ch, ci) => (
                  <span
                    key={ci}
                    className="scatter-char"
                    style={{ animationDelay: `${Math.min((start + ci) * 12, 400)}ms` }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
              {wi < words.length - 1 ? " " : null}
            </Fragment>
          );
        })}
      </span>
      <span className="sr-only">{text}</span>
    </h2>
  );
}

function readBeatParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("beat");
}

export function StoryExperience() {
  const webgl = useWebGLAvailable();
  const reduced = useReducedMotion();
  const lowEnd = useLowEnd();
  const wide = useWideDesktop();
  const tokens = useSceneTokens();
  const [ready, setReady] = useState(false);
  const [beat, setBeat] = useState(0);
  const [inView, setInView] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef({ current: 0 });
  const beatRef = useRef(0);

  const saveData =
    typeof navigator !== "undefined" &&
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ===
      true;
  const showPoster = webgl === false || saveData || tokens === null;

  const beatTop = (index: number): number => {
    const section = sectionRef.current;
    if (!section) return 0;
    const clamped = Math.min(STORY_BEATS.length - 1, Math.max(0, index));
    const [start] = STORY_BEATS[clamped].scroll;
    return section.offsetTop + section.offsetHeight * start;
  };

  const goToBeat = (index: number, history: "push" | "replace" | "none") => {
    const clamped = Math.min(STORY_BEATS.length - 1, Math.max(0, index));
    beatRef.current = clamped;
    setBeat(clamped);
    window.scrollTo({ top: beatTop(clamped), behavior: reduced ? "auto" : "smooth" });
    if (history === "none") return;
    const url = `?beat=${beatIndexToId(clamped, STORY_IDS)}`;
    if (window.location.search === url) return;
    if (history === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  };

  useLayoutEffect(() => {
    if (showPoster) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          progressRef.current.current = self.progress;
          const b = resolveBeatIndex(self.progress, STORY_BEATS.length);
          if (b !== beatRef.current) {
            beatRef.current = b;
            setBeat(b);
            const url = `?beat=${beatIndexToId(b, STORY_IDS)}`;
            if (window.location.search !== url) window.history.replaceState(null, "", url);
          }
        },
      });
    }, sectionRef);
    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 600);
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    if (fonts) {
      fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }
    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, [showPoster]);

  useLayoutEffect(() => {
    if (showPoster) return;
    const target = beatIdToIndex(readBeatParam(), STORY_IDS);
    if (target === 0) return;
    const landTimer = setTimeout(() => {
      beatRef.current = target;
      setBeat(target);
      window.scrollTo({ top: beatTop(target), behavior: "auto" });
    }, 700);
    return () => clearTimeout(landTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPoster]);

  useEffect(() => {
    const onPop = () => {
      const target = beatIdToIndex(readBeatParam(), STORY_IDS);
      beatRef.current = target;
      setBeat(target);
      window.scrollTo({ top: beatTop(target), behavior: "auto" });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || showPoster) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [showPoster]);

  const current = STORY_BEATS[beat];
  const act = actOfBeat(beat);

  const canvasNote = (() => {
    if (webgl === null) return "Checking whether this device can show the 3D story.";
    if (saveData) return "Data saver is on, so still images stand in for the 3D story.";
    if (webgl === false) {
      return "This device cannot draw the 3D story, so still images stand in for it.";
    }
    if (!ready) return "The 3D story is loading.";
    if (reduced) return "The 3D story is held still because reduced motion is on.";
    if (lowEnd) return "The 3D story is running in its lighter version for this device.";
    return "The 3D story is ready.";
  })();

  const atFirst = beat === 0;
  const atLast = beat === STORY_BEATS.length - 1;

  return (
    <section
      ref={sectionRef}
      aria-label="The story of one evening"
      className="relative"
      style={{ height: "5000vh" }}
    >
      <div ref={stageRef} className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        {showPoster || !tokens ? (
          <Poster />
        ) : (
          <div className="relative h-[100dvh] w-full">
            <div className="absolute inset-0">
              <StoryCanvas
                progressRef={progressRef.current}
                tokens={tokens}
                directive={current.scene}
                frozen={reduced}
                lowEnd={lowEnd}
                wide={wide}
                inView={inView}
                onReady={() => setReady(true)}
              />
            </div>
            {!ready && (
              <div className="absolute inset-0">
                <Poster />
              </div>
            )}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 flex min-h-0 flex-col justify-center px-6 pt-6 pb-44 md:px-12 md:pt-12 md:pb-40">
          <div className="mat mat-fresnel pointer-events-auto max-h-full w-full max-w-xl overflow-y-auto rounded-panel p-6 md:p-8">
            <p className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>
              {`Beat ${beat + 1} of ${STORY_BEATS.length} · ${act.label}`}
            </p>
            <div className="mt-3">
              <BeatTitle text={current.caption.title} beat={beat} />
            </div>
            <p
              className="mt-4 text-base text-pretty md:text-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              {current.caption.body}
            </p>
          </div>
        </div>

        <p aria-live="polite" aria-atomic="true" className="sr-only">
          {`Story beat ${beat + 1} of ${STORY_BEATS.length}. ${current.id}. ${canvasNote}`}
        </p>

        <div className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-2 px-6">
          {!showPoster && (
            <>
              <nav aria-label="Story acts" className="flex flex-wrap justify-center gap-2">
                {ACTS.map((a) => {
                  const active = a.act === act.act;
                  return (
                    <button
                      key={a.act}
                      type="button"
                      onClick={() => goToBeat(a.firstBeat, "push")}
                      aria-current={active ? "step" : undefined}
                      aria-label={`${a.label}`}
                      className="min-h-[44px] rounded-full px-4 text-sm font-medium"
                      style={{
                        background: active ? "var(--surface-sheet)" : "transparent",
                        color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                        border: `1px solid ${active ? "var(--accent-primary)" : "var(--border-default)"}`,
                      }}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </nav>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToBeat(beat - 1, "push")}
                  disabled={atFirst}
                  className="inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-medium disabled:opacity-50"
                  style={{
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  Previous beat
                </button>
                <button
                  type="button"
                  onClick={() => goToBeat(beat + 1, "push")}
                  disabled={atLast}
                  className="inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-medium disabled:opacity-50"
                  style={{
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  Next beat
                </button>
              </div>
            </>
          )}
          <a href="#story-access" className="action inline-flex min-h-[44px] items-center text-sm">
            Skip the story and go to the free plan
          </a>
          <Link href="/" className="action inline-flex min-h-[44px] items-center text-sm">
            Back to the product story
          </Link>
        </div>
      </div>

      <style>{`
        .scatter-in { overflow: hidden; }
        .scatter-word { display: inline-block; white-space: nowrap; }
        .scatter-char {
          display: inline-block;
          opacity: 0;
          transform: translateY(110%) rotate(4deg);
          animation: scatter-in 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes scatter-in {
          to { opacity: 1; transform: translateY(0) rotate(0deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .scatter-char { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
    </section>
  );
}
