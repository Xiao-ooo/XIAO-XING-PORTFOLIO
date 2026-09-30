/* Light by default; an explicit choice follows the visitor between pages. */
(function () {
    let savedTheme;
    try { savedTheme = localStorage.getItem('theme'); } catch (_) { /* Storage may be unavailable. */ }
    document.body.classList.toggle('light', savedTheme !== 'dark');
    document.addEventListener('DOMContentLoaded', () => {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        function updateControl() {
            const isDark = !document.body.classList.contains('light');
            toggle.textContent = isDark ? 'Light mode' : 'Dark mode';
            toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
            toggle.setAttribute('aria-pressed', String(isDark));
        }
        updateControl();
        toggle.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light');
            try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch (_) { /* Keep the choice for this page. */ }
            updateControl();
        });
    });
}());
