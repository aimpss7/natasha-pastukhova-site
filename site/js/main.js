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

// ========== PROJECT: SLIDER ==========
function initProjectSlider(config) {
    const track = document.getElementById(config.trackId);
    if (!track) return;

    const slides = track.querySelectorAll(config.slideSelector);
    const counter = document.getElementById(config.counterId);
    const prev = document.getElementById(config.prevId);
    const next = document.getElementById(config.nextId);
    const dotsContainer = document.getElementById(config.dotsId);
    const container = document.getElementById(config.containerId);
    const total = slides.length;
    let currentIndex = 0;

    if (!total) return;

    const dots = dotsContainer ? Array.from({ length: total }, (_, index) => {
        const dot = document.createElement('button');
        dot.className = `slider-dot${index === 0 ? ' active' : ''}`;
        dot.type = 'button';
        dot.setAttribute('aria-label', `Фото ${index + 1}`);
        dot.addEventListener('click', e => {
            e.stopPropagation();
            go(index);
        });
        dotsContainer.appendChild(dot);
        return dot;
    }) : [];

    function go(index) {
        currentIndex = (index + total) % total;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        if (counter) counter.textContent = `${currentIndex + 1} / ${total}`;
        dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === currentIndex));
    }

    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) go(dx < 0 ? currentIndex + 1 : currentIndex - 1);
    }, { passive: true });

    const imageSrcs = Array.from(slides).map(slide => slide.querySelector('img')?.src).filter(Boolean);
    if (Lightbox.setSources) Lightbox.setSources(imageSrcs);

    if (prev) {
        prev.addEventListener('click', e => {
            e.stopPropagation();
            go(currentIndex - 1);
        });
    }

    if (next) {
        next.addEventListener('click', e => {
            e.stopPropagation();
            go(currentIndex + 1);
        });
    }

    if (container) {
        container.addEventListener('click', () => {
            if (Lightbox.open) Lightbox.open(currentIndex);
        });
    }

    document.addEventListener('keydown', e => {
        const lightboxEl = document.getElementById('lightbox');
        if (lightboxEl && lightboxEl.classList.contains('open')) return;
        if (e.key === 'ArrowRight') go(currentIndex + 1);
        if (e.key === 'ArrowLeft') go(currentIndex - 1);
    });
}

initProjectSlider({
    containerId: 'slider',
    trackId: 'slider-track',
    slideSelector: '.slider-slide',
    counterId: 'slider-counter',
    prevId: 'slider-prev',
    nextId: 'slider-next',
    dotsId: 'slider-dots'
});

initProjectSlider({
    containerId: 'carousel',
    trackId: 'carousel-track',
    slideSelector: '.carousel-slide',
    counterId: 'car-counter',
    prevId: 'car-prev',
    nextId: 'car-next',
    dotsId: ''
});

// ========== INDEX: DYNAMIC PROJECTS GRID ==========
const projectsGrid = document.getElementById('cards-start');

