import { kr, plural } from "../lib/format.ts";
import { useBump } from "../lib/hooks.ts";

export function Header({ total, donations }: { total: number; donations: number; }) {
    const bump = useBump(total);

    return (
        <header>
            <div className="brand">
                <div>
                    <h1>Alumniskatt</h1>
                </div>
            </div>
            <div className="total">
                <div className="label">Insamlat</div>
                {/* Remounted on every bump to replay the colour flash */}
                <div key={bump?.id ?? 0} className={bump ? "amount num bumped" : "amount num"}>
                    {kr(total)}
                </div>
                <div className="count">{plural(donations, "inbetalning", "inbetalningar")}</div>
            </div>
        </header>
    );
}
