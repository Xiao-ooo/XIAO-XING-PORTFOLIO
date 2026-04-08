import { projects } from './projects.js';

document.addEventListener("DOMContentLoaded", () => {

    /* ---- NAV ---- */
    const nav = document.getElementById("mainNav");
    if (nav) {
        window.addEventListener("scroll", () => {
            nav.classList.toggle("scrolled", window.scrollY > 40);
        }, { passive: true });
    }

    /* ---- FIND PROJECT ---- */
    const params = new URLSearchParams(window.location.search);
    const id     = params.get("id");
    const proj   = projects.find(p => p.id === id);

    if (!proj) {
        document.body.innerHTML = `
            <div class="not-found">
                <p>Project not found.</p>
                <a href="index.html">← Back</a>
            </div>`;
        return;
    }

    /* ---- META ---- */
    document.title = `${proj.title} — XIAO XING`;

    const breadcrumb = document.getElementById("breadcrumb");
    if (breadcrumb) breadcrumb.textContent = proj.category?.replace("-", " ").toUpperCase() || "WORK";

    const titleEl = document.getElementById("proj-title");
    if (titleEl) titleEl.textContent = proj.title;

    const yearEl = document.getElementById("proj-year");
    if (yearEl) yearEl.textContent = proj.year;

    const catEl = document.getElementById("proj-cat");
    if (catEl) catEl.textContent = proj.category?.replace("-", " ").toUpperCase() || "";

    const descEl = document.getElementById("proj-description");
    if (descEl) descEl.textContent = proj.description || "";

    /* ---- EXPERIENCE BUTTON ---- */
    const expWrap = document.getElementById("proj-experience-wrap");
    if (expWrap && proj.link) {
        expWrap.innerHTML = `
            <a class="detail-experience" href="${proj.link}" target="_blank" rel="noopener">
                ${proj.linkLabel || "Experience the Work"}
            </a>
        `;
    }

    /* ---- REGULAR LINK ---- */
    const linkEl = document.getElementById("proj-link");
    if (linkEl) {
        if (proj.link) {
            linkEl.href          = proj.link;
            linkEl.textContent   = proj.linkLabel || "View Project →";
            linkEl.style.display = "inline-flex";
        } else {
            linkEl.style.display = "none";
        }
    }

    /* ---- MEDIA ---- */
    const mediaContainer = document.getElementById("proj-media");
    if (!mediaContainer) return;

    if (proj.type === "image") {
        mediaContainer.innerHTML = `
            <img src="${proj.src}" alt="${proj.title}" class="detail-image reveal">
        `;

    } else if (proj.type === "video") {
        mediaContainer.innerHTML = `
            <video controls src="${proj.src}"
                   class="detail-video reveal"
                   ${proj.thumbnail ? `poster="${proj.thumbnail}"` : ""}></video>
        `;

    } else if (proj.type === "gallery") {
        mediaContainer.innerHTML = `
            <div class="gallery-viewer">
                <div class="gallery-main" id="galleryMain">
                    <img src="${proj.images[0]}" alt="${proj.title}" id="mainImage">
                    <button class="gal-nav gal-prev" id="galPrev">&#8592;</button>
                    <button class="gal-nav gal-next" id="galNext">&#8594;</button>
                    <span class="gal-counter" id="galCounter">1 / ${proj.images.length}</span>
                </div>
                <div class="gallery-thumbs" id="galleryThumbs">
                    ${proj.images.map((img, i) => `
                        <img src="${img}"
                             alt="slide ${i + 1}"
                             class="thumb ${i === 0 ? "active" : ""}"
                             data-index="${i}">
                    `).join("")}
                </div>
            </div>
        `;

        let current = 0;
        const mainImg = document.getElementById("mainImage");
        const counter = document.getElementById("galCounter");
        const thumbs  = document.querySelectorAll(".thumb");

        function goTo(index) {
            current = (index + proj.images.length) % proj.images.length;
            mainImg.style.opacity = "0";
            setTimeout(() => {
                mainImg.src           = proj.images[current];
                mainImg.style.opacity = "1";
            }, 220);
            counter.textContent = `${current + 1} / ${proj.images.length}`;
            thumbs.forEach((t, i) => t.classList.toggle("active", i === current));
        }

        document.getElementById("galPrev").addEventListener("click", () => goTo(current - 1));
        document.getElementById("galNext").addEventListener("click", () => goTo(current + 1));
        thumbs.forEach(t => t.addEventListener("click", () => goTo(parseInt(t.dataset.index))));
        document.addEventListener("keydown", e => {
            if (e.key === "ArrowLeft")  goTo(current - 1);
            if (e.key === "ArrowRight") goTo(current + 1);
        });

        /* mixed media video below gallery */
        if (proj.video) {
            const vidWrap = document.createElement("div");
            vidWrap.style.marginTop = "12px";
            const vid = document.createElement("video");
            vid.controls = true;
            vid.src      = proj.video;
            vid.classList.add("detail-video", "reveal");
            if (proj.thumbnail) vid.poster = proj.thumbnail;
            vidWrap.appendChild(vid);
            mediaContainer.appendChild(vidWrap);
        }
    }

    /* ---- REVEAL ---- */
    document.querySelectorAll(".reveal").forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.07}s`;
        setTimeout(() => el.classList.add("visible"), 60);
    });

    /* ---- RELATED ---- */
    const relatedContainer = document.getElementById("relatedProjects");
    if (relatedContainer) {
        const related = projects
            .filter(p => p.id !== proj.id && p.category === proj.category)
            .slice(0, 3);

        if (!related.length) {
            document.querySelector(".detail-related")?.remove();
            return;
        }

        related.forEach(p => {
            const thumb = p.type === "gallery" ? p.images[0]
                        : p.src || p.thumbnail || "";
            const a = document.createElement("a");
            a.href = `project.html?id=${p.id}`;
            a.classList.add("related-card");
            a.innerHTML = `
                <div class="related-thumb">
                    ${thumb ? `<img src="${thumb}" alt="${p.title}">` : ""}
                </div>
                <div class="related-info">
                    <p class="related-title">${p.title}</p>
                    <p class="related-year">${p.year}</p>
                </div>
            `;
            relatedContainer.appendChild(a);
        });
    }
});