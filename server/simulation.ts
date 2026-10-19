// Fake committees and donations, for trying the board without Zettle. Used by the
// demo server (bun run demo) and by /demo on the real server, which shows the board
// on simulated activity so it can be checked on the actual screens.

import { purchaserKey } from "./poller.ts";
import { servePage } from "./server.ts";
import { createStore, type Row } from "./store.ts";

export const COMMITTEES = [
    "Cafémästeriet", "Centralprocessorutskottet", "Skattmästeriet", "Framtidsutskottet",
    "Nollningsutskottet", "Aktivitetsutskottet", "Informationsutskottet", "Källarmästeriet",
    "Medaljelelekommiten", "Näringslivsutskottet", "Sexmästeriet", "Studierådet",
    "Tackmästeriet", "Trivselrådet", "Valberedningen", "Styrelsen",
].map((name, i) => ({ uuid: `demo-${i}`, name }));

export const NAMES = [
    "Kalle Anka", "Kajsa Anka", "Musse Pigg", "Mimmi Pigg", "Långben", "Pluto",
    "Joakim von Anka", "Oppfinnar-Jocke", "Alexander Lukas", "Klarabella", "Hexia de Trix",
    "Svarte Petter", "Farmor Anka", "Knatte", "Fnatte", "Tjatte",
];

export const SCENARIOS = {
    // Nothing sold yet: empty states on both boards
    empty: 0,
    // Early in the evening: a few committees on the board, most in Skamvrån
    early: 8,
    // Late in the evening: every board full
    full: 90,
} as const;

export type Scenario = keyof typeof SCENARIOS;

const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]!;

/** An in-memory store on fake data, starting early in the evening */
export function createSimulation() {
    const store = createStore();
    let rows: Row[] = [];
    // Like the poller, every change hands the store a whole new snapshot
    const publish = () => store.replace(COMMITTEES, rows);

    function addRow(committeeName: string, name: string, amountKr: number) {
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

    function addRandomRow() {
        // Skew towards a few popular committees, so the board has a clear leader
        const committee = Math.random() < 0.6 ? pick(COMMITTEES.slice(0, 6)) : pick(COMMITTEES);
        addRow(committee.name, pick(NAMES), pick([15, 15, 15, 30, 45]));
    }

    const sim = {
        store,
        donations: () => rows.length,
        donate(committeeName: string, name: string, amountKr: number) {
            addRow(committeeName, name, amountKr);
            publish();
        },
        randomDonation() {
            addRandomRow();
            publish();
        },
        load(scenario: Scenario) {
            rows = [];
            for (let i = 0; i < SCENARIOS[scenario]; i++) addRandomRow();
            publish();
        },
    };

    sim.load("early");
    // Keep the "Live" indicator green between donations
    setInterval(publish, 5000);
    return sim;
}

export type Simulation = ReturnType<typeof createSimulation>;

/**
 * A random donation every few seconds. Once the board is full it starts over from
 * early in the evening, so it cycles through sparse and full boards.
 */
export function simulateActivity(sim: Simulation, opts = { minS: 3, maxS: 8, resetAt: 150 }) {
    const next = () => {
        if (sim.donations() >= opts.resetAt) sim.load("early");
        else sim.randomDonation();
        setTimeout(next, (opts.minS + Math.random() * (opts.maxS - opts.minS)) * 1000);
    };
    next();
}

/** /demo, /demo/committees and /demo/donors: the board on the simulation's data */
export function demoRoutes(sim: Simulation) {
    return {
        "/demo": servePage,
        "/demo/committees": servePage,
        "/demo/donors": servePage,
        "/demo/api/leaderboard": () => Response.json(sim.store.leaderboard()),
    };
}
