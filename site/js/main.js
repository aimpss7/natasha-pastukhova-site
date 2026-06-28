// ========== SHARED: EKATERINBURG TIME ==========
function updateEkbTime() {
    const timeElements = document.querySelectorAll('#ekb-time, [data-ekb-time]');
    if (!timeElements.length) return;

    const ekbTime = new Date().toLocaleTimeString('ru-RU', {
        timeZone: 'Asia/Yekaterinburg',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    timeElements.forEach(element => {
        element.textContent = ekbTime;
    });
}

updateEkbTime();
setInterval(updateEkbTime, 1000);

// ========== SHARED: EKATERINBURG WEATHER ==========
async function updateEkbWeather() {
    const weatherElements = document.querySelectorAll('#weather-temp, [data-weather-temp]');
    if (!weatherElements.length) return;

    const cacheKey = 'ekbWeatherData';
    const cacheDuration = 24 * 60 * 60 * 1000; // 24 часа
    const setWeatherTemp = temp => {
        weatherElements.forEach(element => {
            element.textContent = temp;
            element.hidden = false;
        });
    };

    weatherElements.forEach(element => {
        if (!element.textContent.trim() || element.textContent.trim() === '--°C') {
            element.hidden = true;
        }
    });

    try {
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        if (cachedData && (Date.now() - cachedData.timestamp < cacheDuration)) {
            const cachedTemp = `${Math.round(cachedData.data.current_weather.temperature)}°C`;
            setWeatherTemp(cachedTemp);
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
        const temp = `${Math.round(data.current_weather.temperature)}°C`;
        setWeatherTemp(temp);

        // Кэшируем новые данные
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data }));
    } catch (error) {
        console.error('Не удалось загрузить данные о погоде:', error);
    }
}

// Первоначальный вызов и установка интервала
updateEkbWeather();
setInterval(updateEkbWeather, 24 * 60 * 60 * 1000);

// ========== SHARED: COMPACT HEADER ==========
const siteHeader = document.querySelector('.header');
if (siteHeader) {
    let headerCompact = false;
    let headerTicking = false;

    function updateHeaderState() {
        const shouldCompact = window.scrollY > 32;
        if (shouldCompact === headerCompact) return;
        headerCompact = shouldCompact;
        siteHeader.classList.toggle('is-compact', shouldCompact);
    }

    function requestHeaderState() {
        if (headerTicking) return;
        headerTicking = true;
        window.requestAnimationFrame(() => {
            updateHeaderState();
            headerTicking = false;
        });
    }

    updateHeaderState();
    window.addEventListener('scroll', requestHeaderState, { passive: true });
}

