import type { ReactNode } from "react";
import { kr } from "../lib/format.ts";
import { useBump, useChangeCount } from "../lib/hooks.ts";
import { BumpEffects } from "./ui.tsx";

type Props = { name: string; total: number; media: ReactNode; sub: ReactNode };

/** The big card for #1 on each board */
export function HeroCard({ name, total, media, sub }: Props) {
    // Keyed on the name, so a change of leader flashes without a "+X kr"
    const bump = useBump(total, name.toLowerCase());
    const leaderChanges = useChangeCount(name.toLowerCase());

    return (
        <div className="hero">
            <BumpEffects bump={bump} />
            {/* Remounted on every change of leader, replaying the stamp */}
            {leaderChanges > 0 && (
                <span key={leaderChanges} className="new-leader">
                    Ny ledare!
                </span>
            )}
            {media}
            <div>
                <div className="name">{name}</div>
                {sub}
            </div>
            {/* Remounted on every bump to slam the stamp down again */}
            <span key={bump?.id ?? 0} className={bump ? "money num slam" : "money num"}>
                {kr(total)}
            </span>
        </div>
    );
}
