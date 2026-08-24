import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: [
    ".agent/**",
    ".agents/**",
    ".claude/**",
    ".codex/**",
    ".continue/**",
    ".cursor/**",
    ".gemini/**",
    ".opencode/**",
    ".pi/**",
    ".roo/**",
    ".windsurf/**",
    "tools/oxlint/anti-slop/**",
    "node_modules/**",
    "dist/**",
    "build/**",
    "docs/.vitepress/cache/**",
    "docs/docs/.vitepress/cache/**",
    "docs/branding/canvasui/**",
  ],
  jsPlugins: [
    { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
  ],
  rules: {
    // `as unknown as T` is the sanctioned escape when evidence was lost through untyped transit (JSON.parse) — downgraded to warn for this codebase.
    "anti-slop/no-chained-type-assertions": "warn",
    // Style-level (satisfies vs explicit annotation) — downgraded to warn.
    "anti-slop/no-known-value-widening": "warn",
    "anti-slop/no-module-mocking": "error",
    "anti-slop/no-object-parameters": "error",
    "anti-slop/no-reflect-apply": "error",
    "anti-slop/no-reflect-get": "error",
    // Boundary validators (config/licensing/listing parsers) narrow
    // Record<string, unknown> fields with typeof — that IS the parse at
    // the I/O boundary. Downgraded to warn: the rule cannot distinguish
    // boundary parsing from mid-domain narrowing in this architecture.
    "anti-slop/no-runtime-typeof": "warn",
    // Same rationale: boundary records are typed Record<string, unknown>
    // by design; values are guarded field-by-field before use.
    "anti-slop/no-unsafe-dictionary-type": "warn",
    // The codebase's established conditional-field pattern (spread with
    // empty object) is used pervasively in serializers; flagged only.
    "anti-slop/no-conditional-empty-object-spread": "warn",
    "anti-slop/no-shape-in-symbol-names": "error",
    // boundary parsers accept unknown by definition; fields are guarded one-by-one — downgraded to warn for this codebase.
    "anti-slop/no-unknown-parameters": "warn",
    // boundary parse results start as unknown and are narrowed before return — downgraded to warn for this codebase.
    "anti-slop/no-unknown-returns": "warn",
    "anti-slop/no-unknown-type-aliases": "error",
    "anti-slop/no-widen-then-assert": "error",
    "anti-slop/require-safety-comment-for-type-assertion": "error",
  },
});