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

// ========== SHARED: EKATERINBURG WEATHER ==========
async function updateEkbWeather() {
    const weatherElement = document.getElementById('weather-temp');
    if (!weatherElement) return;

    const cacheKey = 'ekbWeatherData';
    const cacheDuration = 24 * 60 * 60 * 1000; // 24 часа

    try {
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        if (cachedData && (Date.now() - cachedData.timestamp < cacheDuration)) {
            weatherElement.textContent = `${Math.round(cachedData.data.current_weather.temperature)}°C`;
            return; // Используем данные из кэша
        }
    } catch (e) {
        console.warn('Не удалось прочитать кэш погоды.', e);
    }

    // Если нет валидного кэша, запрашиваем новые данные
    try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=56.8389&longitude=60.6057&current_weather=true&timezone=Asia/Yekaterinburg');
        if (!response.ok) {
            throw new Error(`Сетевой ответ не был успешным: ${response.statusText}`);
        }
        const data = await response.json();
        
        weatherElement.textContent = `${Math.round(data.current_weather.temperature)}°C`;

        // Кэшируем новые данные
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data }));
    } catch (error) {
        console.error('Не удалось загрузить данные о погоде:', error);
    }
}

// Первоначальный вызов и установка интервала
updateEkbWeather();
setInterval(updateEkbWeather, 24 * 60 * 60 * 1000);

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

// ========== PROJECT: LIGHTBOX MODULE ==========
const Lightbox = (function() {
    const lightboxEl = document.getElementById('lightbox');
    if (!lightboxEl) return {};

    const imgEl = document.getElementById('lb-img');
    const counterEl = document.getElementById('lb-counter');
    let sources = [];
    let currentIndex = 0;

    function render() {
        if (!imgEl || !counterEl) return;
        imgEl.src = sources[currentIndex];
        counterEl.textContent = `${currentIndex + 1} / ${sources.length}`;
    }

    function open(index = 0) {
        currentIndex = index;
        render();
        lightboxEl.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        lightboxEl.classList.remove('open');
        document.body.style.overflow = '';
    }

    function shift(dir) {
        currentIndex = (currentIndex + dir + sources.length) % sources.length;
        render();
    }

    function setSources(srcs) {
        sources = srcs;
    }

    lightboxEl.addEventListener('click', e => {
        if (e.target === lightboxEl) close();
    });

    document.addEventListener('keydown', e => {
        if (!lightboxEl.classList.contains('open')) return;
        if (e.key === 'ArrowRight') shift(1);
        if (e.key === 'ArrowLeft') shift(-1);
        if (e.key === 'Escape') close();
    });

    // Предоставляем публичные методы для управления лайтбоксом
    return { open, setSources };
})();

// ========== PROJECT: CAROUSEL ==========
const track = document.getElementById('carousel-track');

if (track) {
    const slides = track.querySelectorAll('.carousel-slide');
    const counter = document.getElementById('car-counter');
    const total = slides.length;
    let carIndex = 0;

    function carGo(idx) {
        carIndex = (idx + total) % total;
        track.style.transform = `translateX(-${carIndex * 100}%)`;
        counter.textContent = (carIndex + 1) + ' / ' + total;
    }

    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) carGo(dx < 0 ? carIndex + 1 : carIndex - 1);
    }, { passive: true });

    // Инициализация лайтбокса для карусели
    const carouselImageSrcs = Array.from(slides).map(s => s.querySelector('img').src);
    if (Lightbox.setSources) {
        Lightbox.setSources(carouselImageSrcs);
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
        if (Lightbox.open) Lightbox.open(carIndex);
    });

    // Навигация по карусели с клавиатуры, когда лайтбокс закрыт
    document.addEventListener('keydown', e => {
        if (!document.getElementById('lightbox').classList.contains('open')) {
            if (e.key === 'ArrowRight') carGo(carIndex + 1);
            if (e.key === 'ArrowLeft') carGo(carIndex - 1);
        }
    });
}

// ========== INDEX: DYNAMIC PROJECTS GRID ==========
const projectsGrid = document.getElementById('cards-start');

