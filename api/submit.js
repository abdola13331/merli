export const config = { runtime: "edge" };

const getUpstream = () => {
    try {
        const raw = process.env.PROVIDER_KEY || "";
        return atob(raw).replace(/\/$/, "");
    } catch {
        return null;
    }
};

export default async function handler(req) {
    const base = getUpstream();
    const url = new URL(req.url);

    if (!url.pathname.includes("/api/submit")) {
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const target = base + url.pathname + url.search;

        const fwd = new Headers();
        for (const [k, v] of req.headers) {
            const low = k.toLowerCase();
            if (low.startsWith("x-vercel-") || low === "host" || low === "connection") continue;
            fwd.set(k, v);
        }
        fwd.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");

        const res = await fetch(target, {
            method: req.method,
            headers: fwd,
            body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
            duplex: "half",
            redirect: "manual",
        });

        return new Response(res.body, {
            status: res.status,
            headers: res.headers,
        });
    } catch {
        return new Response(null, { status: 502 });
    }
}
