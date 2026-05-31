/**
 * ÍNTEGRAS — Lógica de Interactividad (JS v3)
 */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // 1. SELECTOR DE PERIODO DE PRECIOS
    // =========================================================================

    const pricingData = {
        mensual: {
            pertenece: { price: '45', suffix: '€/mes', total: '45€/mes',           saving: '',                              display: '45€/mes', nota: '' },
            transforma: { price: '90', suffix: '€/mes', total: '90€/mes',          saving: '',                              display: '90€/mes', nota: '' }
        },
        trimestral: {
            pertenece: { price: '38', suffix: '€/mes', total: '114€ cada 3 meses', saving: 'Ahorras 21€',                  display: '38€/mes', nota: '' },
            transforma: { price: '76', suffix: '€/mes', total: '228€ cada 3 meses', saving: 'Ahorras 36€',                 display: '76€/mes', nota: '' }
        },
        semestral: {
            pertenece: { price: '36', suffix: '€/mes', total: '216€ cada 6 meses', saving: 'Ahorras 54€',                  display: '36€/mes', nota: '' },
            transforma: { price: '72', suffix: '€/mes', total: '432€ cada 6 meses', saving: 'Ahorras 108€',                display: '72€/mes', nota: '' }
        },
        anual: {
            pertenece: { price: '33', suffix: '€/mes', total: '396€ al año',       saving: 'Pagas 10 meses, disfrutas 12',      display: '33€/mes', nota: 'Precio fijo para siempre como fundadora' },
            transforma: { price: '67', suffix: '€/mes', total: '804€ al año',      saving: 'Pagas 10 meses, disfrutas 12 ⭐',   display: '67€/mes', nota: 'Precio fijo para siempre como fundadora' }
        }
    };

    const periodBtns = document.querySelectorAll('.period-btn');
    const planesGrid = document.querySelector('.planes-grid');

    function updatePricing(period) {
        const data = pricingData[period];
        if (!data || !planesGrid) return;

        planesGrid.style.opacity = '0.5';
        planesGrid.style.transform = 'scale(0.99)';
        planesGrid.style.transition = 'opacity 0.15s ease, transform 0.15s ease';

        setTimeout(() => {
            ['pertenece', 'transforma'].forEach(plan => {
                const d = data[plan];

                const priceEl   = document.getElementById('price-' + plan);
                const suffixEl  = document.getElementById('suffix-' + plan);
                const totalEl   = document.getElementById('total-' + plan);
                const savingEl  = document.getElementById('saving-' + plan);
                const displayEl = document.getElementById('pdisplay-' + plan);
                const notaEl    = document.getElementById('nota-' + plan);

                if (priceEl)   priceEl.textContent  = d.price;
                if (suffixEl)  suffixEl.textContent  = d.suffix;
                if (totalEl)   totalEl.textContent   = d.total;
                if (displayEl) displayEl.textContent = d.display;
                if (notaEl)    notaEl.textContent    = d.nota;

                if (savingEl) {
                    if (d.saving) {
                        savingEl.textContent    = d.saving;
                        savingEl.style.display  = 'inline-block';
                    } else {
                        savingEl.style.display  = 'none';
                    }
                }
            });

            planesGrid.style.opacity   = '1';
            planesGrid.style.transform = 'scale(1)';
        }, 150);
    }

    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updatePricing(btn.dataset.period);
        });
    });

    // Render initial state (trimestral is active by default)
    updatePricing('trimestral');


    // =========================================================================
    // 2. MODAL
    // =========================================================================

    const modalOverlay = document.getElementById('modal');
    const modalClose   = document.getElementById('modal-close');
    const modalFormWrap = document.getElementById('modal-form-wrap');
    const modalSuccess = document.getElementById('modal-success');
    const modalBack    = document.getElementById('modal-back');
    const modalForm    = document.getElementById('modal-form');
    const openBtns     = document.querySelectorAll('.js-open-modal');

    function openModal() {
        if (!modalOverlay) return;
        modalOverlay.classList.add('active');
        modalOverlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const first = modalForm && modalForm.querySelector('input');
            if (first) first.focus();
        }, 300);
    }

    function closeModal() {
        if (!modalOverlay) return;
        modalOverlay.classList.remove('active');
        modalOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (modalForm) modalForm.reset();
            if (modalFormWrap) modalFormWrap.style.display = 'block';
            if (modalSuccess)  modalSuccess.style.display  = 'none';
        }, 350);
    }

    openBtns.forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            openModal();
        });
    });

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBack)  modalBack.addEventListener('click', closeModal);

    if (modalOverlay) {
        modalOverlay.addEventListener('click', e => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });


    // =========================================================================
    // 3. ENVÍO FORMULARIO MODAL
    // =========================================================================

    if (modalForm) {
        modalForm.addEventListener('submit', e => {
            e.preventDefault();

            const nombre  = document.getElementById('m-name').value.trim();
            const email   = document.getElementById('m-email').value.trim();
            const reason  = document.getElementById('m-reason').value.trim();
            const medical = document.getElementById('m-medical').value.trim();

            if (!nombre || !email || !reason) {
                alert('Por favor, completa los campos obligatorios (nombre, email y motivo).');
                return;
            }

            const submitBtn = modalForm.querySelector('button[type="submit"]');
            const origText  = submitBtn.textContent;
            submitBtn.disabled    = true;
            submitBtn.textContent = 'Procesando tu plaza…';

            setTimeout(() => {
                saveLead({ nombre, email, reason, medical, origen: 'Modal' });

                if (modalFormWrap) modalFormWrap.style.display = 'none';
                if (modalSuccess)  modalSuccess.style.display  = 'block';

                submitBtn.disabled    = false;
                submitBtn.textContent = origText;

                decrementPlazas();
            }, 1200);
        });
    }


    // =========================================================================
    // 4. ENVÍO FORMULARIO DE CONTACTO
    // =========================================================================

    const contactForm    = document.getElementById('contact-form');
    const contactSuccess = document.getElementById('contact-success');

    if (contactForm) {
        contactForm.addEventListener('submit', e => {
            e.preventDefault();

            const nombre  = document.getElementById('c-name').value.trim();
            const email   = document.getElementById('c-email').value.trim();
            const reason  = document.getElementById('c-reason').value.trim();
            const medical = document.getElementById('c-medical').value.trim();

            if (!nombre || !email || !reason) {
                alert('Por favor, completa los campos obligatorios (*).');
                return;
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const origText  = submitBtn.textContent;
            submitBtn.disabled    = true;
            submitBtn.textContent = 'Procesando tu plaza…';

            setTimeout(() => {
                saveLead({ nombre, email, reason, medical, origen: 'Formulario Contacto' });

                contactForm.style.display = 'none';
                if (contactSuccess) contactSuccess.style.display = 'block';

                submitBtn.disabled    = false;
                submitBtn.textContent = origText;

                decrementPlazas();
            }, 1200);
        });
    }


    // =========================================================================
    // 5. PERSISTENCIA DE LEADS (localStorage — solo desarrollo)
    // =========================================================================

    function saveLead(fields) {
        const lead = {
            id: 'lead_' + Date.now(),
            fechaRegistro: new Date().toISOString(),
            ...fields
        };
        const leads = JSON.parse(localStorage.getItem('integras_leads') || '[]');
        leads.push(lead);
        localStorage.setItem('integras_leads', JSON.stringify(leads));
    }


    // =========================================================================
    // 6. CONTADOR DE PLAZAS DISPONIBLES
    // =========================================================================

    let plazas = parseInt(localStorage.getItem('integras_plazas_restantes') || '25', 10);
    const plazasEls = document.querySelectorAll('.plazas-num');

    function renderPlazas() {
        plazasEls.forEach(el => { el.textContent = plazas; });
    }

    function decrementPlazas() {
        if (plazas > 1) {
            plazas--;
            localStorage.setItem('integras_plazas_restantes', String(plazas));
            renderPlazas();
        }
    }

    renderPlazas();


    // =========================================================================
    // 7. FAQ ACORDEÓN
    // =========================================================================

    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const btn  = item.querySelector('.faq-preg');
        const resp = item.querySelector('.faq-resp');
        if (!btn || !resp) return;

        btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');

            // Cerrar todos
            faqItems.forEach(i => {
                i.classList.remove('active');
                const r = i.querySelector('.faq-resp');
                if (r) r.style.maxHeight = '0';
            });

            // Abrir el pulsado si estaba cerrado
            if (!isOpen) {
                item.classList.add('active');
                resp.style.maxHeight = resp.scrollHeight + 'px';
            }
        });
    });


    // =========================================================================
    // 8. ANIMACIONES DE ENTRADA (IntersectionObserver)
    // =========================================================================

    const animEls = document.querySelectorAll('.anim');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        animEls.forEach(el => observer.observe(el));
    } else {
        animEls.forEach(el => el.classList.add('animated'));
    }

});
