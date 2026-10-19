import { AnimatePresence } from "motion/react";
import type { Donor } from "../../../server/types.ts";
import { HeroCard } from "./HeroCard.tsx";
import { DonorRow } from "./rows.tsx";
import { FavouriteLine, Monogram } from "./ui.tsx";

export function DonorBoard({ donors }: { donors: Donor[] }) {
    const [top, ...rest] = donors;

    return (
        <section className="board donors-board">
            <h2>Kvällens generösaste</h2>

            {top ? (
                <HeroCard
                    name={top.name}
                    total={top.total}
                    media={<Monogram name={top.name} />}
                    sub={<FavouriteLine donor={top} />}
                />
            ) : (
                <p className="empty">Ingen har donerat. Ta ledning!</p>
            )}

            <ol>
                {/* popLayout: a leaving row stops taking up space at once, so the list
                    never grows taller for a moment and the page doesn't shrink to fit */}
                <AnimatePresence initial={false} mode="popLayout">
                    {rest.map((d, i) => (
                        <DonorRow key={d.name.toLowerCase()} donor={d} rank={i + 2} />
                    ))}
                </AnimatePresence>
            </ol>
        </section>
    );
}
