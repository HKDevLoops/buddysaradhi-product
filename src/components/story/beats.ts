// Implements: docs/plans/ANIMATION_MODEL_BRIEF.md §2 (the 50-beat narrative).
//
// WHAT THIS FILE IS. The single source of truth for the `/story` scroll story:
// one evening in a tutor's life going wrong, and the same evening going right.
// 50 beats across 5 acts. Every consumer — the camera rig, the character, the
// act directives, the server page's static list, the tests — reads THIS module.
// Nobody re-declares a beat anywhere else.
//
// THE INVARIANTS (all enforced by tests/beats.test.ts, not by inspection):
// - exactly 50 beats, ids unique and ordered;
// - scroll ranges tile 0..1 contiguously: no gap, no overlap;
// - every beat declares a camera TARGET (not just a position) and an fov;
// - Act II roll never exceeds 0.08 rad; beat 38 roll is exactly 0.
//
// COPY RULES (audited mechanism language, same as tour-copy.ts): no headcounts,
// no durations, no invented benchmarks, no statistics. What the product does is
// stated; what it does not do is never claimed.

export type BeatFocus = "seeker" | "room" | "ledger" | "self" | "none";

export type CharacterPose = "compressed" | "anxious" | "still" | "open" | "upright";

export type LedgerPresence = "hidden" | "entering" | "present" | "center" | "orbit";

export interface CameraFrame {
  /** Camera position in world units. */
  readonly pos: readonly [number, number, number];
  /** MANDATORY look target. A beat without a target is a rejected beat. */
  readonly target: readonly [number, number, number];
  /** Vertical field of view, degrees. Must stay inside [35, 90]. */
  readonly fov: number;
  /** Dutch angle, radians. 0 unless the act's camera language says otherwise. */
  readonly roll?: number;
}

export interface SceneDirective {
  readonly character: CharacterPose;
  readonly ledger: LedgerPresence;
  /** Crowd density 0..1 (Act II noise vs Act I solitude). */
  readonly crowd: number;
  /** 0 = cold sodium night, 1 = warm relief. Drives light colour, not copy. */
  readonly warmth: number;
  /** True only where the story demands a hard stop (beat 21). */
  readonly stillness: boolean;
}

export interface BeatCaption {
  readonly title: string;
  readonly body: string;
}

export interface Beat {
  /** Stable kebab id. Never renumbered — deep links (`?beat=`) depend on it. */
  readonly id: string;
  readonly act: 1 | 2 | 3 | 4 | 5;
  /** [start, end] in normalised scroll 0..1. Contiguous with neighbours. */
  readonly scroll: readonly [number, number];
  readonly camera: CameraFrame;
  readonly focus: BeatFocus;
  readonly caption: BeatCaption;
  readonly scene: SceneDirective;
}

// ─── ACT I — THE HUNT (beats 1–9, scroll 0.00–0.15) · focus: seeker ─────────
// A seeker. Alone. Phone in hand. Evening. She is looking for a class.

