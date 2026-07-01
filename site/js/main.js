// ========== SHARED: EKATERINBURG TIME ==========
function updateEkbTime() {
    const timeElements = document.querySelectorAll('#ekb-time, [data-ekb-time]');
    if (!timeElements.length) return;

    const ekbTime = new Date().toLocaleTimeString('ru-RU', {
        timeZone: 'Asia/Yekaterinburg',
        hour: '2-digit',
        minute: '2-digit'
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
            element.textContent = element.closest('.footer-live') ? `, ${temp}` : temp;
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
    const navToggle = siteHeader.querySelector('[data-nav-toggle]');
    const mobileNavQuery = window.matchMedia('(max-width: 760px)');

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

    function setHeaderMenu(open) {
        siteHeader.classList.toggle('nav-open', open);
        if (navToggle) {
            navToggle.setAttribute('aria-expanded', String(open));
            navToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
        }
    }

    if (navToggle) {
        navToggle.addEventListener('click', event => {
            event.stopPropagation();
            setHeaderMenu(!siteHeader.classList.contains('nav-open'));
        });

        siteHeader.querySelectorAll('.header-menu a').forEach(link => {
            link.addEventListener('click', () => setHeaderMenu(false));
        });

        document.addEventListener('click', event => {
            if (!siteHeader.classList.contains('nav-open')) return;
            if (siteHeader.contains(event.target)) return;
            setHeaderMenu(false);
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') setHeaderMenu(false);
        });

        mobileNavQuery.addEventListener('change', event => {
            if (!event.matches) setHeaderMenu(false);
        });
    }
}

// ========== SHARED: CONTACT MAIL CHIPS ==========
function initMailChips() {
    const mailChips = document.querySelectorAll('[data-copy-mail]');
    if (!mailChips.length) return;

    async function copyText(value) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(value);
            return true;
        }

        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        textarea.remove();
        return copied;
    }

    mailChips.forEach(chip => {
        const mail = chip.dataset.copyMail || '';
        const copyLabel = chip.querySelector('.contact-mail-copy');
        let resetTimer = null;

        chip.addEventListener('click', async () => {
            if (!chip.classList.contains('is-expanded')) {
                chip.classList.add('is-expanded');
                chip.setAttribute('aria-expanded', 'true');
                return;
            }

            try {
                await copyText(mail);
                chip.classList.add('is-copied');
                if (copyLabel) copyLabel.textContent = 'Скопировано';
                window.clearTimeout(resetTimer);
                resetTimer = window.setTimeout(() => {
                    chip.classList.remove('is-copied');
                    if (copyLabel) copyLabel.textContent = 'Копировать';
                }, 1700);
            } catch (e) {
                window.location.href = `mailto:${mail}`;
            }
        });
    });
}

initMailChips();

