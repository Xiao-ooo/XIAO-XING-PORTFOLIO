(function () {
    'use strict';

    /* ============================================================
       LENIS SMOOTH SCROLL
    ============================================================ */
    if (typeof Lenis !== 'undefined') {
        var lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
        function lenisRaf(t) { lenis.raf(t); requestAnimationFrame(lenisRaf); }
        requestAnimationFrame(lenisRaf);
    }

    /* ============================================================
       PAGE EXIT TRANSITION
    ============================================================ */
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:8000;pointer-events:none;opacity:0;transition:opacity 0.38s ease';
    overlay.style.background = document.body.classList.contains('light') ? '#f2ede6' : '#020202';
    document.body.appendChild(overlay);

    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href]');
        if (!link) return;
        var href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:') ||
            href.startsWith('mailto:') || href.startsWith('http') || link.target === '_blank') return;
        e.preventDefault();
        overlay.style.background = document.body.classList.contains('light') ? '#f2ede6' : '#020202';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
        setTimeout(function () { window.location.href = href; }, 380);
    });

    window.addEventListener('pageshow', function (e) {
        if (e.persisted) {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        }
    });

    /* ============================================================
       SPARKLE EFFECTS (pointer devices only)
    ============================================================ */
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var COLORS = ['#c8ff47', '#ffffff', '#ffe566', '#a8f0ff', '#ff99cc'];

    function burst(x, y) {
        for (var i = 0; i < 14; i++) {
            (function (i) {
                var angle = (i / 14) * Math.PI * 2;
                var dist = 16 + Math.random() * 26;
                var dx = Math.cos(angle) * dist;
                var dy = Math.sin(angle) * dist;
                var size = 2 + Math.random() * 4;
                var color = COLORS[Math.floor(Math.random() * COLORS.length)];
                var dur = 380 + Math.random() * 200;
                var p = document.createElement('div');
                p.style.cssText = 'position:fixed;border-radius:50%;pointer-events:none;z-index:9997;' +
                    'width:' + size + 'px;height:' + size + 'px;background:' + color + ';' +
                    'left:' + x + 'px;top:' + y + 'px;transform:translate(-50%,-50%);' +
                    'transition:transform ' + dur + 'ms cubic-bezier(0,.9,.57,1),opacity ' + dur + 'ms ease';
                document.body.appendChild(p);
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        p.style.transform = 'translate(calc(-50% + ' + dx.toFixed(1) + 'px),calc(-50% + ' + dy.toFixed(1) + 'px)) scale(0)';
                        p.style.opacity = '0';
                    });
                });
                setTimeout(function () { p.remove(); }, dur + 50);
            }(i));
        }

        var ring = document.createElement('div');
        ring.style.cssText = 'position:fixed;border-radius:50%;pointer-events:none;z-index:9996;' +
            'width:4px;height:4px;background:rgba(200,255,71,0.9);' +
            'left:' + x + 'px;top:' + y + 'px;transform:translate(-50%,-50%);' +
            'transition:width .38s cubic-bezier(0,.9,.57,1),height .38s cubic-bezier(0,.9,.57,1),opacity .38s ease';
        document.body.appendChild(ring);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                ring.style.width = '40px';
                ring.style.height = '40px';
                ring.style.background = 'transparent';
                ring.style.border = '1px solid rgba(200,255,71,0.4)';
                ring.style.opacity = '0';
            });
        });
        setTimeout(function () { ring.remove(); }, 420);
    }

    document.addEventListener('mousedown', function (e) { burst(e.clientX, e.clientY); });

    /* --- Sparkle trail while moving --- */
    var lastTrail = 0;
    document.addEventListener('mousemove', function (e) {
        var now = Date.now();
        if (now - lastTrail < 80) return;
        lastTrail = now;
        var s = document.createElement('div');
        s.style.cssText = 'position:fixed;pointer-events:none;z-index:9995;' +
            'width:3px;height:3px;border-radius:50%;' +
            'background:' + COLORS[Math.floor(Math.random() * COLORS.length)] + ';' +
            'left:' + e.clientX + 'px;top:' + e.clientY + 'px;' +
            'transform:translate(-50%,-50%);opacity:0.5;' +
            'transition:opacity .4s ease,transform .4s ease';
        document.body.appendChild(s);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                s.style.opacity = '0';
                s.style.transform = 'translate(-50%,-50%) scale(0)';
            });
        });
        setTimeout(function () { s.remove(); }, 450);
    });

}());
