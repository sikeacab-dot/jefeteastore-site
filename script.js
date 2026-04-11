/**
 * JEFE TEASTORE - STABLE ENGINE v5
 * Clean, logical, and mobile-ready.
 */

const State = {
    db: [],
    cart: [],
    selectedVariant: null  // { grams: '100', price: 275 }
};

const DEFAULT_TG_CONFIG = {
    token: '',
    chatId: '',
    threads: { orders: 3, inquiries: 3, newsletter: 3 }
};

const TG_CONFIG = { ...DEFAULT_TG_CONFIG, ...(window.JEFE_CONFIG || {}) };

// Helper to escape HTML characters for Telegram
function escapeHTML(str) {
    if (!str) return '—';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

async function sendToTelegram(message, threadType = 'orders') {
    const token = TG_CONFIG.token ? TG_CONFIG.token.trim() : '';
    const chatId = TG_CONFIG.chatId;

    if (!token || token.includes('ВАШ_')) {
        console.warn("JEFE: Telegram token not configured.");
        return;
    }
    
    // Check if we have threads, otherwise send to main chat
    const threadId = (TG_CONFIG.threads && TG_CONFIG.threads[threadType]) || null;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
    const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    };

    if (threadId) {
        payload.message_thread_id = threadId;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            // FALLBACK: If threadId was the problem, try sending without it
            if (payload.message_thread_id) {
                console.warn(`JEFE: Thread ${threadId} failed, trying without thread...`, result.description);
                delete payload.message_thread_id;
                const secondTry = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (secondTry.ok) {
                    console.log(`JEFE: Sent to Telegram Main Chat (fallback)`);
                    return;
                }
            }
            throw new Error(`TG API Error: ${result.description || 'Unknown'}`);
        }
        
        console.log(`JEFE: Sent to Telegram (${threadType})`);
    } catch (err) {
        console.error("JEFE: Telegram delivery failed", err);
        // Alert only during development or for testing?
        // alert("Помилка відправки замовлення. Будь ласка, напишіть нам у Telegram напряму.");
    }
}

