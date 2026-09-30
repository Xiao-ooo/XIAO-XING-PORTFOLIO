(function () {
    'use strict';

    /* ============================================================
       LENIS SMOOTH SCROLL
    ============================================================ */
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof Lenis !== 'undefined' && !reduceMotion) {
        var lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
        function lenisRaf(t) { lenis.raf(t); requestAnimationFrame(lenisRaf); }
        requestAnimationFrame(lenisRaf);
    }

    /* ============================================================
       RESPONSIVE NAVIGATION
    ============================================================ */
    var nav = document.getElementById('mainNav');
    // Progressively compact the header over the first 220px of scrolling.
    // One shared handler keeps every page and restored scroll position consistent.
    if (nav) {
        var navFrame = 0;
        function updateNav() {
            var progress = reduceMotion ? 0 : Math.min(Math.max(window.scrollY, 0) / 220, 1);
            nav.style.setProperty('--nav-progress', progress.toFixed(4));
            navFrame = 0;
        }
        function queueNavUpdate() {
            if (!navFrame) navFrame = requestAnimationFrame(updateNav);
        }
        updateNav();
        window.addEventListener('scroll', queueNavUpdate, { passive: true });
        window.addEventListener('pageshow', queueNavUpdate);
    }

    var navList = nav && nav.querySelector('ul');
    var navInner = nav && nav.querySelector('.nav-inner');

    if (navList && navInner) {
        navList.id = navList.id || 'site-menu';
        var menuButton = document.createElement('button');
        menuButton.className = 'menu-toggle';
        menuButton.type = 'button';
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-controls', navList.id);
        menuButton.setAttribute('aria-label', 'Open navigation');
        menuButton.innerHTML = '<span></span><span></span>';
        navInner.appendChild(menuButton);

        function setMenu(open) {
            nav.classList.toggle('menu-open', open);
            document.body.classList.toggle('menu-is-open', open);
            menuButton.setAttribute('aria-expanded', String(open));
            menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        }

        menuButton.addEventListener('click', function () {
            setMenu(!nav.classList.contains('menu-open'));
        });
        navList.addEventListener('click', function (e) {
            if (e.target.closest('a')) setMenu(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') setMenu(false);
        });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 760) setMenu(false);
        }, { passive: true });
    }

}());
