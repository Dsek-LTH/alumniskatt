import type { ReactNode } from "react";
import { kr } from "../lib/format.ts";
import { useBump } from "../lib/hooks.ts";
import { BumpEffects } from "./ui.tsx";

type Props = { name: string; total: number; media: ReactNode; sub: ReactNode };

/** The big card for #1 on each board */
export function HeroCard({ name, total, media, sub }: Props) {
    // Keyed on the name, so a change of leader flashes without a "+X kr"
    const bump = useBump(total, name.toLowerCase());

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
