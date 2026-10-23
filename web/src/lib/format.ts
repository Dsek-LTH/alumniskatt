/** 150000 öre → "1 500 kr" */
export const kr = (ore: number) => `${Math.round(ore / 100).toLocaleString("sv-SE")} kr`;

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "2026-10-24T19:43:00.000Z" → "21:43", in the screen's time zone */
export const clock = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

/**
 * Ranks for totals sorted highest first, where equal totals share a rank:
 * [300, 200, 200, 100] → [1, 2, 2, 4]
 */
export function sharedRanks(totals: number[]): number[] {
    const ranks: number[] = [];
    totals.forEach((total, i) => ranks.push(i > 0 && total === totals[i - 1] ? ranks[i - 1]! : i + 1));
    return ranks;
}
