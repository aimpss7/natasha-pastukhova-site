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

// ========== SHARED: PROJECT DATA ==========
const FALLBACK_PROJECTS = [
    {
        id: "dushi-ne-chayu-yaroslavl",
        name: "Души не чаю - Ярославль",
        year: 2023,
        category: "Мурал",
        cover: "assets/images/projects/dushi-ne-chayu-yaroslavl/cover.jpg",
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
        location: "Екатеринбург",
        desc: "Роспись маяка в Екатеринбурге.",
        rotation: 0.04
    }
];

async function loadProjectsData() {
    try {
        const response = await fetch('assets/data/projects.json?v=site-v1-3', { cache: 'no-store' });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (e) {
        console.warn("Could not fetch projects.json, using fallback data.", e);
        return FALLBACK_PROJECTS;
    }
}

function fixPath(p) {
    if (!p) return p;
    return (location.protocol === 'file:') ? p.replace(/^\//, '') : p;
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function projectUrl(project) {
    if (!project || !project.id || project.hidden) return '';
    return fixPath(project.url || `project.html?id=${encodeURIComponent(project.id)}`);
}

function projectImages(project) {
    return ((project && (project.images || project.storyImages)) || [project && project.cover])
        .map(fixPath)
        .filter(Boolean);
}

// ========== INDEX: DYNAMIC PROJECTS GRID ==========
const projectsGrid = document.getElementById('cards-start');

if (projectsGrid) {
    function getPublicDescription(project) {
        const desc = project.desc || project.description || '';
        if (/черновая карточка|v0|needs-real-photo/i.test(desc)) return '';
        return desc;
    }

    function renderProjects(projects, options = {}) {
        projects = (projects || []).filter(project => !project.hidden);
        const showCategoryInMeta = options.showCategoryInMeta !== false;

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
            const sourceRotation = typeof p.rotation === 'number' ? p.rotation : 0;
            const rot = Math.max(-0.06, Math.min(0.06, sourceRotation)).toFixed(4);
            const title = p.name || p.title || '';
            const img   = fixPath(p.cover || p.image || '');
            const url   = projectUrl(p);
            const desc  = getPublicDescription(p);
            const metaParts = [p.year, p.location];
            if (showCategoryInMeta) metaParts.push(p.category);
            const meta  = metaParts.filter(Boolean).join(' · ');
            const layoutClass = layoutPattern[index % layoutPattern.length];
            const storyImages = projectImages(p);
            const isStory = p.story && storyImages.length > 1;
            const cardClass = `card ${layoutClass}${url || isStory ? '' : ' card-disabled'}${isStory ? ' story-card' : ''}`;

            if (isStory) {
                html += `
            <article class="${cardClass}" data-project-id="${p.id}">
                <div class="story-media" style="--base-rotation: ${rot}deg;">
                    ${url ? `<a class="story-photo-link" href="${url}" aria-label="Открыть проект ${title}">` : ''}
                        <img src="${storyImages[0]}" alt="${title}">
                    ${url ? '</a>' : ''}
                    <div class="story-progress">
                        ${storyImages.map((_, dotIndex) => `<span class="${dotIndex === 0 ? 'active' : ''}"></span>`).join('')}
                    </div>
                    <button class="story-btn story-prev" type="button" aria-label="Предыдущее фото"><span class="visually-hidden">Предыдущее фото</span></button>
                    <button class="story-btn story-next" type="button" aria-label="Следующее фото"><span class="visually-hidden">Следующее фото</span></button>
                    <div class="story-counter visually-hidden" aria-live="polite">1 из ${storyImages.length}</div>
                </div>
                <div class="story-copy">
                    <h3>${url ? `<a href="${url}">${title}</a>` : title}</h3>
                    <div class="card-meta">${meta}</div>
                    ${desc ? `<p class="card-desc">${desc}</p>` : ''}
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

        const visibleProjects = (allProjects || []).filter(project => !project.hidden);
        const buttons = filterContainer.querySelectorAll('.filter-btn');
        const categoryMap = {
            all: null,
            murals: ['Мурал'],
            'objects-paintings': ['Инсталляция', 'Роспись']
        };

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const categoryFilter = categoryMap[btn.dataset.filter || 'all'];
                const filteredProjects = categoryFilter ? visibleProjects.filter(p => categoryFilter.includes(p.category)) : visibleProjects;
                renderProjects(filteredProjects, { showCategoryInMeta: !categoryFilter });
            });
        });
    }

    loadProjectsData().then(projects => {
        renderProjects(projects);
        initFilters(projects);
    });
}

// ========== PROJECT: DATA-DRIVEN PAGE ==========
const projectPage = document.getElementById('project-page');

if (projectPage) {
    function renderCredits(project) {
        if (project.credits && project.credits.length) {
            return project.credits.map(item => `<p>${item}</p>`).join('');
        }

        const rows = [
            project.year,
            project.location,
            project.category
        ].filter(Boolean);

        return rows.length ? `<p>${rows.map(escapeHtml).join('<br>')}</p>` : '';
    }

    function renderProjectCard(project) {
        const title = escapeHtml(project.name || project.title || '');
        const meta = [project.year, project.location, project.category].filter(Boolean).join(' · ');
        return `
            <a class="card" href="${projectUrl(project)}">
                <div class="card-img">
                    <img src="${fixPath(project.cover || project.image || '')}" alt="${title}">
                </div>
                <h3>${title}</h3>
                <div class="card-meta">${escapeHtml(meta)}</div>
            </a>`;
    }

    function renderProject(projects, project) {
        const images = projectImages(project);
        const title = escapeHtml(project.name || project.title || 'Проект');
        const meta = [project.year, project.location, project.category].filter(Boolean).join(' · ');
        const otherProjects = projects
            .filter(item => !item.hidden && item.id !== project.id)
            .slice(0, 4);

        document.title = `Наташа Пастухова — ${title}`;

        projectPage.innerHTML = `
            <article class="project-top">
                <div class="project-image-col">
                    <div class="slider" id="slider">
                        <div class="slider-track" id="slider-track">
                            ${images.map((src, index) => `
                                <div class="slider-slide">
                                    <img src="${src}" alt="${title} — ${index + 1}">
                                </div>`).join('')}
                        </div>
                        ${images.length > 1 ? `
                            <button class="slider-btn slider-prev" id="slider-prev" aria-label="Предыдущее фото">←</button>
                            <button class="slider-btn slider-next" id="slider-next" aria-label="Следующее фото">→</button>
                            <div class="slider-counter" id="slider-counter">1 / ${images.length}</div>
                            <div class="slider-dots" id="slider-dots"></div>
                        ` : ''}
                    </div>
                </div>

                <div class="project-info-col">
                    <a class="project-back" href="index.html#cards-start">← Все работы</a>
                    <h1 class="project-title">${title}</h1>
                    <div class="project-body">
                        <p class="project-description">${escapeHtml(project.desc || project.description || 'Описание проекта будет добавлено позже.')}</p>
                        <div class="project-credits">
                            ${renderCredits(project)}
                        </div>
                    </div>
                </div>
            </article>

            <section class="next-projects">
                <div class="next-label">Другие работы</div>
                <div class="next-grid">${otherProjects.map(renderProjectCard).join('')}</div>
            </section>`;

        initProjectSlider({
            containerId: 'slider',
            trackId: 'slider-track',
            slideSelector: '.slider-slide',
            counterId: 'slider-counter',
            prevId: 'slider-prev',
            nextId: 'slider-next',
            dotsId: 'slider-dots'
        });
    }

    loadProjectsData().then(projects => {
        const visibleProjects = projects.filter(project => !project.hidden);
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id') || (visibleProjects[0] && visibleProjects[0].id);
        const project = visibleProjects.find(item => item.id === id) || visibleProjects[0];

        if (!project) {
            projectPage.innerHTML = '<div class="project-loading">Проекты не найдены.</div>';
            return;
        }

        renderProject(visibleProjects, project);
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