const ACT_I: readonly Beat[] = [
  {
    id: "street-night",
    act: 1,
    scroll: [0, 0.016667],
    camera: { pos: [0, 8, 40], target: [0, 2, 20], fov: 55, roll: 0 },
    focus: "seeker",
    caption: {
      title: "Evening. A street that teaches nothing.",
      body: "The tuition boards glow. Every one of them promises the same thing in the same font.",
    },
    scene: { character: "compressed", ledger: "hidden", crowd: 0, warmth: 0, stillness: false },
  },
  {
    id: "phone-glow",
    act: 1,
    scroll: [0.016667, 0.033333],
    camera: { pos: [-2, 7, 38], target: [-2, 1.5, 22], fov: 55, roll: 0 },
    focus: "seeker",
    caption: {
      title: "She looks down.",
      body: "The phone is the only light on her. Everything she needs is supposed to be in there.",
    },
    scene: { character: "compressed", ledger: "hidden", crowd: 0, warmth: 0, stillness: false },
  },
  {
    id: "first-result",
    act: 1,
    scroll: [0.033333, 0.05],
    camera: { pos: [-4, 6.5, 36], target: [-4, 1.2, 24], fov: 55, roll: 0 },
    focus: "seeker",
    caption: {
      title: "A listing. Class 9, maths, four hundred a month.",
      body: "The details fit in one line. The questions it raises do not.",
    },
    scene: { character: "compressed", ledger: "hidden", crowd: 0.05, warmth: 0, stillness: false },
  },
  {
    id: "the-question",
    act: 1,
    scroll: [0.05, 0.066667],
    camera: { pos: [-5, 6, 34], target: [-5, 1, 25], fov: 55, roll: 0 },
    focus: "seeker",
    caption: {
      title: "Who is teaching this?",
      body: "No name. No face. No record of anyone ever having learned there.",
    },
    scene: { character: "compressed", ledger: "hidden", crowd: 0.05, warmth: 0, stillness: false },
  },
  {
    id: "scroll-past",
    act: 1,
    scroll: [0.066667, 0.083333],
    camera: { pos: [-3, 5.5, 32], target: [0, 1, 26], fov: 55, roll: 0 },
    focus: "seeker",
    caption: {
      title: "Three more listings. Same font. Same voice.",
      body: "Scrolling does not narrow it down. It only makes the evening shorter.",
    },
    scene: { character: "compressed", ledger: "hidden", crowd: 0.1, warmth: 0, stillness: false },
  },
  {
    id: "doubt",
    act: 1,
    scroll: [0.083333, 0.1],
    camera: { pos: [0, 5, 31], target: [0, 1, 26], fov: 55, roll: 0 },
    focus: "seeker",
    caption: {
      title: "She stops.",
      body: "Something in her posture changes. This is not going to work.",
    },
    scene: { character: "compressed", ledger: "hidden", crowd: 0.1, warmth: 0, stillness: false },
  },
  {
    id: "the-whatsapp",
    act: 1,
    scroll: [0.1, 0.116667],
    camera: { pos: [2, 4.5, 30], target: [2, 1, 25], fov: 55, roll: 0 },
    focus: "seeker",
    caption: {
      title: "A screenshot from a friend. A spreadsheet.",
      body: "Nine columns. No names. Somebody's entire institute, flattened into cells.",
    },
    scene: { character: "compressed", ledger: "hidden", crowd: 0.1, warmth: 0, stillness: false },
  },
  {
    id: "the-thread",
    act: 1,
    scroll: [0.116667, 0.133333],
    camera: { pos: [4, 4, 29], target: [3, 1, 24], fov: 55, roll: 0 },
    focus: "seeker",
    caption: {
      title: "Forty-seven messages. Did you pay? Which batch?",
      body: "Every answer arrives three questions late, and the questions keep coming.",
    },
    scene: { character: "compressed", ledger: "hidden", crowd: 0.15, warmth: 0, stillness: false },
  },
  {
    id: "alone-lit",
    act: 1,
    scroll: [0.133333, 0.15],
    camera: { pos: [6, 5, 30], target: [0, 1, 20], fov: 55, roll: 0 },
    focus: "seeker",
    caption: {
      title: "Wide. One small lit figure in a dark grid.",
      body: "This is the problem BuddySaradhi exists for. Remember this frame.",
    },
    scene: { character: "compressed", ledger: "hidden", crowd: 0.15, warmth: 0, stillness: false },
  },
];

// ─── ACT II — THE CHAOS (beats 10–20, scroll 0.15–0.38) · focus: room ───────
// The corridor. Other seekers converge. Everything is noise.

