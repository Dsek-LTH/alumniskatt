# Alumniskatt

Live leaderboard for the alumni pub. Alumni add an *alumniskatt* to their order in Zettle,
pick a committee as the product variant and give their name as the row comment. The board
shows which committee has collected the most and who has donated the most.

A Bun server fetches the evening's sales from Zettle every minute, sums them in memory
and serves a React page meant for the Asta screens. Nothing is stored; Zettle is the
source of truth, so a restart just refetches.

## Setup

```bash
bun install
cp .env.example .env   # fill in the Zettle credentials and EVENT_START
```

## Running

| Command | What it does |
|---|---|
| `bun run demo` | Fake data, no Zettle needed. Control panel at http://localhost:5173/dev |
| `bun run dev` | Real Zettle data with hot reload at http://localhost:5173 |
| `bun run build && bun run start` | Production on http://localhost:3000 |
| `docker compose up -d --build` | Production in Docker |
| `bun test` / `bun run typecheck` | Tests and type checks |
| `bun run inspect` | Prints recent Zettle purchases, to check comments and variants |

## Views

- `/` shows both boards, `/committees` and `/donors` show one each.
- `/rotate` switches between the two boards every 20 seconds, for screens too small
  for both. `?interval=30` changes how often.
- `/demo`, `/demo/committees`, `/demo/donors` and `/demo/rotate` show the same views on
  fake data, with a donation every few seconds, for checking how the board looks on the
  real screens. It starts over once the board is full, and the footer says "Demo" instead of "Live".
- Every view is dark in the evening (18–06) and light otherwise. `?theme=dark` or
  `?theme=light` fixes the theme.

Each new donation is shown in a banner across the screen for a few seconds, and the
latest ones scroll by in the *Senaste* band above the footer.

In Asta, add a `WEBSITE` item pointing at e.g. `http://<server>:3000/`.

## Layout

- `server/` – Bun server: Zettle client, poller, in-memory store, API and demo server (`demo.ts`)
- `server/types.ts` – the API types, shared with the web app
- `web/` – the leaderboard page (Vite, React, Motion)
- `web/public/logos/` – committee logos from [Dsek-LTH/grafik](https://github.com/Dsek-LTH/grafik)
