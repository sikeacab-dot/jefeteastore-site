/**
 * JEFE TEASTORE - ULTIMATE UNIFIED ENGINE v2
 * Focus: logic safety, checkout validation, premium stability.
 */

const State = {
    db: [],
    filteredItems: [],
    visibleCount: 12,
    itemsPerPage: 12,
    cart: [],
    selectedVariant: null,
    isMobile: window.matchMedia("(max-width: 820px)").matches
};

const TG_CONFIG = {
    token: window.JEFE_CONFIG?.token || '',
    chatId: window.JEFE_CONFIG?.chatId || '',
    threads: window.JEFE_CONFIG?.threads || { orders: 3, inquiries: 3, newsletter: 3 }
};

// --- Utils ---
function escapeHTML(str) {
    if (!str) return '—';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendToTelegram(message, threadType = 'orders') {
    if (!TG_CONFIG.token || TG_CONFIG.token.includes('ВАШ_')) return;
    const threadId = TG_CONFIG.threads[threadType];
    const url = `https://api.telegram.org/bot${TG_CONFIG.token}/sendMessage`;
    const payload = { chat_id: TG_CONFIG.chatId, text: message, parse_mode: 'HTML' };
    if (threadId) payload.message_thread_id = threadId;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok && payload.message_thread_id) {
            delete payload.message_thread_id;
            await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }
    } catch (err) { console.error("JEFE: TG Delivery Error", err); }
}

