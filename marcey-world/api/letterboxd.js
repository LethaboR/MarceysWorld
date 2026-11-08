// Reads a public Letterboxd RSS feed and returns recent films plus diary stats.
// Needs Node 18+. Deploy on Vercel with the rest of the site.

module.exports = async (req, res) => {
    const user = String(req.query.user || "").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!user) return res.status(400).json({ error: "missing user" });

    try {
        const r = await fetch(`https://letterboxd.com/${user}/rss/`, {
            headers: { "User-Agent": "marcey-world/1.0" }
        });
        if (!r.ok) throw new Error("status " + r.status);
        const xml = await r.text();

        const all = xml
            .split("<item>")
            .slice(1)
            .map((chunk) => {
                const pick = (tag) => {
                    const m = chunk.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
                    return m ? m[1].replace(/^<!\[CDATA\[|\]\]>$/g, "").trim() : "";
                };
                const desc = pick("description");
                const poster = (desc.match(/<img src="([^"]+)"/) || [])[1] || "";
                return {
                    title: pick("letterboxd:filmTitle"),
                    year: pick("letterboxd:filmYear"),
                    rating: pick("letterboxd:memberRating"),
                    watched: pick("letterboxd:watchedDate"),
                    rewatch: pick("letterboxd:rewatch") === "Yes",
                    liked: pick("letterboxd:memberLike") === "Yes",
                    link: pick("link"),
                    poster
                };
            })
            .filter((i) => i.title);

        // ---- stats from the diary entries in the feed ----
        const rated = all.filter((i) => i.rating !== "" && !isNaN(parseFloat(i.rating)));
        const dist = {};
        for (let s = 0.5; s <= 5; s += 0.5) dist[s] = 0;
        rated.forEach((i) => { dist[parseFloat(i.rating)] += 1; });

        const thisYear = String(new Date().getFullYear());
        const stats = {
            total: all.length,
            thisYear: all.filter((i) => i.watched.startsWith(thisYear)).length,
            average: rated.length
                ? Math.round((rated.reduce((a, i) => a + parseFloat(i.rating), 0) / rated.length) * 10) / 10
                : null,
            fiveStar: rated.filter((i) => parseFloat(i.rating) === 5).length,
            liked: all.filter((i) => i.liked).length,
            rewatched: all.filter((i) => i.rewatch).length,
            distribution: dist
        };

        res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate");
        res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
        res.status(200).json({ items: all.slice(0, 12), stats });
    } catch (e) {
        res.status(502).json({ error: "could not load feed" });
    }
};
