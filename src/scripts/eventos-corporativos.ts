import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt.js';

const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Reveal ao rolar ─────────────────────────────────────── */
function initReveal() {
  let alvos = Array.from(document.querySelectorAll<HTMLElement>('.revela, .revela-foto'));
  function revelar(el: HTMLElement) { el.classList.add('visivel'); }

  if ('IntersectionObserver' in window && !reduzir) {
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { revelar(e.target as HTMLElement); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    alvos.forEach((el) => io.observe(el));

    let agendado = false;
    function checar() {
      agendado = false;
      const limite = window.innerHeight * 0.92;
      alvos = alvos.filter((el) => {
        if (el.classList.contains('visivel')) return false;
        const r = el.getBoundingClientRect();
        if (r.top < limite && r.bottom > 0) { revelar(el); return false; }
        return true;
      });
    }
    function agendar() { if (!agendado) { agendado = true; requestAnimationFrame(checar); } }
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    window.addEventListener('load', agendar);
    agendar();
  } else {
    alvos.forEach(revelar);
  }
}

/* ── Linha do tempo ─────────────────────────────────────── */
function initTimeline() {
  const tempo = document.querySelector<HTMLElement>('[data-tempo]');
  if (!tempo) return;
  if ('IntersectionObserver' in window && !reduzir) {
    new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { tempo.classList.add('ativo'); (e.target as any).__io?.disconnect(); } });
    }, { threshold: 0.4 }).observe(tempo);
  } else {
    tempo.classList.add('ativo');
  }
}

/* ── Tabs (Diferenciais) ────────────────────────────────── */
function initTabs() {
  const blocoAbas = document.querySelector<HTMLElement>('[data-abas]');
  if (!blocoAbas) return;

  const abas = blocoAbas.querySelectorAll<HTMLElement>('.aba');
  const fotosAbas = blocoAbas.querySelectorAll<HTMLImageElement>('.abas__fotos img');
  let abaAtual = 0;

  function mostrarAba(i: number) {
    abaAtual = i;
    abas.forEach((a, k) => {
      a.classList.toggle('ativo', k === i);
      a.querySelector('button')?.setAttribute('aria-expanded', String(k === i));
    });
    fotosAbas.forEach((f, k) => f.classList.toggle('ativo', k === i));
    const barra = abas[i].querySelector<HTMLElement>('.aba__barra');
    if (barra) { barra.style.animation = 'none'; void barra.offsetWidth; barra.style.animation = ''; }
  }

  abas.forEach((a, k) => {
    a.querySelector('button')?.addEventListener('click', () => mostrarAba(k));
    a.querySelector<HTMLElement>('.aba__barra')?.addEventListener('animationend', () => {
      if (k === abaAtual) mostrarAba((abaAtual + 1) % abas.length);
    });
  });

  blocoAbas.addEventListener('mouseenter', () => blocoAbas.classList.add('pausado'));
  blocoAbas.addEventListener('mouseleave', () => blocoAbas.classList.remove('pausado'));

  const desktopAbas = window.matchMedia('(min-width: 960px)');
  if ('IntersectionObserver' in window && !reduzir) {
    new IntersectionObserver((es) => {
      es.forEach((e) => { blocoAbas.classList.toggle('rodando', e.isIntersecting && desktopAbas.matches); });
    }, { threshold: 0.35 }).observe(blocoAbas);
  }
}

