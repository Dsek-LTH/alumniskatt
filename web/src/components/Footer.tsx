import { useNow } from "../lib/hooks.ts";

export function Footer({ updatedAt, demo }: { updatedAt: string | null; demo: boolean }) {
    return (
        <footer>
            <div className="steps">
                <span>
                    <b>1</b>Köp <strong>alumniskatt</strong> i baren
                </span>
                <span>
                    <b>2</b>Välj vilket utskott som får pengarna
                </span>
                <span>
                    <b>3</b>Säg ditt namn till bartendern
                </span>
            </div>
            <Status updatedAt={updatedAt} label={demo ? "Demo" : "Live"} />
        </footer>
    );
}

// Turns red if the poller has not synced for 3 minutes
function Status({ updatedAt, label }: { updatedAt: string | null; label: string }) {
    const now = useNow(1000);

    if (!updatedAt) return <span className="status">Väntar på första synken…</span>;

    const ageS = Math.max(0, Math.round((now - Date.parse(updatedAt)) / 1000));
    return (
        <span className={ageS > 180 ? "status stale" : "status"}>
            {ageS < 60 ? `${label} · uppdaterad för ${ageS} s sedan` : `Uppdaterad för ${Math.floor(ageS / 60)} min sedan`}
        </span>
    );
}
