import type { ReactNode } from "react";
import { kr, nameList } from "../lib/format.ts";
import { useBump, useChangeCount } from "../lib/hooks.ts";
import { BumpEffects } from "./ui.tsx";

type Props = {
    name: string;
    total: number;
    media: ReactNode;
    sub: ReactNode;
    /** Others with the same total, who share first place */
    tiedWith?: string[];
};

/** The big card for #1 on each board */
export function HeroCard({ name, total, media, sub, tiedWith = [] }: Props) {
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
                {tiedWith.length > 0 && <span className="tie">Delad etta med {nameList(tiedWith)}</span>}
            </div>
            {/* Remounted on every bump to slam the stamp down again */}
            <span key={bump?.id ?? 0} className={bump ? "money num slam" : "money num"}>
                {kr(total)}
            </span>
        </div>
    );
}
