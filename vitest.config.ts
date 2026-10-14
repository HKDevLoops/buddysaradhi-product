import { defineConfig } from "vitest/config";

// Test runner boundary for the STANDALONE product-page repo.
//
// Implements: `AGENTS.md` §7.1 (test pyramid) and §7.4 (CI gates), scoped to this
// app. Two runners coexist here and must not be conflated:
//
//   1. `tests/**`            -> Vitest. Browser/DOM + scene-graph + SSR render
//                               assertions. Needs `vitest` and a DOM environment.
//   2. `src/app/admin/_lib/`
//      `*.test.ts`          -> `node --test`. Plain unit tests over pure admin
//                               logic; deliberately runner-agnostic so they can
//                               execute without Vitest.
//
// WHY THIS FILE HAS TO EXIST. In the monorepo the boundary lived in the ROOT
// `vitest.config.ts`, which excluded those two admin files by absolute path. This
// app is now deployed standalone (`AGENTS.md` Rule 11 — one directory, one
// target), so it no longer inherits the root config. Without an explicit
// include/exclude, Vitest's default glob picks up the `node --test` files and
// fails them: they use `node:test`'s `describe`/`it`, not Vitest's, so the
// suites die with "No test suite found" — a false red that hides real results.
//
// `scripts.test` runs BOTH runners in sequence; `scripts["test:unit"]` runs only
// Vitest, for a fast inner loop.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Defense in depth: even if `include` is widened, never let Vitest claim a
    // `node --test` file. This pair is the exact list the root config excluded.
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "src/app/admin/_lib/access-requests.test.ts",
      "src/app/admin/_lib/engine.test.ts",
    ],
  },
});