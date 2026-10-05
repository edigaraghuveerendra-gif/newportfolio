(() => {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover     = window.matchMedia('(hover: hover)').matches;


    /* =====================================================
       1. MOBILE MENU: close after tap, Esc, or outside tap
    ===================================================== */

    const navToggle = document.getElementById('nav-toggle');
    const navMenu   = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {

        navMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navToggle.checked = false;
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') navToggle.checked = false;
        });

        document.addEventListener('click', (event) => {
            if (navToggle.checked && !event.target.closest('.navbar')) {
                navToggle.checked = false;
            }
        });
    }


    /* =====================================================
       2. ACTIVE NAV LINK while scrolling
    ===================================================== */

    const navLinks = [...document.querySelectorAll('.nav-center a')];
    const sections = [...document.querySelectorAll('main section[id]')];

    if ('IntersectionObserver' in window && navLinks.length) {

        const setActive = (id) => {
            navLinks.forEach((link) => {
                link.classList.toggle('active', link.getAttribute('href') === '#' + id);
            });
        };

        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) setActive(entry.target.id);
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        sections.forEach((section) => spy.observe(section));
    }


    /* =====================================================
       3. SCROLL REVEAL (fade up)
    ===================================================== */

    if (!reduceMotion && 'IntersectionObserver' in window) {

        const selector = [
            '.section-heading',
            '.section-description',
            '.about-copy',
            '.about-facts',
            '.about-stage-wrap',
            '.stack-row',
            '.project-panel',
            '.certification-card',
            '.education-card',
            '.coding-card',
            '.focus-inner',
            '.contact-content'
        ].join(',');

        const gridParents = '.stack-rows, .certifications-grid, .coding-grid';

        const targets = document.querySelectorAll(selector);

        targets.forEach((el) => {
            el.classList.add('reveal');

            // Small stagger for cards inside a grid
            if (el.parentElement.matches(gridParents)) {
                const index = [...el.parentElement.children].indexOf(el);
                el.style.setProperty('--reveal-delay', (index % 4) * 70 + 'ms');
            }
        });

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const el = entry.target;
                el.classList.add('is-visible');
                observer.unobserve(el);

                // When the fade is done, remove the helper classes so the
                // normal hover effects work again.
                el.addEventListener('transitionend', function done(event) {
                    if (event.target !== el || event.propertyName !== 'opacity') return;
                    el.classList.remove('reveal', 'is-visible');
                    el.style.removeProperty('--reveal-delay');
                    el.removeEventListener('transitionend', done);
                });
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        targets.forEach((el) => revealObserver.observe(el));
    }


    /* =====================================================
       4. SOFT CARD SPOTLIGHT (mouse devices only)
    ===================================================== */

    if (canHover) {
        document
            .querySelectorAll('.skill-card, .certification-card, .coding-card')
            .forEach((card) => {

                card.classList.add('spotlight-card');

                card.addEventListener('pointermove', (event) => {
                    const box = card.getBoundingClientRect();
                    card.style.setProperty('--mx', (event.clientX - box.left) + 'px');
                    card.style.setProperty('--my', (event.clientY - box.top) + 'px');
                });
            });
    }


    /* =====================================================
       5. HERO WINDOW TILT (mouse devices only)
    ===================================================== */

    const heroWrap   = document.querySelector('.hero-window-wrap');
    const heroWindow = document.querySelector('.hero-window');

    if (heroWrap && heroWindow && canHover && !reduceMotion) {

        heroWrap.addEventListener('pointermove', (event) => {
            const box = heroWrap.getBoundingClientRect();
            const x = (event.clientX - box.left) / box.width  - 0.5;
            const y = (event.clientY - box.top)  / box.height - 0.5;

            heroWindow.style.transform =
                'rotateX(' + (-y * 3).toFixed(2) + 'deg) ' +
                'rotateY(' + (x * 4).toFixed(2) + 'deg)';
        });

        heroWrap.addEventListener('pointerleave', () => {
            heroWindow.style.transform = '';
        });
    }




        /* =====================================================
       6. ABOUT: HANGING ID CARD (rope physics, plain JS)
       Drag the card, let go, and it swings and settles.
    ===================================================== */

    const idStage = document.getElementById('idStage');
    const idCard  = document.getElementById('idCard');
    const idStrap = document.getElementById('idStrap');

    if (idStage && idCard && idStrap) {

        const band   = idStrap.querySelector('.strap-band');
        const stitch = idStrap.querySelector('.strap-stitch');

        const SEGMENTS = 6;      // rope pieces
        const ANCHOR_Y = -8;     // rope starts just above the stage
        const MAX_SPEED = 28;    // stops wild flings

        let W = 0, H = 0, cardW = 0, cardH = 0;
        let segLen = 0, hang = 0, reach = 0;
        let rope = [];
        let tail = null;         // the centre of the card

        let dragging = false;
        const grab = { x: 0, y: 0 };
        const pointer = { x: 0, y: 0 };

        let visible = false, rafId = 0, lastTime = 0, calm = 0, introDone = false;


        /* ---- Build the rope and card for the current size ---- */

        function build() {
            const box = idStage.getBoundingClientRect();
            W = box.width;
            H = box.height;
            cardW = idCard.offsetWidth;
            cardH = idCard.offsetHeight;

            if (!W || !H || !cardH) return false;

            const ropeLen = Math.max(110, H - cardH - 22);

            segLen = ropeLen / SEGMENTS;
            hang   = cardH / 2;
            reach  = ropeLen + hang;

            const ax = W / 2;
            rope = [];

            for (let i = 0; i <= SEGMENTS; i++) {
                const y = ANCHOR_Y + i * segLen;
                rope.push({ x: ax, y: y, px: ax, py: y, w: i === 0 ? 0 : 1 });
            }

            const end = rope[SEGMENTS];
            tail = { x: end.x, y: end.y + hang, px: end.x, py: end.y + hang, w: 0.25 };

            return true;
        }


        /* ---- Physics ---- */

        function integrate(p, gravity, damping) {
            if (!p.w) return;

            let vx = (p.x - p.px) * damping;
            let vy = (p.y - p.py) * damping;

            const speed = Math.hypot(vx, vy);
            if (speed > MAX_SPEED) {
                vx *= MAX_SPEED / speed;
                vy *= MAX_SPEED / speed;
            }

            p.px = p.x;
            p.py = p.y;
            p.x += vx;
            p.y += vy + gravity;
        }

        // Keep two points exactly "len" apart
        function link(a, b, len) {
            const total = a.w + b.w;
            if (!total) return;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.0001;
            const k = (dist - len) / dist / total;

            a.x += dx * k * a.w;
            a.y += dy * k * a.w;
            b.x -= dx * k * b.w;
            b.y -= dy * k * b.w;
        }

        function step(dt) {
            const gravity = 1700 * dt * dt;
            const damping = 0.994;

            for (let i = 1; i <= SEGMENTS; i++) integrate(rope[i], gravity, damping);

            if (dragging) {
                // The card follows the pointer; the rope follows the card
                tail.w = 0;
                tail.px = tail.x;
                tail.py = tail.y;

                let tx = pointer.x - grab.x;
                let ty = pointer.y - grab.y;

                const dx = tx - rope[0].x;
                const dy = ty - rope[0].y;
                const dist = Math.hypot(dx, dy);
                const limit = reach * 0.985;

                if (dist > limit) {
                    tx = rope[0].x + (dx / dist) * limit;
                    ty = rope[0].y + (dy / dist) * limit;
                }

                tail.x = tx;
                tail.y = ty;
            } else {
                tail.w = 0.25;
                integrate(tail, gravity, damping);
            }

            for (let k = 0; k < 12; k++) {
                for (let i = 0; i < SEGMENTS; i++) link(rope[i], rope[i + 1], segLen);
                link(rope[SEGMENTS], tail, hang);
            }

            // Stay inside the stage
            const minX = cardW / 2 + 6;
            const maxX = W - cardW / 2 - 6;
            const maxY = H - cardH / 2 - 14;

            tail.x = Math.min(maxX, Math.max(minX, tail.x));
            tail.y = Math.min(maxY, tail.y);

            for (let i = 1; i <= SEGMENTS; i++) {
                rope[i].x = Math.min(W - 8, Math.max(8, rope[i].x));
            }
        }


        /* ---- Draw ---- */

        function render() {
            const end = rope[SEGMENTS];

            // Card hangs from the end of the rope and tilts with it
            const angle = Math.atan2(-(tail.x - end.x), tail.y - end.y);

            idCard.style.transform =
                'translate(' + (end.x - cardW / 2).toFixed(2) + 'px,' + end.y.toFixed(2) + 'px) ' +
                'rotate(' + angle.toFixed(4) + 'rad)';

            // Strap: a smooth curve through the rope points
            let d = 'M' + rope[0].x.toFixed(1) + ' ' + rope[0].y.toFixed(1);

            for (let i = 1; i < SEGMENTS; i++) {
                const mx = (rope[i].x + rope[i + 1].x) / 2;
                const my = (rope[i].y + rope[i + 1].y) / 2;
                d += ' Q' + rope[i].x.toFixed(1) + ' ' + rope[i].y.toFixed(1) +
                     ' ' + mx.toFixed(1) + ' ' + my.toFixed(1);
            }

            d += ' L' + end.x.toFixed(1) + ' ' + end.y.toFixed(1);

            band.setAttribute('d', d);
            stitch.setAttribute('d', d);
        }


        /* ---- Animation loop (sleeps when still or off-screen) ---- */

        function frame(time) {
            rafId = 0;
            if (!visible || document.hidden) return;

            const dt = Math.min(0.033, Math.max(0.001, (time - lastTime) / 1000 || 0.016));
            lastTime = time;

            step(dt / 2);
            step(dt / 2);
            render();

            const motion = Math.abs(tail.x - tail.px) + Math.abs(tail.y - tail.py);
            calm = (!dragging && motion < 0.015) ? calm + 1 : 0;

            if (calm > 45) return;   // settled: stop using the CPU

            rafId = requestAnimationFrame(frame);
        }

        function wake() {
            calm = 0;
            if (rafId || !visible || reduceMotion || !tail) return;
            lastTime = performance.now();
            rafId = requestAnimationFrame(frame);
        }

        function nudge(amount) {
            if (!tail) return;
            tail.px -= amount;
            rope[SEGMENTS].px -= amount * 0.4;
            wake();
        }

        function setup() {
            if (!build()) return;
            idStage.classList.add('is-live');
            render();
        }


        /* ---- Mouse / touch ---- */

        function updatePointer(event) {
            const box = idStage.getBoundingClientRect();
            pointer.x = event.clientX - box.left;
            pointer.y = event.clientY - box.top;
        }

        function release(event) {
            if (!dragging) return;
            dragging = false;
            idCard.classList.remove('is-dragging');
            try { idCard.releasePointerCapture(event.pointerId); } catch (e) { /* ignore */ }
            wake();
        }

        if (!reduceMotion) {

            idCard.addEventListener('pointerdown', (event) => {
                if (!tail || (event.pointerType === 'mouse' && event.button !== 0)) return;

                updatePointer(event);
                grab.x = pointer.x - tail.x;
                grab.y = pointer.y - tail.y;

                dragging = true;
                idCard.classList.add('is-dragging');
                idCard.setPointerCapture(event.pointerId);
                wake();
            });

            idCard.addEventListener('pointermove', (event) => {
                if (dragging) updatePointer(event);
            });

            idCard.addEventListener('pointerup', release);
            idCard.addEventListener('pointercancel', release);

            // Keyboard: Enter or Space gives it a swing
            idCard.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    nudge(22);
                }
            });
        }


        /* ---- Start, resize, visibility ---- */

        setup();

        if ('IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
                visible = entries[0].isIntersecting;

                if (visible) {
                    if (!introDone && !reduceMotion) {
                        introDone = true;
                        nudge(14);   // one small swing when it first appears
                    }
                    wake();
                }
            }, { threshold: 0.2 }).observe(idStage);
        } else {
            visible = true;
            wake();
        }

        if ('ResizeObserver' in window) {
            let pending = 0;

            const resizeWatcher = new ResizeObserver(() => {
                cancelAnimationFrame(pending);
                pending = requestAnimationFrame(() => {
                    setup();
                    wake();
                });
            });

            resizeWatcher.observe(idStage);
            resizeWatcher.observe(idCard);
        }

        document.addEventListener('visibilitychange', wake);
    }
})();