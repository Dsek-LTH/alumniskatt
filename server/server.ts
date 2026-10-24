import { leaderboardEvents } from "./events.ts";
import type { Store } from "./store.ts";

type Routes = Parameters<typeof Bun.serve>[0]["routes"];

// Built by `bun run build` (Vite). During development Vite serves the app itself.
const DIST = "web/dist";

/** Serves the built web app for a client-side route, e.g. /committees. */
export async function servePage(): Promise<Response> {
    const index = Bun.file(`${DIST}/index.html`);
    if (!(await index.exists())) {
        return new Response("The web app is not built. Run `bun run build`, or use `bun run dev`.", { status: 503 });
    }
    return new Response(index);
}

/** The leaderboard API and the built web app. The demo server passes extra routes for its control panel. */
export function startServer(store: Store, opts: { port: number; pollIntervalS: number; extraRoutes?: Routes }) {
    return Bun.serve({
        port: opts.port,
        routes: {
            // One page, three views: the app picks its mode from the path
            "/": servePage,
            "/committees": servePage,
            "/donors": servePage,
            // Switches between the two boards, for screens too small for both
            "/rotate": servePage,
            "/api/leaderboard": () => Response.json(store.leaderboard()),
            "/api/events": () => leaderboardEvents(store),
            "/health": () => {
                const { updatedAt, lastError } = store.leaderboard();
                const ageS = updatedAt ? (Date.now() - Date.parse(updatedAt)) / 1000 : Infinity;
                const healthy = ageS < opts.pollIntervalS * 3;
                return Response.json({ healthy, updatedAt, lastError }, { status: healthy ? 200 : 503 });
            },
            ...opts.extraRoutes,
        },
        fetch: staticFile,
    });
}

// Bundles and logos from the build. Only paths with a file extension
// and without "..", so nothing outside web/dist can be requested.
async function staticFile(req: Request): Promise<Response> {
    const path = decodeURIComponent(new URL(req.url).pathname);
    if (!path.includes("..") && /\.[a-z0-9]+$/i.test(path)) {
        const file = Bun.file(`${DIST}${path}`);
        if (await file.exists()) return new Response(file);
    }
    return new Response("Not found", { status: 404 });
}
