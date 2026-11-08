/* ============================================
   SETTINGS - change these two things
   ============================================ */

const CONFIG = {
    // Marcey's Letterboxd username (the part after letterboxd.com/)
    letterboxdUser: "marceyy2fine",

    // Her Shelf account
    shelfHandle: "marceyyy",
    // Paste her Shelf link here (Shelf app > her profile > share / copy link).
    // While this is empty, the button just shows "@marceyyy".
    shelfUrl: "",

    // Paste a PUBLIC playlist link here to make the tracklist playable.
    // Works with Apple Music, Spotify or YouTube playlist links.
    playlistUrl: "",

    // Leave "" when the site and the /api folder are deployed together.
    apiBase: ""
};

const api = (path) => CONFIG.apiBase + path;


/* ============================================
   SECTIONS
   ============================================ */

function showSection(sectionId) {
    document.querySelectorAll(".page-section").forEach((s) => s.classList.add("hidden"));
    document.getElementById(sectionId).classList.remove("hidden");

    document.querySelectorAll(".navigation button").forEach((b) => {
        b.classList.toggle("active", b.dataset.section === sectionId);
    });

    if (sectionId === "films") loadFilms();
    if (sectionId === "guestbook" && !guestbookLoaded) loadGuestbook();
}

document.querySelectorAll(".navigation button").forEach((btn) => {
    btn.addEventListener("click", () => showSection(btn.dataset.section));
});


/* ============================================
   MEMORIES VIEWER
   ============================================ */

const memoryModal = document.getElementById("memoryModal");

function openMemory(image) {
    document.getElementById("expandedMemory").src = image.src;
    memoryModal.style.display = "flex";
}

function closeMemory() {
    memoryModal.style.display = "none";
}

document.querySelectorAll("[data-memory]").forEach((img) => {
    img.addEventListener("click", () => openMemory(img));
});
memoryModal.addEventListener("click", (e) => {
    if (e.target === memoryModal) closeMemory();
});
document.getElementById("closeMemory").addEventListener("click", closeMemory);


/* ============================================
   SONG PLAYER
   ============================================ */

const song = document.getElementById("song");
const musicButton = document.getElementById("musicButton");

musicButton.addEventListener("click", () => {
    if (song.paused) {
        song.play();
        musicButton.textContent = "❚❚ Pause";
    } else {
        song.pause();
        musicButton.textContent = "▶ Play";
    }
});
song.addEventListener("ended", () => { musicButton.textContent = "▶ Play"; });


/* ============================================
   SECRETS (flowers + moon)
   ============================================ */

const secrets = {
    message1: `
        <h2>🌸 You found me</h2>
        <p>I hope you know how loved you are.</p>`,
    message2: `
        <h2>♡ A little memory ♡</h2>
        <p>Some of my favourite moments are the ones where we're doing absolutely nothing.</p>`,
    message3: `
        <h2>⭐ Secret compliment</h2>
        <p>You're genuinely one of the most interesting people I've ever met.</p>`,
    message4: `
        <h2>💙 You found the secret</h2>
        <p>If you found this one, you're officially an explorer.</p>
        <p>I love you ♡</p>`,
    moon: `
        <h2>☾ You found the moon</h2>
        <p>Some things are meant to be found when you're not looking for them.</p>
        <p>Like this little message. ♡</p>`
};

const secretModal = document.getElementById("secretModal");

function showSecret(key) {
    document.getElementById("secretContent").innerHTML = secrets[key] || "";
    secretModal.style.display = "flex";
}

function closeSecret() {
    secretModal.style.display = "none";
}

document.querySelectorAll("[data-secret]").forEach((el) => {
    el.addEventListener("click", () => showSecret(el.dataset.secret));
    el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            showSecret(el.dataset.secret);
        }
    });
});
document.getElementById("closeSecret").addEventListener("click", closeSecret);
secretModal.addEventListener("click", (e) => {
    if (e.target === secretModal) closeSecret();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeSecret();
        closeMemory();
    }
});


/* ============================================
   GUESTBOOK (saved in the database, grouped by day)
   ============================================ */

