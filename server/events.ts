import type { Store } from "./store.ts";

// A comment line this often keeps the connection open through Bun's idle timeout
// (10 s) and OKD's router (30 s) while nothing happens
const PING_MS = 5000;

const encoder = new TextEncoder();

/**
 * GET /api/events: Server-Sent Events with the whole leaderboard, sent on connect and
 * after every change, so screens update the moment a sync lands instead of on their next poll.
 */
export function leaderboardEvents(store: Store): Response {
    let stop = () => {};
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const write = (text: string) => {
                try {
                    controller.enqueue(encoder.encode(text));
                } catch {
                    stop();
                }
            };
            const send = () => write(`data: ${JSON.stringify(store.leaderboard())}\n\n`);
            send();
            const unsubscribe = store.subscribe(send);
            const ping = setInterval(() => write(": ping\n\n"), PING_MS);
            stop = () => {
                unsubscribe();
                clearInterval(ping);
            };
        },
        cancel() {
            stop();
        },
    });
    return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
}
