const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Menu mobile =====
const navBtn = document.querySelector<HTMLButtonElement>('.nav-toggle');
const menu = document.getElementById('mobile-menu');
if (navBtn && menu) {
  const setOpen = (open: boolean) => {
    navBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => (menu.hidden = true), reduceMotion ? 0 : 250);
    }
  };
  navBtn.addEventListener('click', () => setOpen(navBtn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  });
}

// ===== Thème : Nocturne (sombre) / Jour (clair) =====
const themeBtn = document.querySelector<HTMLButtonElement>('.mode-toggle');
const root = document.documentElement;
const label = () => {
  if (themeBtn) themeBtn.textContent = root.classList.contains('light') ? 'Jour' : 'Nocturne';
};
label();
themeBtn?.addEventListener('click', () => {
  const light = root.classList.toggle('light');
  try {
    localStorage.setItem('theme', light ? 'light' : 'dark');
  } catch {}
  label();
});

// ===== Apparition douce au scroll =====
const reveals = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  reveals.forEach((el) => io.observe(el));
}

// ===== Projecteur qui suit la souris sur les œuvres =====
document.querySelectorAll<HTMLElement>('.oeuvre .cadre').forEach((cadre) => {
  cadre.addEventListener('pointermove', (e) => {
    const r = cadre.getBoundingClientRect();
    cadre.style.setProperty('--x', `${((e.clientX - r.left) / r.width) * 100}%`);
    cadre.style.setProperty('--y', `${((e.clientY - r.top) / r.height) * 100}%`);
  });
});

// ===== Modale des compétences =====
const modal = document.querySelector<HTMLDialogElement>('#skill-modal');
if (modal) {
  const iframe = modal.querySelector('iframe')!;
  const titre = modal.querySelector('#modal-title')!;
  document.addEventListener('click', (e) => {
    const lienModal = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-modal-src]');
    if (!lienModal) return;
    e.preventDefault();
    titre.textContent = lienModal.dataset.modalTitle ?? 'Détail';
    iframe.src = lienModal.dataset.modalSrc!;
    modal.showModal();
  });
  modal.addEventListener('click', (e) => {
    // Clic sur le bouton fermer ou en dehors de la fenêtre
    if ((e.target as HTMLElement).closest('[data-modal-close]') || e.target === modal) modal.close();
  });
  modal.addEventListener('close', () => (iframe.src = 'about:blank'));
}
