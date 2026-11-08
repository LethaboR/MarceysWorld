// Saves and loads guestbook messages in a free Supabase database.
// Environment variables (set on Vercel):
//   SUPABASE_URL           e.g. https://abcdxyz.supabase.co
//   SUPABASE_SERVICE_KEY   the "service_role" key (keep it secret, server only)

const clean = (text, max) =>
    String(text || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

module.exports = async (req, res) => {
    const base = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!base || !key) return res.status(500).json({ error: "not set up" });

    const headers = {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json"
    };

    res.setHeader("Cache-Control", "no-store");

    try {
        if (req.method === "GET") {
            const r = await fetch(
                `${base}/rest/v1/guestbook?select=id,name,message,created_at&order=created_at.desc&limit=300`,
                { headers }
            );
            if (!r.ok) throw new Error("read failed");
            return res.status(200).json({ entries: await r.json() });
        }

        if (req.method === "POST") {
            const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

            if (body.website) return res.status(200).json({ ok: true }); // hidden field: bots only

            const name = clean(body.name, 40);
            const message = clean(body.message, 500);
            if (!name || !message) return res.status(400).json({ error: "name and message needed" });

            const r = await fetch(`${base}/rest/v1/guestbook`, {
                method: "POST",
                headers: { ...headers, Prefer: "return=minimal" },
                body: JSON.stringify({ name, message })
            });
            if (!r.ok) throw new Error("write failed");
            return res.status(201).json({ ok: true });
        }

        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ error: "method not allowed" });
    } catch (e) {
        return res.status(502).json({ error: "something went wrong" });
    }
};