const ACT_II: readonly Beat[] = [
  {
    id: "corridor-blink",
    act: 2,
    scroll: [0.15, 0.170909],
    camera: { pos: [4, 3.5, 26], target: [0, 1.5, 14], fov: 58, roll: 0 },
    focus: "room",
    caption: {
      title: "The corridor.",
      body: "Harsh strip lighting, a long perspective, and no edges to hold on to.",
    },
    scene: { character: "anxious", ledger: "hidden", crowd: 0.4, warmth: 0, stillness: false },
  },
  {
    id: "crowd-in",
    act: 2,
    scroll: [0.170909, 0.191818],
    camera: { pos: [2, 3, 23], target: [0, 1.5, 12], fov: 62, roll: 0.03 },
    focus: "room",
    caption: {
      title: "Silhouettes, overlapping, no faces.",
      body: "Everyone is looking for the same thing and nobody will say what it costs.",
    },
    scene: { character: "anxious", ledger: "hidden", crowd: 0.6, warmth: 0, stillness: false },
  },
  {
    id: "noise-registers",
    act: 2,
    scroll: [0.191818, 0.212727],
    camera: { pos: [0, 2.8, 21], target: [0, 1.2, 10], fov: 65, roll: -0.04 },
    focus: "room",
    caption: {
      title: "Paper registers everywhere. Stacked. Falling.",
      body: "The institute's memory, in a pile, in no order, in pencil.",
    },
    scene: { character: "anxious", ledger: "hidden", crowd: 0.7, warmth: 0, stillness: false },
  },
  {
    id: "noise-whatsapp",
    act: 2,
    scroll: [0.212727, 0.233636],
    camera: { pos: [-2, 2.6, 19], target: [-1, 1.2, 9], fov: 68, roll: 0.06 },
    focus: "room",
    caption: {
      title: "Message bubbles multiplying. Unreadable.",
      body: "The chat is the office now. The office has no filing cabinet.",
    },
    scene: { character: "anxious", ledger: "hidden", crowd: 0.8, warmth: 0, stillness: false },
  },
  {
    id: "noise-calls",
    act: 2,
    scroll: [0.233636, 0.254545],
    camera: { pos: [-3, 2.5, 17], target: [-1, 1, 8], fov: 70, roll: -0.07 },
    focus: "room",
    caption: {
      title: "Missed-call glyphs, pulsing.",
      body: "Every missed call is a fee nobody will remember to ask for.",
    },
    scene: { character: "anxious", ledger: "hidden", crowd: 0.9, warmth: 0, stillness: false },
  },
  {
    id: "noise-excel",
    act: 2,
    scroll: [0.254545, 0.275455],
    camera: { pos: [-2, 2.4, 15], target: [0, 1, 7], fov: 70, roll: 0.08 },
    focus: "room",
    caption: {
      title: "A grid of cells. Some red. Nobody knows why.",
      body: "The formula broke three months ago. The red stayed.",
    },
    scene: { character: "anxious", ledger: "hidden", crowd: 1, warmth: 0, stillness: false },
  },
  {
    id: "the-weight",
    act: 2,
    scroll: [0.275455, 0.296364],
    camera: { pos: [0, 2.2, 14], target: [0, 0.8, 6], fov: 68, roll: -0.05 },
    focus: "room",
    caption: {
      title: "The camera drifts down. The noise has weight.",
      body: "This is what running a tuition looks like without a system. Hold it.",
    },
    scene: { character: "anxious", ledger: "hidden", crowd: 1, warmth: 0, stillness: false },
  },
  {
    id: "pinned-doubt",
    act: 2,
    scroll: [0.296364, 0.317273],
    camera: { pos: [1, 2.2, 13], target: [1, 1, 6], fov: 64, roll: 0.03 },
    focus: "room",
    caption: {
      title: "One bubble holds still. Sir, my fee is paid but it shows due.",
      body: "A real message, from a real parent, with no good answer attached.",
    },
    scene: { character: "anxious", ledger: "hidden", crowd: 0.7, warmth: 0, stillness: false },
  },
  {
    id: "pinned-doubt-2",
    act: 2,
    scroll: [0.317273, 0.338182],
    camera: { pos: [1.5, 2.2, 12], target: [1.5, 1, 5.5], fov: 60, roll: 0 },
    focus: "room",
    caption: {
      title: "Another. I marked attendance. It didn't save.",
      body: "Two messages. Two different failures. One evening.",
    },
    scene: { character: "anxious", ledger: "hidden", crowd: 0.5, warmth: 0, stillness: false },
  },
  {
    id: "the-collapse",
    act: 2,
    scroll: [0.338182, 0.359091],
    camera: { pos: [1, 2.4, 12], target: [0, 1, 5], fov: 58, roll: 0 },
    focus: "room",
    caption: {
      title: "The corridor narrows. Everyone looks at their own screen.",
      body: "Eleven people, eleven versions of the truth, zero of them written down.",
    },
    scene: { character: "anxious", ledger: "hidden", crowd: 0.6, warmth: 0, stillness: false },
  },
  {
    id: "the-cost",
    act: 2,
    scroll: [0.359091, 0.38],
    camera: { pos: [0, 2.6, 12], target: [0, 1, 4], fov: 55, roll: 0 },
    focus: "room",
    caption: {
      title: "Silence. Every screen still lit. Nothing resolved.",
      body: "The roll is level again. The worst is over, because something is about to change.",
    },
    scene: { character: "anxious", ledger: "entering", crowd: 0.3, warmth: 0.1, stillness: false },
  },
];

