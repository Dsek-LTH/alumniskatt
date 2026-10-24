import type { CSSProperties } from "react";
import type { Donation } from "../../../server/types.ts";
import { clock, kr } from "../lib/format.ts";
import { Logo } from "./ui.tsx";

// At least this many items per lap, so a short list still fills the width
const MIN_ITEMS = 6;

/**
 * A band of the latest donations scrolling by. Times are clock times rather than
 * "2 min sedan", so the text never changes mid-scroll and the band doesn't jump.
 */
export function Ticker({ recent }: { recent: Donation[] }) {
    const items =
        recent.length > 0
            ? recent.map((d) => (
                  <span key={d.id} className="ticker-item">
                      <span className="ticker-time num">{clock(d.timestamp)}</span>
                      <b>{d.name || "Någon"}</b> gav <b className="num">{kr(d.amount)}</b> till
                      <Logo src={d.logo} className="mini" />
                      {d.committee}
                  </span>
              ))
            : [
                  <span key="empty" className="ticker-item">
                      Ingen har donerat än – <b>bli först!</b>
                  </span>,
              ];

    // One lap is the items repeated until it is long enough. The track holds two laps
    // and slides one lap's width, so the loop is seamless.
    const lap = Array.from({ length: Math.ceil(MIN_ITEMS / items.length) }, () => items).flat();
    // About 8 s per item, slow enough to read without pulling the eye from the boards
    const style = { "--lap-s": `${lap.length * 8}s` } as CSSProperties;

    return (
        <div className="ticker">
            <strong>Senaste</strong>
            <div className="ticker-window">
                <div className="ticker-track" style={style}>
                    {[0, 1].map((copy) => (
                        <span key={copy} className="ticker-lap" aria-hidden={copy === 1}>
                            {lap.map((item, i) => (
                                <span key={i}>{item}</span>
                            ))}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
