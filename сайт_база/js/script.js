// ========== SHARED: LANGUAGE TOGGLE ==========
function toggleLanguage() {
    const langToggle = document.querySelector('.lang-toggle');
    if (langToggle) {
        langToggle.textContent = langToggle.textContent === 'RU' ? 'EN' : 'RU';
    }
}

// ========== SHARED: EKATERINBURG TIME ==========
function updateEkbTime() {
    const timeElement = document.getElementById('ekb-time');
    if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString('ru-RU', {
            timeZone: 'Asia/Yekaterinburg',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

updateEkbTime();
setInterval(updateEkbTime, 1000);

// ========== INDEX: FLOATING IMAGES PHYSICS ==========
const heroSection = document.querySelector('.hero');

if (heroSection) {
    function isMobile() {
        return window.innerWidth <= 768;
    }

    const balls = [];
    const ballElements = document.querySelectorAll('.floating-img');

    function updateBoundaries() {
        return {
            width: heroSection.offsetWidth,
            height: heroSection.offsetHeight
        };
    }

    ballElements.forEach((elem) => {
        const computedStyle = window.getComputedStyle(elem);
        const x = parseFloat(computedStyle.left);
        const y = parseFloat(computedStyle.top);

        balls.push({
            element: elem,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            rotation: 0,
            angularVelocity: 0,
            radius: 200,
            mass: 3
        });
    });

    let mouseX = 0;
    let mouseY = 0;
    const cursorRadius = 20;
    const pushForce = 4;

    document.addEventListener('mousemove', (e) => {
        if (isMobile()) return;

        const heroRect = heroSection.getBoundingClientRect();
        mouseX = e.clientX - heroRect.left;
        mouseY = e.clientY - heroRect.top;
    });

    function animate() {
        if (isMobile()) return;

        const boundaries = updateBoundaries();

        balls.forEach(ball => {
            const dx = mouseX - (ball.x + ball.radius);
            const dy = mouseY - (ball.y + ball.radius);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < ball.radius + cursorRadius) {
                const angle = Math.atan2(dy, dx);
                const force = pushForce;
                ball.vx -= Math.cos(angle) * force;
                ball.vy -= Math.sin(angle) * force;

                ball.angularVelocity += (Math.random() - 0.5) * 3;
            }
        });

        balls.forEach(ball => {
            ball.x += ball.vx;
            ball.y += ball.vy;

            if (ball.x < 0) {
                ball.x = 0;
                ball.vx *= -0.9;
                ball.angularVelocity += ball.vx * 0.05;
            }
            if (ball.x > boundaries.width - ball.radius * 2) {
                ball.x = boundaries.width - ball.radius * 2;
                ball.vx *= -0.9;
                ball.angularVelocity += ball.vx * 0.05;
            }
            if (ball.y < 0) {
                ball.y = 0;
                ball.vy *= -0.9;
                ball.angularVelocity += ball.vy * 0.05;
            }
            if (ball.y > boundaries.height - ball.radius * 2) {
                ball.y = boundaries.height - ball.radius * 2;
                ball.vy *= -0.9;
                ball.angularVelocity += ball.vy * 0.05;
            }

            ball.rotation += ball.angularVelocity;

            ball.vx *= 0.96;
            ball.vy *= 0.96;
            ball.angularVelocity *= 0.95;

            if (Math.abs(ball.vx) < 0.05) ball.vx = 0;
            if (Math.abs(ball.vy) < 0.05) ball.vy = 0;
            if (Math.abs(ball.angularVelocity) < 0.1) ball.angularVelocity = 0;

            ball.element.style.left = ball.x + 'px';
            ball.element.style.top = ball.y + 'px';
            ball.element.style.transform = `rotate(${ball.rotation}deg)`;
        });

        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const ball1 = balls[i];
                const ball2 = balls[j];

                const dx = (ball2.x + ball2.radius) - (ball1.x + ball1.radius);
                const dy = (ball2.y + ball2.radius) - (ball1.y + ball1.radius);
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = ball1.radius + ball2.radius;

                if (distance < minDist) {
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    const vx1 = ball1.vx * cos + ball1.vy * sin;
                    const vy1 = ball1.vy * cos - ball1.vx * sin;
                    const vx2 = ball2.vx * cos + ball2.vy * sin;
                    const vy2 = ball2.vy * cos - ball2.vx * sin;

                    const vx1Final = vx2;
                    const vx2Final = vx1;

                    ball1.vx = vx1Final * cos - vy1 * sin;
                    ball1.vy = vy1 * cos + vx1Final * sin;
                    ball2.vx = vx2Final * cos - vy2 * sin;
                    ball2.vy = vy2 * cos + vx2Final * sin;

                    const impactForce = Math.sqrt(vx1Final * vx1Final + vy1 * vy1);
                    ball1.angularVelocity += impactForce * 0.2 * (Math.random() - 0.5);
                    ball2.angularVelocity -= impactForce * 0.2 * (Math.random() - 0.5);

                    const overlap = minDist - distance;
                    const moveX = overlap * cos / 2;
                    const moveY = overlap * sin / 2;
                    ball1.x -= moveX;
                    ball1.y -= moveY;
                    ball2.x += moveX;
                    ball2.y += moveY;
                }
            }
        }

        requestAnimationFrame(animate);
    }

    if (!isMobile()) {
        animate();
    }

    window.addEventListener('resize', () => {
        if (isMobile()) return;

        const boundaries = updateBoundaries();
        balls.forEach(ball => {
            if (ball.x > boundaries.width - ball.radius * 2) ball.x = boundaries.width - ball.radius * 2;
            if (ball.y > boundaries.height - ball.radius * 2) ball.y = boundaries.height - ball.radius * 2;
            if (ball.x < 0) ball.x = 0;
            if (ball.y < 0) ball.y = 0;
        });
    });
}