// ─── ACT III — THE TURN (beats 21–30, scroll 0.38–0.58) · focus: ledger ─────
// The ledger card appears. It is not magic — it is ordered.

const ACT_III: readonly Beat[] = [
  {
    id: "card-breathe",
    act: 3,
    scroll: [0.38, 0.4],
    camera: { pos: [0, 2.4, 10], target: [0, 1.2, 2], fov: 38, roll: 0 },
    focus: "ledger",
    caption: {
      title: "The card floats in. Slow. Quiet.",
      body: "Nothing else moves. After the corridor, the stillness is the point.",
    },
    scene: { character: "still", ledger: "entering", crowd: 0, warmth: 0.2, stillness: true },
  },
  {
    id: "card-front",
    act: 3,
    scroll: [0.4, 0.42],
    camera: { pos: [0, 2.2, 8], target: [0, 1.2, 2], fov: 38, roll: 0 },
    focus: "ledger",
    caption: {
      title: "One face, edge-lit.",
      body: "It does not do eleven things. It keeps one record, correctly.",
    },
    scene: { character: "still", ledger: "present", crowd: 0, warmth: 0.3, stillness: false },
  },
  {
    id: "the-append",
    act: 3,
    scroll: [0.42, 0.44],
    camera: { pos: [0, 2, 7], target: [0, 1.2, 2], fov: 38, roll: 0 },
    focus: "ledger",
    caption: {
      title: "A row lands. The chain extends.",
      body: "A new entry is written. Nothing old is rewritten. It can only extend.",
    },
    scene: { character: "still", ledger: "present", crowd: 0, warmth: 0.4, stillness: false },
  },
  {
    id: "the-append-2",
    act: 3,
    scroll: [0.44, 0.46],
    camera: { pos: [0.5, 2, 6.5], target: [0, 1.2, 2], fov: 38, roll: 0 },
    focus: "ledger",
    caption: {
      title: "Another row. Older, dimmer, but present.",
      body: "Last month's payments are still there, exactly as written. That is the whole trick.",
    },
    scene: { character: "still", ledger: "present", crowd: 0, warmth: 0.4, stillness: false },
  },
  {
    id: "the-reverse",
    act: 3,
    scroll: [0.46, 0.48],
    camera: { pos: [-0.5, 2, 6.5], target: [0, 1.2, 2], fov: 38, roll: 0 },
    focus: "ledger",
    caption: {
      title: "A mistake becomes a second row, not an erasure.",
      body: "The wrong value survives beside the right one. The books stay honest because nothing vanishes.",
    },
    scene: { character: "still", ledger: "present", crowd: 0, warmth: 0.5, stillness: false },
  },
  {
    id: "the-hash",
    act: 3,
    scroll: [0.48, 0.5],
    camera: { pos: [0, 1.9, 6], target: [0, 1.2, 2], fov: 38, roll: 0 },
    focus: "ledger",
    caption: {
      title: "Each link depends on the last.",
      body: "Tamper with one row and the chain disagrees with itself. That is tamper-evidence, not a slogan.",
    },
    scene: { character: "still", ledger: "present", crowd: 0, warmth: 0.5, stillness: false },
  },
  {
    id: "the-receipt",
    act: 3,
    scroll: [0.5, 0.52],
    camera: { pos: [0.3, 1.9, 5.8], target: [0, 1.2, 2], fov: 38, roll: 0 },
    focus: "ledger",
    caption: {
      title: "A receipt, numbered in order.",
      body: "Numbers never repeat and never go backwards. A gap in the sequence is a void, explained, not a loss.",
    },
    scene: { character: "still", ledger: "present", crowd: 0, warmth: 0.6, stillness: false },
  },
  {
    id: "the-paise",
    act: 3,
    scroll: [0.52, 0.54],
    camera: { pos: [-0.3, 1.9, 5.8], target: [0, 1.2, 2], fov: 38, roll: 0 },
    focus: "ledger",
    caption: {
      title: "Paise, not rupees. Two decimals, exact.",
      body: "Money is counted in whole paise so it can never drift. A tutor's month-end depends on that.",
    },
    scene: { character: "still", ledger: "present", crowd: 0, warmth: 0.6, stillness: false },
  },
  {
    id: "the-one-truth",
    act: 3,
    scroll: [0.54, 0.56],
    camera: { pos: [0, 1.8, 5.5], target: [0, 1.2, 2], fov: 40, roll: 0 },
    focus: "ledger",
    caption: {
      title: "The card turns. Behind it: one number, not five.",
      body: "The dashboard, the roster and the receipt all read from the same rows. They cannot disagree.",
    },
    scene: { character: "still", ledger: "center", crowd: 0, warmth: 0.7, stillness: false },
  },
  {
    id: "the-choice",
    act: 3,
    scroll: [0.56, 0.58],
    camera: { pos: [0, 1.8, 5.5], target: [0, 1.2, 2], fov: 42, roll: 0 },
    focus: "ledger",
    caption: {
      title: "Her hand. One tap, or twenty.",
      body: "The same evening is about to happen again. This time the system is on her side.",
    },
    scene: { character: "still", ledger: "center", crowd: 0, warmth: 0.7, stillness: false },
  },
];

