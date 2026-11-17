# PR #7 credential-guard review

## Exact findings and comparison

The failed CI run is [44094602089](https://github.com/Manjayy-645/neon-cipher/actions/runs/44094602089/job/134078286622).
All three annotations concern `apps/web/src/lib/supabase/server.ts` on the original
PR head `a3acbf0ec4568a30cad3bdd963846f585fe045aa`:

| Original line | Reference | Assessment |
| --- | --- | --- |
| [5](https://github.com/Manjayy-645/neon-cipher/blob/a3acbf0ec4568a30cad3bdd963846f585fe045aa/apps/web/src/lib/supabase/server.ts#L5) | Reads the privileged environment variable | Valid boundary finding: the helper lacked an enforced server-only import boundary. No literal secret value is present. |
| [8](https://github.com/Manjayy-645/neon-cipher/blob/a3acbf0ec4568a30cad3bdd963846f585fe045aa/apps/web/src/lib/supabase/server.ts#L8) | `service_role` in a documentation comment | Textual match, not credential exposure. It is in the same incorrectly classified helper. |
| [19](https://github.com/Manjayy-645/neon-cipher/blob/a3acbf0ec4568a30cad3bdd963846f585fe045aa/apps/web/src/lib/supabase/server.ts#L19) | Privileged variable name in an error message | Textual match, not an embedded credential. The message contains the variable name, not its value. |

The [base file](https://github.com/Manjayy-645/neon-cipher/blob/3264f00e97fc8377705d3718c14f73b0e3a89bbc/apps/web/src/lib/supabase/server.ts)
and PR file are byte-identical: Git blob `8411588917231c09e9ed56baba37e15cabbded60`.
Replaying the **unchanged workflow step** against both trees returns exactly the
same three paths/lines and exit status 1. All three predate the UX change.

The repository import search found no callers of this admin helper in browser or
application code. This review found a missing protection, not evidence that a
service key was shipped to a browser. Public/anonymous browser-client configuration
is separate and unchanged.

## Correction

- Privileged implementation now lives in `lib/supabase/admin.server.ts`, using the
  `.server.ts` convention already recognized by the credential guard.
- Both that implementation and the compatibility entry point `lib/supabase/server.ts`
  import Next.js's `server-only` poison pill. Existing import paths remain valid for
  server callers; client imports fail compilation, including transitive imports.
- The admin factory requires its privileged key. It no longer silently uses the
  public anonymous key when the privileged key is missing. Environment validation
  happens at factory invocation; auth persistence and refresh remain disabled.
- Four server-context unit tests cover the existing import path, correct SDK key,
  missing privileged key despite a public key being present, and missing URL.
  Fixture keys are fake and the SDK is mocked; no privileged hosted operation runs.
- The shared jsdom dialog shim now checks that HTMLDialogElement exists so those
  tests can run in Vitest's Node environment without affecting browser tests.

**The credential guard and workflow are unchanged.** No allowlist, exception,
regex relaxation, skip, obfuscated credential reference, or suppressed failure was
added. The two textual matches do not justify weakening the check. The file move
alone would not enforce a boundary; the compiler marker and negative build test do.

Next.js's installed documentation explicitly makes a separate `server-only` package
installation optional: it handles the import and types internally. No package or
lockfile changes were required.

## Verification

- Unmodified credential guard: passes repaired tree.
- Negative canary: an ordinary temporary client-source file reading the privileged
  variable still fails the same guard at its exact source line. Canary removed.
- Unmodified client `generateCode` import guard: passes.
- Negative production build: a temporary Client Component importing both helper
  entry points fails with `'server-only' cannot be imported from a Client Component module`.
  The diagnostic traces both browser and client-SSR imports. Probe removed.
- Positive production build and TypeScript check: pass after removing the probe.
- Focused server-admin and existing modal ownership tests: 8 pass.
- ESLint: still cannot load its configuration because locked typescript-eslint
  rejects locked TypeScript 7.0; this pre-existing toolchain blocker was not changed.
- Full-suite and latest remote CI outcomes are reported with the review delivery;
  the baseline includes two live Supabase connection/DNS failures unrelated to this patch.

No gameplay, scoring, UI tokens, artwork, paper identity, routes, database schema,
authorization policies or production credentials were changed. No merge or manual
deployment was performed. Reverting this follow-up restores the previous helper;
no migration or persisted-data rollback is required.
