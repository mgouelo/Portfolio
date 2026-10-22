import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Fil rouge : une ligne qui part du titre de la salle et rejoint chaque cartel,
// tracée au fur et à mesure du scroll.
gsap.registerPlugin(ScrollTrigger);

const collection = document.querySelector<HTMLElement>('.collection');
const svg = collection?.querySelector<SVGSVGElement>('.fil-rouge');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (collection && svg) {
  const path = svg.querySelector('path')!;
  let trigger: ScrollTrigger | undefined;

  const dessiner = () => {
    trigger?.kill();
    svg.querySelectorAll('circle').forEach((c) => c.remove());

    const base = collection.getBoundingClientRect();
    // Points d'arrivée : le haut du filet rouge de chaque cartel
    const points = [...collection.querySelectorAll<HTMLElement>('.oeuvre .cartel')].map((c) => {
      const r = c.getBoundingClientRect();
      return { x: r.left - base.left, y: r.top - base.top + 24 };
    });
    if (!points.length) return;

    const depart = { x: 0, y: -40 };
    let d = `M ${depart.x} ${depart.y}`;
    let prec = depart;
    for (const p of points) {
      const milieu = (p.y - prec.y) / 2;
      d += ` C ${prec.x} ${prec.y + milieu}, ${p.x} ${p.y - milieu}, ${p.x} ${p.y}`;
      prec = p;
    }
    path.setAttribute('d', d);

    // Une pastille à chaque cartel, avec sa position le long du fil
    const longueur = path.getTotalLength();
    const etapes = points.map((p) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(p.x));
      c.setAttribute('cy', String(p.y));
      c.setAttribute('r', '5');
      svg.appendChild(c);
      return { c, part: longueurJusqua(path, p, longueur) / longueur };
    });

    if (reduceMotion) {
      path.style.strokeDasharray = 'none';
      etapes.forEach((e) => e.c.classList.add('is-on'));
      return;
    }

    path.style.strokeDasharray = `${longueur}`;
    path.style.strokeDashoffset = `${longueur}`;
    trigger = ScrollTrigger.create({
      trigger: collection,
      start: 'top 75%',
      end: 'bottom 70%',
      scrub: 0.6,
      onUpdate: (self) => {
        path.style.strokeDashoffset = `${longueur * (1 - self.progress)}`;
        etapes.forEach((e) => e.c.classList.toggle('is-on', self.progress >= e.part - 0.01));
      },
    });
  };

  // Le fil dépend de la mise en page : on le redessine quand elle change
  // (images chargées, redimensionnement, changement mobile/bureau).
  dessiner();
  window.addEventListener('load', () => ScrollTrigger.refresh());
  new ResizeObserver(() => dessiner()).observe(collection);
}

// Longueur du fil jusqu'au point le plus proche de p (recherche simple par échantillonnage).
function longueurJusqua(path: SVGPathElement, p: { x: number; y: number }, total: number) {
  let meilleure = 0;
  let distMin = Infinity;
  for (let l = 0; l <= total; l += 4) {
    const q = path.getPointAtLength(l);
    const dist = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
    if (dist < distMin) {
      distMin = dist;
      meilleure = l;
    }
  }
  return meilleure;
}
