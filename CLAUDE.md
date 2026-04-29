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

### Where the list lives
`lib/badge-list.ts` → `VALID_BADGE_SET` (a `Set<string>`). To update the list, replace the contents of that set. **The rules below apply automatically — no other code needs to change.**

### Sorting rules (applied automatically from the badge number alone)

**Rule 1 — First digit → station visit order (wave assignment)**

| First digit | PGR wave | TTT wave | Launch wave |
|---|---|---|---|
| 1 | 1 | 2 | 3 |
| 2 | 2 | 3 | 1 |
| 3 | 3 | 1 | 2 |
| 4 | 1 | 3 | 2 |
| 5 | 3 | 2 | 1 |
| 6 | 2 | 1 | 3 |

Used for: wave-mismatch warnings at PGR and Launch; pre-computing TTT and Launch team rosters.

**Rule 2 — Second (middle) digit → initial Launch team assignment**
- `1` = Red · `2` = Orange · `3` = Green · `4` = Blue · `5` = Purple
- These are *defaults* — most likely to change due to no-shows. Host adjusts in the badge modal day-of.
- Team cards show "N expected" (dashed border) when not yet confirmed; confirmed shows solid with count.

Used for: pre-populating each Launch team's badge modal when no confirmed data exists yet.

**Rule 3 — Last digit → TTT team (odd/even)**
- Odd last digit → **Team X**
- Even last digit → **Team O**

Used for: auto-populating TTT SubmitTab team columns. Host only needs to tap ⇄ if someone switches day-of.

### Validation behaviour (all stations)
- Unknown badge code → ⚠ warning (red border), saving never blocked
- Badge used more than once at the same station → ⚠ warning (amber border)
- Badge at wrong wave for that station → ⚠ warning
- Manually overridden TTT team assignment → ↕ indicator on chip

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

- Google Sheets: wired for PGR but settings gear removed from UI; may need to revisit
- Folder restructuring — mentioned but not urgent