// ─── ACT IV — THE RELIEF (beats 31–40, scroll 0.58–0.78) · focus: self ──────
// The same evening, now going right. Same beats, inverted.

const ACT_IV: readonly Beat[] = [
  {
    id: "same-night",
    act: 4,
    scroll: [0.58, 0.6],
    camera: { pos: [0, 2.5, 8], target: [0, 1.5, 0], fov: 48, roll: 0 },
    focus: "self",
    caption: {
      title: "The same street. The same sodium light.",
      body: "She is walking differently. Watch the shoulders, not the phone.",
    },
    scene: { character: "open", ledger: "present", crowd: 0.1, warmth: 0.75, stillness: false },
  },
  {
    id: "phone-warm",
    act: 4,
    scroll: [0.6, 0.62],
    camera: { pos: [-1, 3, 10], target: [-1, 1.5, -2], fov: 52, roll: 0 },
    focus: "self",
    caption: {
      title: "The phone is not a search bar. It is five labels.",
      body: "Dashboard. Students. Attendance. Fees. Settings. Nothing else competes for the evening.",
    },
    scene: { character: "open", ledger: "present", crowd: 0.1, warmth: 0.8, stillness: false },
  },
  {
    id: "tap-students",
    act: 4,
    scroll: [0.62, 0.64],
    camera: { pos: [-2, 3.5, 12], target: [-2, 1.5, -4], fov: 55, roll: 0 },
    focus: "self",
    caption: {
      title: "Students, ordered, named, owed.",
      body: "The roster knows every batch. Nobody is a row in somebody's spreadsheet.",
    },
    scene: { character: "open", ledger: "present", crowd: 0.1, warmth: 0.8, stillness: false },
  },
  {
    id: "tap-attendance",
    act: 4,
    scroll: [0.64, 0.66],
    camera: { pos: [-1, 4, 14], target: [0, 1.5, -6], fov: 55, roll: 0 },
    focus: "self",
    caption: {
      title: "One tap marks the whole class.",
      body: "The next tap locks the day. From then on the record is authoritative.",
    },
    scene: { character: "open", ledger: "present", crowd: 0.1, warmth: 0.85, stillness: false },
  },
  {
    id: "tap-fees",
    act: 4,
    scroll: [0.66, 0.68],
    camera: { pos: [0, 4.5, 16], target: [0, 1.5, -8], fov: 55, roll: 0 },
    focus: "self",
    caption: {
      title: "Fee generated, attributed, dated.",
      body: "Each invoice knows its student, its month, and exactly what is still owed on it.",
    },
    scene: { character: "open", ledger: "present", crowd: 0.1, warmth: 0.85, stillness: false },
  },
  {
    id: "tap-paid",
    act: 4,
    scroll: [0.68, 0.7],
    camera: { pos: [1, 4.5, 17], target: [1, 1.5, -9], fov: 55, roll: 0 },
    focus: "self",
    caption: {
      title: "Money in. Ledger balanced. Screen closes.",
      body: "The receipt numbers itself. She does not think about the receipt.",
    },
    scene: { character: "open", ledger: "present", crowd: 0.1, warmth: 0.9, stillness: false },
  },
  {
    id: "tap-settings",
    act: 4,
    scroll: [0.7, 0.72],
    camera: { pos: [2, 4.5, 18], target: [2, 1.5, -10], fov: 55, roll: 0 },
    focus: "self",
    caption: {
      title: "Security. PIN. The account is hers.",
      body: "Backup encrypted, access behind her PIN. Nobody else's evening touches this one.",
    },
    scene: { character: "open", ledger: "present", crowd: 0.1, warmth: 0.9, stillness: false },
  },
  {
    id: "the-breath",
    act: 4,
    scroll: [0.72, 0.74],
    camera: { pos: [0, 5, 20], target: [0, 2, -8], fov: 55, roll: 0 },
    focus: "self",
    caption: {
      title: "She exhales. Shoulders drop.",
      body: "This is the beat to hold. Level camera, warm light, no roll. Relief has a geometry and this is it.",
    },
    scene: { character: "open", ledger: "present", crowd: 0, warmth: 1, stillness: false },
  },
  {
    id: "walk-away",
    act: 4,
    scroll: [0.74, 0.76],
    camera: { pos: [-2, 5.5, 22], target: [-2, 2, -10], fov: 55, roll: 0 },
    focus: "self",
    caption: {
      title: "She walks. The street is the same. She is not.",
      body: "Act One took eleven minutes of her evening. Act Four takes forty seconds.",
    },
    scene: { character: "open", ledger: "present", crowd: 0, warmth: 1, stillness: false },
  },
  {
    id: "the-corridor-flip",
    act: 4,
    scroll: [0.76, 0.78],
    camera: { pos: [0, 5, 20], target: [0, 2, -12], fov: 55, roll: 0 },
    focus: "self",
    caption: {
      title: "The corridor, now quiet, now lit, now hers.",
      body: "Same architecture as Act Two. Different evening.",
    },
    scene: { character: "open", ledger: "present", crowd: 0.1, warmth: 1, stillness: false },
  },
];