if (projectsGrid) {
    // Встроенные данные на случай, если fetch не сработает (например, при открытии file://)
    const FALLBACK_PROJECTS = [
        {
            id: "project-1",
            name: "Все мои друзья",
            year: 2024,
            category: "Мурал",
            cover: "assets/images/projects/project-1/26-02-11_Lisitsin_Pastuhova_6775-ph.jpg",
            url: "projects/project-1/",
            location: "Екатеринбург",
            desc: "Мурал создан в рамках фестиваля «Стенограффия».",
            rotation: -0.2192
        },
        {
            id: "project-2",
            name: "Название проекта 2",
            year: 2020,
            category: "Мурал",
            cover: "assets/images/project-2.svg",
            url: "projects/project-2/",
            location: "Город",
            desc: "Описание проекта 2.",
            rotation: 0.0958
        }
    ];

    async function loadProjects() {
        try {
            const response = await fetch('assets/data/projects.json');
            if (!response.ok) throw new Error('Network error');
            return await response.json();
        } catch (e) {
            console.warn("Could not fetch projects.json, using fallback data.", e);
            return FALLBACK_PROJECTS;
        }
    }

    // Убираем ведущий / для совместимости с file:// протоколом
    function fixPath(p) {
        if (!p) return p;
        return (location.protocol === 'file:') ? p.replace(/^\//, '') : p;
    }

    function renderProjects(projects) {
        if (!projects || !projects.length) {
            projectsGrid.innerHTML = '<p style="padding:40px;color:#666;">Проекты не найдены.</p>';
            return;
        }

        let html = '';
        const layoutPattern = [
            'layout-standard',
            'layout-standard',
            'layout-large',
            'layout-standard',
            'layout-wide',
            'layout-standard',
            'layout-standard',
            'layout-large',
            'layout-standard',
            'layout-standard',
            'layout-wide',
            'layout-standard'
        ];

        html += '<div class="projects-layout">';
        projects.forEach((p, index) => {
            const rot   = (p.rotation || (Math.random() - 0.5) * 0.5).toFixed(4);
            const title = p.name || p.title || '';
            const img   = fixPath(p.cover || p.image || '');
            const url   = fixPath(p.url);
            const desc  = p.desc || p.description || '';
            const meta  = [p.year, p.location, p.category].filter(Boolean).join(' · ');
            const status = p.status && p.status !== 'published' ? `<span class="card-status">· ${p.status}</span>` : '';
            const layoutClass = p.layoutSize ? `layout-${p.layoutSize}` : layoutPattern[index % layoutPattern.length];
            const cardClass = `card ${layoutClass}${url ? '' : ' card-disabled'}`;
            const cardInner = `
                <div class="card-img" style="--base-rotation: ${rot}deg;">
                    <img src="${img}" alt="${title}">
                </div>
                <h3>${title}</h3>
                <div class="card-meta">${meta}${status}</div>
                ${desc ? `<p class="card-desc">${desc}</p>` : ''}`;

            html += url ? `
            <a href="${url}" class="${cardClass}">${cardInner}</a>` : `
            <div class="${cardClass}" aria-disabled="true">${cardInner}</div>`;
        });
        html += '</div>';

        projectsGrid.innerHTML = html;
    }

    function initFilters(allProjects) {
        const filterContainer = document.querySelector('.hero .filters');
        if (!filterContainer) return;

        const buttons = filterContainer.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterText = btn.textContent.trim();
                const categoryMap = { 'Murals': 'Мурал', 'Sculptures': 'Инсталляция' };
                const categoryFilter = categoryMap[filterText];

                const filteredProjects = categoryFilter ? allProjects.filter(p => p.category === categoryFilter) : allProjects;
                renderProjects(filteredProjects);
            });
        });
    }

    loadProjects().then(projects => {
        renderProjects(projects);
        initFilters(projects);
    });
}

// ========== ABOUT: SECTION SWITCHER ==========
function showSection(num) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById('section-' + num).classList.add('active');

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => item.classList.remove('active'));
    menuItems[num - 1].classList.add('active');
}