const guestEntries = document.getElementById("guestbookEntries");
const guestStatus = document.getElementById("guestStatus");
let guestbookOnline = false;
let guestbookLoaded = false;
let localEntries = [];   // only used when the database isn't connected yet

const dayKey = (iso) => {
    const d = new Date(iso);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};

function renderGuestbook(list) {
    guestEntries.innerHTML = "";
    let lastDay = "";

    list.forEach((e) => {
        const key = dayKey(e.created_at);
        if (key !== lastDay) {
            const h = document.createElement("h4");
            h.className = "day-heading";
            h.textContent = new Date(e.created_at).toLocaleDateString(undefined, {
                weekday: "long", day: "numeric", month: "long", year: "numeric"
            });
            guestEntries.appendChild(h);
            lastDay = key;
        }

        const entry = document.createElement("div");
        entry.className = "guest-message";

        const strong = document.createElement("strong");
        strong.textContent = e.name + " ♡";
        const time = document.createElement("time");
        time.textContent = new Date(e.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
        const p = document.createElement("p");
        p.textContent = e.message;

        entry.append(strong, time, p);
        guestEntries.appendChild(entry);
    });
}

async function loadGuestbook() {
    try {
        const res = await fetch(api("/api/guestbook"));
        if (!res.ok) throw new Error("guestbook");
        const { entries } = await res.json();
        guestbookOnline = true;
        guestbookLoaded = true;
        renderGuestbook(entries);
        guestStatus.textContent = entries.length ? "" : "No messages yet. Be the first ♡";
    } catch (err) {
        guestbookOnline = false;
        guestStatus.textContent =
            "Messages will be saved for good once the site is online with the database connected.";
    }
}

document.getElementById("guestSubmit").addEventListener("click", async () => {
    const nameInput = document.getElementById("guestName");
    const messageInput = document.getElementById("guestMessage");
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (name === "" || message === "") {
        alert("Please write your name and a message ♡");
        return;
    }

    const button = document.getElementById("guestSubmit");
    button.disabled = true;

    try {
        if (!guestbookOnline) await loadGuestbook();

        if (guestbookOnline) {
            const res = await fetch(api("/api/guestbook"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    message,
                    website: document.getElementById("guestWebsite").value
                })
            });
            if (!res.ok) throw new Error("save");
            await loadGuestbook();
        } else {
            localEntries.unshift({ name, message, created_at: new Date().toISOString() });
            renderGuestbook(localEntries);
        }

        nameInput.value = "";
        messageInput.value = "";
    } catch (err) {
        alert("Couldn't save that message. Please try again ♡");
    } finally {
        button.disabled = false;
    }
});


/* ============================================
   PROFILE CARD TILT
   ============================================ */

const profileCard = document.querySelector(".profile");

