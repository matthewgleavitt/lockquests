// Pull-to-refresh. The page reads the Google Sheet on every load, so a
// reload is what actually picks up sheet edits. Browsers that have their
// own pull-to-refresh are suppressed via overscroll-behavior in style.css
// so only one gesture handler runs.
(function () {
    var THRESHOLD = 70, startY = 0, pulling = false, armed = false, ind = null;

    function indicator() {
        if (ind) return ind;
        ind = document.createElement('div');
        ind.className = 'ptr';
        ind.setAttribute('aria-hidden', 'true');
        ind.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"' +
            ' stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
            '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
        document.body.appendChild(ind);
        return ind;
    }

    function atTop() {
        return (window.pageYOffset || document.documentElement.scrollTop || 0) <= 0;
    }

    function place(dist) {
        var el = indicator();
        el.style.transform = 'translateX(-50%) translateY(' + dist + 'px) rotate(' +
            (dist / THRESHOLD * 180) + 'deg)';
        el.style.opacity = Math.min(dist / THRESHOLD, 1);
    }

    function reset(animate) {
        var el = indicator();
        el.style.transition = animate ? 'transform .22s ease, opacity .22s ease' : '';
        el.style.transform = 'translateX(-50%) translateY(0) rotate(0deg)';
        el.style.opacity = '0';
        el.classList.remove('ptr-armed');
        if (animate) setTimeout(function () { el.style.transition = ''; }, 240);
    }

    document.addEventListener('touchstart', function (e) {
        pulling = e.touches.length === 1 && atTop();
        armed = false;
        if (pulling) { startY = e.touches[0].clientY; indicator().style.transition = ''; }
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
        if (!pulling) return;
        var dy = e.touches[0].clientY - startY;
        if (dy <= 0 || !atTop()) { if (armed) reset(true); pulling = false; armed = false; return; }
        var dist = Math.min(dy * 0.5, THRESHOLD * 1.4);   // resistance
        place(dist);
        armed = dist >= THRESHOLD;
        indicator().classList.toggle('ptr-armed', armed);
    }, { passive: true });

    document.addEventListener('touchend', function () {
        if (!pulling) return;
        pulling = false;
        if (armed) {
            indicator().classList.add('ptr-spin');
            location.reload();
        } else {
            reset(true);
        }
    });

    document.addEventListener('touchcancel', function () {
        if (pulling) { pulling = false; reset(true); }
    });
})();
