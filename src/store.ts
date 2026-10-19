// The latest snapshot from Zettle, kept in memory. Zettle is the source of truth:
// the poller refetches the whole event window every minute and replaces everything here.

import { logoFor } from "./logos.ts";
import type { Committee, Donor, Leaderboard } from "./types.ts";

export type { Leaderboard };

/** One alumniskatt row from a purchase */
export type Row = {
    timestamp: string;
    variantUuid: string;
    variantName: string;
    purchaserRaw: string;
    purchaserKey: string;
    amount: number; // öre
};

export type CommitteeVariant = { uuid: string; name: string };

const TOP_DONORS = 10;

/** Sums the rows per committee and per donor. Every row is one donation. */
export function computeLeaderboard(
    variants: CommitteeVariant[],
    rows: Row[],
): Omit<Leaderboard, "updatedAt" | "lastError"> {
    // Every committee is listed, even at 0 kr, so empty ones get shamed too. Rows for a
    // variant that has since been removed from the product still count, under their own name.
    const committees = new Map<string, { name: string; position: number; total: number; donations: number }>();
    variants.forEach((v, position) => committees.set(v.uuid, { name: v.name, position, total: 0, donations: 0 }));

    const donors = new Map<
        string,
        { name: string; lastSeen: string; total: number; donations: number; byCommittee: Map<string, { name: string; total: number }> }
    >();

    for (const row of rows) {
        let committee = committees.get(row.variantUuid);
        if (!committee) {
            committee = { name: row.variantName, position: Infinity, total: 0, donations: 0 };
            committees.set(row.variantUuid, committee);
        }
        committee.total += row.amount;
        committee.donations++;

        if (!row.purchaserKey) continue;
        let donor = donors.get(row.purchaserKey);
        if (!donor) {
            donor = { name: row.purchaserRaw, lastSeen: row.timestamp, total: 0, donations: 0, byCommittee: new Map() };
            donors.set(row.purchaserKey, donor);
        }
        // Show the most recently typed spelling of the name
        if (row.timestamp >= donor.lastSeen) {
            donor.name = row.purchaserRaw;
            donor.lastSeen = row.timestamp;
        }
        donor.total += row.amount;
        donor.donations++;
        const given = donor.byCommittee.get(row.variantUuid) ?? { name: committee.name, total: 0 };
        given.total += row.amount;
        donor.byCommittee.set(row.variantUuid, given);
    }

    const committeeList: Committee[] = [...committees.values()]
        .sort((a, b) => b.total - a.total || a.position - b.position)
        .map(({ name, total, donations }) => ({ name, logo: logoFor(name), total, donations }));

    const donorList: Donor[] = [...donors.values()]
        .sort((a, b) => b.total - a.total)
        .slice(0, TOP_DONORS)
        .map(({ name, lastSeen, total, donations, byCommittee }) => {
            const favourite = [...byCommittee.values()].reduce((best, c) => (c.total > best.total ? c : best));
            return { name, lastSeen, total, donations, favourite: favourite.name, favouriteLogo: logoFor(favourite.name) };
        });

    return {
        total: rows.reduce((sum, r) => sum + r.amount, 0),
        donations: rows.length,
        committees: committeeList,
        donors: donorList,
    };
}

export function createStore() {
    let variants: CommitteeVariant[] = [];
    let rows: Row[] = [];
    let updatedAt: string | null = null;
    let lastError: string | null = null;

    return {
        /** A fresh snapshot from Zettle replaces everything */
        replace(nextVariants: CommitteeVariant[], nextRows: Row[]) {
            variants = nextVariants;
            rows = nextRows;
            this.markSuccess();
        },

        markSuccess() {
            updatedAt = new Date().toISOString();
            lastError = null;
        },

        markError(message: string) {
            lastError = message;
        },

        // Used by the demo server, which builds its data a row at a time
        setCommittees(next: CommitteeVariant[]) {
            variants = next;
        },
        addRow(row: Row) {
            rows.push(row);
        },
        clearRows() {
            rows = [];
        },

        leaderboard(): Leaderboard {
            return { updatedAt, lastError, ...computeLeaderboard(variants, rows) };
        },
    };
}

export type Store = ReturnType<typeof createStore>;
