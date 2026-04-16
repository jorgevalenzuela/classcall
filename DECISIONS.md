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

---

## D-007 · JWT for sessions, not cookies

**Status:** Accepted
**Date:** 2026-04-16

**Context:** Students access ClassCall from mobile devices and potentially cross-origin deployments. Cookie-based sessions require SameSite configuration and CSRF protection that adds friction.

**Decision:** JWT bearer tokens, signed with `HS256`. Tokens are stored in `sessionStorage` (student side) so they are cleared on tab close. Instructor tokens are not persisted.

**AI suggested?** AI-suggested, human approved

**Consequences:** Stateless auth — no server-side session store needed. Requires a token refresh strategy for long class sessions in a future iteration.

---

## D-008 · 6-digit code, 3-minute expiry

**Status:** Accepted
**Date:** 2026-04-16

**Context:** Students log in during a live class session on school-issued or personal devices. Login must be fast; school email is the identity anchor.

**Decision:** 6-digit numeric code, 3-minute TTL, single-use flag. Codes are stored by `email_hash` only — the plain-text email is never persisted server-side.

**AI suggested?** Human-decided

**Consequences:** Secure enough for a classroom context. Students who miss the window must request a new code. Brute-force risk is low given the short window and single-use constraint.

---

## D-009 · Attendance window server-enforced

**Status:** Accepted
**Date:** 2026-04-16

**Context:** Client-side time checks can be spoofed. Late check-ins undermine attendance integrity.

**Decision:** The server compares `NOW()` against `session.opened_at + attend_window_minutes`. The client has no role in this decision.

**AI suggested?** AI-suggested, human approved

**Consequences:** Fair and tamper-proof. Requires accurate server clock (NTP). Instructor can still override attendance manually via `PATCH /api/attendance/:sessionId`.

---

## D-010 · Single React app, role-based views

**Status:** Accepted
**Date:** 2026-04-16

**Context:** Maintaining two separate frontend bundles doubles the build/deploy surface and requires separate routing.

**Decision:** One Vite app. `InstructorApp` and `StudentApp` are rendered based on the JWT `role` claim (or absence of a token). The split lives in `src/views/`.

**AI suggested?** AI-suggested, human approved

**Consequences:** Smaller deployment footprint. Role logic must be airtight — a compromised or forged token could expose the wrong view. Mitigated by server-side enforcement on every API call.

---

## D-011 · FERPA pseudonymization

**Status:** Accepted
**Date:** 2026-04-16

**Context:** Storing first name + last name + email + class association in a database constitutes an education record under FERPA. Public-facing views (leaderboard) must not expose PII.

**Decision:** Email stored as SHA-256 hash (lookup key) + AES-256-CBC ciphertext (recovery). Leaderboard and progress endpoints expose only `display_alias` and `display_avatar`. The `ferpaStrip` middleware removes `email_encrypted`, `email_hash`, `first_name`, and `last_name` from student-facing responses.

**AI suggested?** Human-identified, AI designed solution

**Consequences:** Instructor sees real names in private views. Students see only aliases on shared screens. Decryption requires the `EMAIL_ENCRYPTION_KEY` environment variable — loss of the key means email recovery is impossible.

---

## D-012 · Continuous 0.0–5.0 grade scale

**Status:** Accepted
**Date:** 2026-04-16

**Context:** Integer Likert levels (1–5) felt too coarse for instructors grading nuanced responses. A "3.7" is meaningfully different from a "3.0".

**Decision:** Grades are `NUMERIC(3,1)` in PostgreSQL, 0.0–5.0 with step 0.1. The UI is a Radix UI slider. Ties are explicitly allowed — no uniqueness check on score. Leaderboard rank uses standard competition ranking (1, 2, 2, 4).

**AI suggested?** Human-decided

**Consequences:** More nuanced grading. Leaderboard rank calculation must handle ties explicitly (same score → same rank, next rank skips). Legacy localStorage grades (integers 1–5) remain compatible since they fall within the new range.
