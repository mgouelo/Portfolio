// ===== Menu mobile (burger) =====
(function () {
  const btn  = document.querySelector('.nav-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const opening = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(opening));

    if (opening) {
      if (menu.hasAttribute('hidden')) menu.removeAttribute('hidden');
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      const onEnd = (e) => {
        if (e.propertyName === 'opacity') {
          menu.setAttribute('hidden', '');
          menu.removeEventListener('transitionend', onEnd);
        }
      };
      menu.addEventListener('transitionend', onEnd);
    }
  });

  menu.addEventListener('click', (e) => {
    if (!e.target.closest('a')) return;

    btn.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');

    const onEnd = (e2) => {
      if (e2.propertyName === 'opacity') {
        menu.setAttribute('hidden', '');
        menu.removeEventListener('transitionend', onEnd);
      }
    };
    menu.addEventListener('transitionend', onEnd);
  });
})();


// ===== Theme switch (clair / sombre) =====
const toggleBtn = document.querySelector('.mode-toggle');
const root = document.documentElement;

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  root.classList.add('light');
  toggleBtn.textContent = 'Clair';
}

toggleBtn.addEventListener('click', () => {
  const isLight = root.classList.toggle('light');
  toggleBtn.textContent = isLight ? 'Clair' : 'Sombre';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});


// ===== Modal compétences (carrousel) =====
(() => {
  const modal = document.getElementById('skill-modal');
  if (!modal) return;

  const dialog       = modal.querySelector('.modal__dialog');
  const titleEl      = modal.querySelector('#modal-title');
  const iframe       = modal.querySelector('.modal__iframe');
  const focusableSel = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
  let lastTrigger    = null;

  function openModal({ title, src }) {
    titleEl.textContent = title || 'Détail';
    iframe.src = src;
    modal.classList.add('is-open');
    document.body.classList.add('modal-open');

    setTimeout(() => {
      const first = dialog.querySelector(focusableSel) || dialog;
      first.focus();
    }, 0);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    iframe.src = 'about:blank';
    if (lastTrigger) lastTrigger.focus();
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-modal-src]');
    if (!a) return;

    e.preventDefault();
    lastTrigger = a;
    openModal({
      title: a.textContent.trim(),
      src: a.getAttribute('data-modal-src'),
    });
  });

  modal.addEventListener('click', (e) => {
    if (e.target.matches('[data-modal-close], .modal__overlay')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    const nodes = dialog.querySelectorAll(focusableSel);
    if (!nodes.length) return;

    const first = nodes[0];
    const last  = nodes[nodes.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();