if (projectsGrid) {
    // Встроенные данные на случай, если fetch не сработает (например, при открытии file://)
    const FALLBACK_PROJECTS = [
        {
            id: "dushi-ne-chayu-yaroslavl",
            name: "Души не чаю",
            year: 2023,
            category: "Мурал",
            cover: "assets/images/projects/dushi-ne-chayu-yaroslavl/cover.jpg",
            url: "",
            location: "Ярославль",
            desc: "Мурал для проекта «Души не чаю».",
            rotation: 0.11
        },
        {
            id: "mayak",
            name: "Маяк",
            year: 2024,
            category: "Мурал",
            cover: "assets/images/projects/mayak/cover.jpg",
            url: "",
            location: "Екатеринбург",
            desc: "Роспись маяка в Екатеринбурге.",
            rotation: 0.04
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

    function getPublicDescription(project) {
        const desc = project.desc || project.description || '';
        if (/черновая карточка|v0|needs-real-photo/i.test(desc)) return '';
        return desc;
    }

    function renderProjects(projects) {
        projects = (projects || []).filter(project => !project.hidden);

        if (!projects || !projects.length) {
            projectsGrid.innerHTML = '<p style="padding:40px;color:#666;">Проекты не найдены.</p>';
            return;
        }

        let html = '';
        const layoutPattern = [
            'layout-half',
            'layout-half',
            'layout-full',
            'layout-third',
            'layout-third',
            'layout-third',
            'layout-full',
            'layout-half',
            'layout-half',
            'layout-third',
            'layout-third',
            'layout-third',
            'layout-half',
            'layout-half'
        ];

        html += '<div class="projects-layout">';

        projects.forEach((p, index) => {
            const sourceRotation = typeof p.rotation === 'number' ? p.rotation : (Math.random() - 0.5) * 0.12;
            const rot = Math.max(-0.06, Math.min(0.06, sourceRotation)).toFixed(4);
            const title = p.name || p.title || '';
            const img   = fixPath(p.cover || p.image || '');
            const url   = fixPath(p.url);
            const desc  = getPublicDescription(p);
            const meta  = [p.year, p.location, p.category].filter(Boolean).join(' · ');
            const layoutClass = layoutPattern[index % layoutPattern.length];
            const storyImages = (p.storyImages || p.images || []).map(fixPath).filter(Boolean);
            const isStory = p.story && storyImages.length > 1;
            const cardClass = `card ${layoutClass}${url || isStory ? '' : ' card-disabled'}${isStory ? ' story-card' : ''}`;

            if (isStory) {
                html += `
            <article class="${cardClass}" data-project-id="${p.id}">
                <div class="story-media" style="--base-rotation: ${rot}deg;">
                    <img src="${storyImages[0]}" alt="${title}">
                    <div class="story-progress">
                        ${storyImages.map((_, dotIndex) => `<span class="${dotIndex === 0 ? 'active' : ''}"></span>`).join('')}
                    </div>
                    <button class="story-btn story-prev" type="button" aria-label="Предыдущее фото"><span class="visually-hidden">Предыдущее фото</span></button>
                    <button class="story-btn story-next" type="button" aria-label="Следующее фото"><span class="visually-hidden">Следующее фото</span></button>
                    <div class="story-counter visually-hidden" aria-live="polite">1 из ${storyImages.length}</div>
                </div>
                <div class="story-copy">
                    <h3>${title}</h3>
                    <div class="card-meta">${meta}</div>
                    ${desc ? `<p class="card-desc">${desc}</p>` : ''}
                    ${url ? `<a class="story-open" href="${url}" aria-label="Открыть проект ${title}" title="Открыть проект"></a>` : ''}
                </div>
            </article>`;
                return;
            }

            const cardInner = `
                <div class="card-img" style="--base-rotation: ${rot}deg;">
                    <img src="${img}" alt="${title}">
                </div>
                <h3>${title}</h3>
                <div class="card-meta">${meta}</div>
                ${desc ? `<p class="card-desc">${desc}</p>` : ''}`;

            html += url ? `
            <a href="${url}" class="${cardClass}">${cardInner}</a>` : `
            <div class="${cardClass}" aria-disabled="true">${cardInner}</div>`;
        });
        html += '</div>';

        projectsGrid.innerHTML = html;
        initStoryCards(projects);
    }

    function initStoryCards(projects) {
        const byId = new Map(projects.map(project => [project.id, project]));

        projectsGrid.querySelectorAll('.story-card').forEach(card => {
            const project = byId.get(card.dataset.projectId);
            const images = ((project && (project.storyImages || project.images)) || []).map(fixPath).filter(Boolean);
            if (images.length < 2) return;

            let current = 0;
            const img = card.querySelector('.story-media img');
            const counter = card.querySelector('.story-counter');
            const dots = card.querySelectorAll('.story-progress span');

            function show(next) {
                current = (next + images.length) % images.length;
                img.src = images[current];
                counter.textContent = `${current + 1} из ${images.length}`;
                dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === current));
            }

            card.querySelector('.story-prev').addEventListener('click', () => show(current - 1));
            card.querySelector('.story-next').addEventListener('click', () => show(current + 1));
        });
    }

    function initFilters(allProjects) {
        const filterContainer = document.querySelector('.project-filters .filters');
        if (!filterContainer) return;

        const buttons = filterContainer.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterText = btn.textContent.trim();
                const categoryMap = {
                    'Murals': ['Мурал'],
                    'Sculptures': ['Инсталляция'],
                    'Муралы': ['Мурал'],
                    'Объекты': ['Инсталляция'],
                    'Объекты и росписи': ['Инсталляция', 'Роспись']
                };
                const categoryFilter = categoryMap[filterText];

                const filteredProjects = categoryFilter ? allProjects.filter(p => categoryFilter.includes(p.category)) : allProjects;
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
