# SDD ledger — plan: docs/superpowers/plans/2026-10-03-prompt-os-single-release.md

Setup: isolated GitHub feature branch `feat/prompt-os-single-release` created from approved docs head based on main `1eb97ccd66342c5b39509bb28dc5b476ed480ded`.
Baseline: main Cloudflare Build Check run #382 succeeded on `1eb97ccd66342c5b39509bb28dc5b476ed480ded`.
Ruling: local clone/worktree unavailable because sandbox DNS blocks github.com; use isolated GitHub branch plus Actions as executable workspace. Cost if wrong: CI feedback is slower than local tests, but no production/main side effect.
Ruling: spec forbids opening Draft PR before milestones finish and workflow otherwise runs only on main/PR; temporarily add feature branch to push trigger, then remove before final Draft PR. Cost if wrong: temporary workflow diff could leak into final PR if cleanup is missed; Task 16 must assert workflow restored.
Pre-flight: Task 1 exampleValues feeds Task 4 Try Example; use prompt.exampleValues as the only executable example source.
Pre-flight: Task 2 Run/Result listPage APIs feed Task 3 UI and Tasks 12–15 control/backup; repository boundary remains authoritative.
Pre-flight: Task 6 Draft/Version repositories feed Tasks 7–10 and Tasks 12–15; immutable Version/mutable Draft ownership is binding.
Pre-flight: Task 9 Compare consumes Run/Result from Milestone A and Draft/Version from Tasks 6–8; normalize artifacts at diff boundary, never mutate source records.
Pre-flight: Tasks 12–15 consume repository records from A/B; analytics/backup must not create a duplicate telemetry source of truth.
