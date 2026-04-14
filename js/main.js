/* ═══════════════════════════════════════════════════════════════
   FASTHARMONY — JAVASCRIPT PRINCIPAL
   Features: Custom cursor, 3D tilt, scroll animations, form handling
═══════════════════════════════════════════════════════════════ */

'use strict';


/* ─── CUSTOM CURSOR ─────────────────────────────────────────── */
(function initCursor() {
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');

  if (!cursor || !ring) return;

  // Only activate on precise pointer devices (mouse, not touch)
  if (!window.matchMedia('(pointer: fine)').matches) return;

  let mx = -200, my = -200; // mouse position
  let rx = -200, ry = -200; // ring position (lerped)
  let visible = false;

  // Update mouse position immediately (cursor dot follows exactly)
  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;

    if (!visible) {
      cursor.style.opacity = '1';
      ring.style.opacity   = '1';
      visible = true;
    }

    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    ring.style.opacity   = '0';
    visible = false;
  });

  // Smooth ring lerp
  function animateRing() {
    rx += (mx - rx) * 0.1;
    ry += (my - ry) * 0.1;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();
})();


/* ─── PROGRESS BAR — fallback for non-scroll-driven CSS ─────── */
(function initProgressBar() {
  const bar = document.getElementById('progressBar');
  if (!bar) return;

  // If CSS scroll-driven animations are supported, CSS handles it
  if (CSS.supports('animation-timeline', 'scroll()')) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    const progress = total > 0 ? scrolled / total : 0;
    bar.style.transform = `scaleX(${progress})`;
  }, { passive: true });
})();


/* ─── NAVBAR — scroll & active state ────────────────────────── */
const nav      = document.getElementById('nav');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__link');

function handleNavScroll() {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}

function highlightActiveNav() {
  const scrollY = window.scrollY;

  sections.forEach(section => {
    const top    = section.offsetTop - 110;
    const height = section.offsetHeight;
    const id     = section.getAttribute('id');

    if (scrollY >= top && scrollY < top + height) {
      navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('active', isActive);
      });
    }
  });
}

window.addEventListener('scroll', handleNavScroll,    { passive: true });
window.addEventListener('scroll', highlightActiveNav, { passive: true });
handleNavScroll();


/* ─── MOBILE MENU ────────────────────────────────────────────── */
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobileMenu');
const mobileLinks = document.querySelectorAll('.mobile-menu__link');
let menuOpen = false;

function toggleMenu(open) {
  menuOpen = open;
  hamburger.classList.toggle('open', open);
  mobileMenu.classList.toggle('open', open);
  mobileMenu.setAttribute('aria-hidden', String(!open));
  hamburger.setAttribute('aria-expanded', String(open));
  hamburger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  document.body.style.overflow = open ? 'hidden' : '';
}

hamburger.addEventListener('click', () => toggleMenu(!menuOpen));

mobileLinks.forEach(link => {
  link.addEventListener('click', () => toggleMenu(false));
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menuOpen) toggleMenu(false);
});


/* ─── SMOOTH SCROLL ─────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();
    const offset = nav.offsetHeight + 10;
    const top    = target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ─── SCROLL REVEAL (IntersectionObserver) ───────────────────── */
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -56px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


/* ─── 3D TILT on value cards ─────────────────────────────────── */
(function initTilt() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const STRENGTH = 6; // max degrees

  document.querySelectorAll('.values__item').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x    = (e.clientX - rect.left) / rect.width  - 0.5;
      const y    = (e.clientY - rect.top)  / rect.height - 0.5;

      card.style.transform = [
        `perspective(800px)`,
        `rotateX(${-y * STRENGTH}deg)`,
        `rotateY(${x * STRENGTH}deg)`,
        `translateY(-3px)`,
      ].join(' ');
      card.style.transition = 'transform 0.1s linear';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = '';
    });
  });
})();


/* ─── FORM: validação e envio ────────────────────────────────── */
const form        = document.getElementById('requestForm');
const formSuccess = document.getElementById('formSuccess');

