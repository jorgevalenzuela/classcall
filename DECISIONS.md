# ClassCall — Architecture Decision Records

## D-001 · localStorage-only persistence

**Status:** Accepted
**Date:** 2026-04-16

**Context:** ClassCall is a single-page app with no server component. Student data (names, grades) is sensitive; teachers should not need to create accounts or trust a third-party cloud service.

**Decision:** All state is persisted exclusively in `localStorage` under namespaced keys (`jscc_roster`, `cc_grades`, `cc_pool`, `cc_called`, `cc_history`, `cc_settings`). No backend, no authentication.

**Consequences:** Data is device-local and browser-local. Teachers must re-upload the roster when switching devices. Export / backup features can be added in a later iteration.

---

## D-002 · CSV roster upload (no manual entry UI)

**Status:** Accepted
**Date:** 2026-04-16

**Context:** Teachers already maintain class rosters in spreadsheet tools that export CSV. Building a full CRUD name-entry form would duplicate that workflow.

**Decision:** Roster is loaded exclusively via CSV file upload (click or drag-and-drop). The parser accepts `name`, `first`+`last`, or first-column-fallback heuristics so most grade-book exports work without reformatting.

**Consequences:** No in-app editing of individual names. Teachers who need to add/remove one student must re-upload the full CSV. Acceptable trade-off for v1.

---

## D-003 · Likert 1–5 grading scale

**Status:** Accepted
**Date:** 2026-04-16

**Context:** ClassCall targets quick, formative cold-call assessment during a live class session. A numeric rubric must be fast to apply and universally understood.

**Decision:** Grades are integers 1–5 with labels: 1 = Needs Growth, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent. Leaderboard scores are expressed as `avg / 5 × 100` (percentage).

**Consequences:** Granular rubrics (e.g., 0–100 or multi-dimension) are out of scope for v1. The percentage formula makes the leaderboard intuitive regardless of how many grades a student has.

---

## D-004 · instructorMode in component state only (not persisted)

**Status:** Accepted
**Date:** 2026-04-16

**Context:** When a teacher projects ClassCall onto a classroom screen, students can see the app. Persisting `instructorMode=true` across page refreshes would expose the Grade tab by default on a shared or student-facing display.

**Decision:** `instructorMode` is held in `App` component state and resets to `false` on every page load. The Grade tab (and inline Likert buttons in CallPanel) are only visible while `instructorMode` is active.

**Consequences:** Teachers must re-enable instructor mode after each refresh. This is an intentional privacy default. A PIN-protected persistent mode can be explored in a future iteration.