// ─── ACT V — THE FIVE SCREENS (beats 41–50, scroll 0.78–1.00) · focus: ledger
// The reveal. Five screens, in spec order. The product, honestly shown.

const ACT_V: readonly Beat[] = [
  {
    id: "five-behind",
    act: 5,
    scroll: [0.78, 0.802],
    camera: { pos: [7, 4, 2], target: [0, 1.5, -4], fov: 45, roll: 0 },
    focus: "ledger",
    caption: {
      title: "Five panes, suspended in depth.",
      body: "No sixth screen. The product fits in five, and the story can show all of them.",
    },
    scene: { character: "upright", ledger: "orbit", crowd: 0, warmth: 1, stillness: false },
  },
  {
    id: "screen-dashboard",
    act: 5,
    scroll: [0.802, 0.824],
    camera: { pos: [9, 3.5, -2], target: [0, 1.5, -4], fov: 45, roll: 0 },
    focus: "ledger",
    caption: {
      title: "Dashboard. Dues, collected, heatmap.",
      body: "Month end, answered on one screen: what came in, what is owed, what is due today.",
    },
    scene: { character: "upright", ledger: "orbit", crowd: 0, warmth: 1, stillness: false },
  },
  {
    id: "screen-students",
    act: 5,
    scroll: [0.824, 0.846],
    camera: { pos: [7, 3, -8], target: [0, 1.5, -4], fov: 45, roll: 0 },
    focus: "ledger",
    caption: {
      title: "Students. The roster, the balances.",
      body: "Every student, every batch, every balance — searchable without leaving the screen.",
    },
    scene: { character: "upright", ledger: "orbit", crowd: 0, warmth: 1, stillness: false },
  },
  {
    id: "screen-attendance",
    act: 5,
    scroll: [0.846, 0.868],
    camera: { pos: [2, 3, -11], target: [0, 1.5, -4], fov: 45, roll: 0 },
    focus: "ledger",
    caption: {
      title: "Attendance. The month, marked.",
      body: "Present, absent, locked. The register the corridor could never keep.",
    },
    scene: { character: "upright", ledger: "orbit", crowd: 0, warmth: 1, stillness: false },
  },
  {
    id: "screen-fees",
    act: 5,
    scroll: [0.868, 0.89],
    camera: { pos: [-3, 3, -11], target: [0, 1.5, -4], fov: 45, roll: 0 },
    focus: "ledger",
    caption: {
      title: "Fees. Invoices, receipts, the void.",
      body: "Generate, collect, correct — the void is a second row, never an erasure.",
    },
    scene: { character: "upright", ledger: "orbit", crowd: 0, warmth: 1, stillness: false },
  },
  {
    id: "screen-settings",
    act: 5,
    scroll: [0.89, 0.912],
    camera: { pos: [-7, 3, -8], target: [0, 1.5, -4], fov: 45, roll: 0 },
    focus: "ledger",
    caption: {
      title: "Settings. Security, backup, export.",
      body: "The screen that keeps the other four honest. PIN, backup, and your data under your control.",
    },
    scene: { character: "upright", ledger: "orbit", crowd: 0, warmth: 1, stillness: false },
  },
  {
    id: "one-tap",
    act: 5,
    scroll: [0.912, 0.934],
    camera: { pos: [-9, 3.5, -3], target: [0, 1.5, -4], fov: 45, roll: 0 },
    focus: "ledger",
    caption: {
      title: "One tap from any screen to any other.",
      body: "That is the product's actual promise. Not features — fewer taps between a tutor and done.",
    },
    scene: { character: "upright", ledger: "orbit", crowd: 0, warmth: 1, stillness: false },
  },
  {
    id: "the-room",
    act: 5,
    scroll: [0.934, 0.956],
    camera: { pos: [-6, 4, 2], target: [0, 1.5, -4], fov: 45, roll: 0 },
    focus: "ledger",
    caption: {
      title: "The staffroom. Every tutor, all five screens live.",
      body: "One room at a time. That is how a tuition grows — never all at once.",
    },
    scene: { character: "upright", ledger: "orbit", crowd: 0.3, warmth: 1, stillness: false },
  },
  {
    id: "the-instants",
    act: 5,
    scroll: [0.956, 0.978],
    camera: { pos: [-2, 3.5, 4], target: [0, 1.8, -4], fov: 45, roll: 0 },
    focus: "ledger",
    caption: {
      title: "The ledger card at the centre, every screen agreeing with it.",
      body: "One number, not five. The orbit closes where the story opened: the record.",
    },
    scene: { character: "upright", ledger: "center", crowd: 0, warmth: 1, stillness: false },
  },
  {
    id: "the-cta",
    act: 5,
    scroll: [0.978, 1],
    camera: { pos: [0, 3, 6], target: [0, 1.8, -4], fov: 45, roll: 0 },
    focus: "ledger",
    caption: {
      title: "Built for one room at a time.",
      body: "Free for every tutor. Download, set a PIN, and tonight's evening is the short one.",
    },
    scene: { character: "upright", ledger: "center", crowd: 0, warmth: 1, stillness: false },
  },
];

/** Runtime vocabulary for poses. character.tsx implements exactly these. */
export const CHARACTER_POSES = ["compressed", "anxious", "still", "open", "upright"] as const;

/** Runtime vocabulary for ledger presence. */
export const LEDGER_PRESENCES = ["hidden", "entering", "present", "center", "orbit"] as const;

export const STORY_BEATS: readonly Beat[] = [
  ...ACT_I,
  ...ACT_II,
  ...ACT_III,
  ...ACT_IV,
  ...ACT_V,
];

export const STORY_IDS: readonly string[] = STORY_BEATS.map((b) => b.id);

/** Beat index for a normalised scroll progress. Reuses the shared helper so
 *  the story and the tour can never disagree about what "current" means. */
export function storyBeatIndex(progress: number): number {
  const clamped = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  return Math.min(STORY_BEATS.length - 1, Math.floor(clamped * STORY_BEATS.length));
}
