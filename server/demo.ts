// Demo API: the real leaderboard API on fake, in-memory data, plus the endpoints the
// control panel at /dev uses to add donations and load scenarios. No Zettle needed.
//
//   bun run demo    → open http://localhost:5173/dev (Vite proxies the API to this server)

import { logoFor } from "./logos.ts";
import { purchaserKey } from "./poller.ts";
import { servePage, startServer } from "./server.ts";
import { bySwedishName, createStore, type Row } from "./store.ts";

const COMMITTEES = [
    "Cafémästeriet", "Centralprocessorutskottet", "Skattmästeriet", "Framtidsutskottet",
    "Nollningsutskottet", "Aktivitetsutskottet", "Informationsutskottet", "Källarmästeriet",
    "Medaljelelekommiten", "Näringslivsutskottet", "Sexmästeriet", "Studierådet",
    "Tackmästeriet", "Trivselrådet", "Valberedningen", "Styrelsen",
].map((name, i) => ({ uuid: `dev-${i}`, name }));

const NAMES = [
    "Kalle Anka", "Kajsa Anka", "Musse Pigg", "Mimmi Pigg", "Långben", "Pluto",
    "Joakim von Anka", "Oppfinnar-Jocke", "Alexander Lukas", "Klarabella", "Hexia de Trix",
    "Svarte Petter", "Farmor Anka", "Knatte", "Fnatte", "Tjatte",
];

const SCENARIOS = {
    // Nothing sold yet: empty states on both boards
    empty: 0,
    // Early in the evening: a few committees on the board, most in Skamvrån
    early: 8,
    // Late in the evening: every board full
    full: 90,
} as const;

type Scenario = keyof typeof SCENARIOS;

const store = createStore();
let rows: Row[] = [];
// Like the poller, every change hands the store a whole new snapshot
const publish = () => store.replace(COMMITTEES, rows);

const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]!;

function donate(committeeName: string, name: string, amountKr: number) {
    const committee = COMMITTEES.find((c) => c.name === committeeName);
    if (!committee) throw new Error(`Unknown committee ${committeeName}`);
    rows.push({
        timestamp: new Date().toISOString(),
        variantUuid: committee.uuid,
        variantName: committee.name,
        purchaserRaw: name.trim(),
        purchaserKey: purchaserKey(name),
        amount: Math.round(amountKr * 100),
    });
}

function randomDonation() {
    // Skew towards a few popular committees, so the scenarios have a clear leader
    const committee = Math.random() < 0.6 ? pick(COMMITTEES.slice(0, 6)) : pick(COMMITTEES);
    donate(committee.name, pick(NAMES), pick([15, 15, 15, 30, 45]));
}

function load(scenario: Scenario) {
    rows = [];
    for (let i = 0; i < SCENARIOS[scenario]; i++) randomDonation();
}

load("early");
publish();

// Keep the "Live" indicator green while the demo is running
setInterval(publish, 5000);

const port = Number(process.env.PORT || 3001);

const server = startServer(store, {
    port,
    pollIntervalS: 60,
    extraRoutes: {
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
                    randomDonation();
                } else {
                    donate(body.committee, body.name ?? "", Number(body.amount ?? 15));
                }
                publish();
                return Response.json({ ok: true });
            },
        },
        "/dev/api/scenario": {
            POST: async (req) => {
                const { scenario } = (await req.json()) as { scenario: Scenario };
                if (!Object.hasOwn(SCENARIOS, scenario)) return Response.json({ error: "Unknown scenario" }, { status: 400 });
                load(scenario);
                publish();
                return Response.json({ ok: true });
            },
        },
    },
});

console.log(`alumniskatt demo API on ${server.url}`);