// ========== PROJECT: LIGHTBOX MODULE ==========
const Lightbox = (function() {
    const lightboxEl = document.getElementById('lightbox');
    if (!lightboxEl) return {};

    const imgEl = document.getElementById('lb-img');
    const counterEl = document.getElementById('lb-counter');
    const prevEl = document.getElementById('lb-prev');
    const nextEl = document.getElementById('lb-next');
    const closeEl = document.getElementById('lb-close');
    let sources = [];
    let currentIndex = 0;
    let previousFocus = null;

    function render() {
        if (!imgEl || !counterEl) return;
        imgEl.src = sources[currentIndex];
        counterEl.textContent = `${currentIndex + 1} / ${sources.length}`;
    }

    function open(index = 0) {
        previousFocus = document.activeElement;
        currentIndex = index;
        render();
        lightboxEl.classList.add('open');
        document.body.style.overflow = 'hidden';
        if (closeEl) closeEl.focus();
    }

    function close() {
        lightboxEl.classList.remove('open');
        document.body.style.overflow = '';
        if (previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus();
        }
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

    if (prevEl) {
        prevEl.addEventListener('click', e => {
            e.stopPropagation();
            shift(-1);
        });
    }

    if (nextEl) {
        nextEl.addEventListener('click', e => {
            e.stopPropagation();
            shift(1);
        });
    }

    if (closeEl) {
        closeEl.addEventListener('click', e => {
            e.stopPropagation();
            close();
        });
    }

    document.addEventListener('keydown', e => {
        if (!lightboxEl.classList.contains('open')) return;
        if (e.key === 'ArrowRight') shift(1);
        if (e.key === 'ArrowLeft') shift(-1);
        if (e.key === 'Escape') close();
        if (e.key === 'Tab') {
            const focusable = [closeEl, prevEl, nextEl].filter(Boolean);
            const currentFocusIndex = focusable.indexOf(document.activeElement);
            if (focusable.length && currentFocusIndex !== -1) {
                e.preventDefault();
                const nextFocusIndex = e.shiftKey
                    ? (currentFocusIndex - 1 + focusable.length) % focusable.length
                    : (currentFocusIndex + 1) % focusable.length;
                focusable[nextFocusIndex].focus();
            }
        }
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
        name: "Души не чаю: Ярославль",
        year: 2023,
        category: "Мурал",
        pageReady: true,
        cover: "assets/images/projects/dushi-ne-chayu-yaroslavl/cover.jpg",
        location: "Ярославль",
        desc: "Мурал для проекта «Души не чаю».",
        rotation: 0.11
    },
    {
        id: "mayak",
        name: "Маяк",
        year: 2024,
        category: "Роспись",
        pageReady: true,
        cover: "assets/images/projects/mayak/cover.jpg",
        location: "Екатеринбург",
        desc: "Роспись объекта в Екатеринбурге.",
        rotation: 0.04
    }
];

async function loadProjectsData() {
    try {
        const response = await fetch('assets/data/projects.json?v=site-v1-6', { cache: 'no-store' });
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

function hasProjectDetailPage(project) {
    return Boolean(project && !project.hidden && project.id);
}

function projectUrl(project) {
    if (!project || !project.id || !hasProjectDetailPage(project)) return '';
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
    function heroCandidates(projects) {
        const preferred = [
            'mayak',
            'dushi-ne-chayu-yaroslavl',
            'moroshka',
            'wooden-idols',
            'moon-cycle',
            'sea-stones'
        ];
        const visible = (projects || []).filter(project => !project.hidden && (project.cover || (project.images && project.images.length)));
        return preferred
            .map(id => visible.find(project => project.id === id))
            .filter(Boolean)
            .concat(visible.filter(project => !preferred.includes(project.id)))
            .slice(0, 6);
    }

    function renderHeroWorks(projects) {
        const heroImage = document.querySelector('[data-hero-image]');
        const heroLink = document.querySelector('[data-hero-link]');
        const heroCaption = document.querySelector('[data-hero-caption]');
        const heroWorks = document.querySelector('[data-hero-works]');
        if (!heroImage) return;

        const items = heroCandidates(projects);
        if (!items.length) return;

        function show(project, index) {
            const title = project.name || project.title || '';
            const src = fixPath(project.cover || projectImages(project)[0] || '');
            const meta = [project.year, project.location, project.category].filter(Boolean).join(' · ');
            const cardAnchor = project.id ? `#work-${project.id}` : '#cards-start';
            const detailUrl = projectUrl(project);

            if (src) heroImage.src = src;
            heroImage.alt = title;
            if (heroCaption) heroCaption.textContent = [title, meta].filter(Boolean).join(' · ');
            if (heroLink) {
                heroLink.href = detailUrl || cardAnchor;
                heroLink.setAttribute('aria-label', detailUrl ? `Открыть проект ${title}` : `Перейти к карточке проекта ${title}`);
            }
            if (heroWorks) {
                heroWorks.querySelectorAll('.hero-work').forEach((button, buttonIndex) => {
                    button.classList.toggle('active', buttonIndex === index);
                    button.setAttribute('aria-pressed', String(buttonIndex === index));
                });
            }
        }

        if (heroWorks) {
            heroWorks.innerHTML = '';
        }

        show(items[0], 0);

        if (items.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            let current = 0;
            window.setInterval(() => {
                current = (current + 1) % items.length;
                show(items[current], current);
            }, 6000);
        }
    }

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
            'layout-large',
            'layout-third',
            'layout-third',
            'layout-third',
            'layout-third',
            'layout-large',
            'layout-third',
            'layout-half',
            'layout-half',
            'layout-third',
            'layout-third',
            'layout-third'
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

            const anchorId = p.id ? ` id="work-${escapeHtml(p.id)}"` : '';

            if (isStory) {
                html += `
            <article class="${cardClass}"${anchorId} data-project-id="${p.id}">
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
            <a href="${url}" class="${cardClass}"${anchorId}>${cardInner}</a>` : `
            <div class="${cardClass}"${anchorId} aria-disabled="true">${cardInner}</div>`;
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
            murals: ['Мурал'],
            'objects-paintings': ['Инсталляция', 'Роспись']
        };

        function applyFilter(btn) {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const categoryFilter = categoryMap[btn.dataset.filter || 'murals'];
            const filteredProjects = categoryFilter ? visibleProjects.filter(p => categoryFilter.includes(p.category)) : visibleProjects;
            renderProjects(filteredProjects, { showCategoryInMeta: !categoryFilter });
        }

        buttons.forEach(btn => {
            btn.addEventListener('click', () => applyFilter(btn));
        });

        const initialButton = filterContainer.querySelector('.filter-btn.active') || buttons[0];
        if (initialButton) applyFilter(initialButton);
    }

    loadProjectsData().then(projects => {
        renderHeroWorks(projects);
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
        const url = projectUrl(project);
        const inner = `
                <div class="card-img">
                    <img src="${fixPath(project.cover || project.image || '')}" alt="${title}">
                </div>
                <h3>${title}</h3>
                <div class="card-meta">${escapeHtml(meta)}</div>`;

        if (!url) {
            return `<div class="card card-disabled" aria-disabled="true">${inner}</div>`;
        }

        return `
            <a class="card" href="${url}">${inner}</a>`;
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
        const detailProjects = visibleProjects.filter(hasProjectDetailPage);
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id') || (detailProjects[0] && detailProjects[0].id);
        const project = detailProjects.find(item => item.id === id);

        if (!project) {
            window.location.replace('index.html#cards-start');
            return;
        }

        renderProject(detailProjects, project);
    });
}

// ========== ABOUT: SECTION SWITCHER ==========
function showSection(num) {
    const sections = document.querySelectorAll('.section');
    sections.forEach((section, index) => {
        const isActive = index === num - 1;
        section.classList.toggle('active', isActive);
        section.setAttribute('role', 'tabpanel');
        section.hidden = !isActive;
    });

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach((item, index) => {
        const isActive = index === num - 1;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-selected', String(isActive));
    });
}

showSection(1);
