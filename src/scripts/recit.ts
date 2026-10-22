// Récit au scroll en galerie de musée.
// Chaque titre ## du texte devient un chapitre, illustré par un tableau.
// À la fin d'un chapitre, son tableau grandit et s'efface (on passe devant),
// pendant que le suivant, accroché au fond du couloir, s'approche jusqu'au premier plan.

const recit = document.querySelector<HTMLElement>('.recit');
const texte = recit?.querySelector<HTMLElement>('.recit-texte');
const tableaux = [...(recit?.querySelectorAll<HTMLElement>('.tableau-recit') ?? [])];

if (recit && texte && tableaux.length) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Regrouper chaque titre et ses paragraphes dans une <section class="scene">
  const scenes: HTMLElement[] = [];
  let courante: HTMLElement | null = null;
  for (const el of [...texte.children]) {
    if (el.tagName === 'H2' || !courante) {
      courante = document.createElement('section');
      courante.className = 'scene';
      texte.insertBefore(courante, el);
      scenes.push(courante);
    }
    courante.appendChild(el);
  }

  // 2. Position des chapitres, recalculée quand la mise en page change
  let bornes: { haut: number; hauteur: number }[] = [];
  const mesurer = () => {
    bornes = scenes.map((sc) => {
      const r = sc.getBoundingClientRect();
      return { haut: r.top + window.scrollY, hauteur: r.height };
    });
  };

  // Douceur : départ et arrivée lents
  const adoucir = (t: number) => t * t * (3 - 2 * t);

  // 3. Avancement dans la galerie : 2,5 = à mi-chemin entre le tableau III et le tableau IV.
  //    Le tableau reste immobile pendant la lecture, la marche se fait sur la fin du chapitre.
  let vise = 0;
  let affiche = 0;
  let sceneActive = -1;
  const lire = () => {
    const milieu = window.scrollY + window.innerHeight * (window.innerWidth <= 860 ? 0.68 : 0.55);
    let s = 0;
    bornes.forEach((b, i) => {
      if (b.haut <= milieu) s = i;
    });
    const b = bornes[s];
    const p = Math.min(1, Math.max(0, (milieu - b.haut) / b.hauteur));
    const marche = s < scenes.length - 1 ? adoucir(Math.min(1, Math.max(0, (p - 0.7) / 0.3))) : 0;
    vise = s + marche;

    if (s !== sceneActive) {
      sceneActive = s;
      scenes.forEach((sc, i) => sc.classList.toggle('is-active', i === s));
    }
  };

  // 4. Placement de chaque tableau selon sa distance d au tableau regardé
  //    d < 0 : déjà dépassé · d = 0 : au premier plan · d > 0 : plus loin dans le couloir
  const placer = () => {
    tableaux.forEach((el, i) => {
      const d = i - affiche;
      let echelle: number;
      let opacite: number;
      let flou = 0;
      if (d <= -1) {
        echelle = 1.6;
        opacite = 0;
      } else if (d < 0) {
        echelle = 1 - d * 0.6; // il grandit en passant devant nous
        opacite = 1 + d * 1.4;
        flou = -d * 6;
      } else if (d <= 2) {
        echelle = 1 - (1 - Math.pow(0.32, d)) * 0.88; // 1 → 0,4 → 0,21
        opacite = d <= 1 ? 1 - d * 0.35 : 0.65 - (d - 1) * 0.65;
      } else {
        echelle = 0.1;
        opacite = 0;
      }
      el.style.transform = `translate(-50%, -50%) scale(${echelle.toFixed(4)})`;
      el.style.opacity = Math.max(0, Math.min(1, opacite)).toFixed(3);
      el.style.filter = flou > 0.05 ? `blur(${flou.toFixed(2)}px)` : '';
      el.style.zIndex = String(100 - i);
      el.classList.toggle('is-front', Math.abs(d) < 0.5);
    });
  };

  // 5. Boucle d'animation : l'affichage rejoint la cible en douceur
  let enCours = false;
  const boucle = () => {
    affiche += (vise - affiche) * (reduceMotion ? 1 : 0.09);
    if (Math.abs(vise - affiche) < 0.0005) affiche = vise;
    placer();
    if (affiche !== vise) requestAnimationFrame(boucle);
    else enCours = false;
  };
  const relancer = () => {
    lire();
    if (!enCours) {
      enCours = true;
      requestAnimationFrame(boucle);
    }
  };

  mesurer();
  lire();
  affiche = vise;
  placer();
  window.addEventListener('scroll', relancer, { passive: true });
  const remesurer = () => {
    mesurer();
    relancer();
  };
  window.addEventListener('resize', remesurer);
  window.addEventListener('load', remesurer);
  document.fonts?.ready.then(remesurer);
}
