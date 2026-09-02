# Development Decisions Record

Living log of architecture, feature, and process decisions for AMP
Operations, per the requirement in [README.md](./README.md). Add an entry
whenever a decision is made, an alternative is rejected, a test fails, a
security issue is found, or a question needs Dominic's input. Keep entries
dated and in chronological order; do not delete superseded entries, mark
them superseded instead.

## 2026-09-02 — Project paused, requirements recorded

- **Decision:** No application code, architecture, or infrastructure is
  being built yet. This session only recorded the project requirements
  (`README.md`) and started this decisions log, per the explicit
  instruction that development stays paused until Dominic asks for it.
- **Repo audit:** At the time of writing, the `drunkeneyeuk/amp` repository
  contained a single file, `Fire alarm battery calculator.zip` (a static
  HTML/PWA tool: `deploy/index.html`, manifest, icons, README). It is a
  standalone calculator, not one of the four existing projects named in
  the brief (AMP Team calendar, digital fire-alarm logbook, engineer
  field-reporting app, certificate projects). None of those four were
  found in this repository — they likely live elsewhere (another repo, or
  outside GitHub). **Open question for Dominic:** where do the AMP Team
  calendar, digital fire-alarm logbook, engineer field-reporting app, and
  certificate projects currently live, so they can be reviewed for reuse
  before Stage 1 audit work begins?
- **No stack/architecture chosen yet.** Framework, hosting, database,
  mobile approach (native vs. cross-platform), offline-sync strategy, and
  AI provider are all undecided — these are Stage 1+ decisions and will be
  recorded here once development is authorised.

## Open questions

- Location/ownership of the four existing projects referenced in the
  brief (calendar, logbook, field-reporting app, certificate projects).
- Availability and format of Simpro data exports (needed for Stage 9).
- Target mobile approach (native iOS/Android vs. cross-platform framework)
  — deferred until Stage 3.
- Accounting platform AMP currently uses, for the eventual invoicing
  export/integration (Stage 6).
