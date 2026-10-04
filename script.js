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
            '.about-card',
            '.about-photo',
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

})();