import { projects } from './projects.js';

/* ============================================================
   INTRO TEXT PARALLAX
============================================================ */
const introInner = document.querySelector(".intro-inner");
const introBg = document.querySelector(".intro-bg");
if (introInner) {
    window.addEventListener("scroll", () => {
        const y = window.scrollY;
        const ease = 1 - Math.pow(1 - Math.min(y / 600, 1), 3);
        introInner.style.opacity = 1 - ease * 1.25;
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
        .slice(0, 9);

    container.innerHTML = "";
    items.forEach((p, i) => {
        const thumb = p.type === "gallery" ? p.images[0]
            : p.type === "video" ? p.thumbnail
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

    const frag = document.createDocumentFragment();
    [...source, ...source].forEach(p => {
        const thumb = p.type === "gallery" ? p.images[0]
            : p.type === "video" ? p.thumbnail
                : p.src || "";
        const card = document.createElement("a");
        card.href = `project.html?id=${p.id}`;
        card.classList.add("hcard");
        card.innerHTML = `
            <div class="hcard-img">
                ${thumb ? `<img src="${thumb}" alt="${p.title}"
                    loading="eager" decoding="async"
                    width="300" height="200">` : ""}
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

    const duration = Math.max(source.length * 7, 28);
    track.style.animation = "none";
    track.getBoundingClientRect();
    track.style.animation = `loopScroll ${duration}s linear infinite`;

    let isDragging = false, dragStartX = 0, pausedAt = 0;

    function getX(el) {
        return new DOMMatrix(window.getComputedStyle(el).transform).m41;
    }

    function resumeFrom(currentX) {
        const half = track.scrollWidth / 2;
        if (!half) return;
        const raw = Math.abs(currentX) / half;
        const progress = isNaN(raw) ? 0 : Math.min(raw, 1);
        track.style.transform = "";
        track.style.animation = `loopScroll ${duration}s linear infinite`;
        track.style.animationDelay = `-${progress * duration}s`;
    }

    track.addEventListener("mousedown", e => {
        isDragging = true;
        dragStartX = e.clientX;
        pausedAt = getX(track);
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
        pausedAt = getX(track);
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
   3D CYLINDER GALLERY
============================================================ */
let _allCylItems = [];
let _cylContainer = null;
let _cylAnimId = null;

function buildCylinder(items, container) {
    if (_cylAnimId) { cancelAnimationFrame(_cylAnimId); _cylAnimId = null; }
    container.innerHTML = "";

    const countEl = document.querySelector(".gallery-count-label");
    if (countEl) countEl.textContent = `${items.length} works`;

    if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "gallery-empty";
        empty.textContent = "No works found";
        container.appendChild(empty);
        return;
    }

    const N = items.length;
    const CARD_W = 180;
    const STRING_H = 70;
    const IMG_H = 116;
    const INFO_H = 78;
    const CARD_H = IMG_H + INFO_H;
    const UNIT_H = STRING_H + CARD_H;

    const radius = Math.max(380, N * 44);
    const perspective = Math.round(radius * 2.6);
    const STEP = 360 / N;
    const TILTS = [-3, 4, -2, 5, -4, 2, 3, -5, 1, -1, 4, -3];

    const scene = document.createElement("div");
    scene.className = "gallery-scene";
    scene.style.setProperty("--gal-persp", perspective + "px");

    const cylinder = document.createElement("div");
    cylinder.className = "gallery-cylinder";

    items.forEach((p, i) => {
        const thumb = p.type === "gallery" ? p.images[0]
            : p.type === "video" ? p.thumbnail
            : p.src || "";

        const angle = i * STEP;
        const tilt = TILTS[i % TILTS.length];

        const wrap = document.createElement("div");
        wrap.className = "gal-item-wrap";
        wrap.style.transform = [
            `rotateY(${angle}deg)`,
            `translateZ(${radius}px)`,
            `translateX(-${CARD_W / 2}px)`,
            `translateY(-${UNIT_H / 2}px)`
        ].join(" ");

        const strEl = document.createElement("div");
        strEl.className = "gal-string";

        const card = document.createElement("a");
        card.className = "gal-postcard";
        card.href = `project.html?id=${p.id}`;
        card.dataset.year = p.year;
        card.dataset.category = p.category || "";
        card.style.transform = `rotate(${tilt}deg)`;
        card.draggable = false;

        card.innerHTML = `
            <div class="gal-postcard-img">
                ${thumb ? `<img src="${thumb}" alt="${p.title}" loading="lazy" draggable="false">` : ""}
            </div>
            <div class="gal-postcard-info">
                <span class="gal-postcard-cat">${(p.category || "").replace(/-/g, " ")}</span>
                <span class="gal-postcard-title">${p.title}</span>
                <span class="gal-postcard-year">${p.year}</span>
            </div>
        `;

        wrap.appendChild(strEl);
        wrap.appendChild(card);
        cylinder.appendChild(wrap);
    });

    const hint = document.createElement("div");
    hint.className = "gal-drag-hint";
    hint.textContent = "drag or scroll to explore →";

    scene.appendChild(cylinder);
    scene.appendChild(hint);
    container.appendChild(scene);

    /* --- Rotation interaction --- */
    let currentAngle = 0;
    let velocity = 0;
    let isDragging = false;
    let lastDragX = 0;
    let totalDragDist = 0;

    function setAngle(a) {
        cylinder.style.transform = `rotateY(${a}deg)`;
    }

    function tick() {
        if (!isDragging) {
            velocity *= 0.94;
            if (Math.abs(velocity) < 0.004) velocity = 0;
            currentAngle += velocity;
            setAngle(currentAngle);
        }
        _cylAnimId = requestAnimationFrame(tick);
    }
    tick();

    scene.addEventListener("mousedown", e => {
        isDragging = true;
        lastDragX = e.clientX;
        totalDragDist = 0;
        velocity = 0;
        scene.style.cursor = "grabbing";
        e.preventDefault();
    });

    window.addEventListener("mousemove", e => {
        if (!isDragging) return;
        const dx = e.clientX - lastDragX;
        totalDragDist += Math.abs(dx);
        velocity = dx * 0.25;
        currentAngle += velocity;
        setAngle(currentAngle);
        lastDragX = e.clientX;
    });

    window.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        scene.style.cursor = "";
    });

    scene.addEventListener("click", e => {
        if (totalDragDist > 8) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }, true);

    scene.addEventListener("wheel", e => {
        e.preventDefault();
        velocity += (e.deltaX + e.deltaY) * 0.04;
    }, { passive: false });

    scene.addEventListener("touchstart", e => {
        isDragging = true;
        lastDragX = e.touches[0].clientX;
        totalDragDist = 0;
        velocity = 0;
    }, { passive: true });

    scene.addEventListener("touchmove", e => {
        if (!isDragging) return;
        const dx = e.touches[0].clientX - lastDragX;
        totalDragDist += Math.abs(dx);
        velocity = dx * 0.2;
        currentAngle += velocity;
        setAngle(currentAngle);
        lastDragX = e.touches[0].clientX;
    }, { passive: true });

    scene.addEventListener("touchend", () => { isDragging = false; });
}

/* ============================================================
   RENDER PROJECTS — 3D CYLINDER
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

    _allCylItems = items;

    const container = document.createElement("div");
    container.className = "cyl-container";
    _cylContainer = container;

    placeholder.replaceWith(container);
    buildCylinder(items, container);
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

            const filter = btn.dataset.filter;
            const visible = _allCylItems.filter(p =>
                filter === "all"
                || String(p.year) === filter
                || p.category === filter
            );

            if (_cylContainer) buildCylinder(visible, _cylContainer);
        });
    });
}

/* ============================================================
   THEME TOGGLE
============================================================ */
const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");

if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
    if (themeToggle) themeToggle.checked = true;
    if (themeLabel) themeLabel.textContent = "Light";
}

if (themeToggle) {
    themeToggle.addEventListener("change", () => {
        const isLight = themeToggle.checked;
        document.body.classList.toggle("light", isLight);
        themeLabel.textContent = isLight ? "Light" : "Dark";
        localStorage.setItem("theme", isLight ? "light" : "dark");
    });
}

/* ============================================================
   INIT
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    observeReveal();
    if (document.getElementById("ctCollage")) buildCollage("ctCollage");
    if (document.getElementById("loopTrack")) buildLoopStrip("loopTrack");

    /* Hero title — character stagger */
    const heroTitle = document.querySelector(".intro-inner h1");
    if (heroTitle) {
        const original = heroTitle.textContent;
        heroTitle.setAttribute("aria-label", original);
        let delay = 0.12;
        heroTitle.innerHTML = [...original].map(ch => {
            if (ch === " ") return "<span style='display:inline-block;width:.28em'></span>";
            const span = `<span class="char" style="transition-delay:${delay.toFixed(2)}s">${ch}</span>`;
            delay += 0.055;
            return span;
        }).join("");
        requestAnimationFrame(() => requestAnimationFrame(() => {
            heroTitle.querySelectorAll(".char").forEach(c => c.classList.add("in"));
        }));
    }

    /* Intro supporting elements — staggered fade-in */
    const introFades = [
        document.querySelector(".intro-eyebrow"),
        document.querySelector(".intro-divider"),
        document.querySelector(".intro-sub"),
    ];
    introFades.forEach((el, i) => {
        if (!el) return;
        el.style.opacity = "0";
        el.style.transform = "translateY(14px)";
        el.style.transition = "opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)";
        el.style.transitionDelay = (0.55 + i * 0.18) + "s";
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
        introFades.forEach(el => {
            if (!el) return;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
        });
    }));
});