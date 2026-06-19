/**
 * ÍNTEGRAS — Lógica de Interactividad (JS v3)
 */

// Los leads se envían a /api/submit-lead (función serverless en Vercel).
// La API Key de GoHighLevel vive en las Variables de Entorno de Vercel, nunca en este archivo.

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // 1. SELECTOR DE PERIODICIDAD
    // =========================================================================

    const pricingData = {
        mensual:    { fundadora: { total: '24,99', suf: '€/mes',          equiv: null,          ahorro: null           }, definitivo: { ref: '54,99€/mes'            } },
        trimestral: { fundadora: { total: '63,22', suf: '€ / trimestre',  equiv: '21,07 €/mes', ahorro: 'Ahorras 11,75€' }, definitivo: { ref: '138,95€ / trimestre'  } },
        semestral:  { fundadora: { total: '119,95', suf: '€ / semestre',  equiv: '19,99 €/mes', ahorro: 'Ahorras 29,99€' }, definitivo: { ref: '263,95€ / semestre'   } },
        anual:      { fundadora: { total: '221,91', suf: '€ / año',       equiv: '18,49 €/mes', ahorro: 'Ahorras 77,97€' }, definitivo: { ref: '487,91€ / año'         } }
    };

    const periodTabs = document.querySelectorAll('.period-tab');
    const pfTotal    = document.getElementById('pf-total');
    const pfSuf      = document.getElementById('pf-suf');
    const pfEquiv    = document.getElementById('pf-equiv');
    const pfAhorro   = document.getElementById('pf-ahorro');
    const pdRef      = document.getElementById('pd-ref');

    function updatePeriod(period) {
        const d = pricingData[period];
        if (!d) return;

        if (pfTotal) pfTotal.textContent = d.fundadora.total;
        if (pfSuf)   pfSuf.textContent   = d.fundadora.suf;

        if (pfEquiv) {
            pfEquiv.textContent   = d.fundadora.equiv || '';
            pfEquiv.style.display = d.fundadora.equiv ? '' : 'none';
        }
        if (pfAhorro) {
            if (d.fundadora.ahorro) {
                pfAhorro.textContent   = '· ' + d.fundadora.ahorro;
                pfAhorro.style.display = '';
            } else {
                pfAhorro.style.display = 'none';
            }
        }
        if (pdRef) pdRef.textContent = d.definitivo.ref;
    }

    periodTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            periodTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updatePeriod(tab.dataset.period);
        });
    });

    updatePeriod('trimestral');


    // =========================================================================
    // 2. MODAL
    // =========================================================================

    const modalOverlay = document.getElementById('modal');
    const modalClose = document.getElementById('modal-close');
    const modalFormWrap = document.getElementById('modal-form-wrap');
    const modalSuccess = document.getElementById('modal-success');
    const modalBack = document.getElementById('modal-back');
    const modalForm = document.getElementById('modal-form');
    const openBtns = document.querySelectorAll('.js-open-modal');

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
            if (modalSuccess) modalSuccess.style.display = 'none';
        }, 350);
    }

    let selectedPlan = null;

    function applyPlanToRadios(plan) {
        const radios = modalForm ? modalForm.querySelectorAll('input[name="m-plan"]') : [];
        radios.forEach(r => {
            r.checked = (r.value === (plan || ''));
        });
        highlightSelectedRadio();
    }

    function highlightSelectedRadio() {
        if (!modalForm) return;
        modalForm.querySelectorAll('.plan-radio-option').forEach(opt => {
            opt.classList.toggle('selected', opt.querySelector('input').checked);
        });
    }

    openBtns.forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            selectedPlan = btn.dataset.plan || null;
            openModal();
            setTimeout(() => applyPlanToRadios(selectedPlan), 50);
        });
    });

    if (modalForm) {
        modalForm.querySelectorAll('input[name="m-plan"]').forEach(r => {
            r.addEventListener('change', highlightSelectedRadio);
        });
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBack) modalBack.addEventListener('click', closeModal);

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
        modalForm.addEventListener('submit', async e => {
            e.preventDefault();

            const nombre  = document.getElementById('m-name').value.trim();
            const email   = document.getElementById('m-email').value.trim();
            const reason  = document.getElementById('m-reason').value.trim();
            const medical = document.getElementById('m-medical').value.trim();
            const planRadio = modalForm.querySelector('input[name="m-plan"]:checked');
            const plan    = planRadio ? planRadio.value || null : selectedPlan;

            if (!nombre || !email || !reason) {
                alert('Por favor, completa los campos obligatorios (nombre, email y motivo).');
                return;
            }

            const submitBtn = modalForm.querySelector('button[type="submit"]');
            const origText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Procesando tu plaza…';

            await saveLead({ nombre, email, reason, medical, plan, origen: 'Modal' });

            if (modalFormWrap) modalFormWrap.style.display = 'none';
            if (modalSuccess) modalSuccess.style.display = 'block';

            submitBtn.disabled = false;
            submitBtn.textContent = origText;

            decrementPlazas();
        });
    }


    // =========================================================================
    // 4. ENVÍO FORMULARIO DE CONTACTO
    // =========================================================================

    const contactForm = document.getElementById('contact-form');
    const contactSuccess = document.getElementById('contact-success');

    if (contactForm) {
        contactForm.addEventListener('submit', async e => {
            e.preventDefault();

            const nombre = document.getElementById('c-name').value.trim();
            const email = document.getElementById('c-email').value.trim();
            const reason = document.getElementById('c-reason').value.trim();
            const medical = document.getElementById('c-medical').value.trim();

            if (!nombre || !email || !reason) {
                alert('Por favor, completa los campos obligatorios (*).');
                return;
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const origText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Procesando tu plaza…';

            await saveLead({ nombre, email, reason, medical, origen: 'Formulario Contacto' });

            contactForm.style.display = 'none';
            if (contactSuccess) contactSuccess.style.display = 'block';

            submitBtn.disabled = false;
            submitBtn.textContent = origText;

            decrementPlazas();
        });
    }


    // =========================================================================
    // 5. ENVÍO A /api/submit-lead (función serverless Vercel) + BACKUP LOCAL
    // =========================================================================

    async function saveLead(fields) {
        // Backup local siempre, como seguro ante fallos de red
        const lead = { id: 'lead_' + Date.now(), fechaRegistro: new Date().toISOString(), ...fields };
        const leads = JSON.parse(localStorage.getItem('integras_leads') || '[]');
        leads.push(lead);
        localStorage.setItem('integras_leads', JSON.stringify(leads));

        try {
            const res = await fetch('/api/submit-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fields)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error('ÍNTEGRAS CRM: error al enviar lead', res.status, err);
            }
        } catch (err) {
            console.error('ÍNTEGRAS CRM: error de red', err);
        }
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
        const btn = item.querySelector('.faq-preg');
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


    // =========================================================================
    // 9. BARRA DE PLAZAS FUNDADORAS (animación de entrada)
    // =========================================================================

    const spotsBarFill = document.querySelector('.spots-bar-fill');

    if (spotsBarFill) {
        const targetWidth = spotsBarFill.dataset.width || '0';

        if ('IntersectionObserver' in window) {
            const spotsObserver = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        spotsBarFill.style.width = targetWidth + '%';
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });
            spotsObserver.observe(spotsBarFill);
        } else {
            spotsBarFill.style.width = targetWidth + '%';
        }
    }


    // =========================================================================
    // 10. BENEFICIOS EXPANDIBLES (touch/click)
    // =========================================================================

    const beneficioItems = document.querySelectorAll('.beneficio-item');

    beneficioItems.forEach(item => {
        const header = item.querySelector('.beneficio-header');
        const body = item.querySelector('.beneficio-body');
        if (!header || !body) return;

        header.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            beneficioItems.forEach(i => {
                i.classList.remove('open');
                const b = i.querySelector('.beneficio-body');
                if (b) b.style.maxHeight = '0';
            });

            if (!isOpen) {
                item.classList.add('open');
                body.style.maxHeight = body.scrollHeight + 'px';
            }
        });
    });


    // =========================================================================
    // 11. CARRUSEL DE TESTIMONIOS
    // =========================================================================

    const testimonios = document.querySelectorAll('.testimonio');
    const testimoniosDots = document.querySelectorAll('.testimonios-dot');
    const testimoniosTrack = document.querySelector('.testimonios-track');
    let currentTestimonio = 0;
    let testimonioTimer = null;

    function showTestimonio(index) {
        testimonios.forEach((t, i) => t.classList.toggle('active', i === index));
        testimoniosDots.forEach((d, i) => {
            d.classList.toggle('active', i === index);
            d.setAttribute('aria-selected', String(i === index));
        });
        currentTestimonio = index;
    }

    function nextTestimonio() {
        showTestimonio((currentTestimonio + 1) % testimonios.length);
    }

    function startTestimonioTimer() {
        clearInterval(testimonioTimer);
        testimonioTimer = setInterval(nextTestimonio, 5500);
    }

    if (testimonios.length > 0) {
        startTestimonioTimer();

        testimoniosDots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                showTestimonio(i);
                startTestimonioTimer();
            });
        });

        if (testimoniosTrack) {
            let touchStartX = 0;

            testimoniosTrack.addEventListener('touchstart', e => {
                touchStartX = e.touches[0].clientX;
            }, { passive: true });

            testimoniosTrack.addEventListener('touchend', e => {
                const dx = e.changedTouches[0].clientX - touchStartX;
                if (Math.abs(dx) > 50) {
                    if (dx < 0) showTestimonio((currentTestimonio + 1) % testimonios.length);
                    else showTestimonio((currentTestimonio - 1 + testimonios.length) % testimonios.length);
                    startTestimonioTimer();
                }
            }, { passive: true });
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearInterval(testimonioTimer);
            } else {
                startTestimonioTimer();
            }
        });
    }

});