// --- Core UI Engine ---
const UI = {
    init() {
        console.log("JEFE: Engine Active. Stability Mode.");
        try { State.cart = JSON.parse(localStorage.getItem('jefe_cart')) || []; } catch(e) { State.cart = []; }
        
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);

        this.syncDatabase();
        this.setupEventListeners();
        this.optimizePerformance();
    },

    syncDatabase() {
        const source = window.products || [];
        if (source.length > 0) {
            State.db = source;
            document.body.classList.add('loaded');
            this.filterBy('all', null, false);
            this.updateCartUI();
            this.setupInfiniteScroll();
        } else {
            setTimeout(() => this.syncDatabase(), 100);
        }
    },

    optimizePerformance() {
        if (State.isMobile) {
            document.querySelectorAll('.grain, .mesh-glow, .cursor').forEach(el => el.remove());
        }
        this.setupObservers();
        this.setupMouse();
    },

    setupEventListeners() {
        window.matchMedia("(max-width: 820px)").addEventListener('change', e => {
            State.isMobile = e.matches;
            this.renderProducts();
        });

        // Global click handler for closing sidebars via overlay
        document.addEventListener('click', e => {
            if (e.target.classList.contains('sidebar-overlay')) {
                const sidebar = e.target.closest('.sidebar');
                if (sidebar) {
                    const id = sidebar.id.replace('-sidebar', '');
                    this.toggleSidebar(id, false);
                }
            }
            if (e.target.classList.contains('detail-view')) this.closeDetail();
        });
    },

    filterBy(cat, tabEl, scroll = true) {
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        if (tabEl) tabEl.classList.add('active');
        else {
            const match = document.querySelector(`.cat-tab[data-cat="${cat}"]`);
            if (match) match.classList.add('active');
        }

        State.filteredItems = cat === 'all' ? [...State.db] : State.db.filter(p => p.category === cat);
        State.visibleCount = State.itemsPerPage;
        this.renderProducts();
        if (scroll) document.querySelector('#collection').scrollIntoView({ behavior: 'smooth' });
    },

    renderProducts() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        const items = State.filteredItems.slice(0, State.visibleCount);
        if (items.length === 0) {
            grid.innerHTML = `<div style="padding:100px; opacity:0.3; width:100%; text-align:center;">Товарів не знайдено</div>`;
            return;
        }

        grid.innerHTML = items.map(p => {
            const img = p.images?.[0] || p.image || '';
            const price = p.variants ? (p.variants['100'] || Object.values(p.variants)[0]) : (p.price || 0);
            return `
                <div class="card reveal" onclick="UI.openDetail(${p.id})">
                    ${p.badge && p.badge !== 'none' ? `<div class="badge badge-${p.badge.toLowerCase()}">${p.badge}</div>` : ''}
                    <div class="card-media">
                        <img src="${img}" loading="lazy" decoding="async" onload="this.classList.add('loaded')" alt="${p.name}">
                    </div>
                    <div class="card-info">
                        <p class="card-cat">${p.category}</p>
                        <h4 class="card-title">${p.name}</h4>
                        <span class="card-price">${p.on_order ? 'Замовити' : price + '₴'}</span>
                    </div>
                </div>
            `;
        }).join('');
        this.setupObservers();
    },

    setupInfiniteScroll() {
        const sentinel = document.getElementById('scroll-sentinel');
        if (!sentinel) return;
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && State.visibleCount < State.filteredItems.length) {
                State.visibleCount += State.itemsPerPage;
                this.renderProducts();
            }
        }, { rootMargin: '300px' });
        obs.observe(sentinel);
    },

    openDetail(id) {
        const p = State.db.find(x => x.id === id);
        if (!p) return;
        State.selectedVariant = null;

        const modal = document.getElementById('product-detail');
        const container = document.getElementById('detail-content');
        modal.scrollTop = 0;

        const images = p.images?.length > 0 ? p.images : [p.image];
        const weights = p.variants ? Object.keys(p.variants).sort((a,b) => Number(a)-Number(b)) : [];
        const initialPrice = weights.length > 0 ? p.variants[weights.includes('100') ? '100' : weights[0]] : p.price;

        container.innerHTML = `
            <div class="detail-container">
                <div class="detail-media">
                    <div class="img-slider">
                        <div class="img-slider-track">
                            ${images.map(src => `<div class="img-slide"><img src="${src}"></div>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="detail-info--v2">
                    <div class="dp-meta"><span class="dp-cat">${p.category}</span></div>
                    <h2 class="dp-name">${p.name}</h2>
                    <p class="dp-desc">${p.description || 'Натуральний преміальний чай.'}</p>
                    ${weights.length > 0 && !p.on_order ? `
                        <div class="dp-block">
                            <div class="dp-label">Вага</div>
                            <div class="detail-variants">
                                ${weights.map(w => `
                                    <button type="button" class="weight-btn ${w===(weights.includes('100')?'100':weights[0])?'active':''}" 
                                            onclick="UI.selectVariant(${id}, '${w}', ${p.variants[w]})">${w}г</button>
                                `).join('')}
                            </div>
                        </div>` : ''}
                    <div class="dp-bottom">
                        <div class="detail-price" id="detail-price">${initialPrice}₴</div>
                        <button type="button" class="btn-buy" onclick="UI.addToCart(${p.id})">${p.on_order ? 'Замовити' : 'В кошик'}</button>
                    </div>
                </div>
            </div>
        `;

        if (weights.length > 0) State.selectedVariant = { grams: weights.includes('100') ? '100' : weights[0], price: initialPrice };
        modal.classList.add('active');
        document.body.classList.add('no-scroll');
    },

    selectVariant(id, grams, price) {
        State.selectedVariant = { grams, price };
        const priceEl = document.getElementById('detail-price');
        if (priceEl) priceEl.innerText = `${price}₴`;
        document.querySelectorAll('.weight-btn').forEach(b => b.classList.toggle('active', b.innerText === grams+'г'));
    },

    closeDetail() {
        document.getElementById('product-detail').classList.remove('active');
        document.body.classList.remove('no-scroll');
    },

    addToCart(id) {
        const p = State.db.find(x => x.id === id);
        if (!p) return;
        const price = p.on_order ? 0 : (State.selectedVariant?.price || p.price);
        const item = {
            id: p.id,
            name: p.name,
            price: price,
            grams: State.selectedVariant?.grams || null,
            image: p.images?.[0] || p.image,
            qty: 1
        };

        const existing = State.cart.find(x => x.id === item.id && x.grams === item.grams);
        if (existing) existing.qty++;
        else State.cart.push(item);

        this.updateCartUI();
        localStorage.setItem('jefe_cart', JSON.stringify(State.cart));
        this.closeDetail();
        
        // Show confirmation popup
        const popup = document.getElementById('added-popup');
        if (popup) popup.classList.add('active');
    },

    closeAddedPopup(action) {
        const popup = document.getElementById('added-popup');
        if (popup) popup.classList.remove('active');
        if (action === 'checkout') this.toggleSidebar('cart', true);
    },

    updateCartUI() {
        const container = document.getElementById('cart-items');
        const badge = document.getElementById('cart-qty');
        const totalEl = document.getElementById('cart-total');
        const footer = document.getElementById('cart-footer-block');

        const count = State.cart.reduce((a, b) => a + b.qty, 0);
        const total = State.cart.reduce((a, b) => a + (b.price * b.qty), 0);

        if (badge) badge.innerText = count;
        if (totalEl) totalEl.innerText = `${total}₴`;
        const coTotal = document.getElementById('co-total');
        if (coTotal) coTotal.innerText = `${total}₴`;

        if (!container) return;
        if (State.cart.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:50px; opacity:0.5;">Кошик порожній</div>`;
            if (footer) footer.style.display = 'none';
        } else {
            container.innerHTML = State.cart.map((item, idx) => `
                <div class="cart-item">
                    <img src="${item.image}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
                    <div style="flex:1;">
                        <div style="font-weight:700; font-size:0.9rem;">${item.name}</div>
                        <div style="font-size:0.75rem; opacity:0.6;">${item.grams?item.grams+'г':''} x${item.qty}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:800;">${item.price * item.qty}₴</div>
                        <button type="button" onclick="UI.removeFromCart(${idx})" style="background:none; border:none; color:#ff4444; font-size:1.2rem; cursor:pointer;">&times;</button>
                    </div>
                </div>
            `).join('');
            if (footer) footer.style.display = 'block';
        }
    },

    removeFromCart(idx) {
        State.cart.splice(idx, 1);
        this.updateCartUI();
        localStorage.setItem('jefe_cart', JSON.stringify(State.cart));
    },

    toggleSidebar(type, open) {
        const el = document.getElementById(`${type}-sidebar`);
        if (el) el.classList.toggle('active', open);
        document.body.classList.toggle('no-scroll', open);
    },

    // UI Entry point for checkout from cart
    checkout() {
        if (State.cart.length === 0) return;
        // ONLY open the checkout view, do NOT trigger any submission logic
        this.toggleCheckout(true);
    },

    toggleCheckout(open) {
        this.toggleSidebar('checkout', open);
        if (open) {
            this.toggleSidebar('cart', false); // Clean switch
            const total = State.cart.reduce((a, b) => a + (b.price * b.qty), 0);
            const coTotal = document.getElementById('co-total');
            if (coTotal) coTotal.innerText = `${total}₴`;
        }
    },

    onDeliveryTypeChange(type) {
        const pickupInfo = document.getElementById('co-pickup-info');
        const deliveryOpts = document.getElementById('co-delivery-options');
        if (pickupInfo) pickupInfo.style.display = (type === 'pickup' ? 'block' : 'none');
        if (deliveryOpts) deliveryOpts.style.display = (type === 'delivery' ? 'block' : 'none');
    },

    onCourierChange(type) {
        const npFields = document.getElementById('co-np-fields');
        const taxiFields = document.getElementById('co-taxi-fields');
        if (npFields) npFields.style.display = (type === 'np' ? 'block' : 'none');
        if (taxiFields) taxiFields.style.display = (type === 'taxi' ? 'block' : 'none');
    },

    // Robust Submission Handler
    async handleCheckoutSubmit(e) {
        e.preventDefault(); // CRITICAL: Stop the browser from submitting the form normally
        
        const phoneField = document.getElementById('co-phone');
        const phone = phoneField ? phoneField.value.trim() : '';

        // Strict Validation: Stop if phone is missing or invalid
        if (!phone || phone === '+380' || phone.length < 10) {
            alert("Будь ласка, введіть коректний номер телефону для зв'язку.");
            if (phoneField) phoneField.focus();
            return;
        }

        const btn = e.target.querySelector('button[type="submit"]');
        if (btn) {
            btn.disabled = true;
            btn.innerText = "Відправляємо...";
        }

        try {
            const data = {
                name: document.getElementById('co-name')?.value.trim() || 'Клієнт',
                messenger: document.querySelector('input[name="order-messenger"]:checked')?.value || 'Telegram',
                comment: document.getElementById('co-comment')?.value.trim() || '—',
                deliveryType: document.querySelector('input[name="delivery-type"]:checked')?.value || 'pickup',
                courierType: document.querySelector('input[name="courier-type"]:checked')?.value || 'np',
                total: State.cart.reduce((a, b) => a + (b.price * b.qty), 0)
            };

            let deliveryMsg = data.deliveryType === 'pickup' ? '🏪 Самовивіз (Нагірна 16)' : '🚚 Доставка';
            if (data.deliveryType === 'delivery') {
                if (data.courierType === 'np') {
                    const city = document.getElementById('co-np-city')?.value.trim() || '—';
                    const branch = document.getElementById('co-np-branch')?.value.trim() || '—';
                    deliveryMsg += ` (Нова Пошта): ${city}, Відділення ${branch}`;
                } else {
                    const addr = document.getElementById('co-taxi-address')?.value.trim() || '—';
                    deliveryMsg += ` (Таксі): ${addr}`;
                }
            }
            
            const itemsList = State.cart.map(i => `• ${i.name} ${i.grams ? '('+i.grams+'г)' : ''} x${i.qty} — ${i.price * i.qty}₴`).join('\n');
            
            const message = `🛍 <b>НОВЕ ЗАМОВЛЕННЯ</b>\n\n` +
                `👤 Клієнт: <b>${escapeHTML(data.name)}</b>\n` +
                `📞 Телефон: <code>${escapeHTML(phone)}</code>\n` +
                `💬 Зв'язок: <b>${data.messenger}</b>\n\n` +
                `📜 Товари:\n${itemsList}\n\n` +
                `💰 Разом: <b>${data.total}₴</b>\n` +
                `📍 Доставка: ${escapeHTML(deliveryMsg)}\n` +
                `💬 Коментар: ${escapeHTML(data.comment)}`;

            await sendToTelegram(message);
            
            // CLEANUP ONLY ON SUCCESS
            State.cart = [];
            localStorage.removeItem('jefe_cart');
            this.updateCartUI();
            this.toggleCheckout(false);
            
            alert("Дякуємо! Замовлення прийнято. Менеджер зв'яжеться з вами найближчим часом.");

        } catch (err) {
            console.error("Submission failed", err);
            alert("Сталася помилка при відправці. Спробуйте ще раз або зверніться до нас напрямую.");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Підтвердити замовлення";
            }
        }
    },

    setupObservers() {
        const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); }), { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    },

    setupMouse() {
        if (State.isMobile) return;
        const glow = document.querySelector('.mesh-glow');
        const cursor = document.querySelector('.cursor');
        window.onmousemove = (e) => {
            if (cursor) {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            }
            if (glow) {
                const x = (e.clientX / window.innerWidth) * 100;
                const y = (e.clientY / window.innerHeight) * 100;
                glow.style.setProperty('--x', x + '%');
                glow.style.setProperty('--y', y + '%');
            }
        };
    }
};

