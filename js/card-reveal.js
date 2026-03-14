// ==========================================
// Card Reveal Animation - 3D Flip
// Controlled by PORTAL_CONFIG.cardRevealAnimation
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    if (!window.PORTAL_CONFIG || !window.PORTAL_CONFIG.cardRevealAnimation) return;

    if (window.innerWidth < 900) {
        document.body.removeAttribute('data-card-reveal');
        return;
    }

    var portals = document.querySelector('.portals');
    if (!portals) return;

    var cards = Array.from(portals.querySelectorAll('.portal-card'));
    if (cards.length < 3) {
        document.body.removeAttribute('data-card-reveal');
        return;
    }

    var hasStarted = false;

    function startAnimation() {
        if (hasStarted) return;
        hasStarted = true;
        requestAnimationFrame(runAnimation);
    }

    function runAnimation() {
        // Measure real grid-rendered heights
        portals.style.visibility = 'hidden';
        document.body.removeAttribute('data-card-reveal');
        void portals.offsetHeight;

        var cardHeights = cards.map(function (card) {
            return card.offsetHeight;
        });
        var maxHeight = Math.max.apply(null, cardHeights);

        // Restore hidden state before building DOM
        document.body.setAttribute('data-card-reveal', 'true');
        void portals.offsetHeight;

        // Build flip DOM inside each card
        cards.forEach(function (card) {
            card.style.height = maxHeight + 'px';

            var inner = document.createElement('div');
            inner.className = 'card-flip-inner';

            var front = document.createElement('div');
            front.className = 'card-flip-front';
            front.setAttribute('aria-hidden', 'true');

            var back = document.createElement('div');
            back.className = 'card-flip-back';

            while (card.firstChild) {
                back.appendChild(card.firstChild);
            }

            inner.appendChild(front);
            inner.appendChild(back);
            card.appendChild(inner);
        });

        var T_EXPAND = 800;
        var T_CUT = 400;
        var T_SPLIT = 1100;
        var T_FLIP = 1300;
        var T_SETTLE = 500;

        portals.classList.add('card-reveal-active');
        portals.style.visibility = '';

        // Real card metrics
        var rect1 = cards[0].getBoundingClientRect();
        var rect2 = cards[1].getBoundingClientRect();
        var realGap = rect2.left - rect1.right;
        var cardW = rect1.width;

        // Pixel-accurate image slicing with horizontal overhang
        var overhangX = 36;
        var bgWidth = (3 * cardW) + (2 * overhangX);

        var inners = cards.map(function (c) { return c.querySelector('.card-flip-inner'); });
        var fronts = cards.map(function (c) { return c.querySelector('.card-flip-front'); });

        inners.forEach(function (inner) { inner.style.transition = 'none'; });
        fronts.forEach(function (front) { front.style.transition = 'none'; });

        // Merge pieces by translating outer cards inward exactly by the real gap.
        // Keeping this exact avoids positional jump when the split starts.
        var overlapGap = realGap;
        inners[0].style.transform = 'translateX(' + overlapGap + 'px)';
        inners[2].style.transform = 'translateX(-' + overlapGap + 'px)';

        // Image mapping per slice
        fronts.forEach(function (front, index) {
            front.style.backgroundSize = bgWidth + 'px auto';
            front.style.backgroundPosition = ((-index * cardW) - overhangX) + 'px center';
            front.style.opacity = '0';
        });

        // Preserve outer radius at cut-time
        fronts[0].style.borderRadius = '1.25rem 0 0 1.25rem';
        fronts[1].style.borderRadius = '0';
        fronts[2].style.borderRadius = '0 1.25rem 1.25rem 0';
        fronts[0].style.borderRightColor = 'transparent';
        fronts[1].style.borderLeftColor = 'transparent';
        fronts[1].style.borderRightColor = 'transparent';
        fronts[2].style.borderLeftColor = 'transparent';

        // True pre-cut single banner (actual cut occurs later at split)
        var portalsRect = portals.getBoundingClientRect();
        var mergedLeft = (rect1.left - portalsRect.left) + realGap;
        var mergedTop = rect1.top - portalsRect.top;
        var mergedWidth = 3 * cardW;
        var banner = document.createElement('div');
        banner.className = 'card-reveal-banner';
        banner.style.left = mergedLeft + 'px';
        banner.style.top = mergedTop + 'px';
        banner.style.width = mergedWidth + 'px';
        banner.style.height = maxHeight + 'px';
        banner.style.backgroundSize = bgWidth + 'px auto';
        banner.style.backgroundPosition = (-overhangX) + 'px center';
        portals.appendChild(banner);

        // Initial hero-scale expansion (no shrink-back compensation)
        portals.style.transform = 'scale(0.72)';
        void portals.offsetHeight;

        portals.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        inners.forEach(function (inner) {
            inner.style.transition = 'transform 1.1s cubic-bezier(0.4, 0, 0.2, 1)';
        });
        fronts.forEach(function (front) {
            front.style.transition = 'border-radius 1.1s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        // Phase 1: expand
        requestAnimationFrame(function () {
            portals.style.transform = 'scale(1)';
        });

        // Phase 2: split
        setTimeout(function () {
            // Perform the actual cut now: hide single banner, show 3 slice fronts
            banner.style.opacity = '0';
            fronts.forEach(function (front) {
                front.style.opacity = '1';
            });

            // Start movement on the next frame so the cut-state paints first
            requestAnimationFrame(function () {
                inners.forEach(function (inner) {
                    inner.style.transform = 'translateX(0)';
                });
                fronts.forEach(function (front) {
                    front.style.borderRadius = '1.25rem';
                    front.style.borderColor = 'rgba(117, 105, 95, 0.5)';
                });
            });

            setTimeout(function () {
                if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
            }, 180);
        }, T_EXPAND + T_CUT);

        // Phase 3: flip
        setTimeout(function () {
            inners.forEach(function (inner) {
                inner.style.transform = '';
            });
            portals.classList.add('cr-flipped');
        }, T_EXPAND + T_CUT + T_SPLIT);

        // Phase 4: settle into final state (keep flipped structure to avoid end flicker)
        setTimeout(function () {
            portals.style.transform = '';
            portals.style.transition = '';
            portals.classList.remove('cr-merged');
            portals.classList.add('card-revealed');
            document.body.removeAttribute('data-card-reveal');
            if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
            cards.forEach(function (card) {
                card.style.height = maxHeight + 'px';
                card.style.transition = '';
            });
        }, T_EXPAND + T_CUT + T_SPLIT + T_FLIP + T_SETTLE);
    }

    if (document.fonts && document.fonts.ready) {
        Promise.race([
            document.fonts.ready,
            new Promise(function (resolve) { setTimeout(resolve, 1500); })
        ]).then(startAnimation);
    } else {
        window.addEventListener('load', startAnimation, { once: true });
        setTimeout(startAnimation, 300);
    }
});
