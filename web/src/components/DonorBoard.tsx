import { AnimatePresence } from "motion/react";
import type { Donor } from "../../../server/types.ts";
import { sharedRanks } from "../lib/format.ts";
import { EmptyHero, GhostRow } from "./empty.tsx";
import { HeroCard } from "./HeroCard.tsx";
import { DonorRow } from "./rows.tsx";
import { FavouriteLine, Monogram } from "./ui.tsx";

// The server sends the top 10 donors; the leader gets the hero card
const LAST_RANK = 10;

export function DonorBoard({ donors }: { donors: Donor[] }) {
    const [top, ...rest] = donors;
    const ranks = sharedRanks(donors.map((d) => d.total));

    return (
        <section className="board donors-board">
            <h2>Kvällens generösaste</h2>

            {top ? (
                <HeroCard
                    name={top.name}
                    total={top.total}
                    media={<Monogram name={top.name} />}
                    sub={<FavouriteLine donor={top} />}
                    tiedWith={rest.filter((d) => d.total === top.total).map((d) => d.name)}
                />
            ) : (
                <EmptyHero title="Din plats?" sub="Köp en alumniskatt och hamna här" />
            )}

            <ol>
                {/* popLayout: a leaving row stops taking up space at once, so the list
                    never grows taller for a moment and the page doesn't shrink to fit */}
                <AnimatePresence initial={false} mode="popLayout">
                    {rest.map((d, i) => (
                        <DonorRow key={d.name.toLowerCase()} donor={d} rank={ranks[i + 1]!} />
                    ))}
                </AnimatePresence>
                {/* Ranks nobody holds yet, so the table keeps its shape */}
                {Array.from({ length: Math.max(0, LAST_RANK - 1 - rest.length) }, (_, i) => (
                    <GhostRow key={`ghost-${i}`} rank={rest.length + i + 2} />
                ))}
            </ol>
        </section>
    );
}