if (form) {
  // Cache field references to avoid repeated DOM queries
  const emailInput = form.querySelector('#email');
  const telefoneInput = form.querySelector('#telefone');
  const marcaInput = form.querySelector('#marca');

  /* ─── VALIDAÇÃO CUSTOMIZADA: email OU telefone (pelo menos 1 obrigatório) */
  function validateContactFields() {
    const emailHasValue = emailInput.value.trim() !== '';
    const telefoneHasValue = telefoneInput.value.trim() !== '';

    // Validar que PELO MENOS UM está preenchido
    if (!emailHasValue && !telefoneHasValue) {
      emailInput.setCustomValidity('Por favor, preencha o email ou o telefone.');
      telefoneInput.setCustomValidity('Por favor, preencha o email ou o telefone.');
      return false;
    }

    emailInput.setCustomValidity('');
    telefoneInput.setCustomValidity('');

    // Validar marca obrigatório
    if (!marcaInput.value.trim()) {
      marcaInput.setCustomValidity('Por favor, preencha a marca.');
      return false;
    }

    marcaInput.setCustomValidity('');
    return true;
  }

  // Validar ao perder foco
  emailInput.addEventListener('blur', validateContactFields);
  telefoneInput.addEventListener('blur', validateContactFields);
  marcaInput.addEventListener('blur', validateContactFields);

  /* ─── CONTACTO PREFERENCIAL AUTOMÁTICO ──────────────────────────── */
  const contactoPrefSelect = form.querySelector('#contacto-pref');

  function updateContactoPreferencial() {
    const emailHasValue = emailInput.value.trim() !== '';
    const telefoneHasValue = telefoneInput.value.trim() !== '';

    // Se só telefone está preenchido
    if (telefoneHasValue && !emailHasValue) {
      contactoPrefSelect.value = 'telefone';
    }
    // Se só email está preenchido
    else if (emailHasValue && !telefoneHasValue) {
      contactoPrefSelect.value = 'email';
    }
    // Se ambos estão preenchidos, deixar vazio (utilizador escolhe)
    // Se nenhum está preenchido, deixar vazio
    else {
      contactoPrefSelect.value = '';
    }
  }

  emailInput.addEventListener('input', updateContactoPreferencial);
  emailInput.addEventListener('blur', updateContactoPreferencial);
  telefoneInput.addEventListener('input', updateContactoPreferencial);
  telefoneInput.addEventListener('blur', updateContactoPreferencial);

  form.addEventListener('submit', function (e) {
    // Validação customizada ANTES de submeter
    if (!validateContactFields()) {
      e.preventDefault();
      form.reportValidity();
      return;
    }

    if (!form.checkValidity()) {
      e.preventDefault();
      form.reportValidity();
      return;
    }

    const submitBtn  = form.querySelector('.form__submit');
    const submitText = form.querySelector('.form__submit-text');

    submitBtn.disabled = true;
    submitText.textContent = 'A enviar...';

    // Deixar submeter para Formspree naturalmente (sem preventDefault)
    // Formspree vai processar e redirecionar
  });
}


/* ─── HERO VIDEO — fade in once data is loaded ───────────────── */
(function initHeroVideo() {
  const video = document.querySelector('.hero__video');
  if (!video) return;

  function showVideo() { video.style.opacity = '1'; }

  if (video.readyState >= 3) {
    showVideo();
  } else {
    video.addEventListener('canplaythrough', showVideo, { once: true });
    video.addEventListener('playing', showVideo, { once: true });
  }
})();


/* ─── ANO AUTOMÁTICO NO RODAPÉ ───────────────────────────────── */
const yearEl = document.getElementById('footerYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();


/* ─── RGPD MODAL ────────────────────────────────────────────── */
(function initRgpdModal() {
  const modal = document.getElementById('rgpdModal');
  const overlay = document.getElementById('rgpdOverlay');
  const closeBtn = document.getElementById('rgpdClose');
  const checkboxLabel = document.querySelector('.form__check-label');

  if (!modal) return;

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  // Open modal when clicking on privacy link in checkbox
  if (checkboxLabel) {
    const privacyLink = checkboxLabel.querySelector('.form__check-link');
    if (privacyLink) {
      privacyLink.addEventListener('click', (e) => {
        // Only intercept if not opening in new tab
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          openModal();
        }
      });
    }
  }

  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
})();