// ========== SHARED: PRIVACY MODAL ==========
function initPrivacyModal() {
    const triggers = document.querySelectorAll('[data-privacy-open]');
    if (!triggers.length) return;

    const modal = document.createElement('div');
    modal.className = 'privacy-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'privacy-modal-title');
    modal.hidden = true;
    modal.innerHTML = `
        <div class="privacy-modal-panel" role="document">
            <button class="privacy-modal-close" type="button" aria-label="Закрыть">×</button>
            <span class="privacy-modal-label">О данных</span>
            <h2 id="privacy-modal-title">Cookies и данные</h2>
            <p>Сайт не ставит рекламные cookies и не подключает аналитику.</p>
            <p>Погода Екатеринбурга берется из Open-Meteo. Температура сохраняется в браузере на 24 часа, чтобы не запрашивать ее при каждом открытии.</p>
            <p>Письма открываются в вашем почтовом приложении. Сайт не хранит заявки, платежные данные и переписку.</p>
            <button class="privacy-modal-ok" type="button">Понятно</button>
        </div>`;
    document.body.appendChild(modal);

    const panel = modal.querySelector('.privacy-modal-panel');
    const closeButtons = modal.querySelectorAll('.privacy-modal-close, .privacy-modal-ok');
    let previousFocus = null;

    function openModal() {
        previousFocus = document.activeElement;
        modal.hidden = false;
        document.body.classList.add('privacy-modal-open');
        requestAnimationFrame(() => {
            modal.classList.add('is-open');
            const closeButton = modal.querySelector('.privacy-modal-close');
            if (closeButton) closeButton.focus();
        });
    }

    function closeModal() {
        modal.classList.remove('is-open');
        document.body.classList.remove('privacy-modal-open');
        window.setTimeout(() => {
            modal.hidden = true;
            if (previousFocus && typeof previousFocus.focus === 'function') {
                previousFocus.focus();
            }
        }, 160);
    }

    triggers.forEach(trigger => {
        trigger.addEventListener('click', openModal);
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    modal.addEventListener('click', event => {
        if (!panel || panel.contains(event.target)) return;
        closeModal();
    });

    document.addEventListener('keydown', event => {
        if (modal.hidden) return;
        if (event.key === 'Escape') closeModal();
    });
}

initPrivacyModal();

// ========== SHARED: READABLE TYPOGRAPHY ==========
function initReadableTypography(root = document) {
    const textBlocks = root.querySelectorAll([
        '.hero-summary',
        '.cv-bio p',
        '.shop-heading p',
        '.shop-item p',
        '.project-description',
        '.project-facts-notes',
        '.project-detail-copy p',
        '.project-detail-credits p',
        '.privacy-content p',
        '.privacy-modal-panel p'
    ].join(','));

    if (!textBlocks.length) return;

    const shortWordPattern = /(^|[\s(«"„])((?:в|во|к|ко|с|со|у|о|об|обо|и|а|но|на|за|из|от|до|по|не|ни|же|ли|бы|для|над|под|при|про))\s+/giu;

    textBlocks.forEach(block => {
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
        const textNodes = [];

        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }

        textNodes.forEach(node => {
            node.nodeValue = node.nodeValue.replace(shortWordPattern, '$1$2\u00a0');
        });
    });
}

initReadableTypography();

// ========== SHARED: LANGUAGE SWITCH ==========
function initLanguageSwitch() {
    const languageLinks = document.querySelectorAll('.lang-toggle[href]');
    const pendingButtons = document.querySelectorAll('[data-lang-pending]');
    if (!languageLinks.length && !pendingButtons.length) return;

    let toast = null;
    let toastTimer = null;

    function showToast(message) {
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'lang-toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toast.classList.remove('is-visible');
        }, 1700);
    }

    pendingButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.add('is-pending');
            showToast('English version is being prepared');
            window.setTimeout(() => {
                button.classList.remove('is-pending');
            }, 1700);
        });
    });

    if (!languageLinks.length) return;

    const sectionAnchors = ['shop', 'artist', 'cards-start', 'projects'];

    function currentPageName() {
        return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    }

    function visibleSectionHash() {
        const headerOffset = document.querySelector('.header')?.getBoundingClientRect().height || 0;
        const probeY = Math.min(window.innerHeight * 0.42, headerOffset + 180);
        let best = null;

        sectionAnchors.forEach(id => {
            const element = document.getElementById(id);
            if (!element) return;
            const rect = element.getBoundingClientRect();
            const distance = rect.top <= probeY && rect.bottom >= probeY
                ? 0
                : Math.min(Math.abs(rect.top - probeY), Math.abs(rect.bottom - probeY));
            if (!best || distance < best.distance) {
                best = { id, distance };
            }
        });

        return best ? `#${best.id}` : '';
    }

    function currentContextHash() {
        const hash = window.location.hash || '';
        if (hash && (document.getElementById(hash.slice(1)) || /^#work-/.test(hash))) return hash;
        if (currentPageName() === 'shop.html') return '#shop';
        return visibleSectionHash();
    }

    function contextQuery(hash) {
        const current = new URLSearchParams(window.location.search);
        const next = new URLSearchParams();
        const filterFromUrl = current.get('filter');
        const activeFilter = document.querySelector('.filter-btn.active[data-filter]')?.getAttribute('data-filter');
        const activeWork = document.querySelector('.project-card-inline.is-overlay-source')?.getAttribute('data-project-id') || '';

        if (activeFilter && activeFilter !== 'all') {
            next.set('filter', activeFilter);
        } else if (!activeFilter && filterFromUrl) {
            next.set('filter', filterFromUrl);
        }

        if (activeWork) {
            next.set('work', activeWork);
        } else if (/^#work-/.test(hash)) {
            next.set('work', decodeURIComponent(hash.replace(/^#work-/, '')));
        }

        return next.toString();
    }

    function languageHref(targetLang) {
        const hash = currentContextHash();
        if (targetLang === 'ru' && currentPageName() === 'shop.html') return 'shop.html';
        const page = targetLang === 'en' ? 'en.html' : 'index.html';
        const query = contextQuery(hash);
        return `${page}${query ? `?${query}` : ''}${hash || ''}`;
    }

    function updateLanguageLinks() {
        languageLinks.forEach(link => {
            const targetLang = (link.getAttribute('lang') || '').toLowerCase();
            if (targetLang === 'en' || targetLang === 'ru') {
                link.setAttribute('href', languageHref(targetLang));
            }
        });
    }

    updateLanguageLinks();
    window.addEventListener('hashchange', updateLanguageLinks);
    window.addEventListener('site-context-change', updateLanguageLinks);
    window.addEventListener('scroll', () => {
        window.requestAnimationFrame(updateLanguageLinks);
    }, { passive: true });

    languageLinks.forEach(link => {
        link.addEventListener('click', updateLanguageLinks);
    });
}

initLanguageSwitch();

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
        images: [
            "assets/images/projects/dushi-ne-chayu-yaroslavl/story-01.jpg",
            "assets/images/projects/dushi-ne-chayu-yaroslavl/story-02.jpg",
            "assets/images/projects/dushi-ne-chayu-yaroslavl/story-03.jpg",
            "assets/images/projects/dushi-ne-chayu-yaroslavl/story-04.jpg",
            "assets/images/projects/dushi-ne-chayu-yaroslavl/story-05.jpg",
            "assets/images/projects/dushi-ne-chayu-yaroslavl/story-06.jpg"
        ],
        location: "Ярославль",
        desc: "Мурал для проекта «Души не чаю» в Ярославле. Работа разворачивается вдоль городской поверхности как протяженная цветная сцена: крупные персонажи, бытовые детали и декоративные формы собирают фасад в цельный визуальный рассказ.",
        rotation: 0.11
    },
    {
        id: "dushi-ne-chayu-ivanovo",
        name: "Души не чаю: Иваново",
        year: 2023,
        category: "Мурал",
        cover: "assets/images/projects/dushi-ne-chayu-ivanovo/cover.jpg",
        location: "Иваново",
        desc: "Мурал для проекта «Души не чаю» в Иваново. Длинная горизонтальная композиция работает с ритмом фасада: окна, цветовые блоки, растительные мотивы и мягкие фигуры связывают архитектуру с повседневным городским движением.",
        rotation: -0.05
    },
    {
        id: "dushi-ne-chayu-vologda",
        name: "Души не чаю: Вологда",
        year: 2023,
        category: "Мурал",
        cover: "assets/images/projects/dushi-ne-chayu-vologda/cover.jpg",
        location: "Вологда",
        desc: "Мурал для проекта «Души не чаю» в Вологде. Роспись вытянута вдоль городской стены и собирает узнаваемые бытовые образы в яркую декоративную ленту, которую можно считывать и издалека, и при движении вдоль объекта.",
        rotation: 0.08
    },
    {
        id: "moon-cycle",
        name: "Цикл Луны",
        year: 2022,
        category: "Мурал",
        cover: "assets/images/projects/moon-cycle/cover.jpg",
        location: "Певек",
        desc: "Муральный триптих в Певеке. Три фасада объединены мотивами ночного неба, животных и циклического движения; работа связывает северный городской пейзаж с ярким орнаментальным рассказом.",
        rotation: -0.13
    },
    {
        id: "moroshka",
        name: "Морошка",
        year: 2022,
        category: "Мурал",
        cover: "assets/images/projects/moroshka/cover.jpg",
        location: "Анадырь",
        desc: "Мурал в Анадыре. Композиция построена на северных растительных мотивах: крупные ягоды, мягкие цветовые пятна и слоистые формы превращают фасад в спокойный, но заметный городской знак.",
        rotation: 0.05
    },
    {
        id: "sea-stones",
        name: "Морские камушки",
        year: 2022,
        category: "Мурал",
        cover: "assets/images/projects/sea-stones/cover.jpg",
        location: "Анадырь",
        desc: "Мурал в Анадыре. Фасад заполняют крупные округлые формы, напоминающие морские камни и живые природные паттерны; работа добавляет в городскую среду яркий, почти тактильный слой.",
        rotation: -0.06
    },
    {
        id: "neighbors",
        name: "Соседи",
        year: 2020,
        category: "Мурал",
        cover: "assets/images/projects/neighbors/cover.jpg",
        location: "Екатеринбург",
        desc: "Мурал для фестиваля «Стенограффия XI» в Екатеринбурге. Работа занимает торец жилого дома и смотрит во двор как большой цветной персонаж; тема соседства здесь буквально встроена в городскую повседневность.",
        rotation: 0.06
    },
    {
        id: "mayak",
        name: "Маяк",
        year: 2025,
        category: "Роспись",
        pageReady: true,
        cover: "assets/images/projects/mayak/cover.jpg",
        images: [
            "assets/images/projects/mayak/story-01.jpg",
            "assets/images/projects/mayak/story-02.jpg",
            "assets/images/projects/mayak/story-03.jpg",
            "assets/images/projects/mayak/story-04.jpg",
            "assets/images/projects/mayak/story-05.jpg",
            "assets/images/projects/mayak/story-06.jpg"
        ],
        location: "Екатеринбург",
        desc: "Роспись объекта в Екатеринбурге. Вертикальная форма работает как городской ориентир: яркие красно-голубые блоки и простые фигуры меняют ощущение места в разное время года.",
        rotation: 0.04
    },
    {
        id: "wooden-idols",
        name: "Деревянные идолы",
        year: 2022,
        category: "Объект",
        cover: "assets/images/projects/wooden-idols/cover.jpg",
        location: "Екатеринбург",
        desc: "Серия деревянных объектов для фестиваля паблик-арта ЧО. Скульптуры сохраняют след ручной работы и выглядят как группа вертикальных персонажей, встроенных в природный ландшафт и меняющих масштаб прогулочного пространства.",
        rotation: 0.07
    },
    {
        id: "july",
        name: "Июль",
        year: 2021,
        category: "Роспись",
        cover: "assets/images/projects/july/cover.jpg",
        location: "Екатеринбург",
        desc: "Роспись троллейбуса для фестиваля «Стенограффия». Работа переносит художественный язык Наташи на движущийся городской объект: цветные формы, растения и персонажи становятся частью маршрута и повседневного транспорта.",
        rotation: 0.12
    }
];

async function loadProjectsData() {
    if (location.protocol === 'file:') {
        return FALLBACK_PROJECTS;
    }

    try {
        const response = await fetch('assets/data/projects.json?v=site-v1-12');
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

function escapeHtmlWithBreaks(value) {
    return escapeHtml(value).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
}

const SITE_LANG = (document.documentElement.lang || 'ru').toLowerCase().startsWith('en') ? 'en' : 'ru';
const IS_EN = SITE_LANG === 'en';
const UI_TEXT = {
    ru: {
        projectsEmpty: 'Проекты не найдены.',
        openProject: 'Открыть проект',
        goToProject: 'Перейти к проекту',
        goToCard: 'Перейти к карточке проекта',
        prevPhoto: 'Предыдущее фото',
        nextPhoto: 'Следующее фото',
        credits: 'Кредиты',
        facts: {
            year: 'Год',
            city: 'Город',
            format: 'Формат',
            project: 'Проект',
            role: 'Роль',
            material: 'Материал',
            size: 'Размер',
            curator: 'Куратор',
            photo: 'Фото'
        },
        back: '← Все работы',
        otherWorks: 'Другие работы',
        missingDescription: 'Описание проекта будет добавлено позже.'
    },
    en: {
        projectsEmpty: 'No projects found.',
        openProject: 'Open project',
        goToProject: 'Go to project',
        goToCard: 'Go to project card',
        prevPhoto: 'Previous photo',
        nextPhoto: 'Next photo',
        credits: 'Credits',
        facts: {
            year: 'Year',
            city: 'City',
            format: 'Format',
            project: 'Project',
            role: 'Role',
            material: 'Material',
            size: 'Scale',
            curator: 'Curator',
            photo: 'Photo'
        },
        back: '← All works',
        otherWorks: 'Other works',
        missingDescription: 'Project description will be added later.'
    }
};

function uiText(key) {
    return UI_TEXT[SITE_LANG][key] || UI_TEXT.ru[key] || '';
}

function localizedProjectField(project, key) {
    if (!project) return '';
    if (IS_EN) {
        const enKey = `${key}En`;
        if (project[enKey]) return project[enKey];
    }
    return project[key] || '';
}

function projectTitle(project) {
    return localizedProjectField(project, 'name') || project?.title || '';
}

function projectDescription(project) {
    if (!project) return '';
    return IS_EN
        ? (project.descEn || project.descriptionEn || project.desc || project.description || '')
        : (project.desc || project.description || '');
}

function projectLocation(project) {
    return localizedProjectField(project, 'location');
}

function projectCategory(project) {
    return localizedProjectField(project, 'category');
}

function projectCredits(project) {
    if (!project) return [];
    const credits = IS_EN && project.creditsEn ? project.creditsEn : project.credits;
    return credits ? (Array.isArray(credits) ? credits : [credits]).filter(Boolean) : [];
}

function renderMetaParts(parts, className = 'meta-list') {
    const cleanParts = parts.filter(Boolean).map(escapeHtml);
    if (!cleanParts.length) return '';
    return `<span class="${className}">${cleanParts.map(part => `<span>${part}</span>`).join('')}</span>`;
}

function renderProjectCardMeta(project, includeCategory = false) {
    const parts = [];
    const location = projectLocation(project);
    const category = projectCategory(project);

    if (location) {
        parts.push(`<span class="card-meta-location">${escapeHtml(location)}</span>`);
    }

    if (project.year) {
        parts.push(`<span class="card-meta-year">${escapeHtml(project.year)}</span>`);
    }

    if (includeCategory && category) {
        parts.push(`<span class="card-meta-category">${escapeHtml(category)}</span>`);
    }

    return parts.length ? `<span class="card-meta-list card-meta-list--place">${parts.join(' ')}</span>` : '';
}

function renderProjectDetailMeta(project) {
    const parts = [];
    const location = projectLocation(project);

    if (location) {
        parts.push(`<span class="project-detail-meta-location">${escapeHtml(location)}</span>`);
    }

    if (project.year) {
        parts.push(`<span class="project-detail-meta-year">${escapeHtml(project.year)}</span>`);
    }

    return parts.length ? `<span class="project-detail-meta-list project-detail-meta-list--place">${parts.join(' ')}</span>` : '';
}

function hasProjectDetailPage(project) {
    return Boolean(project && !project.hidden && project.id);
}

function getCurrentPageName() {
    return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
}

function isOnePagePage() {
    return Boolean(document.querySelector('.onepage-main'));
}

function hasOnePageSource(params = new URLSearchParams(window.location.search)) {
    return params.get('from') === 'onepage';
}

function onePageProjectHash(project) {
    return project && project.id ? `#work-${encodeURIComponent(project.id)}` : '#projects';
}

function onePageFilterKey(project) {
    if (!project || !project.category) return '';
    if (project.category === 'Мурал') return 'murals';
    if (['Инсталляция', 'Роспись', 'Объект', 'Скульптура'].includes(project.category)) return 'objects-paintings';
    return '';
}

function onePageProjectBackUrl(project) {
    const params = new URLSearchParams();
    const filter = onePageFilterKey(project);
    if (filter) params.set('filter', filter);
    if (project && project.id) params.set('work', project.id);
    const query = params.toString();
    const page = getCurrentPageName() === 'en.html' ? 'en.html' : 'index.html';
    return `${page}${query ? `?${query}` : ''}${onePageProjectHash(project)}`;
}

function projectBackUrl(project) {
    return hasOnePageSource() ? onePageProjectBackUrl(project) : 'index.html#cards-start';
}

function addOnePageSource(url, project) {
    if (!url || !/(^|\/)project\.html(?:[?#]|$)/i.test(url)) return url;

    const hashIndex = url.indexOf('#');
    const base = hashIndex === -1 ? url : url.slice(0, hashIndex);
    const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
    const queryIndex = base.indexOf('?');
    const path = queryIndex === -1 ? base : base.slice(0, queryIndex);
    const query = queryIndex === -1 ? '' : base.slice(queryIndex + 1);
    const params = new URLSearchParams(query);

    if (project && project.id && !params.has('id')) {
        params.set('id', project.id);
    }
    params.set('from', 'onepage');
    if (project && project.id) params.set('work', project.id);
    const filter = onePageFilterKey(project);
    if (filter) params.set('filter', filter);

    return `${path}?${params.toString()}${hash}`;
}

function shouldKeepOnePageSource() {
    return isOnePagePage() || hasOnePageSource();
}

function getOnePageHashProjectId() {
    const match = window.location.hash.match(/^#work-(.+)$/);
    if (!match) return '';

    try {
        return decodeURIComponent(match[1]);
    } catch (e) {
        return match[1];
    }
}

function scrollToOnePageHashProject() {
    const projectId = getOnePageHashProjectId();
    if (!isOnePagePage() || !projectId) return;

    window.requestAnimationFrame(() => {
        const target = document.getElementById(`work-${projectId}`);
        if (target) target.scrollIntoView({ block: 'start' });
    });
}

function projectUrl(project) {
    if (!project || !project.id || !hasProjectDetailPage(project)) return '';
    const url = fixPath(project.url || `project.html?id=${encodeURIComponent(project.id)}`);
    return shouldKeepOnePageSource() ? addOnePageSource(url, project) : url;
}

function projectImages(project) {
    return ((project && (project.images || project.storyImages)) || [project && project.cover])
        .map(fixPath)
        .filter(Boolean);
}

// ========== INDEX: DYNAMIC PROJECTS GRID ==========
const projectsGrid = document.getElementById('cards-start');

if (projectsGrid) {
    let projectDisclosureController = null;

    function heroCandidates(projects) {
        const preferred = [
            'mayak',
            'wooden-idols',
            'dushi-ne-chayu-yaroslavl'
        ];
        const visible = (projects || []).filter(project => !project.hidden && (project.cover || (project.images && project.images.length)));
        const ranked = visible
            .filter(project => Number.isFinite(project.heroRank))
            .sort((a, b) => a.heroRank - b.heroRank);
        const curated = ranked.length
            ? ranked
            : preferred
                .map(id => visible.find(project => project.id === id))
                .filter(Boolean);
        const curatedIds = new Set(curated.map(project => project.id));
        return curated
            .concat(visible.filter(project => !curatedIds.has(project.id)))
            .slice(0, 3);
    }

    function renderHeroWorks(projects) {
        const heroImages = document.querySelectorAll('[data-hero-image]');
        const heroLink = document.querySelector('[data-hero-link]');
        const heroCaption = document.querySelector('[data-hero-caption]');
        const heroWorks = document.querySelector('[data-hero-works]');
        if (!heroImages.length) return;

        const items = heroCandidates(projects);
        if (!items.length) return;

        function show(project, index) {
            const title = projectTitle(project);
            const src = fixPath(project.cover || projectImages(project)[0] || '');
            const meta = projectLocation(project) || projectCategory(project) || '';
            const cardAnchor = project.id ? `#work-${project.id}` : '#cards-start';
            const detailUrl = projectUrl(project);

            heroImages.forEach(image => {
                if (src) image.src = src;
                image.alt = title;
            });
            if (heroCaption) heroCaption.textContent = [title, meta].filter(Boolean).join(' · ');
            if (heroLink) {
                const heroTarget = isOnePagePage() ? onePageProjectBackUrl(project) : (detailUrl || cardAnchor);
                heroLink.href = heroTarget;
                heroLink.setAttribute('aria-label', isOnePagePage() ? `${uiText('goToProject')} ${title}` : (detailUrl ? `${uiText('openProject')} ${title}` : `${uiText('goToCard')} ${title}`));
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
        const desc = projectDescription(project);
        if (/черновая карточка|v0|needs-real-photo/i.test(desc)) return '';
        return desc;
    }

    function projectStoryPreviewImages(project) {
        const seen = new Set();
        return [project.previewImage, ...projectImages(project)]
            .map(fixPath)
            .filter(Boolean)
            .filter(src => {
                if (seen.has(src)) return false;
                seen.add(src);
                return true;
            });
    }

    function renderProjects(projects, options = {}) {
        projects = (projects || []).filter(project => !project.hidden);
        const showCategoryInMeta = options.showCategoryInMeta !== false;
        const useInlineDetail = isOnePagePage();

        if (!projects || !projects.length) {
            projectsGrid.innerHTML = `<p style="padding:40px;color:#666;">${escapeHtml(uiText('projectsEmpty'))}</p>`;
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
            const rawTitle = projectTitle(p);
            const title = escapeHtml(rawTitle);
            const img   = escapeHtml(fixPath(p.cover || p.image || ''));
            const url   = projectUrl(p);
            const safeUrl = escapeHtml(url);
            const desc  = escapeHtml(getPublicDescription(p));
            const meta  = renderProjectCardMeta(p, showCategoryInMeta);
            const layoutClass = layoutPattern[index % layoutPattern.length];
            const storyImages = projectStoryPreviewImages(p).map(escapeHtml);
            const isStory = p.story && storyImages.length > 1;
            const hasInlineDetail = useInlineDetail && p.id;
            const hasAction = hasInlineDetail || url || isStory;
            const cardClass = `card ${layoutClass}${hasAction ? '' : ' card-disabled'}${isStory ? ' story-card' : ''}${useInlineDetail ? ' project-card-inline' : ''}`;
            const projectId = escapeHtml(p.id || '');

            const anchorId = p.id ? ` id="work-${escapeHtml(p.id)}"` : '';
            const titleMarkup = hasInlineDetail
                ? `<button class="project-title-button" type="button" data-project-open="${projectId}" aria-expanded="false">${title}</button>`
                : title;

            if (isStory) {
                html += `
            <article class="${cardClass}"${anchorId} data-project-id="${projectId}">
                <div class="story-media" style="--base-rotation: ${rot}deg;">
                    ${url && !useInlineDetail ? `<a class="story-photo-link" href="${safeUrl}" aria-label="${escapeHtml(uiText('openProject'))} ${title}">` : ''}
                        <img src="${storyImages[0]}" alt="${title}" loading="lazy" decoding="async">
                    ${url && !useInlineDetail ? '</a>' : ''}
                    <div class="story-progress">
                        ${storyImages.map((_, dotIndex) => `<span class="${dotIndex === 0 ? 'active' : ''}"></span>`).join('')}
                    </div>
                    <button class="story-btn story-prev" type="button" aria-label="${escapeHtml(uiText('prevPhoto'))}"><span class="visually-hidden">${escapeHtml(uiText('prevPhoto'))}</span></button>
                    <button class="story-btn story-next" type="button" aria-label="${escapeHtml(uiText('nextPhoto'))}"><span class="visually-hidden">${escapeHtml(uiText('nextPhoto'))}</span></button>
                    <div class="story-counter visually-hidden" aria-live="polite">1 из ${storyImages.length}</div>
                </div>
                <div class="story-copy">
                    <div class="card-meta">${meta}</div>
                    <h3>${url && !useInlineDetail ? `<a href="${safeUrl}">${title}</a>` : titleMarkup}</h3>
                    ${desc ? `<p class="card-desc">${desc}</p>` : ''}
                </div>
            </article>`;
                return;
            }

            const cardInner = `
                <div class="card-img" style="--base-rotation: ${rot}deg;">
                    <img src="${img}" alt="${title}" loading="lazy" decoding="async">
                </div>
                <div class="card-meta">${meta}</div>
                <h3>${titleMarkup}</h3>
                ${desc ? `<p class="card-desc">${desc}</p>` : ''}`;

            if (useInlineDetail && p.id) {
                html += `
            <article class="${cardClass}"${anchorId} data-project-id="${projectId}">${cardInner}</article>`;
                return;
            }

            html += url ? `
            <a href="${safeUrl}" class="${cardClass}"${anchorId}>${cardInner}</a>` : `
            <div class="${cardClass}"${anchorId} aria-disabled="true">${cardInner}</div>`;
        });
        html += '</div>';

        document.body.classList.remove('project-overlay-open');
        projectsGrid.innerHTML = html;
        initStoryCards(projects);
        initProjectDisclosure(projects);
    }

    function initStoryCards(projects) {
        const byId = new Map(projects.map(project => [project.id, project]));

        projectsGrid.querySelectorAll('.story-card').forEach(card => {
            const project = byId.get(card.dataset.projectId);
            const images = project ? projectStoryPreviewImages(project) : [];
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

    function projectDetailText(project) {
        return getPublicDescription(project) || localizedProjectField(project, 'detail') || project.inside || project.longDescription || project.process || localizedProjectField(project, 'context') || '';
    }

    function projectDetailFacts(project) {
        const labels = UI_TEXT[SITE_LANG].facts;
        return [
            [labels.project, project.series || project.program || project.festival],
            [labels.role, project.role],
            [labels.material, project.material || project.materials],
            [labels.size, project.size],
            [labels.curator, project.curator],
            [labels.photo, project.photographer || project.photo]
        ].filter(([, value]) => value);
    }

    function projectCreditBlocks(project) {
        return projectCredits(project);
    }

    function renderProjectCredit(value) {
        return escapeHtmlWithBreaks(String(value).replace(/<br\s*\/?>/gi, '\n'));
    }

    function renderProjectInlineDetail(project) {
        const images = projectStoryPreviewImages(project).slice(0, 10);
        const title = escapeHtml(project.name || project.title || '');
        const titleId = `project-detail-title-${escapeHtml(project.id || 'current')}`;
        const detailText = projectDetailText(project);
        const facts = projectDetailFacts(project);
        const credits = projectCreditBlocks(project);
        const meta = renderProjectDetailMeta(project);
        const projectId = escapeHtml(project.id || '');

        return `
            <div class="project-detail-card project-detail-card--entity" data-project-id="${projectId}" aria-live="polite">
                <button class="project-detail-close" type="button" aria-label="Закрыть проект">×</button>
                <div class="project-detail-copy">
                    ${meta ? `<div class="project-detail-meta">${meta}</div>` : ''}
                    ${title ? `<h3 id="${titleId}">${title}</h3>` : ''}
                    ${detailText ? `
                        <section class="project-detail-section">
                            <div class="project-detail-section-label">О проекте</div>
                            <p>${escapeHtmlWithBreaks(detailText)}</p>
                        </section>` : ''}
                    ${facts.length ? `
                        <dl class="project-detail-facts">
                            ${facts.map(([label, value]) => `
                                <div>
                                    <dt>${escapeHtml(label)}</dt>
                                    <dd>${Array.isArray(value) ? value.map(escapeHtml).join(', ') : escapeHtmlWithBreaks(value)}</dd>
                                </div>`).join('')}
                        </dl>` : ''}
                    ${credits.length ? `
                        <section class="project-detail-credits">
                            <div class="project-detail-credits-label">${escapeHtml(uiText('credits'))}</div>
                            ${credits.map(value => `<p>${renderProjectCredit(value)}</p>`).join('')}
                        </section>` : ''}
                </div>
                ${images.length ? `
                    <div class="project-detail-gallery">
                        ${images.map((src, index) => `<img src="${escapeHtml(src)}" alt="${title ? `Проект ${title}` : 'Проект'} — изображение ${index + 1}" loading="lazy" decoding="async">`).join('')}
                    </div>` : ''}
            </div>`;
    }

    function initProjectDisclosure(projects) {
        if (!isOnePagePage()) return;

        let detail = document.getElementById('project-inline-detail');
        if (!detail) {
            detail = document.createElement('div');
            detail.className = 'project-inline-detail project-inline-overlay';
            detail.id = 'project-inline-detail';
            detail.hidden = true;
        }

        const byId = new Map(projects.map(project => [project.id, project]));
        const layout = projectsGrid.querySelector('.projects-layout');
        const overlayHost = document.querySelector('.onepage-main') || layout || document.body;
        let restoreFocus = null;
        let hiddenProjectBackground = [];
        let isSyncingProjectHistory = false;

        function activeFilterKey() {
            return document.querySelector('.filter-btn.active[data-filter]')?.getAttribute('data-filter') || 'all';
        }

        function projectStateUrl(projectId) {
            const params = new URLSearchParams(window.location.search);
            params.delete('work');
            const filter = activeFilterKey();

            if (filter && filter !== 'all') {
                params.set('filter', filter);
            } else {
                params.delete('filter');
            }

            if (projectId) params.set('work', projectId);

            const query = params.toString();
            const page = getCurrentPageName() || 'index.html';
            const hash = projectId ? `#work-${encodeURIComponent(projectId)}` : '#cards-start';
            return `${page}${query ? `?${query}` : ''}${hash}`;
        }

        function pushProjectState(projectId) {
            if (!window.history || isSyncingProjectHistory) return;
            const nextUrl = projectStateUrl(projectId);
            const currentUrl = `${window.location.pathname.split('/').pop() || 'index.html'}${window.location.search}${window.location.hash}`;
            if (nextUrl !== currentUrl) {
                window.history.pushState({ projectId }, '', nextUrl);
            }
        }

        function replaceProjectState(projectId = '') {
            if (!window.history || isSyncingProjectHistory) return;
            window.history.replaceState({ projectId }, '', projectStateUrl(projectId));
        }

        function setProjectBackgroundHidden(isHidden) {
            if (!isHidden) {
                hiddenProjectBackground.forEach(({ element, ariaHidden, inert }) => {
                    if (ariaHidden === null) {
                        element.removeAttribute('aria-hidden');
                    } else {
                        element.setAttribute('aria-hidden', ariaHidden);
                    }
                    element.inert = inert;
                });
                hiddenProjectBackground = [];
                return;
            }

            hiddenProjectBackground = [];
            const targets = [
                ...Array.from(document.body.children).filter(element => element !== overlayHost && element.tagName !== 'SCRIPT'),
                ...Array.from(overlayHost.children).filter(element => element !== detail)
            ];

            targets.forEach(element => {
                hiddenProjectBackground.push({
                    element,
                    ariaHidden: element.getAttribute('aria-hidden'),
                    inert: Boolean(element.inert)
                });
                element.setAttribute('aria-hidden', 'true');
                element.inert = true;
            });
        }

        function keepProjectFocus(event) {
            if (event.key !== 'Tab' || detail.hidden) return;
            const focusable = Array.from(detail.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
                .filter(element => element.offsetParent !== null);
            if (!focusable.length) {
                event.preventDefault();
                detail.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        function openProject(projectId, options = {}) {
            const project = byId.get(projectId);
            if (!project) return;
            const card = Array.from(projectsGrid.querySelectorAll('.project-card-inline')).find(item => item.dataset.projectId === projectId);
            if (!card || !layout) return;

            const alreadyOpen = card.classList.contains('is-overlay-source') && !detail.hidden && detail.parentElement === overlayHost;

            if (alreadyOpen) {
                closeProject();
                return;
            }

            restoreFocus = document.activeElement;
            detail.hidden = true;
            detail.innerHTML = '';
            if (detail.parentElement) detail.remove();

            projectsGrid.querySelectorAll('.project-card-inline').forEach(card => {
                card.classList.toggle('is-overlay-source', card.dataset.projectId === projectId);
            });
            projectsGrid.querySelectorAll('[data-project-open]').forEach(button => {
                button.setAttribute('aria-expanded', String(button.dataset.projectOpen === projectId));
            });

            const cardRect = card.getBoundingClientRect();
            const layoutRect = layout.getBoundingClientRect();
            const overlayTop = Math.max(0, cardRect.top - layoutRect.top);

            detail.className = 'project-inline-detail project-inline-overlay';
            detail.style.setProperty('--project-overlay-top', `${overlayTop}px`);
            overlayHost.appendChild(detail);
            detail.innerHTML = renderProjectInlineDetail(project);
            const titleElement = detail.querySelector('.project-detail-copy h3');
            detail.setAttribute('role', 'dialog');
            detail.setAttribute('aria-modal', 'true');
            detail.setAttribute('tabindex', '-1');
            if (titleElement?.id) {
                detail.setAttribute('aria-labelledby', titleElement.id);
                detail.removeAttribute('aria-label');
            } else {
                detail.setAttribute('aria-label', 'Проект');
                detail.removeAttribute('aria-labelledby');
            }
            detail.hidden = false;
            setProjectBackgroundHidden(true);
            document.documentElement.classList.add('project-overlay-open');
            document.body.classList.add('project-overlay-open');
            detail.querySelector('.project-detail-close')?.addEventListener('click', event => {
                event.stopPropagation();
                closeProject();
            });
            requestAnimationFrame(() => {
                detail.querySelector('.project-detail-close')?.focus();
            });
            initReadableTypography(detail);
            if (options.updateHistory !== false) pushProjectState(projectId);
            window.dispatchEvent(new Event('site-context-change'));
        }

        function closeProject(options = {}) {
            projectsGrid.querySelectorAll('.project-card-inline.is-overlay-source').forEach(card => card.classList.remove('is-overlay-source'));
            projectsGrid.querySelectorAll('[data-project-open]').forEach(button => {
                button.setAttribute('aria-expanded', 'false');
            });
            detail.hidden = true;
            detail.innerHTML = '';
            detail.style.removeProperty('--project-overlay-top');
            detail.removeAttribute('role');
            detail.removeAttribute('aria-modal');
            detail.removeAttribute('aria-labelledby');
            detail.removeAttribute('aria-label');
            detail.removeAttribute('tabindex');
            if (detail.parentElement) detail.remove();
            setProjectBackgroundHidden(false);
            document.documentElement.classList.remove('project-overlay-open');
            document.body.classList.remove('project-overlay-open');
            if (restoreFocus && typeof restoreFocus.focus === 'function') {
                restoreFocus.focus();
            }
            restoreFocus = null;
            if (options.updateHistory !== false) replaceProjectState('');
            window.dispatchEvent(new Event('site-context-change'));
        }

        if (projectDisclosureController) projectDisclosureController.abort();
        projectDisclosureController = new AbortController();

        projectsGrid.addEventListener('click', event => {
            const button = event.target.closest('[data-project-open]');
            if (button && projectsGrid.contains(button)) {
                event.preventDefault();
                event.stopPropagation();
                openProject(button.dataset.projectOpen);
                return;
            }

            if (event.target.closest('.project-detail-close, .story-btn, a')) return;

            const card = event.target.closest('.project-card-inline');
            if (card && projectsGrid.contains(card)) openProject(card.dataset.projectId);
        }, { signal: projectDisclosureController.signal });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !detail.hidden) closeProject();
            keepProjectFocus(event);
        }, { signal: projectDisclosureController.signal });

        window.addEventListener('popstate', () => {
            if (!isOnePagePage()) return;
            const projectId = getOnePageHashProjectId();
            isSyncingProjectHistory = true;
            if (projectId && byId.has(projectId)) {
                openProject(projectId, { updateHistory: false });
            } else if (!detail.hidden) {
                closeProject({ updateHistory: false });
            }
            isSyncingProjectHistory = false;
        }, { signal: projectDisclosureController.signal });

        const initialProjectId = getOnePageHashProjectId();
        if (initialProjectId && byId.has(initialProjectId)) {
            requestAnimationFrame(() => openProject(initialProjectId, { updateHistory: false }));
        }
    }

    function initFilters(allProjects) {
        const filterContainer = document.querySelector('.project-filters .filters');
        if (!filterContainer) return;

        const editorialOrder = [
            'dushi-ne-chayu-yaroslavl',
            'mayak',
            'wooden-idols',
            'moon-cycle',
            'dushi-ne-chayu-ivanovo',
            'moroshka',
            'sea-stones',
            'dushi-ne-chayu-vologda',
            'july',
            'neighbors'
        ];
        const visibleProjects = (allProjects || [])
            .filter(project => !project.hidden)
            .slice()
            .sort((a, b) => {
                const aIndex = editorialOrder.indexOf(a.id);
                const bIndex = editorialOrder.indexOf(b.id);
                if (aIndex === -1 && bIndex === -1) return 0;
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            });
        const buttons = filterContainer.querySelectorAll('.filter-btn');
        const categoryMap = {
            all: null,
            murals: ['Мурал'],
            'objects-paintings': ['Инсталляция', 'Роспись', 'Объект', 'Скульптура']
        };

        function buttonForReturnContext() {
            const params = new URLSearchParams(window.location.search);
            const filterFromParams = params.get('filter');
            if (filterFromParams) {
                const button = filterContainer.querySelector(`.filter-btn[data-filter="${filterFromParams}"]`);
                if (button) return button;
            }

            const projectId = getOnePageHashProjectId();
            if (!isOnePagePage() || !projectId) return null;

            const project = visibleProjects.find(item => item.id === projectId);
            if (!project) return null;

            const filterKey = Object.keys(categoryMap).find(key => {
                const categories = categoryMap[key];
                return Array.isArray(categories) && categories.includes(project.category);
            });
            return filterKey ? filterContainer.querySelector(`.filter-btn[data-filter="${filterKey}"]`) : null;
        }

        function updateFilterUrl(filterKey) {
            if (!isOnePagePage() || !window.history) return;
            const params = new URLSearchParams(window.location.search);
            params.delete('work');
            if (filterKey && filterKey !== 'all') {
                params.set('filter', filterKey);
            } else {
                params.delete('filter');
            }
            const query = params.toString();
            const page = getCurrentPageName() || 'index.html';
            window.history.replaceState({}, '', `${page}${query ? `?${query}` : ''}#cards-start`);
        }

        function applyFilter(btn, options = {}) {
            buttons.forEach(b => {
                const isActive = b === btn;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-pressed', String(isActive));
            });
            btn.classList.add('active');

            const categoryFilter = categoryMap[btn.dataset.filter || 'all'];
            const filteredProjects = categoryFilter ? visibleProjects.filter(p => categoryFilter.includes(p.category)) : visibleProjects;
            renderProjects(filteredProjects, { showCategoryInMeta: !categoryFilter });
            if (options.syncUrl) updateFilterUrl(btn.dataset.filter || 'all');
            window.dispatchEvent(new Event('site-context-change'));
            if (options.scrollToHash) scrollToOnePageHashProject();
        }

        buttons.forEach(btn => {
            btn.addEventListener('click', () => applyFilter(btn, { syncUrl: true }));
        });

        const initialButton = buttonForReturnContext() || filterContainer.querySelector('.filter-btn.active') || buttons[0];
        if (initialButton) applyFilter(initialButton, { scrollToHash: true });
    }

    loadProjectsData().then(projects => {
        renderHeroWorks(projects);
        initFilters(projects);
    });
}

// ========== PROJECT: DATA-DRIVEN PAGE ==========
const projectPage = document.getElementById('project-page');

if (projectPage) {
    function renderProjectFacts(project) {
        const labels = UI_TEXT[SITE_LANG].facts;
        const rows = [
            [labels.year, project.year],
            [labels.city, projectLocation(project)],
            [labels.format, projectCategory(project)],
            [labels.project, project.series || project.program || project.festival],
            [labels.material, project.material || project.materials],
            [labels.size, project.size],
            [labels.curator, project.curator],
            [labels.photo, project.photographer || project.photo]
        ].filter(([, value]) => value);

        if (rows.length) {
            return `
                <dl class="project-facts">
                    ${rows.map(([label, value]) => `
                        <div class="project-fact">
                            <dt>${escapeHtml(label)}</dt>
                            <dd>${Array.isArray(value) ? value.map(escapeHtml).join(', ') : escapeHtmlWithBreaks(value)}</dd>
                        </div>`).join('')}
                </dl>`;
        }

        const credits = projectCredits(project);
        if (credits.length) {
            return `<div class="project-facts project-facts-notes">${credits.map(item => `<p>${escapeHtmlWithBreaks(item)}</p>`).join('')}</div>`;
        }

        return '';
    }

    function renderProjectCard(project) {
        const title = escapeHtml(projectTitle(project));
        const meta = renderProjectCardMeta(project);
        const url = projectUrl(project);
        const inner = `
                <div class="card-img">
                    <img src="${escapeHtml(fixPath(project.cover || project.image || ''))}" alt="${title}" loading="lazy" decoding="async">
                </div>
                <h3>${title}</h3>
                <div class="card-meta">${meta}</div>`;

        if (!url) {
            return `<div class="card card-disabled" aria-disabled="true">${inner}</div>`;
        }

        return `
            <a class="card" href="${url}">${inner}</a>`;
    }

    function renderProject(projects, project) {
        const images = projectImages(project);
        const title = escapeHtml(projectTitle(project) || 'Project');
        const backUrl = escapeHtml(projectBackUrl(project));
        const otherProjects = projects
            .filter(item => !item.hidden && item.id !== project.id)
            .slice(0, 3);

        document.title = IS_EN ? `Natasha Pastukhova — ${title}` : `Наташа Пастухова — ${title}`;

        projectPage.innerHTML = `
            <article class="project-top">
                <div class="project-image-col">
                    <div class="slider" id="slider">
                        <div class="slider-track" id="slider-track">
                            ${images.map((src, index) => `
                                <div class="slider-slide">
                                    <img src="${src}" alt="${title} — ${index + 1}" ${index === 0 ? 'loading="eager"' : 'loading="lazy"'} decoding="async">
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
                    <a class="project-back" href="${backUrl}">${escapeHtml(uiText('back'))}</a>
                    <h1 class="project-title">${title}</h1>
                    <div class="project-body">
                        <p class="project-description">${escapeHtml(projectDescription(project) || uiText('missingDescription'))}</p>
                        ${renderProjectFacts(project)}
                    </div>
                </div>
            </article>

            <section class="next-projects">
                <div class="next-label">${escapeHtml(uiText('otherWorks'))}</div>
                <div class="next-grid">${otherProjects.map(renderProjectCard).join('')}</div>
            </section>`;

        initReadableTypography(projectPage);

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
            window.location.replace(hasOnePageSource(params) ? 'index.html#projects' : 'index.html#cards-start');
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

function initCvArchive() {
    const archives = document.querySelectorAll('[data-cv-archive]');
    if (!archives.length) return;

    archives.forEach(archive => {
        const triggers = Array.from(archive.querySelectorAll('[data-cv-group-trigger]'));
        const groups = Array.from(archive.querySelectorAll('[data-cv-group]'));

        function setActiveGroup(groupName) {
            triggers.forEach(trigger => {
                const isActive = trigger.dataset.cvGroupTrigger === groupName;
                trigger.classList.toggle('active', isActive);
                trigger.setAttribute('aria-selected', String(isActive));
                trigger.setAttribute('tabindex', isActive ? '0' : '-1');
            });

            groups.forEach(group => {
                const isActive = group.dataset.cvGroup === groupName;
                group.classList.toggle('active', isActive);
                group.hidden = !isActive;
            });
        }

        triggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                setActiveGroup(trigger.dataset.cvGroupTrigger);
            });

            trigger.addEventListener('keydown', event => {
                const currentIndex = triggers.indexOf(trigger);
                let nextIndex = currentIndex;
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % triggers.length;
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
                if (event.key === 'Home') nextIndex = 0;
                if (event.key === 'End') nextIndex = triggers.length - 1;
                if (nextIndex === currentIndex) return;
                event.preventDefault();
                const nextTrigger = triggers[nextIndex];
                setActiveGroup(nextTrigger.dataset.cvGroupTrigger);
                nextTrigger.focus();
            });
        });

        groups.forEach(group => {
            const table = group.querySelector('table[data-preview-limit]');
            const button = group.querySelector('[data-cv-show-more]');
            if (!table || !button) return;

            const rows = Array.from(table.querySelectorAll('tr'));
            const previewLimit = Number(table.dataset.previewLimit) || 10;
            const collapsedLabel = button.dataset.collapsedLabel || 'Показать все';
            const expandedLabel = button.dataset.expandedLabel || 'Свернуть';

            if (rows.length <= previewLimit) {
                button.hidden = true;
                return;
            }

            button.hidden = false;
            button.setAttribute('aria-controls', table.id || `${group.id}-table`);
            if (!table.id) table.id = `${group.id}-table`;

            function setExpanded(isExpanded) {
                rows.forEach((row, index) => {
                    row.hidden = !isExpanded && index >= previewLimit;
                });
                button.textContent = isExpanded ? expandedLabel : collapsedLabel;
                button.setAttribute('aria-expanded', String(isExpanded));
            }

            button.addEventListener('click', () => {
                const isExpanded = button.getAttribute('aria-expanded') === 'true';
                setExpanded(!isExpanded);
            });

            setExpanded(false);
        });

        const initiallyActive = triggers.find(trigger => trigger.classList.contains('active')) || triggers[0];
        if (initiallyActive) {
            setActiveGroup(initiallyActive.dataset.cvGroupTrigger);
        }
    });
}

showSection(1);
initCvArchive();

function initShopStories() {
    document.querySelectorAll('[data-shop-story]').forEach(story => {
        const images = Array.from(story.querySelectorAll('img'));
        const dots = Array.from(story.querySelectorAll('.shop-story-progress span'));
        const prev = story.querySelector('.shop-story-prev');
        const next = story.querySelector('.shop-story-next');
        const status = document.createElement('div');
        status.className = 'shop-story-status visually-hidden';
        status.setAttribute('aria-live', 'polite');
        story.appendChild(status);

        if (images.length <= 1) {
            story.classList.add('is-static');
            status.textContent = '1 из 1';
            return;
        }

        let current = 0;

        function show(nextIndex) {
            current = (nextIndex + images.length) % images.length;
            images.forEach((image, index) => {
                const isActive = index === current;
                image.classList.toggle('active', isActive);
                image.setAttribute('aria-hidden', String(!isActive));
            });
            dots.forEach((dot, index) => dot.classList.toggle('active', index === current));
            status.textContent = `${current + 1} из ${images.length}`;
        }

        prev?.addEventListener('click', event => {
            event.preventDefault();
            show(current - 1);
        });

        next?.addEventListener('click', event => {
            event.preventDefault();
            show(current + 1);
        });

        show(0);
    });
}

initShopStories();

function initShopOrderModal() {
    const triggers = document.querySelectorAll('.shop-order[href^="mailto:"]');
    if (!triggers.length) return;
    const shopMail = 'hipastukhova@gmail.com';
    const modalCopy = IS_EN ? {
        close: 'Close',
        label: 'Purchase',
        title: 'Check availability',
        note: 'Choose email or copy the prepared message for Telegram / Max.',
        mail: 'Write an email',
        copy: 'Copy text',
        copied: 'Copied',
        copyFailed: 'Copy failed',
        subjectPrefix: 'Relief availability',
        hello: title => `Hello! I would like to check availability of “${title}”.`,
        details: value => `Details: ${value}.`,
        siteNote: value => `Website note: ${value}`,
        price: value => `Price: ${value}.`,
        ask: 'Please confirm size, mounting, framing and shipping.',
        name: 'Name:',
        city: 'City:',
        contact: 'Preferred contact:'
    } : {
        close: 'Закрыть',
        label: 'Покупка',
        title: 'Уточнить наличие',
        note: 'Можно написать на почту или скопировать готовый текст для Telegram / Max.',
        mail: 'Написать на почту',
        copy: 'Скопировать текст',
        copied: 'Скопировано',
        copyFailed: 'Не удалось скопировать',
        subjectPrefix: 'Уточнить наличие: барельеф',
        hello: title => `Здравствуйте! Хочу уточнить наличие работы «${title}».`,
        details: value => `Детали: ${value}.`,
        siteNote: value => `Комментарий на сайте: ${value}`,
        price: value => `Стоимость: ${value}.`,
        ask: 'Подскажите, пожалуйста, размер, крепление, оформление и доставку.',
        name: 'Имя:',
        city: 'Город:',
        contact: 'Контакт для связи:'
    };

    const modal = document.createElement('div');
    modal.className = 'shop-order-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'shop-order-modal-title');
    modal.hidden = true;
    modal.innerHTML = `
        <div class="shop-order-modal-panel" role="document">
            <button class="shop-order-modal-close" type="button" aria-label="${escapeHtml(modalCopy.close)}">×</button>
            <span class="shop-order-modal-label">${escapeHtml(modalCopy.label)}</span>
            <h2 id="shop-order-modal-title">${escapeHtml(modalCopy.title)}</h2>
            <p class="shop-order-modal-item"></p>
            <p class="shop-order-modal-note">${escapeHtml(modalCopy.note)}</p>
            <div class="shop-order-modal-actions">
                <a class="shop-order-modal-mail" href="mailto:hipastukhova@gmail.com">${escapeHtml(modalCopy.mail)}</a>
                <button class="shop-order-modal-copy" type="button">${escapeHtml(modalCopy.copy)}</button>
                <button class="shop-order-modal-cancel" type="button">${escapeHtml(modalCopy.close)}</button>
            </div>
        </div>`;
    document.body.appendChild(modal);

    const panel = modal.querySelector('.shop-order-modal-panel');
    panel?.setAttribute('tabindex', '-1');
    const closeButtons = modal.querySelectorAll('.shop-order-modal-close, .shop-order-modal-cancel');
    const itemText = modal.querySelector('.shop-order-modal-item');
    const mailLink = modal.querySelector('.shop-order-modal-mail');
    const copyButton = modal.querySelector('.shop-order-modal-copy');
    let previousFocus = null;
    let preparedBody = '';

    function modalFocusableElements() {
        return Array.from(modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
            .filter(element => element.offsetParent !== null);
    }

    function keepModalFocus(event) {
        if (event.key !== 'Tab' || modal.hidden) return;
        const focusable = modalFocusableElements();
        if (!focusable.length) {
            event.preventDefault();
            panel?.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function openModal(trigger) {
        const item = trigger.closest('.shop-item');
        const title = item?.querySelector('h4, h3')?.textContent?.trim() || 'Работа';
        const price = item?.querySelector('.shop-price')?.textContent?.trim() || '';
        const meta = Array.from(item?.querySelectorAll('.shop-item-meta span') || [])
            .map(element => element.textContent.trim())
            .filter(Boolean)
            .join(' · ');
        const note = item?.querySelector('.shop-item-note, p')?.textContent?.trim() || '';
        const subject = `${modalCopy.subjectPrefix}: ${title}`;
        const body = [
            modalCopy.hello(title),
            meta ? modalCopy.details(meta) : '',
            note ? modalCopy.siteNote(note) : '',
            price ? modalCopy.price(price) : '',
            modalCopy.ask,
            '',
            modalCopy.name,
            modalCopy.city,
            modalCopy.contact
        ].filter(Boolean).join('\n');
        preparedBody = body;

        previousFocus = document.activeElement;
        itemText.textContent = [title, meta, price].filter(Boolean).join(' · ');
        mailLink.href = `mailto:${shopMail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        copyButton.textContent = modalCopy.copy;
        modal.hidden = false;
        document.body.classList.add('shop-order-modal-open');
        requestAnimationFrame(() => {
            modal.classList.add('is-open');
            mailLink.focus();
        });
    }

    function closeModal() {
        if (modal.hidden) return;
        modal.classList.remove('is-open');
        document.body.classList.remove('shop-order-modal-open');
        window.setTimeout(() => {
            modal.hidden = true;
            if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
        }, 160);
    }

    triggers.forEach(trigger => {
        trigger.addEventListener('click', event => {
            event.preventDefault();
            openModal(trigger);
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    copyButton?.addEventListener('click', async () => {
        if (!preparedBody) return;
        try {
            if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
            await navigator.clipboard.writeText(preparedBody);
            copyButton.textContent = modalCopy.copied;
        } catch (e) {
            copyButton.textContent = modalCopy.copyFailed;
        }
    });

    modal.addEventListener('click', event => {
        if (!panel || panel.contains(event.target)) return;
        closeModal();
    });

    document.addEventListener('keydown', event => {
        if (modal.hidden) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closeModal();
            return;
        }
        keepModalFocus(event);
    });
}

initShopOrderModal();
