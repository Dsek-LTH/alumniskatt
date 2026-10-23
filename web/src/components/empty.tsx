import type { Committee } from "../../../server/types.ts";
import { Logo, Rank } from "./ui.tsx";

/** Stands in for the hero card until someone takes first place */
export function EmptyHero({ title, sub }: { title: string; sub: string }) {
    return (
        <div className="hero placeholder">
            <span className="monogram" aria-hidden>
                ?
            </span>
            <div>
                <div className="name">{title}</div>
                <span className="sub">{sub}</span>
            </div>
            <span className="money">Ledig!</span>
        </div>
    );
}

/** Every committee lined up before the first donation */
export function Contenders({ committees }: { committees: Committee[] }) {
    return (
        <div className="contenders">
            <strong>I startblocken</strong>
            <ul>
                {committees.map((c) => (
                    <li key={c.name}>
                        <Logo src={c.logo} />
                        {c.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** A faded row for a rank nobody holds yet */
export function GhostRow({ rank }: { rank: number }) {
    return (
        <li className="ghost" aria-hidden>
            <Rank n={rank} />
            <span className="ghost-line" />
            <span className="ghost-money">– kr</span>
        </li>
    );
}
