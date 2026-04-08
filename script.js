import { projects } from './projects.js';

/* ============================================================
   INTRO PARALLAX
============================================================ */
const introInner = document.querySelector(".intro-inner");
const introBg    = document.querySelector(".intro-bg");
if (introInner) {
    window.addEventListener("scroll", () => {
        const y    = window.scrollY;
        const ease = 1 - Math.pow(1 - Math.min(y / 480, 1), 3);
        introInner.style.opacity   = 1 - ease * 1.25;
        introInner.style.transform = `translateY(${y * 0.18}px) scale(${1 - ease * 0.04})`;
        if (introBg) introBg.style.transform = `scale(${1 + ease * 0.12})`;
    }, { passive: true });
}

/* ============================================================
   REVEAL ON SCROLL
============================================================ */
const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
}, { threshold: 0.08 });

function observeReveal(root = document) {
    root.querySelectorAll(".reveal").forEach(el => revealObs.observe(el));
}

/* ============================================================
   COLLAGE
============================================================ */
function buildCollage(id) {
    const container = document.getElementById(id);
    if (!container) return;

    const items = projects
        .filter(p => p.category === "creative-tech")
        .sort((a, b) => b.year - a.year)
        .slice(0, 6);

    container.innerHTML = "";
    items.forEach((p, i) => {
        const thumb = p.type === "gallery" ? p.images[0]
                    : p.type === "video"   ? p.thumbnail
                    : p.src || "";

        const el = document.createElement("a");
        el.href = `project.html?id=${p.id}`;
        el.classList.add("collage-card", "reveal");
        el.dataset.slot = i + 1;
        el.style.transitionDelay = `${i * 0.07}s`;
        el.innerHTML = `
            ${thumb ? `<img src="${thumb}" alt="${p.title}" loading="lazy">` : ""}
            <div class="collage-overlay"></div>
            <div class="collage-caption">
                <span class="collage-title">${p.title}</span>
                <span class="collage-year">${p.year}</span>
            </div>
            ${p.type === "gallery" ? `<span class="collage-badge">${p.images.length} images</span>` : ""}
        `;
        container.appendChild(el);
    });
    observeReveal(container);
}

/* ============================================================
   INFINITE LOOP STRIP
============================================================ */
function buildLoopStrip(id) {
    const track = document.getElementById(id);
    if (!track) return;

    const items = projects
        .filter(p => p.featured && p.category !== "creative-tech")
        .sort((a, b) => b.year - a.year);

    const source = items.length
        ? items
        : projects.filter(p => p.featured).sort((a, b) => b.year - a.year);

    if (!source.length) return;

    // Build all cards into a fragment — single DOM write
    const frag = document.createDocumentFragment();
    [...source, ...source].forEach(p => {
        const thumb = p.type === "gallery" ? p.images[0]
                    : p.type === "video"   ? p.thumbnail
                    : p.src || "";
        const card = document.createElement("a");
        card.href = `project.html?id=${p.id}`;
        card.classList.add("hcard");
        card.innerHTML = `
            <div class="hcard-img">
                ${thumb ? `<img src="${thumb}" alt="${p.title}"
                    loading="eager" decoding="async"
                    width="280" height="187">` : ""}
            </div>
            <div class="hcard-info">
                <span class="hcard-cat">${p.category?.replace("-", " ") || ""}</span>
                <h3 class="hcard-title">${p.title}</h3>
                <span class="hcard-year">${p.year}</span>
            </div>
        `;
        frag.appendChild(card);
    });
    track.appendChild(frag);

    // Duration scales with card count
    const duration = Math.max(source.length * 7, 28);

    // Force GPU layer before animation starts — prevents stutter on scroll-into-view
    track.style.animation = "none";
    track.getBoundingClientRect(); // flush reflow
    track.style.animation = `loopScroll ${duration}s linear infinite`;

    /* ---- Drag to scrub ---- */
    let isDragging = false;
    let dragStartX = 0;
    let pausedAt   = 0;

    function getX(el) {
        return new DOMMatrix(window.getComputedStyle(el).transform).m41;
    }

    function resumeFrom(currentX) {
        const half     = track.scrollWidth / 2;
        if (!half) return;
        const raw      = Math.abs(currentX) / half;
        const progress = isNaN(raw) ? 0 : Math.min(raw, 1);
        track.style.transform      = "";
        track.style.animation      = `loopScroll ${duration}s linear infinite`;
        track.style.animationDelay = `-${progress * duration}s`;
    }

    track.addEventListener("mousedown", e => {
        isDragging = true;
        dragStartX = e.clientX;
        pausedAt   = getX(track);
        track.style.animation = "none";
        track.style.transform = `translateX(${pausedAt}px)`;
    });

    window.addEventListener("mousemove", e => {
        if (!isDragging) return;
        const half = track.scrollWidth / 2;
        if (!half) return;
        let newX = pausedAt + (e.clientX - dragStartX);
        newX = ((newX % -half) - half) % -half;
        if (newX > 0) newX -= half;
        track.style.transform = `translateX(${newX}px)`;
    });

    window.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        resumeFrom(getX(track));
    });

    track.addEventListener("touchstart", e => {
        dragStartX = e.touches[0].clientX;
        pausedAt   = getX(track);
        track.style.animation = "none";
        track.style.transform = `translateX(${pausedAt}px)`;
    }, { passive: true });

    track.addEventListener("touchmove", e => {
        const half = track.scrollWidth / 2;
        if (!half) return;
        let newX = pausedAt + (e.touches[0].clientX - dragStartX);
        newX = ((newX % -half) - half) % -half;
        if (newX > 0) newX -= half;
        track.style.transform = `translateX(${newX}px)`;
    }, { passive: true });

    track.addEventListener("touchend", () => {
        resumeFrom(getX(track));
    });
}

