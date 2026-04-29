@AGENTS.md

# Next View 2026 — Project Context

Corporate event scoring system. Three stations, each with its own mobile scorekeeper app, all feeding a unified `/results` leaderboard. No auth — security by obscurity.

**Deployed:** GitHub → Vercel auto-deploy. Push to `main` = live.

---

## Station Map

| Station | Route | Description |
|---|---|---|
| Tic Tac Talk | `/host` | Trivia word game. Host controls display + tracks scores |
| Pretty Good Race | `/pgr` | Obstacle-course style scoring, 6 sub-scores per team |
| 3-2-1 Launch | `/launch` | Catapult distance + target shooting, 5 fixed color teams |
| Results | `/results` | Live leaderboard, normalized scores across all stations |

Participant display for TTT: `/display`

---

## Team / Wave Structure

- ~15–25 participants, 3 waves per station, ~5 teams/wave
- Launch: **5 fixed teams** — Red / Orange / Green / Blue / Purple
- TTT: Team X vs Team O per wave
- PGR: individual teams scored separately
- Players identified by **badge numbers** (3-digit codes)

---

## Badge Numbers

55 valid codes defined in `lib/badge-list.ts`.

**First digit encodes station visit order:**
- `1` → PGR → TTT → Launch
- `2` → Launch → PGR → TTT
- `3` → TTT → Launch → PGR
- `4` → PGR → Launch → TTT
- `5` → Launch → TTT → PGR
- `6` → TTT → PGR → Launch

Badge validation is **warnings-only, never blocking**. Invalid/duplicate badges show colored borders + ⚠ text. Cross-station duplicate detection via `GET /api/badges`.

---

## Scoring & Normalization

```
PGR:    score / 24 × 100          (fixed 24-pt max)
TTT:    score / tttMax × 100      (tttMax = highest actual score across waves)
Launch: total / launchMax × 100   (launchMax = highest team total across waves)
```

Launch team total = `round1Feet × 5 + round2Total` (null if either missing).

PGR tiebreaker: Finish Order (lower = better) adds fractional pts.

Each badge gets their team's normalized score. Final leaderboard sums all 3 stations (max 300 pts).

---

## Key Files

```
lib/
  badge-list.ts       — VALID_BADGE_SET, getBadgeStatus, BADGE_INPUT_CLASS, badgeWarnings
  pgr-types.ts        — PGREntry, PGRState types
  pgr-store.ts        — Redis store (key: pgr:state)
  pgr-sheets.ts       — Google Sheets integration (dormant in UI)
  ttt-types.ts        — TTTState, TTTWave types
  ttt-store.ts        — Redis store (key: ttt:state)
  launch-types.ts     — LaunchTeam, TeamColor, launchTeamTotal()
  launch-store.ts     — Redis store (key: launch:state), upsertTeam, mergeBadges

app/
  pgr/page.tsx        — PGR scorekeeper UI
  launch/page.tsx     — Launch scorekeeper UI (TeamRow + BadgeModal)
  host/page.tsx       — TTT host (ControlTab + SetupTab + SubmitTab)
  display/page.tsx    — TTT participant display
  results/page.tsx    — Unified leaderboard

  api/
    badges/route.ts         — GET: all committed badges per station
    pgr/entries/route.ts    — CRUD for PGR entries
    pgr/submit/route.ts     — Push to Google Sheets
    ttt/waves/route.ts      — GET/POST TTT wave data
    launch/entries/route.ts — GET/POST Launch entries + SUBMIT_WAVE
    results/route.ts        — Aggregates + normalizes all station data
    game/route.ts           — TTT display word state
```

---

## Persistence

Upstash Redis with in-memory fallback.
Env vars: `KV_REST_API_URL`, `KV_REST_API_TOKEN`

---

## Pending / Undecided

- "Wave" vs "Heat" — user asked for alternatives, hasn't decided
- Badge first-digit routing — could be used for cross-station validation or auto-wave suggestions, no specific ask yet
- Google Sheets: wired for PGR but settings gear removed from UI; may need to revisit
- Folder restructuring — mentioned but not urgent
