# ClassCall

A lightweight classroom cold-call tool for instructors. Upload your class roster, randomly call on students, grade responses on a 1–5 Likert scale, and let students see their progress on a live leaderboard — all without accounts or a server.

## Features

| Feature | Description |
|---------|-------------|
| **Roster upload** | Drag-and-drop or click-to-upload CSV; accepts `name`, `first`+`last`, or first-column layouts |
| **Random call** | Weighted random selection from the active pool; called students are removed until pool resets |
| **Volunteer mode** | Click any student chip to call them directly |
| **Inline grading** | 1–5 Likert scale (Needs Growth → Excellent) applied per call in instructor mode |
| **Grade panel** | Instructor-only per-student history and running averages |
| **Leaderboard** | Sorted bar chart with named/anonymous toggle; medals for top 3 |
| **Pool modes** | *Session reset* (manual) or *Round-robin* (auto-refills when exhausted) |
| **Privacy-first** | All data stays in your browser's localStorage; no accounts, no cloud |

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Usage

1. **Roster tab** — upload a `.csv` file with your class list.
2. **Call tab** — click **Call random** to select a student. Grade them with the 1–5 buttons (requires Instructor mode).
3. **Leaderboard tab** — share with the class on a projector. Toggle *Anonymous* to hide names.
4. **Settings tab** — choose pool mode, reset the pool, or clear data.

### Instructor mode

Click the **🔒 Student** button in the top-right corner to enter instructor mode (🔓 Instructor). This reveals:
- The **Grade** tab
- Inline Likert grading buttons in the Call tab

Instructor mode resets on every page refresh by design (see `DECISIONS.md` D-004).

## CSV format

Any of the following column layouts are recognised automatically:

```
name
Jane Smith

first,last
Jane,Smith

# First column used as name if no recognised header is found
Jane Smith,Grade 10,Section B
```

## Data model

All state is stored in `localStorage`:

| Key | Contents |
|-----|----------|
| `jscc_roster` | Array of `{id, name}` student objects |
| `cc_grades` | Map of `studentId → number[]` |
| `cc_pool` | Array of student IDs currently in the call pool |
| `cc_called` | Array of student IDs called this session |
| `cc_history` | Array of `{studentId, name, grade, ts}` call records |
| `cc_settings` | `{poolMode, lbMode}` preferences |

## Project layout

```
classcall/
├── index.html
├── package.json
├── vite.config.js
├── DECISIONS.md
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── hooks/
    │   └── useClassCall.js
    ├── utils/
    │   ├── csvParser.js
    │   └── scoring.js
    └── components/
        ├── RosterManager.jsx
        ├── CallPanel.jsx
        ├── GradePanel.jsx
        ├── Leaderboard.jsx
        └── SettingsPanel.jsx
```

## Architecture decisions

See [DECISIONS.md](./DECISIONS.md) for the rationale behind key design choices (localStorage-only, CSV-only roster, Likert scale, instructor-mode privacy).

## License

MIT