if (profileCard) {
    profileCard.addEventListener("mousemove", (event) => {
        const rect = profileCard.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -3;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 3;
        profileCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    profileCard.addEventListener("mouseleave", () => {
        profileCard.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    });
}


/* ============================================
   GLITTER BACKGROUND
   ============================================ */

(function makeSparkles() {
    const box = document.getElementById("sparkles");
    for (let i = 0; i < 45; i++) {
        const s = document.createElement("span");
        const size = 2 + Math.random() * 3;
        s.style.width = s.style.height = size + "px";
        s.style.left = Math.random() * 100 + "%";
        s.style.top = Math.random() * 100 + "%";
        s.style.animationDelay = Math.random() * 3 + "s";
        s.style.animationDuration = 2 + Math.random() * 3 + "s";
        box.appendChild(s);
    }
})();


/* ============================================
   MARCEY'S TRACKLIST
   ============================================ */

const TRACKS = [
    ["A Couple Minutes", "Olivia Dean"],
    ["i love you", "Billie Eilish"],
    ["sing me to sleep", "i don't like mirrors"],
    ["Cinnamon Girl", "Lana Del Rey"],
    ["Pushing It Down and Praying", "Lizzy McAlpine"],
    ["It Ain't Me, Babe", "Timothée Chalamet & Monica Barbaro"],
    ["Letter Home", "Childish Gambino"],
    ["We'll Never Have Sex", "Leith Ross"],
    ["Come Back (Buddha Remastered 2001)", "The Five Stairsteps"],
    ["I Won't Cry Anymore", "Marvin Gaye"],
    ["Why Did I Choose You? (1995 Version)", "Marvin Gaye"],
    ["ilomilo", "Billie Eilish"],
    ["8", "Billie Eilish"],
    ["Six Feet Under", "Billie Eilish"],
    ["Bored", "Billie Eilish"],
    ["Lover, You Should've Come Over", "Jeff Buckley"],
    ["Futile Devices (Doveman Remix)", "Sufjan Stevens"],
    ["Halley's Comet", "Billie Eilish"],
    ["Slow Dance", "Clairo"],
    ["John Wayne", "Cigarettes After Sex"],
    ["Hurts Me Too", "Faye Webster"],
    ["leaving us both behind", "ativansocial & findnothing"],
    ["Nika Nika (Magical Remix) [feat. Iso & CavaTheKwaal]", "Dlala Thukzin"],
    ["Bozza Mthathe", "Thakzin"],
    ["Siyaqala(Shiblika)", "Permitted Gang"],
    ["Gqomu Lomantshingelani", "Unticipated Soundz"],
    ["Ntakatho KaMzukulu", "Unticipated Soundz"],
    ["Une barque sur l'océan from Miroirs", "Andre Laplante"],
    ["I Love Lucy", "Khamari"],
    ["Doctor, My Eyes", "Khamari"],
    ["Miami", "Odeal & Leon Thomas"],
    ["Male Fantasy", "Billie Eilish"],
    ["Tortoise of Independency", "King Krule"],
    ["Find Your Love", "Drake"],
    ["Billie Bossa Nova", "Billie Eilish"],
    ["Bad Luck", "Khalid"],
    ["4:44", "JAY-Z"],
    ["Savior", "Kendrick Lamar, Baby Keem & Sam Dew"],
    ["Rider", "Mereba"],
    ["Galice", "Dean Blunt"],
    ["Nubian Queen", "Michael Angelo"],
    ["Cannock Chase", "Labi Siffre"],
    ["Our Vacuum", "King Krule"],
    ["D>E>A>T>H>M>E>T>A>L", "Panchiko"],
    ["Hatachi No Koi", "Lamp"],
    ["Space Song", "Beach House"],
    ["Truffle Butter (feat. Drake & Lil Wayne)", "Nicki Minaj"],
    ["Boss Zonke", "Riky Rick"],
    ["Gin and Juice", "Snoop Dogg"],
    ["Nuthin' But A \"G\" Thang", "Dr. Dre & Snoop Dogg"],
    ["Partition", "Beyoncé"],
    ["No Idea", "Don Toliver"],
    ["Funny", "Searows"],
    ["Chapter Six", "Kendrick Lamar"],
    ["Momma", "Kendrick Lamar"],
    ["Nocturnes, Op. 15: No. 2 in F-Sharp Major", "Arthur Rubinstein"],
    ["RUSSIAN ROULETTE(...)", "millkzy"],
    ["Steeeam", "Shelly"],
    ["WILDFLOWER", "Billie Eilish"],
    ["Champagne Coast", "Blood Orange"],
    ["Seigfried", "Frank Ocean"],
    ["Self Control", "Frank Ocean"],
    ["Go To the Moon", "Sishii"],
    ["That's All I Ask", "Nina Simone"],
    ["It's Not Right But It's Okay", "Whitney Houston"],
    ["World of Our Own (Single Remix)", "Westlife"],
    ["Swear It Again (Radio Edit)", "Westlife"],
    ["Flying Without Wings", "Westlife"],
    ["Thinking of You", "Katy Perry"],
    ["Retreating Into a Dying Mind", "miserable teens club"],
    ["Hisoyakani", "Lamp"],
    ["Waiting", "leverfall"],
    ["This Is How It Goes", "GoldFish"]
];

(function renderTracklist() {
    const list = document.getElementById("tracklist");

    TRACKS.forEach(([title, artist], i) => {
        const li = document.createElement("li");

        const num = document.createElement("span");
        num.className = "t-num";
        num.textContent = i + 1;

        const text = document.createElement("div");
        const t = document.createElement("span");
        t.className = "t-name";
        t.textContent = title;
        const a = document.createElement("span");
        a.className = "t-sub";
        a.textContent = artist;
        text.append(t, a);

        li.append(num, text);
        li.className = "track";
        li.tabIndex = 0;
        li.setAttribute("role", "link");
        li.title = "Open on Apple Music";
        li.addEventListener("click", () => openTrack(title, artist));
        li.addEventListener("keydown", (e) => {
            if (e.key === "Enter") openTrack(title, artist);
        });
        list.appendChild(li);
    });

    document.getElementById("trackCount").textContent = TRACKS.length + " songs ♡";
})();

// Finds the exact song on Apple Music using Apple's free search (no account needed)
function itunesSearch(term) {
    return new Promise((resolve, reject) => {
        const cb = "itunes_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
        const script = document.createElement("script");
        const done = () => { clearTimeout(timer); delete window[cb]; script.remove(); };
        const timer = setTimeout(() => { done(); reject(new Error("timeout")); }, 6000);

        window[cb] = (data) => { done(); resolve(data); };
        script.onerror = () => { done(); reject(new Error("failed")); };
        script.src = "https://itunes.apple.com/search?media=music&entity=song&limit=1&term=" +
            encodeURIComponent(term) + "&callback=" + cb;
        document.head.appendChild(script);
    });
}

async function openTrack(title, artist) {
    const term = (title + " " + artist).replace(/\(\.\.\.\)/g, "").trim();
    const fallback = "https://music.apple.com/search?term=" + encodeURIComponent(term);
    const cacheKey = "song:" + term;

    // open the tab straight away so the browser doesn't block it
    const tab = window.open("about:blank", "_blank");
    if (!tab) { window.location.href = fallback; return; }
    tab.opener = null;

    let url = localStorage.getItem(cacheKey);
    if (!url) {
        try {
            const data = await itunesSearch(term);
            url = data.results && data.results[0] ? data.results[0].trackViewUrl : "";
            if (url) localStorage.setItem(cacheKey, url);
        } catch (e) { url = ""; }
    }
    tab.location.href = url || fallback;
}

// Turns a normal playlist link into something a website can play
function toEmbed(link) {
    try {
        const u = new URL(link);
        const host = u.hostname.replace(/^www\./, "");

        if (host === "music.apple.com") {
            return {
                src: "https://embed.music.apple.com" + u.pathname + u.search,
                height: 450,
                allow: "autoplay *; encrypted-media *; fullscreen *; clipboard-write",
                sandbox: "allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            };
        }

        if (host === "open.spotify.com") {
            const m = u.pathname.match(/(playlist|album)\/([A-Za-z0-9]+)/);
            if (m) {
                return {
                    src: "https://open.spotify.com/embed/" + m[1] + "/" + m[2],
                    height: 380,
                    allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                };
            }
        }

        if (host === "youtube.com" || host === "music.youtube.com") {
            const id = u.searchParams.get("list");
            if (id) {
                return {
                    src: "https://www.youtube.com/embed/videoseries?list=" + encodeURIComponent(id),
                    height: 380,
                    allow: "autoplay; encrypted-media; fullscreen; picture-in-picture"
                };
            }
        }
    } catch (e) { /* not a valid link */ }
    return null;
}

(function loadPlaylistEmbed() {
    if (!CONFIG.playlistUrl) return;
    const embed = toEmbed(CONFIG.playlistUrl);
    if (!embed) return;

    const frame = document.createElement("iframe");
    frame.src = embed.src;
    frame.height = embed.height;
    frame.allow = embed.allow;
    frame.loading = "lazy";
    frame.title = "Marcey's playlist";
    if (embed.sandbox) frame.setAttribute("sandbox", embed.sandbox);

    document.getElementById("playlistEmbed").appendChild(frame);
})();


/* ============================================
   SHELF LINKS
   ============================================ */

document.querySelectorAll(".shelf-link").forEach((el) => {
    if (CONFIG.shelfUrl) {
        el.href = CONFIG.shelfUrl;
        el.textContent = "See Marcey on Shelf (@" + CONFIG.shelfHandle + ") ↗";
    } else {
        el.removeAttribute("href");
        el.removeAttribute("target");
        el.style.cursor = "default";
        el.textContent = "Find Marcey on Shelf: @" + CONFIG.shelfHandle;
    }
});


/* ============================================
   LETTERBOXD (via /api/letterboxd)
   ============================================ */

let filmsLoaded = false;

function starText(rating) {
    const n = parseFloat(rating);
    if (isNaN(n)) return "";
    return "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "");
}

function renderStats(stats) {
    if (!stats || !stats.total) return;

    const cards = document.getElementById("statCards");
    const bars = document.getElementById("ratingBars");
    cards.innerHTML = "";
    bars.innerHTML = "";

    const items = [
        [stats.total, "films in her diary"],
        [stats.thisYear, "watched this year"],
        [stats.average === null ? "-" : stats.average + " ★", "average rating"],
        [stats.fiveStar, "five-star films"],
        [stats.liked, "films she liked ♥"],
        [stats.rewatched, "rewatches"]
    ];

    items.forEach(([value, label]) => {
        const card = document.createElement("div");
        card.className = "stat-card";
        const v = document.createElement("span");
        v.className = "stat-value";
        v.textContent = value;
        const l = document.createElement("span");
        l.className = "stat-label";
        l.textContent = label;
        card.append(v, l);
        cards.appendChild(card);
    });

    const dist = stats.distribution || {};
    const max = Math.max(1, ...Object.values(dist));
    Object.keys(dist).sort((a, b) => a - b).forEach((rating) => {
        const col = document.createElement("div");
        col.className = "bar-col";

        const count = document.createElement("span");
        count.className = "bar-count";
        count.textContent = dist[rating] || "";

        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height = Math.round((dist[rating] / max) * 100) + "%";

        const label = document.createElement("span");
        label.className = "bar-label";
        label.textContent = rating;

        col.append(count, bar, label);
        bars.appendChild(col);
    });

    document.getElementById("filmStats").classList.remove("hidden");
}

async function loadFilms() {
    if (filmsLoaded) return;

    const status = document.getElementById("filmsStatus");
    const grid = document.getElementById("filmGrid");
    document.getElementById("letterboxdLink").href =
        "https://letterboxd.com/" + CONFIG.letterboxdUser + "/";

    try {
        const res = await fetch(api("/api/letterboxd?user=" + encodeURIComponent(CONFIG.letterboxdUser)));
        if (!res.ok) throw new Error("feed");
        const { items, stats } = await res.json();
        renderStats(stats);

        grid.innerHTML = "";
        items.forEach((f) => {
            const a = document.createElement("a");
            a.className = "film-card";
            a.href = f.link;
            a.target = "_blank";
            a.rel = "noopener";

            if (f.poster) {
                const img = document.createElement("img");
                img.src = f.poster;
                img.alt = f.title;
                a.appendChild(img);
            } else {
                const ph = document.createElement("div");
                ph.className = "no-poster";
                ph.textContent = "🎬";
                a.appendChild(ph);
            }

            const title = document.createElement("span");
            title.className = "f-title";
            title.textContent = f.title + (f.year ? " (" + f.year + ")" : "");

            const meta = document.createElement("span");
            meta.className = "f-meta";
            meta.textContent = [starText(f.rating), f.rewatch ? "↻" : "", f.watched].filter(Boolean).join(" ");

            a.append(title, meta);
            grid.appendChild(a);
        });

        status.textContent = items.length ? "" : "Nothing logged yet.";
        filmsLoaded = true;
    } catch (err) {
        console.error(err);
        status.textContent =
            "Films will show up here once the site is online with the /api folder set up.";
    }
}
