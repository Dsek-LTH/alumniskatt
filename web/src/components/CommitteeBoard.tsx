import { AnimatePresence } from "motion/react";
import type { Committee } from "../../../src/types.ts";
import { plural } from "../lib/format.ts";
import { HeroCard } from "./HeroCard.tsx";
import { CommitteeRow } from "./rows.tsx";
import { Logo } from "./ui.tsx";

export function CommitteeBoard({ committees }: { committees: Committee[] }) {
    // Committees at 0 kr go to Skamvrån instead of taking up rows
    const active = committees.filter((c) => c.total > 0);
    const idle = committees.filter((c) => c.total <= 0);
    const [leader, ...rest] = active;
    // Bars are drawn relative to the leader
    const max = Math.max(1, leader?.total ?? 1);

    return (
        <section className="board committees-board">
            <h2>Kvällens favorit</h2>

            {leader ? (
                <HeroCard
                    leader={leader.name}
                    total={leader.total}
                    media={<Logo src={leader.logo} />}
                    name={leader.name}
                    sub={<span className="sub">{plural(leader.donations, "inbetalning", "inbetalningar")}</span>}
                />
            ) : (
                <p className="empty">Vilket utskott tar ledningen?</p>
            )}

            <ol>
                {/* popLayout: a leaving row stops taking up space at once, so the list
                    never grows taller for a moment and the page doesn't shrink to fit */}
                <AnimatePresence initial={false} mode="popLayout">
                    {rest.map((c, i) => (
                        <CommitteeRow key={c.name} committee={c} rank={i + 2} max={max} />
                    ))}
                </AnimatePresence>
            </ol>

            {leader && idle.length > 0 && (
                <p className="shame">
                    <strong>Skamvrån</strong>
                    {idle.map((c) => (
                        <span key={c.name}>
                            <Logo src={c.logo} />
                            {c.name}
                        </span>
                    ))}
                </p>
            )}
        </section>
    );
}
