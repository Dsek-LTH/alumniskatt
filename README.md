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
- `?theme=` picks a design: `velvet` (default), `noir`, `invite`, `club`, `bauhaus`,
  `utility`, `neobrutal`, `aurora`, `ethereal` or `classic`.

In Asta, add a `WEBSITE` item pointing at e.g. `http://<server>:3000/?theme=velvet`.

## Layout

- `src/` – server: Zettle client, poller, in-memory store, API and demo server
- `web/` – the leaderboard page (Vite, React, Motion)
- `web/public/logos/` – committee logos from [Dsek-LTH/grafik](https://github.com/Dsek-LTH/grafik)