// ========== PROJECT: LIGHTBOX (глобальные функции для onclick в HTML) ==========
let lbSrcs = [];
let lbIndex = 0;

function openLightbox(i) {
    lbIndex = i;
    lbRender();
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
}

function lbShift(dir) {
    lbIndex = (lbIndex + dir + lbSrcs.length) % lbSrcs.length;
    lbRender();
}

function lbRender() {
    document.getElementById('lb-img').src = lbSrcs[lbIndex];
    document.getElementById('lb-counter').textContent = (lbIndex + 1) + ' / ' + lbSrcs.length;
}

// ========== PROJECT: CAROUSEL ==========
const track = document.getElementById('carousel-track');

if (track) {
    const slides  = track.querySelectorAll('.carousel-slide');
    const counter = document.getElementById('car-counter');
    const total   = slides.length;
    let carIndex  = 0;

    function carGo(idx) {
        carIndex = (idx + total) % total;
        track.style.transform = `translateX(-${carIndex * 100}%)`;
        counter.textContent = (carIndex + 1) + ' / ' + total;
    }

    document.getElementById('car-prev').addEventListener('click', e => {
        e.stopPropagation();
        carGo(carIndex - 1);
    });

    document.getElementById('car-next').addEventListener('click', e => {
        e.stopPropagation();
        carGo(carIndex + 1);
    });

    document.getElementById('carousel').addEventListener('click', () => {
        openLightbox(carIndex);
    });

    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) carGo(dx < 0 ? carIndex + 1 : carIndex - 1);
    }, { passive: true });

    // Инициализация лайтбокса
    lbSrcs = Array.from(slides).map(s => s.querySelector('img').src);

    document.getElementById('lightbox').addEventListener('click', function(e) {
        if (e.target === this) closeLightbox();
    });

    document.addEventListener('keydown', e => {
        const lb = document.getElementById('lightbox');
        if (lb.classList.contains('open')) {
            if (e.key === 'ArrowRight') lbShift(1);
            if (e.key === 'ArrowLeft')  lbShift(-1);
            if (e.key === 'Escape')     closeLightbox();
        } else {
            if (e.key === 'ArrowRight') carGo(carIndex + 1);
            if (e.key === 'ArrowLeft')  carGo(carIndex - 1);
        }
    });
}

// ========== PROJECT: SLIDER (точки + автопрокрутка + лайтбокс) ==========
(function () {
    const sliderTrack = document.getElementById('slider-track');
    if (!sliderTrack) return;

    const sliderEl  = document.getElementById('slider');
    const prevBtn   = document.getElementById('slider-prev');
    const nextBtn   = document.getElementById('slider-next');
    const counterEl = document.getElementById('slider-counter');
    const dotsEl    = document.getElementById('slider-dots');
    const lb        = document.getElementById('lightbox');

    const slides = sliderTrack.querySelectorAll('.slider-slide');
    const total  = slides.length;
    if (!total) return;

    let current   = 0;
    let autoTimer = null;

    // ── Генерация точек-индикаторов ──
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Слайд ' + (i + 1));
        dot.addEventListener('click', e => { e.stopPropagation(); goTo(i); resetAuto(); });
        dotsEl.appendChild(dot);
    });

    // ── Переход к слайду ──
    function goTo(idx) {
        current = (idx + total) % total;
        sliderTrack.style.transform = 'translateX(-' + (current * 100) + '%)';
        counterEl.textContent = (current + 1) + ' / ' + total;
        dotsEl.querySelectorAll('.slider-dot').forEach((d, i) => {
            d.classList.toggle('active', i === current);
        });
    }

    // ── Кнопки стрелок ──
    prevBtn.addEventListener('click', e => { e.stopPropagation(); goTo(current - 1); resetAuto(); });
    nextBtn.addEventListener('click', e => { e.stopPropagation(); goTo(current + 1); resetAuto(); });

    // ── Touch-свайп ──
    let touchX = 0;
    sliderTrack.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    sliderTrack.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) { goTo(dx < 0 ? current + 1 : current - 1); resetAuto(); }
    }, { passive: true });

    // ── Клавиатура + лайтбокс ──
    document.addEventListener('keydown', e => {
        if (lb && lb.classList.contains('open')) {
            if (e.key === 'ArrowRight') lbShift(1);
            if (e.key === 'ArrowLeft')  lbShift(-1);
            if (e.key === 'Escape')     closeLightbox();
        } else {
            if (e.key === 'ArrowRight') { goTo(current + 1); resetAuto(); }
            if (e.key === 'ArrowLeft')  { goTo(current - 1); resetAuto(); }
        }
    });

    // ── Клик на слайдер → лайтбокс ──
    lbSrcs = Array.from(slides).map(s => s.querySelector('img').src);
    sliderEl.addEventListener('click', () => openLightbox(current));
    if (lb) lb.addEventListener('click', function (e) { if (e.target === this) closeLightbox(); });

    // ── Автопрокрутка (пауза на ховере) ──
    function startAuto() { autoTimer = setInterval(() => goTo(current + 1), 5000); }
    function stopAuto()  { clearInterval(autoTimer); autoTimer = null; }
    function resetAuto() { stopAuto(); startAuto(); }

    sliderEl.addEventListener('mouseenter', stopAuto);
    sliderEl.addEventListener('mouseleave', startAuto);

    // ── Инициализация ──
    goTo(0);
    startAuto();
})();

// ========== ABOUT: SECTION SWITCHER ==========
function showSection(num) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById('section-' + num).classList.add('active');

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => item.classList.remove('active'));
    menuItems[num - 1].classList.add('active');
}
