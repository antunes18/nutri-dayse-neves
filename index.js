
// Initialize AOS
document.addEventListener('DOMContentLoaded', function () {
    AOS.init({
        duration: 700,
        once: true,
        offset: 100
    });
});

// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', function () {
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', function () {
            const expanded = this.getAttribute('aria-expanded') === 'true' || false;
            this.setAttribute('aria-expanded', !expanded);
            mainNav.classList.toggle('active');
        });
    }
});

function bookingWidget() {
    return {
        form: { service: 'Avaliação Nutricional', name: '', phone: '' },
        message: '',
        init() {
            // listen to global open event
            window.addEventListener('open-book', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.querySelector('#book-btn').focus();
            });
        },
        confirmBooking() {  // Nome alterado de confirm() para confirmBooking()
            // simple validation
            if (!this.form.name || !this.form.phone) {
                this.message = 'Digite seu nome completo e telefone celular, por favor.';
                return;
            }
            const booking = { ...this.form, createdAt: new Date().toISOString() };
            // save to localStorage (client-side)
            const list = JSON.parse(localStorage.getItem('nutriessence_bookings') || '[]');
            list.push(booking);
            localStorage.setItem('nutriessence_bookings', JSON.stringify(list));

            // prepare whatsapp message (URL-encoded)
            const text = encodeURIComponent(`Olá Dra. Dayse, gostaria de agendar: \nServiço desejado: ${booking.service}\nMeu Nome: ${booking.name}\nTelefone: ${booking.phone}`);
            const wa = `https://wa.me/556298244024?text=${text}`;

            this.message = 'Redirecionando para o WhatsApp...';

            // open WhatsApp in same tab
            window.location.href = wa;

            // gently clear form after a short delay
            setTimeout(() => { this.form = { service: 'Avaliação Nutricional', name: '', phone: '' }; }, 600);
        },
        clearForm() {  // Nome alterado de clear() para clearForm()
            this.form = { service: 'Avaliação Nutricional', name: '', phone: '' };
            this.message = '';
        }
    }
}

/* Pure JS carousel with keyboard + pointer drag + responsive slidesPerView */
(function () {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;

    const slidesEl = carousel.querySelector('.slides');
    const slides = Array.from(carousel.querySelectorAll('.slide'));
    const btnPrev = carousel.querySelector('.carousel-btn.prev');
    const btnNext = carousel.querySelector('.carousel-btn.next');
    const dotsWrap = carousel.querySelector('.carousel-dots');

    let index = 0; // current first visible slide index
    let visible = getVisibleCount();
    let isDragging = false;
    let startX = 0, currentTranslate = 0, animationFrame = null;

    function getVisibleCount() {
        const w = window.innerWidth;
        if (w >= 1000) return 3;
        if (w >= 700) return 2;
        return 1;
    }

    function updateSlideWidthVar() {
        visible = getVisibleCount();
        const widthPct = 100 / visible;
        slides.forEach(s => s.style.setProperty('--slide-width', widthPct + '%'));
    }

    function clampIndex(i) {
        // keep index in range 0..(slides.length - 1)
        const n = slides.length;
        return ((i % n) + n) % n;
    }

    function isVisibleSlide(i) {
        // returns true if slide i is visible given current index and visible count (handles wrap)
        const n = slides.length;
        for (let k = 0; k < visible; k++) {
            if ((index + k) % n === i) return true;
        }
        return false;
    }

    function moveTo(i, smooth = true) {
        index = clampIndex(i);
        const shiftPct = (index * (100 / visible));
        slidesEl.style.transition = smooth ? 'transform 360ms cubic-bezier(.22,.9,.3,1)' : 'none';
        slidesEl.style.transform = `translateX(-${shiftPct}%)`;
        updateAria();
        updateDots();
    }

    function next() { moveTo(index + 1); }
    function prev() { moveTo(index - 1); }

    /* build dots */
    function createDots() {
        dotsWrap.innerHTML = '';
        slides.forEach((_, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'dot';
            b.setAttribute('aria-label', 'Ir para slide ' + (i + 1));
            b.dataset.index = i;
            b.addEventListener('click', () => moveTo(i));
            dotsWrap.appendChild(b);
        });
    }

    function updateDots() {
        const dots = Array.from(dotsWrap.children);
        dots.forEach((d, i) => {
            d.setAttribute('aria-pressed', isVisibleSlide(i) ? 'true' : 'false');
        });
    }

    function updateAria() {
        slides.forEach((s, i) => {
            if (isVisibleSlide(i)) {
                s.removeAttribute('aria-hidden');
                s.inert = false;
            } else {
                s.setAttribute('aria-hidden', 'true');
                // when browser supports inert, it helps: otherwise ignore
                try { s.inert = true; } catch (e) { }
            }
        });
    }

    /* Pointer (drag) handling */
    function onPointerDown(e) {
        isDragging = true;
        startX = (e.touches ? e.touches[0].clientX : e.clientX);
        slidesEl.style.transition = 'none';
        carousel.classList.add('is-dragging');
        // remember current translate
        const computed = getComputedStyle(slidesEl).transform;
        currentTranslate = 0;
        if (computed && computed !== 'none') {
            const mat = new WebKitCSSMatrix(computed);
            currentTranslate = mat.m41; // px
        }
        // prevent text/image drag
        e.preventDefault?.();
    }

    function onPointerMove(e) {
        if (!isDragging) return;
        const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
        const dx = clientX - startX;
        const containerW = carousel.clientWidth;
        // compute percentage move relative to visible size
        const movePct = (dx / containerW) * 100;
        const baseShift = index * (100 / visible);
        slidesEl.style.transform = `translateX(calc(-${baseShift}% + ${movePct}%))`;
    }

    function onPointerUp(e) {
        if (!isDragging) return;
        isDragging = false;
        carousel.classList.remove('is-dragging');
        const endX = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
        const dx = endX - startX;
        const threshold = Math.max(20, carousel.clientWidth * 0.08); // 8% width or 20px
        if (dx < -threshold) {
            next();
        } else if (dx > threshold) {
            prev();
        } else {
            moveTo(index); // reset
        }
    }

    /* keyboard navigation (when carousel focused) */
    function onKeyDown(e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    }

    /* handle resize — recalc visible count and reposition nicely */
    let resizeTimer;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const oldVisible = visible;
            updateSlideWidthVar();
            if (visible !== oldVisible) {
                // clamp index to valid range and update transform without animation
                moveTo(index, false);
            } else {
                // just adjust transform so percent calculations match
                moveTo(index, false);
            }
        }, 120);
    }

    /* init */
    updateSlideWidthVar();
    createDots();
    moveTo(0, false);

    // events
    btnNext.addEventListener('click', next);
    btnPrev.addEventListener('click', prev);

    // pointer (touch & mouse)
    // prefer pointer events if supported
    if (window.PointerEvent) {
        slidesEl.addEventListener('pointerdown', onPointerDown, { passive: false });
        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp, { passive: false });
    } else {
        slidesEl.addEventListener('touchstart', onPointerDown, { passive: false });
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('touchend', onPointerUp, { passive: false });
        slidesEl.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);
    }

    // focus/keyboard handling
    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', onKeyDown);

    // window resize
    window.addEventListener('resize', onResize);

    // Make dots keyboard-focusable & visible state initially
    dotsWrap.querySelectorAll('button').forEach(b => b.setAttribute('tabindex', '0'));

    // expose for debugging (optional)
    // window.__simpleCarousel = { moveTo, next, prev };

})();