/* ============================================================
   RENDER PROJECTS
============================================================ */
export function renderProjects(containerId, category = null) {
    const placeholder = document.getElementById(containerId);
    if (!placeholder) return;

    let items = [...projects];
    if (category) {
        const cats = Array.isArray(category) ? category : [category];
        items = items.filter(p => cats.includes(p.category));
    }
    items.sort((a, b) => b.year - a.year);

    const wrap = document.createElement("div");
    wrap.classList.add("projects-wrap");

    const countEl = document.querySelector(".gallery-count-label");
    if (countEl) countEl.textContent = `${items.length} works`;

    const byYear = {};
    items.forEach(p => {
        if (!byYear[p.year]) byYear[p.year] = [];
        byYear[p.year].push(p);
    });

    Object.keys(byYear).sort((a, b) => b - a).forEach(year => {
        const marker = document.createElement("div");
        marker.classList.add("year-marker", "reveal");
        marker.dataset.year = year;
        marker.innerHTML = `
            <span class="year-marker-num">${year}</span>
            <span class="year-marker-line"></span>
        `;
        wrap.appendChild(marker);

        const grid = document.createElement("div");
        grid.classList.add("projects-grid");
        grid.dataset.year = year;

        byYear[year].forEach((p, i) => {
            const thumb = p.type === "gallery" ? p.images[0]
                        : p.type === "video"   ? p.thumbnail
                        : p.src || "";

            const el = document.createElement("a");
            el.classList.add("project", "reveal");
            el.href = `project.html?id=${p.id}`;
            el.dataset.year     = p.year;
            el.dataset.category = p.category || "";
            el.style.transitionDelay = `${(i % 6) * 0.06}s`;
            el.innerHTML = `
                <div class="project-media">
                    ${thumb ? `<img src="${thumb}" alt="${p.title}" loading="lazy">` : ""}
                    ${p.type === "video"   ? `<span class="proj-badge">&#9654;</span>` : ""}
                    ${p.type === "gallery" ? `<span class="proj-badge">${p.images.length} &#8594;</span>` : ""}
                </div>
                <div class="project-vignette"></div>
                <div class="project-view">View</div>
                <div class="project-info">
                    <div class="project-meta">
                        <span class="project-category">${p.category?.replace("-", " ") || ""}</span>
                        <span class="project-year">${p.year}</span>
                    </div>
                    <h3 class="project-title">${p.title}</h3>
                    ${p.description ? `<p class="project-desc">${p.description}</p>` : ""}
                </div>
            `;
            grid.appendChild(el);
        });

        wrap.appendChild(grid);
    });

    placeholder.replaceWith(wrap);
    observeReveal(wrap);
}

/* ============================================================
   FILTER BAR
============================================================ */
export function initFilterBar() {
    const btns = document.querySelectorAll(".filter-btn");
    if (!btns.length) return;

    btns.forEach(btn => {
        btn.addEventListener("click", () => {
            btns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const filter  = btn.dataset.filter;
            const cards   = document.querySelectorAll(".project");
            const markers = document.querySelectorAll(".year-marker");
            let   visible = 0;

            cards.forEach(card => {
                const show = filter === "all"
                    || card.dataset.year     === filter
                    || card.dataset.category === filter;
                card.classList.toggle("hidden", !show);
                if (show) visible++;
            });

            markers.forEach(marker => {
                const grid = marker.nextElementSibling;
                if (!grid) return;
                const anyVisible = [...grid.querySelectorAll(".project")]
                    .some(c => !c.classList.contains("hidden"));
                marker.style.display = anyVisible ? "" : "none";
            });

            const countEl = document.querySelector(".gallery-count-label");
            if (countEl) countEl.textContent = `${visible} works`;
        });
    });
}

/* ============================================================
   INIT
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    observeReveal();
    if (document.getElementById("ctCollage")) buildCollage("ctCollage");
    if (document.getElementById("loopTrack")) buildLoopStrip("loopTrack");
});