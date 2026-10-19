// Demo API: the real leaderboard API on fake, in-memory data, plus the endpoints the
// control panel at /dev uses to add donations and load scenarios. No Zettle needed.
// /demo runs on a separate simulation that adds donations by itself, like on the real server.
//
//   bun run demo    → open http://localhost:5173/dev or http://localhost:5173/demo

import { logoFor } from "./logos.ts";
import { servePage, startServer } from "./server.ts";
import { COMMITTEES, createSimulation, demoRoutes, NAMES, SCENARIOS, simulateActivity, type Scenario } from "./simulation.ts";
import { bySwedishName } from "./store.ts";

// Driven by the control panel
const sim = createSimulation();
// Adds donations by itself, for /demo
const auto = createSimulation();
simulateActivity(auto);

const port = Number(process.env.PORT || 3001);

const server = startServer(sim.store, {
    port,
    pollIntervalS: 60,
    extraRoutes: {
        ...demoRoutes(auto),
        "/dev": servePage,
        "/dev/api/options": () =>
            Response.json({
                committees: COMMITTEES.toSorted(bySwedishName).map((c) => ({ name: c.name, logo: logoFor(c.name) })),
                names: NAMES,
            }),
        "/dev/api/donate": {
            POST: async (req) => {
                const body = (await req.json()) as { committee?: string; name?: string; amount?: number };
                if (!body.committee) {
                    sim.randomDonation();
                } else {
                    sim.donate(body.committee, body.name ?? "", Number(body.amount ?? 15));
                }
                return Response.json({ ok: true });
            },
        },
        "/dev/api/scenario": {
            POST: async (req) => {
                const { scenario } = (await req.json()) as { scenario: Scenario };
                if (!Object.hasOwn(SCENARIOS, scenario)) return Response.json({ error: "Unknown scenario" }, { status: 400 });
                sim.load(scenario);
                return Response.json({ ok: true });
            },
        },
    },
});

console.log(`alumniskatt demo API on ${server.url}`);
