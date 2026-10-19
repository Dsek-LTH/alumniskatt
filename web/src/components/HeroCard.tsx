import type { ReactNode } from "react";
import { kr } from "../lib/format.ts";
import { useBump } from "../lib/hooks.ts";
import { BumpEffects } from "./ui.tsx";

type Props = {
    /** Identifies the leader, so a change of leader flashes without a "+X kr" */
    leader: string;
    total: number;
    media: ReactNode;
    name: string;
    sub: ReactNode;
};

/** The big card for #1 on each board */
export function HeroCard({ leader, total, media, name, sub }: Props) {
    const bump = useBump(total, leader.toLowerCase());

    return (
        <div className="hero">
            <BumpEffects bump={bump} />
            {media}
            <div>
                <div className="name">{name}</div>
                {sub}
            </div>
            <span className="money num">{kr(total)}</span>
        </div>
    );
}