// --- Additional Blocks ---
const Marketing = {
    async handleNewsletter(e) {
        e.preventDefault();
        const input = document.getElementById('footer-news-email');
        if (!input) return;
        const msg = `📬 <b>ПІДПИСКА</b>: <code>${escapeHTML(input.value)}</code>`;
        await sendToTelegram(msg, 'newsletter');
        input.value = '';
        alert("Дякуємо за підписку!");
    }
};

const FooterModal = {
    open(id) {
        const modal = document.getElementById(`fmodal-${id}`);
        if (modal) {
            modal.classList.add('active');
            document.body.classList.add('no-scroll');
        }
    },
    close(id) {
        const modal = document.getElementById(`fmodal-${id}`);
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    },
    async submitForm(e) {
        e.preventDefault();
        const nameInput = document.getElementById('mgr-name');
        const phoneInput = document.getElementById('mgr-phone');
        
        const name = nameInput ? nameInput.value.trim() : '—';
        const phone = phoneInput ? phoneInput.value.trim() : '';

        if (!phone || phone === '+380') {
            alert("Вкажіть ваш номер телефону.");
            return;
        }

        const msg = `🙋‍♂️ <b>ПИТАННЯ МЕНЕДЖЕРУ</b>\n\nІм'я: ${name}\nТел: ${phone}`;
        await sendToTelegram(msg, 'inquiries');
        this.close('manager');
        alert("Дякуємо! Ми зв'яжемося з вами.");
    }
};

// --- Keyboard Logic ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        UI.closeDetail();
        UI.toggleSidebar('cart', false);
        UI.toggleSidebar('checkout', false);
        UI.toggleSidebar('cat', false);
        UI.toggleSearch(false);
    }
});

document.addEventListener('DOMContentLoaded', () => UI.init());