/* ── Slides (Gastronomia) ───────────────────────────────── */
function initSlides() {
  const slides = document.querySelector<HTMLElement>('[data-slides]');
  if (!slides) return;

  const fotosSlides = slides.querySelectorAll<HTMLImageElement>('img');
  const pontos = document.querySelectorAll<HTMLButtonElement>('.slides__ponto');
  let slideAtual = 0;
  let timerSlides: ReturnType<typeof setInterval> | null = null;

  function mostrarSlide(i: number) {
    slideAtual = ((i % fotosSlides.length) + fotosSlides.length) % fotosSlides.length;
    fotosSlides.forEach((f, k) => f.classList.toggle('ativo', k === slideAtual));
    pontos.forEach((p, k) => p.classList.toggle('ativo', k === slideAtual));
    (fotosSlides[(slideAtual + 1) % fotosSlides.length] as HTMLImageElement).loading = 'eager';
  }
  function iniciar() { if (!timerSlides && !reduzir) timerSlides = setInterval(() => mostrarSlide(slideAtual + 1), 4000); }
  function parar()   { if (timerSlides) { clearInterval(timerSlides); timerSlides = null; } }

  pontos.forEach((p, k) => p.addEventListener('click', () => { mostrarSlide(k); parar(); if ((slides as any).dataset.naTela) iniciar(); }));

  const btnAnt = slides.querySelector<HTMLButtonElement>('[data-slide-anterior]');
  const btnProx = slides.querySelector<HTMLButtonElement>('[data-slide-proxima]');
  btnAnt?.addEventListener('click', () => { mostrarSlide(slideAtual - 1); parar(); if ((slides as any).dataset.naTela) iniciar(); });
  btnProx?.addEventListener('click', () => { mostrarSlide(slideAtual + 1); parar(); if ((slides as any).dataset.naTela) iniciar(); });

  slides.addEventListener('mouseenter', parar);
  slides.addEventListener('mouseleave', () => { if ((slides as any).dataset.naTela) iniciar(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) { (slides as any).dataset.naTela = '1'; (fotosSlides[1] as HTMLImageElement).loading = 'eager'; iniciar(); }
        else { delete (slides as any).dataset.naTela; parar(); }
      });
    }, { threshold: 0.3 }).observe(slides);
  }
}

/* ── Carrosséis (Galeria + Depoimentos) ─────────────────── */
function initCarousels() {
  document.querySelectorAll<HTMLElement>('[data-carrossel]').forEach((trilho) => {
    const nome = trilho.dataset.carrossel!;
    const ant  = document.querySelector<HTMLButtonElement>(`[data-anterior="${nome}"]`);
    const prox = document.querySelector<HTMLButtonElement>(`[data-proximo="${nome}"]`);
    const barra = document.querySelector<HTMLElement>(`[data-progresso="${nome}"]`);

    function passo() {
      const item = trilho.children[0] as HTMLElement | null;
      return item ? item.getBoundingClientRect().width + 20 : trilho.clientWidth * 0.8;
    }
    function atualizar() {
      const max = trilho.scrollWidth - trilho.clientWidth;
      const pos = trilho.scrollLeft;
      if (ant)  ant.disabled  = pos <= 4;
      if (prox) prox.disabled = pos >= max - 4;
      if (barra) {
        const visivel = trilho.clientWidth / trilho.scrollWidth;
        barra.style.width = (visivel * 100) + '%';
        barra.style.left  = (max > 0 ? (pos / max) * (100 - visivel * 100) : 0) + '%';
      }
    }
    ant?.addEventListener('click', () => trilho.scrollBy({ left: -passo(), behavior: reduzir ? 'auto' : 'smooth' }));
    prox?.addEventListener('click', () => trilho.scrollBy({ left: passo(), behavior: reduzir ? 'auto' : 'smooth' }));
    trilho.addEventListener('scroll', atualizar, { passive: true });
    window.addEventListener('resize', atualizar);
    atualizar();
  });
}

/* ── Datepicker ─────────────────────────────────────────── */
function initDatepicker() {
  document.querySelectorAll<HTMLInputElement>('[data-datepicker]').forEach((el) => {
    flatpickr(el, {
      locale: Portuguese,
      dateFormat: 'd/m/Y',
      minDate: 'today',
      allowInput: true,
      disableMobile: false,
    });
  });
}

/* ── Ano ────────────────────────────────────────────────── */
function updateYear() {
  const el = document.querySelector<HTMLElement>('[data-ano]');
  if (el) el.textContent = String(new Date().getFullYear());
}

/* ── Entry point ────────────────────────────────────────── */
export function init() {
  document.body.classList.remove('sem-js');
  initReveal();
  initTimeline();
  initTabs();
  initSlides();
  initCarousels();
  initDatepicker();
  updateYear();
}