const UI = {
    init() {
        console.log("JEFE TEASTORE: Engine Ignition.");

        // Restore cart from localStorage
        const savedCart = localStorage.getItem('jefe_cart');
        if (savedCart) {
            try {
                State.cart = JSON.parse(savedCart);
            } catch(e) {
                State.cart = [];
            }
        }

        // Reset scroll position to top on refresh
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
        
        // Initial Data Sync Fallback

        // Data Sync Fallback
        this.syncDatabase();
        this.setupDropdown();
    },

    setupDropdown() {
        const btn = document.querySelector('.dropdown-btn');
        const content = document.querySelector('.dropdown-content');
        if (!btn || !content) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            content.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            content.classList.remove('active');
        });
    },

    syncDatabase() {
        const dbSource = window.products || (typeof products !== 'undefined' ? products : null);

        if (dbSource && dbSource.length > 0) {
            State.db = dbSource;
            console.log(`JEFE TEASTORE: Data Synchronized. Entries: ${State.db.length}`);
            this.buildUI();
        } else {
            console.log('JEFE TEASTORE: Waiting for products database...');
            setTimeout(() => this.syncDatabase(), 200);
        }
    },

    buildUI() {
        document.body.classList.add('loaded');
        this.renderProducts(); // Render 8 random first
        this.renderCategories();
        this.setupSplitText();
        this.setupScrollEffects();
        this.setupObservers();
        this.setupMouseEffects();
        
        // Final reveal
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 500);

        // Initial animations
        setTimeout(() => {
            const title = document.querySelector('.hero-main-title');
            if (title) {
                title.classList.add('active');
                title.addEventListener('animationend', () => {
                    title.style.animation = 'none';
                    title.style.opacity = '1';
                }, { once: true });
            }
        }, 100);

        // Initial cart sync
        this.updateCartUI();
    },

    renderProducts(filter = 'all') {
        const grid = document.getElementById('product-grid');
        let items = [];

        if (filter === 'all') {
            items = [...State.db];
        } else {
            items = State.db.filter(p => p.category === filter);
        }

        if (items.length === 0) {
            grid.innerHTML = `<div style="padding: 100px; opacity: 0.2; width: 100%; text-align: center;">На жаль, товарів у цій категорії немає.</div>`;
            return;
        }

        grid.innerHTML = items.map((p, idx) => {
            const imgSrc = (p.images && p.images[0]) || p.image || '';
            const blurData = (window.PLACEHOLDERS && window.PLACEHOLDERS[imgSrc]) || '';
            const priceValue = p.variants 
                ? (p.variants['100'] || Object.values(p.variants)[0]) 
                : (p.price || 0);
            const priceHtml = p.on_order 
                ? `<span class="card-price on-order">Під замовлення</span>` 
                : `<span class="card-price">${priceValue}₴</span>`;
            // First 4 cards: eager load with high priority (above the fold)
            const isAboveFold = idx < 4;
            const loadAttr = isAboveFold ? 'eager' : 'lazy';
            const priorityAttr = isAboveFold ? 'fetchpriority="high"' : '';

            const badgeHtml = p.badge && p.badge !== 'none' 
                ? `<div class="badge badge-${p.badge.toLowerCase()}">${p.badge}</div>` 
                : '';

            return `
                <div class="card reveal" onclick="UI.openDetail(${p.id})">
                    ${badgeHtml}
                    <div class="card-media">
                        <img src="${imgSrc}" 
                             style="background-image: url('${blurData}')" 
                             onload="this.classList.add('loaded')"
                             loading="${loadAttr}" 
                             decoding="async"
                             ${priorityAttr}
                             alt="${p.name}">
                    </div>
                    <p class="card-cat">${p.category}</p>
                    <div class="card-info">
                        <h4 class="card-title">${p.name}</h4>
                        ${priceHtml}
                    </div>
                    <button class="card-add-btn" onclick="UI.openDetail(${p.id})">Додати</button>
                </div>
            `;
        }).join('');

        // Re-observe new elements
        this.setupObservers();
    },

    renderCategories() {
        const list = document.getElementById('cat-list');
        if (!list) return;
        
        list.innerHTML = `
            <a href="index.html#collection" class="sidebar-link" onclick="UI.filterBy('all'); UI.toggleSidebar('cat', false)">Наші чаї</a>
            <a href="blog.html" class="sidebar-link">Блог</a>
            <a href="#" class="sidebar-link" onclick="UI.toggleSidebar('cat', false); FooterModal.open('contacts')">Контакти</a>
        `;
    },

    // Map internal category keys to Ukrainian display names
    categoryLabels: {
        'all':      'Наші Чаї',
        'Puerh':'Пуер',
        'Oolong':   'Улун',
        'Gaba':     'Габа',
        'Sets':     'Набори',
    },

    updateSectionTitle(cat) {
        const titleEl = document.getElementById('section-title');
        if (!titleEl) return;
        const label = this.categoryLabels[cat] || cat;
        titleEl.innerHTML = `${label}<span style="color: var(--orange);">.</span>`;
    },

    filterBy(cat, tabEl) {
        // Update active tab
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        if (tabEl) tabEl.classList.add('active');
        else {
            const match = document.querySelector(`.cat-tab[data-cat="${cat}"]`);
            if (match) match.classList.add('active');
        }

        this.renderProducts(cat);
        this.toggleSidebar('cat', false);
        this.scrollTo('#collection');
    },


    toggleSidebar(type, open) {
        const sidebar = document.getElementById(`${type}-sidebar`);
        if (!sidebar) return;

        sidebar.classList.toggle('active', open);
        document.body.classList.toggle('no-scroll', open);
        if (open && content) content.scrollTop = 0; // Reset scroll on open
    },

    toggleSearch(open) {
        const overlay = document.getElementById('search-overlay');
        if (!overlay) return;
        overlay.classList.toggle('active', open);
        document.body.classList.toggle('no-scroll', open);
        if (open) {
            setTimeout(() => {
                const input = document.getElementById('search-input');
                if (input) input.focus();
            }, 80);
        } else {
            const input = document.getElementById('search-input');
            if (input) input.value = '';
            document.getElementById('search-results').innerHTML = '';
            document.getElementById('search-hint').style.display = '';
        }
    },

    handleSearch(query) {
        const resultsEl = document.getElementById('search-results');
        const hintEl = document.getElementById('search-hint');
        const q = query.trim().toLowerCase();

        if (!q) {
            resultsEl.innerHTML = '';
            hintEl.style.display = '';
            return;
        }

        hintEl.style.display = 'none';

        const matches = State.db.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
        );

        if (matches.length === 0) {
            resultsEl.innerHTML = `<div class="search-no-results">Нічого не знайдено — спробуй інший запит</div>`;
            return;
        }

        resultsEl.innerHTML = matches.slice(0, 8).map(p => {
            const imgSrc = (p.images && p.images[0]) || p.image || '';
            const price = p.variants
                ? (p.variants['100'] || Object.values(p.variants)[0])
                : (p.price || 0);
            // Highlight matching text
            const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            const highlightedName = p.name.replace(regex, '<mark style="background:var(--orange);color:#000;border-radius:2px;padding:0 2px;">$1</mark>');
            return `
                <div class="search-result-item" onclick="UI.openDetailFromSearch(${p.id})">
                    <img class="search-result-img" src="${imgSrc}" alt="${p.name}" loading="lazy">
                    <div class="search-result-info">
                        <div class="search-result-name">${highlightedName}</div>
                        <div class="search-result-cat">${p.category}</div>
                    </div>
                    <span class="search-result-price">${p.on_order ? 'Під замовлення' : price + '₴'}</span>
                </div>
            `;
        }).join('');
    },

    openDetailFromSearch(id) {
        this.toggleSearch(false);
        setTimeout(() => this.openDetail(id), 200);
    },

    setupMouseEffects() {
        const glow = document.querySelector('.mesh-glow');
        const cursor = document.querySelector('.cursor');

        window.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            
            // Cursor Position
            if (cursor) {
                cursor.style.left = `${clientX}px`;
                cursor.style.top = `${clientY}px`;
            }

            // Mesh Glow
            if (glow) {
                const x = (clientX / window.innerWidth) * 100;
                const y = (clientY / window.innerHeight) * 100;
                glow.style.setProperty('--x', `${x}%`);
                glow.style.setProperty('--y', `${y}%`);
            }
        });

        // Hover Effect
        document.body.addEventListener('mouseover', (e) => {
            const target = e.target.closest('button, a, .card, .cat-pill');
            if (target) cursor?.classList.add('hover');
        });
        document.body.addEventListener('mouseout', (e) => {
            const target = e.target.closest('button, a, .card, .cat-pill');
            if (target) cursor?.classList.remove('hover');
        });
    },

    // Normalize description: trim to first ~200 chars, end on word/sentence
    normalizeDescription(text) {
        const fallback = 'Традиційний китайський чай, зібраний колективом JEFE. Натуральний смак, відсутність добавок.';
        if (!text) return fallback;
        const clean = text.trim().replace(/\s+/g, ' ');
        if (clean.length <= 200) return clean;
        // Cut at last sentence boundary before 200 chars
        const cut = clean.slice(0, 200);
        const lastDot = cut.lastIndexOf('.');
        const lastComma = cut.lastIndexOf(',');
        const boundary = lastDot > 150 ? lastDot + 1 : (lastComma > 150 ? lastComma + 1 : 200);
        return clean.slice(0, boundary).trim();
    },

    openDetail(id) {
        const p = State.db.find(x => x.id === id);
        if (!p) return;

        State.selectedVariant = null;

        const modal = document.getElementById('product-detail');
        const container = document.getElementById('detail-content');
        
        // Reset scroll position to top
        modal.scrollTop = 0;
        if (container) container.scrollTop = 0;

        // ── Images ──────────────────────────────────────────
        const images = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
        const hasMultiple = images.length > 1;

        const sliderHtml = images.length === 0
            ? `<div class="detail-no-img"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`
            : `<div class="img-slider" id="img-slider-${id}">
                    <div class="img-slider-track" id="img-track-${id}">
                        ${images.map((src, i) => `
                            <div class="img-slide">
                                <img src="${src}" alt="${p.name} ${i+1}" loading="${i === 0 ? 'eager' : 'lazy'}">
                            </div>`).join('')}
                    </div>
                    ${hasMultiple ? `
                        <button class="img-slider-btn img-slider-prev" onclick="UI.slideImg('${id}', -1)" aria-label="Попереднє">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <button class="img-slider-btn img-slider-next" onclick="UI.slideImg('${id}', 1)" aria-label="Наступне">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                        <div class="img-slider-dots" id="img-dots-${id}">
                            ${images.map((_, i) => `<button class="img-dot${i===0?' active':''}" onclick="UI.goToSlide('${id}', ${i})"></button>`).join('')}
                        </div>
                        <div class="img-slider-thumbs" id="img-thumbs-${id}">
                            ${images.map((src, i) => `
                                <div class="img-thumb${i===0?' active':''}" onclick="UI.goToSlide('${id}', ${i})">
                                    <img src="${src}" alt="thumb ${i+1}" loading="lazy">
                                </div>`).join('')}
                        </div>` : ''}
                </div>`;

        // ── Variants ────────────────────────────────────────
        const weights = p.variants ? Object.keys(p.variants).sort((a, b) => Number(a) - Number(b)) : [];
        const initialPrice = weights.length > 0
            ? (p.variants[weights.includes('100') ? '100' : weights[0]])
            : p.price;

        const variantsHtml = (weights.length > 0 && !p.on_order) ? `
            <div class="dp-block">
                <div class="detail-variants" id="detail-variants">
                    ${weights.map(w => `
                        <button class="weight-btn" data-grams="${w}" data-price="${p.variants[w]}"
                            onclick="UI.selectVariant(${id}, '${w}', ${p.variants[w]})"
                        >${w}г</button>`).join('')}
                </div>
            </div>` : '';

        // ── Price ──────────────────────────────────────────
        const priceHtml = p.on_order ? '' : `
            <div class="dp-price-wrap">
                <div class="detail-price" id="detail-price">${initialPrice}₴</div>
            </div>`;

        // ── Origin ──────────────────────────────────────────
        const originHtml = p.origin ? `
            <div class="dp-origin">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${p.origin}
            </div>` : '';

        // ── Brew guide ──────────────────────────────────────
        const brew = p.brew || {};
        const brewItems = [
            brew.temp   && { icon: '🌡', label: 'Температура', value: `${brew.temp}°C` },
            brew.time   && { icon: '⏱', label: 'Перший злив', value: `${brew.time} сек` },
            brew.amount && { icon: '⚖', label: 'Заварка', value: brew.amount },
            brew.steeps && { icon: '♾', label: 'Зливів', value: brew.steeps },
        ].filter(Boolean);

        const brewHtml = brewItems.length > 0 ? `
            <div class="dp-block dp-brew-block">
                <div class="dp-label">Заварювання</div>
                <div class="dp-brew-grid">
                    ${brewItems.map(item => `
                        <div class="dp-brew-card">
                            <span class="dp-brew-icon">${item.icon}</span>
                            <span class="dp-brew-value">${item.value}</span>
                            <span class="dp-brew-label">${item.label}</span>
                        </div>`).join('')}
                </div>
                ${brew.notes ? `<p class="dp-brew-notes">${brew.notes}</p>` : ''}
            </div>` : '';

        // ── Description ─────────────────────────────────────
        const desc = p.description || 'Традиційний китайський чай, зібраний колективом JEFE.';

        // ── Final HTML ──────────────────────────────────────
        container.innerHTML = `
            <div class="detail-container detail-container--v2">
                <div class="detail-media">
                    ${sliderHtml}
                </div>
                <div class="detail-info--v2">
                    <div class="dp-content-top">
                        <div class="dp-top">
                            <div class="dp-meta">
                                <span class="dp-cat">${p.category}</span>
                                ${originHtml}
                            </div>
                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 12px; flex-wrap: wrap;">
                                <h2 class="dp-name" style="margin-bottom: 0;">${p.name}</h2>
                            </div>
                            <p class="dp-desc">${desc}</p>
                        </div>
                        ${brewHtml}
                    </div>

                    <div class="dp-content-bottom">
                         ${variantsHtml}
                         ${priceHtml}
                         <div class="dp-purchase">
                             <button class="btn-buy" onclick="UI.addToCart(${p.id})">
                                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                                 ${p.on_order ? 'Замовити' : 'Додати в кошик'}
                             </button>
                         </div>
                    </div>
                </div>
            </div>
        `;


        // ── Slider state ─────────────────────────────────────
        State.sliderIndex = 0;
        State.sliderId = String(id);
        State.sliderTotal = images.length;
        this._initSliderSwipe(id);

        // ── Auto-select variant ──────────────────────────────
        if (weights.length > 0) {
            const defaultW = weights.includes('100') ? '100' : weights[0];
            this.selectVariant(id, defaultW, p.variants[defaultW]);
        }

        // --- GA4 View Item ---
        if (typeof gtag !== 'undefined') {
            gtag('event', 'view_item', {
                currency: 'UAH',
                value: initialPrice || 0,
                items: [{ item_id: String(p.id), item_name: p.name, item_category: p.category, price: initialPrice || 0 }]
            });
        }

        modal.classList.add('active');
        document.body.classList.add('no-scroll');
    },



    slideImg(id, dir) {
        const total = State.sliderTotal;
        if (!total || total <= 1) return;
        State.sliderIndex = (State.sliderIndex + dir + total) % total;
        this.goToSlide(id, State.sliderIndex);
    },

    goToSlide(id, idx) {
        State.sliderIndex = idx;
        const track = document.getElementById(`img-track-${id}`);
        if (track) track.style.transform = `translateX(-${idx * 100}%)`;

        document.querySelectorAll(`#img-dots-${id} .img-dot`).forEach((d, i) =>
            d.classList.toggle('active', i === idx));
        document.querySelectorAll(`#img-thumbs-${id} .img-thumb`).forEach((t, i) =>
            t.classList.toggle('active', i === idx));
    },

    _initSliderSwipe(id) {
        const slider = document.getElementById(`img-slider-${id}`);
        if (!slider || State.sliderTotal <= 1) return;
        let startX = 0;
        slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
        slider.addEventListener('touchend', e => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) this.slideImg(id, diff > 0 ? 1 : -1);
        }, { passive: true });
    },



    selectVariant(id, grams, price) {
        State.selectedVariant = { grams, price };
        // Update price display
        const priceEl = document.getElementById('detail-price');
        if (priceEl) priceEl.textContent = `${price}₴`;
        // Highlight active button
        document.querySelectorAll('.weight-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.grams === String(grams));
        });
    },

    closeDetail() {
        document.getElementById('product-detail').classList.remove('active');
        document.body.classList.remove('no-scroll');
    },

    addToCart(id) {
        const p = State.db.find(x => x.id === id);
        if (p) {
            let price = p.price;
            if (p.on_order) price = 0;
            else if (State.selectedVariant) price = State.selectedVariant.price;

            this.addToCartManual({
                id: p.id,
                name: p.name,
                category: p.category,
                price: price,
                grams: State.selectedVariant ? State.selectedVariant.grams : (p.weight || null),
                image: (p.images ? p.images[0] : p.image)
            });
            this.closeDetail();
            // Show the "Added to Cart" popup
            this.showAddedPopup(p.name);

            // --- GA4 Add to Cart ---
            if (typeof gtag !== 'undefined') {
                gtag('event', 'add_to_cart', {
                    currency: 'UAH',
                    value: price,
                    items: [{ item_id: String(p.id), item_name: p.name, item_category: p.category, price: price, quantity: 1 }]
                });
            }
        }
    },

    addToCartManual(item) {
        const existing = State.cart.find(x => x.id === item.id && x.grams === item.grams);
        if (existing) {
            existing.qty = (existing.qty || 1) + 1;
        } else {
            item.qty = 1;
            State.cart.push(item);
        }
        this.updateCartUI();
        localStorage.setItem('jefe_cart', JSON.stringify(State.cart));
    },

    updateCartUI() {
        const container = document.getElementById('cart-items');
        const checkoutBtnBlock = document.getElementById('cart-footer-block');
        if (!container) return;

        if (State.cart.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; margin-top: 60px;">
                    <p style="font-size: 1.25rem; margin-bottom: 30px; color: rgba(255,255,255,0.85); font-weight: 600;">Ваш кошик ще порожній</p>
                    <button class="btn-checkout" onclick="UI.toggleSidebar('cart', false); UI.scrollTo('#collection');" 
                            style="background: #ff5a00; color: #000; border-radius: 14px; padding: 18px 40px; font-weight: 900; border: none; cursor: pointer; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 4px 30px rgba(255, 90, 0, 0.6); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
                        Перейти до каталогу
                    </button>
                </div>
            `;
            if (checkoutBtnBlock) checkoutBtnBlock.style.display = 'none';
        } else {
            container.innerHTML = State.cart.map((item, idx) => `
                <div class="cart-item" style="display: flex; gap: 15px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.06); align-items: center;">
                    <img src="${item.image}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 12px; background: #1a1a1a;">
                    <div style="flex: 1;">
                        <div style="font-weight: 900; font-size: 1.05rem; margin-bottom: 3px;">${item.name}</div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="opacity: 0.8; font-size: 0.85rem; color: #fff;">
                                ${item.grams ? item.grams + 'г' : ''} 
                                <span style="font-weight: 800; margin-left: 5px;">x${item.qty || 1}</span>
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <button onclick="UI.updateQty(${idx}, -1)" style="width: 24px; height: 24px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 900;">–</button>
                                <button onclick="UI.updateQty(${idx}, 1)" style="width: 24px; height: 24px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 900;">+</button>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                        <button onclick="UI.removeFromCart(${idx})" style="background: none; border: none; color: #ff5e5e; cursor: pointer; font-size: 1.1rem; opacity: 0.6;">&times;</button>
                        <div style="font-weight: 900; font-size: 1.15rem; letter-spacing: -0.5px; color: #fff;">${Number(item.price) * (item.qty || 1)}₴</div>
                    </div>
                </div>
            `).join('');
            if (checkoutBtnBlock) checkoutBtnBlock.style.display = 'block';
        }

        const total = State.cart.reduce((acc, curr) => acc + (Number(curr.price) * (curr.qty || 1)), 0);
        const totalEl = document.getElementById('cart-total');
        if (totalEl) totalEl.innerText = `${total}₴`;

        const badge = document.getElementById('cart-qty');
        if (badge) badge.innerText = State.cart.reduce((acc, item) => acc + (item.qty || 1), 0);
    },

    removeFromCart(index) {
        const item = State.cart[index];
        if (item && typeof gtag !== 'undefined') {
            gtag('event', 'remove_from_cart', {
                currency: 'UAH',
                value: item.price * (item.qty || 1),
                items: [{ item_id: String(item.id), item_name: item.name, price: item.price, quantity: item.qty || 1 }]
            });
        }
        State.cart.splice(index, 1);
        this.updateCartUI();
        localStorage.setItem('jefe_cart', JSON.stringify(State.cart));
    },

    updateQty(index, delta) {
        const item = State.cart[index];
        if (!item) return;
        
        item.qty = (item.qty || 1) + delta;
        if (item.qty <= 0) {
            this.removeFromCart(index);
        } else {
            localStorage.setItem('jefe_cart', JSON.stringify(State.cart));
            this.updateCartUI();
        }
    },

    scrollTo(selector) {
        document.querySelector(selector).scrollIntoView({ behavior: 'smooth' });
    },

    setupSplitText() {
        // Removed as per request to make title static
    },

    setupScrollEffects() {
        // Removed dynamic transforms to prevent mobile scrolling jumps
        const scrollIndicator = document.getElementById('scroll-indicator');
        window.addEventListener('scroll', () => {
            const scroll = window.scrollY;
            if (scrollIndicator) {
                scrollIndicator.classList.toggle('hidden', scroll > 80);
            }
        });
    },

    setupObservers() {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    },

    checkout() {
        if (State.cart.length === 0) return;
        this.toggleCheckout(true);

        // --- GA4 Begin Checkout ---
        if (typeof gtag !== 'undefined') {
            const total = State.cart.reduce((acc, curr) => acc + (curr.price * (curr.qty || 1)), 0);
            gtag('event', 'begin_checkout', {
                currency: 'UAH',
                value: total,
                items: State.cart.map(item => ({
                    item_id: String(item.id),
                    item_name: item.name,
                    price: item.price,
                    quantity: item.qty || 1
                }))
            });
        }
    },

    toggleCheckout(open, e) {
        if (e && e.target !== e.currentTarget) return;
        const modal = document.getElementById('checkout-sidebar');
        if (!modal) return;

        modal.classList.toggle('active', open);
        document.body.classList.toggle('no-scroll', open);
        
        if (open) {
            modal.scrollTop = 0; // Reset scroll on open
            this.toggleSidebar('cart', false);
            // Update total in checkout
            const sum = State.cart.reduce((acc, curr) => acc + (Number(curr.price) * (curr.qty || 1)), 0);
            document.getElementById('co-total').innerText = `${sum}₴`;
        }
    },

    onDeliveryTypeChange(type) {
        const pickupInfo = document.getElementById('co-pickup-info');
        const deliveryOpts = document.getElementById('co-delivery-options');
        
        if (type === 'pickup') {
            pickupInfo.style.display = 'block';
            deliveryOpts.style.display = 'none';
        } else {
            pickupInfo.style.display = 'none';
            deliveryOpts.style.display = 'block';
        }
    },

    onCourierChange(type) {
        const npFields = document.getElementById('co-np-fields');
        const taxiFields = document.getElementById('co-taxi-fields');
        
        if (type === 'np') {
            npFields.style.display = 'block';
            taxiFields.style.display = 'none';
        } else {
            npFields.style.display = 'none';
            taxiFields.style.display = 'block';
        }
    },

    handleCheckoutSubmit(e) {
        e.preventDefault();
        
        const phoneInput = document.getElementById('co-phone').value.trim();
        if (!phoneInput.startsWith('+380')) {
            alert('Будь ласка, введіть коректний номер телефону, що починається з +380');
            return;
        }

        const data = {
            name: document.getElementById('co-name').value,
            phone: phoneInput,
            email: document.getElementById('co-email').value,
            deliveryType: document.querySelector('input[name="delivery-type"]:checked').value,
            comment: document.getElementById('co-comment').value,
            items: State.cart,
            total: State.cart.reduce((acc, curr) => acc + (Number(curr.price) * (curr.qty || 1)), 0)
        };

        if (data.deliveryType === 'delivery') {
            data.courierType = document.querySelector('input[name="courier-type"]:checked').value;
            if (data.courierType === 'np') {
                data.npCity = document.getElementById('co-np-city').value;
                data.npBranch = document.getElementById('co-np-branch').value;
                if (!data.npCity || !data.npBranch) {
                    alert('Будь ласка, заповніть дані для Нової Пошти');
                    return;
                }
            } else {
                data.taxiAddress = document.getElementById('co-taxi-address').value;
                if (!data.taxiAddress) {
                    alert('Будь ласка, вкажіть адресу для таксі');
                    return;
                }
            }
        }

        console.log('Order submitted:', data);

        // --- Telegram Integration ---
        let itemsListHTML = data.items.map(item => 
            `▫️ <b>${escapeHTML(item.name)}</b> ${item.grams ? `(${escapeHTML(item.grams)}г)` : ''} x${item.qty} — ${item.price * item.qty}₴`
        ).join('\n');

        let deliveryInfoHTML = data.deliveryType === 'pickup' 
            ? '🏪 <b>Самовивіз</b> (Нагірна)'
            : `🚚 <b>Доставка:</b> ${data.courierType === 'np' ? 'Нова Пошта' : 'Таксі'}\n` +
              (data.courierType === 'np' 
                ? `📍 Мiсто: ${escapeHTML(data.npCity)}\n🏢 Вiддiлення: ${escapeHTML(data.npBranch)}` 
                : `🏠 Адреса: ${escapeHTML(data.taxiAddress)}`);

        const message = `
📦 <b>НОВЕ ЗАМОВЛЕННЯ</b>

👤 <b>Клієнт:</b> ${escapeHTML(data.name)}
📞 <b>Телефон:</b> <code>${escapeHTML(data.phone)}</code>
📧 <b>Email:</b> ${escapeHTML(data.email)}

🛍 <b>Товари:</b>
${itemsListHTML}

💰 <b>Разом:</b> <b>${data.total}₴</b>

---
${deliveryInfoHTML}

💬 <b>Коментар:</b> ${escapeHTML(data.comment)}
        `.trim();
        sendToTelegram(message, 'orders');
        
        // --- GA4 Purchase ---
        if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase', {
                transaction_id: 'T_' + Date.now(),
                currency: 'UAH',
                value: data.total,
                items: data.items.map(item => ({
                    item_id: String(item.id),
                    item_name: item.name,
                    price: item.price,
                    quantity: item.qty || 1
                }))
            });
        }

        // Success feedback
        alert(`Дякую, ${data.name}! Замовлення на суму ${data.total}₴ отримано. Ми зв'яжемося з вами найближчим часом.🍵`);
        
        State.cart = [];
        localStorage.removeItem('jefe_cart');
        this.updateCartUI();
        this.toggleCheckout(false);
    },

    toggleMessengerOptions(show) {
        const el = document.getElementById('messenger-sub-options');
        if (el) el.style.display = show ? 'block' : 'none';
    },

    showAddedPopup(name) {
        const popup = document.getElementById('added-popup');
        if (!popup) return;
        popup.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeAddedPopup(action) {
        const popup = document.getElementById('added-popup');
        if (popup) popup.classList.remove('active');
        
        if (action === 'continue') {
            document.body.style.overflow = 'auto';
        } else if (action === 'checkout') {
            this.toggleSidebar('cart', true);
        }
    },

    toast(msg) {
        let t = document.getElementById('jefe-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'jefe-toast';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.classList.add('active');
        setTimeout(() => t.classList.remove('active'), 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => UI.init());

// Keyboard: Escape + slider arrow navigation
document.addEventListener('keydown', (e) => {
    const detailActive = document.getElementById('product-detail')?.classList.contains('active');
    const searchActive = document.getElementById('search-overlay')?.classList.contains('active');

    if (e.key === 'Escape') {
        if (searchActive) UI.toggleSearch(false);
        FooterModal.closeAll();
    }

    // Arrow keys navigate slider when detail modal is open
    if (detailActive && !searchActive && State.sliderId) {
        if (e.key === 'ArrowLeft')  UI.slideImg(State.sliderId, -1);
        if (e.key === 'ArrowRight') UI.slideImg(State.sliderId, 1);
    }
});

// ── Footer Modals ─────────────────────────────────────────────

const FooterModal = {
    _ids: ['delivery', 'returns', 'pickup', 'contacts', 'manager'],

    open(name) {
        this.closeAll();
        const el = document.getElementById(`fmodal-${name}`);
        if (el) {
            el.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    close(name) {
        const el = document.getElementById(`fmodal-${name}`);
        if (el) el.classList.remove('active');
        document.body.style.overflow = '';
    },

    closeAll(e) {
        // If triggered by overlay click, only close if clicked the overlay itself
        if (e && e.target !== e.currentTarget) return;
        this._ids.forEach(id => {
            const el = document.getElementById(`fmodal-${id}`);
            if (el) el.classList.remove('active');
        });
        document.body.style.overflow = '';
    },

    async submitForm(e) {
        e.preventDefault();
        const name     = document.getElementById('mgr-name')?.value.trim() || '—';
        const phone    = document.getElementById('mgr-phone')?.value.trim();
        const question = document.getElementById('mgr-question')?.value.trim() || '—';
        
        if (!phone) {
            alert('Будь ласка, введіть номер телефону');
            return;
        }

        // --- Telegram Integration ---
        const message = `
❓ <b>НОВЕ ЗВЕРНЕННЯ (МЕНЕДЖЕР)</b>

👤 <b>Ім'я:</b> ${escapeHTML(name)}
📞 <b>Телефон:</b> <code>${escapeHTML(phone)}</code>
💬 <b>Питання:</b>
${escapeHTML(question)}
        `.trim();

        // Show loading state on button
        const btn = e.target;
        const originalText = btn.textContent;
        btn.textContent = 'Надсилаємо...';
        btn.disabled = true;

        await sendToTelegram(message, 'inquiries');

        // Replace modal body with success message
        const body = document.querySelector('.mp-body');
        if (body) {
            body.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #fff;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🍵</div>
                    <h3 style="margin-bottom: 15px; font-weight: 800;">Дякуємо!</h3>
                    <p style="opacity: 0.8; line-height: 1.5; font-size: 0.95rem;">Ми отримали ваш запит і зв'яжемось з вами найближчим часом.</p>
                </div>
            `;
        }

        // Auto-close after 3 seconds
        setTimeout(() => this.close('manager'), 4000);
    }
};

const Marketing = {
    async handleNewsletter(e) {
        e.preventDefault();
        const input = document.getElementById('news-email');
        const email = input.value.trim();
        if (!email) return;

        const btn = e.target.querySelector('button');
        if (btn) btn.disabled = true;

        const message = `📬 <b>НОВА ПІДПИСКА</b>\n\nEmail: <code>${escapeHTML(email)}</code>`;
        await sendToTelegram(message, 'newsletter');

        input.value = '';
        if (btn) btn.disabled = false;
        
        UI.toast('Дякуємо за підписку! 🍵');
    }
};

