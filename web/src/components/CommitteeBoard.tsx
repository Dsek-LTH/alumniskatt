import { AnimatePresence } from "motion/react";
import type { CSSProperties } from "react";
import type { Committee } from "../../../server/types.ts";
import { plural, sharedRanks } from "../lib/format.ts";
import { Contenders, EmptyHero } from "./empty.tsx";
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
    const ranks = sharedRanks(active.map((c) => c.total));

    return (
        <section className="board committees-board">
            <h2>Kvällens favorit</h2>

            {leader ? (
                <HeroCard
                    name={leader.name}
                    total={leader.total}
                    media={<Logo src={leader.logo} />}
                    sub={<span className="sub">{plural(leader.donations, "inbetalning", "inbetalningar")}</span>}
                />
            ) : (
                <>
                    <EmptyHero title="Vem tar ledningen?" sub="Första alumniskatten avgör" />
                    <Contenders committees={committees} />
                </>
            )}

            {/* Rows per column when the single-board view splits the list in two */}
            <ol style={{ "--rows": Math.max(1, Math.ceil(rest.length / 2)) } as CSSProperties}>
                {/* popLayout: a leaving row stops taking up space at once, so the list
                    never grows taller for a moment and the page doesn't shrink to fit */}
                <AnimatePresence initial={false} mode="popLayout">
                    {rest.map((c, i) => (
                        <CommitteeRow key={c.name} committee={c} rank={ranks[i + 1]!} max={max} />
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
