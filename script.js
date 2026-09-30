import { projects } from './projects.js';

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
   USER-CONTROLLED HIGHLIGHTS STRIP
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
    source.forEach(p => {
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
}

/* ============================================================
   3D IMMERSIVE GALLERY — camera inside the ring
============================================================ */
let _allCylItems = [];
let _cylContainer = null;
let _galCleanup = null;

function projectThumbnail(project) {
    if (project.type === "gallery") return project.images?.[0] || "";
    if (project.type === "video") return project.thumbnail || project.src || "";
    return project.src || "";
}

function buildProjectGrid(items, container) {
    if (_galCleanup) { _galCleanup(); _galCleanup = null; }
    container.innerHTML = "";

    const countEl = document.querySelector(".gallery-count-label");
    if (countEl) countEl.textContent = `${items.length} ${items.length === 1 ? "work" : "works"}`;

    if (!items.length) {
        const empty = document.createElement("p");
        empty.className = "gallery-empty";
        empty.textContent = "No works found";
        container.appendChild(empty);
        return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((project, index) => {
        const thumb = projectThumbnail(project);
        const card = document.createElement("a");
        card.className = "archive-card reveal";
        card.href = `project.html?id=${encodeURIComponent(project.id)}`;
        card.style.transitionDelay = `${Math.min(index, 7) * 0.055}s`;
        card.innerHTML = `
            <div class="archive-card-media">
                ${thumb ? `<img src="${thumb}" alt="${project.title}" loading="lazy" decoding="async">` : ""}
            </div>
            <div class="archive-card-info">
                <div>
                    <span class="archive-card-category">${(project.category || "").replace(/-/g, " ")}</span>
                    <h2 class="archive-card-title">${project.title}</h2>
                </div>
                <span class="archive-card-year">${project.year}</span>
            </div>
        `;
        fragment.appendChild(card);
    });

    container.appendChild(fragment);
    observeReveal(container);
}

async function buildGallery3D(items, container) {
    if (_galCleanup) { _galCleanup(); _galCleanup = null; }
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

    const loadDiv = document.createElement("div");
    loadDiv.className = "gal-loading";
    loadDiv.textContent = "Entering the gallery…";
    container.appendChild(loadDiv);

    let THREE_mod, CSS3D_mod;
    try {
        [THREE_mod, CSS3D_mod] = await Promise.all([
            import("three"),
            import("three/addons/renderers/CSS3DRenderer.js")
        ]);
    } catch {
        loadDiv.textContent = "Gallery could not load";
        return;
    }

    const { Scene, PerspectiveCamera } = THREE_mod;
    const { CSS3DRenderer, CSS3DObject } = CSS3D_mod;

    container.removeChild(loadDiv);

    const scene = new Scene();
    const W = container.clientWidth || window.innerWidth;
    const H = container.clientHeight || 520;
    const camera = new PerspectiveCamera(70, W / H, 1, 30000);
    camera.position.set(0, 0, 0);
    camera.rotation.order = "YXZ";

    const renderer = new CSS3DRenderer();
    renderer.setSize(W, H);
    renderer.domElement.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;";
    container.appendChild(renderer.domElement);

    const N = items.length;
    const radius = Math.max(700, N * 72);
    const TILTS = [-3, 4, -2, 5, -4, 2, 3, -5, 1, -1, 4, -3];

    items.forEach((p, i) => {
        const theta = (i / N) * Math.PI * 2;
        const thumb = p.type === "gallery" ? p.images[0]
            : p.type === "video" ? p.thumbnail
            : p.src || "";

        const card = document.createElement("a");
        card.href = `project.html?id=${p.id}`;
        card.className = "gal-postcard";
        card.style.transformOrigin = "center center";
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

        const obj = new CSS3DObject(card);
        const yOffset = Math.sin(i * 2.4) * 140;
        obj.position.set(
            Math.sin(theta) * radius,
            yOffset,
            Math.cos(theta) * radius
        );
        /* face inward — θ + π rotates the card's front toward the center */
        obj.rotation.y = theta + Math.PI;
        obj.rotation.z = (TILTS[i % TILTS.length] * Math.PI) / 180;
        scene.add(obj);
    });

    const hint = document.createElement("div");
    hint.className = "gal-drag-hint";
    hint.textContent = "drag to look around →";
    hint.style.zIndex = "10";
    container.appendChild(hint);

    let yaw = 0;
    let velYaw = 0;
    let isPointerDown = false;
    let isDragging = false;
    let activePointerId = null;
    let lastX = 0;
    let totalDrag = 0;
    let suppressClick = false;
    let animId;

    const DRAG_THRESHOLD = 7;

    function animate() {
        if (!isDragging) {
            velYaw *= 0.97;
            if (Math.abs(velYaw) < 0.00005) velYaw = 0;
            yaw += velYaw;
        }
        camera.rotation.y = yaw;
        renderer.render(scene, camera);
        animId = requestAnimationFrame(animate);
    }
    animId = requestAnimationFrame(animate);

    function onPointerDown(e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        isPointerDown = true;
        isDragging = false;
        activePointerId = e.pointerId;
        lastX = e.clientX;
        totalDrag = 0;
        velYaw = 0;
    }
    function onPointerMove(e) {
        if (!isPointerDown || e.pointerId !== activePointerId) return;
        const dx = e.clientX - lastX;
        totalDrag += Math.abs(dx);

        if (!isDragging && totalDrag < DRAG_THRESHOLD) {
            lastX = e.clientX;
            return;
        }

        if (!isDragging) {
            isDragging = true;
            container.classList.add("is-dragging");
            renderer.domElement.setPointerCapture?.(e.pointerId);
        }

        /* Only cancel native link/image dragging once this is a real rotation. */
        e.preventDefault();
        velYaw = -dx * 0.0025;
        yaw += velYaw;
        lastX = e.clientX;
    }
    function finishPointer(e) {
        if (activePointerId !== null && e.pointerId !== activePointerId) return;
        suppressClick = isDragging;
        isPointerDown = false;
        isDragging = false;
        container.classList.remove("is-dragging");
        if (activePointerId !== null && renderer.domElement.hasPointerCapture?.(activePointerId)) {
            renderer.domElement.releasePointerCapture(activePointerId);
        }
        activePointerId = null;
    }
    function onWheel(e) {
        e.preventDefault();
        velYaw -= (e.deltaX + e.deltaY) * 0.0002;
    }
    function onClick(e) {
        if (!suppressClick) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        suppressClick = false;
    }
    function onResize() {
        const W2 = container.clientWidth, H2 = container.clientHeight;
        if (!W2 || !H2) return;
        camera.aspect = W2 / H2;
        camera.updateProjectionMatrix();
        renderer.setSize(W2, H2);
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finishPointer);
    window.addEventListener("pointercancel", finishPointer);
    renderer.domElement.addEventListener("click", onClick, true);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);

    _galCleanup = () => {
        cancelAnimationFrame(animId);
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer.domElement.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", finishPointer);
        window.removeEventListener("pointercancel", finishPointer);
        renderer.domElement.removeEventListener("click", onClick, true);
        renderer.domElement.removeEventListener("wheel", onWheel);
        window.removeEventListener("resize", onResize);
    };
}

/* ============================================================
   RENDER PROJECTS — EDITORIAL ARCHIVE GRID
============================================================ */
export async function renderProjects(containerId, category = null) {
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
    container.className = "archive-grid";
    _cylContainer = container;

    placeholder.replaceWith(container);
    buildProjectGrid(items, container);
}

/* ============================================================
   FILTER BAR
============================================================ */
export function initFilterBar() {
    const btns = document.querySelectorAll(".filter-btn");
    if (!btns.length) return;

    btns.forEach(btn => {
        btn.addEventListener("click", () => {
            btns.forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
            btn.classList.add("active");
            btn.setAttribute("aria-pressed", "true");

            const filter = btn.dataset.filter;
            const visible = _allCylItems.filter(p =>
                filter === "all"
                || String(p.year) === filter
                || filter.split(",").includes(p.category)
            );

            if (_cylContainer) buildProjectGrid(visible, _cylContainer);
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

    /* Hero archive lens — project imagery revealed through the name */
    const titleWrap = document.getElementById("heroTitleWrap");
    const lensTitle = document.getElementById("heroLensTitle");
    if (titleWrap && lensTitle) {
        // Match character spacing so the image layer stays aligned with the name.
        lensTitle.innerHTML = heroTitle.innerHTML;
        lensTitle.querySelectorAll(".char").forEach(char => char.classList.add("in"));
        const lensImages = projects
            .filter(project => project.featured)
            .map(projectThumbnail)
            .filter(Boolean);
        let lensIndex = 0;

        const setLensImage = () => {
            if (!lensImages.length) return;
            lensTitle.style.setProperty("--lens-image", `url("${lensImages[lensIndex]}")`);
            lensIndex = (lensIndex + 1) % lensImages.length;
        };
        setLensImage();

        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            titleWrap.addEventListener("pointerenter", setLensImage);
            titleWrap.addEventListener("pointermove", event => {
                const rect = titleWrap.getBoundingClientRect();
                titleWrap.style.setProperty("--lens-x", `${event.clientX - rect.left}px`);
                titleWrap.style.setProperty("--lens-y", `${event.clientY - rect.top}px`);
                titleWrap.classList.add("lens-active");
            });
            titleWrap.addEventListener("pointerleave", () => titleWrap.classList.remove("lens-active"));
        }
    }

    /* Tactile typewriter — deliberate rhythm, pauses, and accessible fallback */
    const typedText = document.getElementById("heroTypedText");
    const typewriter = document.getElementById("heroTypewriter");
    if (typedText && typewriter) {
        const sentences = [
            "Creative technology & digital design.",
            "Interactive installations & web development.",
            "Photography, film & visual art."
        ];
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let paused = false;
        typewriter.addEventListener("pointerenter", () => { paused = true; });
        typewriter.addEventListener("pointerleave", () => { paused = false; });

        const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
        const waitWhilePaused = async () => {
            while (paused) await wait(100);
        };

        async function runTypewriter() {
            if (reduced) return;
            await wait(1450);
            let sentenceIndex = 0;
            while (document.body.contains(typedText)) {
                const sentence = sentences[sentenceIndex];
                typewriter.setAttribute("aria-label", sentence);
                typedText.textContent = "";
                for (const character of sentence) {
                    await waitWhilePaused();
                    const letter = document.createElement("span");
                    letter.className = "typed-character";
                    letter.textContent = character === " " ? "\u00a0" : character;
                    typedText.appendChild(letter);
                    await wait(character === "," ? 270 : character === " " ? 72 : 82 + Math.random() * 62);
                }
                await wait(2400);
                await waitWhilePaused();
                for (let i = sentence.length; i > 0; i -= 1) {
                    await waitWhilePaused();
                    typedText.lastElementChild?.remove();
                    await wait(34);
                }
                await wait(620);
                sentenceIndex = (sentenceIndex + 1) % sentences.length;
            }
        }
        runTypewriter();
    }
});
