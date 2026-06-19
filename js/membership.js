/**
 * ÍNTEGRAS — Sección Membresía (Claude Design)
 * Módulo aislado: no comparte estado con js/script.js.
 * La apertura del modal de leads reutiliza el listener genérico de
 * `.js-open-modal` ya presente en script.js (los CTA llevan ambas clases).
 */
(() => {
  const root = document.querySelector('.integras-mem');
  if (!root) return;

  const PLANS = [
    { label: 'Mensual',    price: '24,99€', total: '',                   savings: '',                special: '',                                          def: '54,99€/mes' },
    { label: 'Trimestral', price: '21,07€', total: '63,22€ cada 3 meses',  savings: '★ Ahorras 11,75€', special: '',                                          def: '46,32€/mes' },
    { label: 'Semestral',  price: '19,99€', total: '119,95€ cada 6 meses', savings: '★ Ahorras 29,99€', special: '',                                          def: '43,99€/mes' },
    { label: 'Anual',      price: '18,49€', total: '221,91€ al año',       savings: '★ Ahorras 77,97€', special: '"Precio fijo para siempre como fundadora"', def: '40,66€/mes' },
  ];

  const TESTIMONIALS = [
    { quote: 'Llevaba años sin hacer ejercicio por miedo a lesionarme. Aquí he recuperado fuerza y, sobre todo, confianza en mi cuerpo.', name: 'Araceli, 62', detail: 'Miembra fundadora de Julio' },
    { quote: 'Lo que más valoro es no sentirme sola en esta etapa. El foro y los talleres con Teresa me han dado una calma que no esperaba.', name: 'María Ángeles, 57', detail: 'Miembra fundadora de Julio' },
    { quote: 'Riguroso pero cercano. José explica cada ejercicio con un cuidado que se nota. Por fin un sitio pensado para mujeres como yo.', name: 'Toñi, 57', detail: 'Miembra fundadora de Julio' },
  ];

  const setBind = (key, val) => {
    const el = root.querySelector(`[data-mem-bind="${key}"]`);
    if (!el) return;
    el.textContent = val;
    el.hidden = !val;
  };

  root.querySelectorAll('.integras-mem__pill').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.integras-mem__pill').forEach(p => p.classList.remove('is-active'));
      btn.classList.add('is-active');
      const p = PLANS[+btn.dataset.plan];
      ['label', 'price', 'total', 'savings', 'special', 'def'].forEach(k => setBind(k, p[k]));
      const priceAnim = root.querySelector('.integras-mem__price-anim');
      priceAnim.style.animation = 'none';
      requestAnimationFrame(() => { priceAnim.style.animation = 'integrasMemPriceIn .45s ease'; });
    });
  });

  let ti = 0;
  const renderTestimonial = () => {
    const t = TESTIMONIALS[ti];
    setBind('tQuote', t.quote);
    setBind('tName', t.name);
    setBind('tDetail', t.detail);
    root.querySelectorAll('.integras-mem__dot').forEach((d, i) => d.classList.toggle('is-active', i === ti));
    const body = root.querySelector('.integras-mem__testimonial-body');
    body.style.animation = 'none';
    requestAnimationFrame(() => { body.style.animation = 'integrasMemQuoteIn .5s ease'; });
  };
  root.querySelectorAll('.integras-mem__dot').forEach(d =>
    d.addEventListener('click', () => { ti = +d.dataset.quote; renderTestimonial(); }));
  setInterval(() => { ti = (ti + 1) % TESTIMONIALS.length; renderTestimonial(); }, 5500);

  // Alternativa táctil al hover: tocar un beneficio lo expande/contrae.
  root.querySelectorAll('.integras-mem__benefit').forEach(item => {
    item.addEventListener('click', () => item.classList.toggle('is-open'));
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-glowing'); });
  }, { threshold: 0.6 });
  root.querySelectorAll('.integras-mem__cta').forEach(c => io.observe(c));
})();
