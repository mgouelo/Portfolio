import { gsap } from 'gsap';

// Récit au scroll : chaque titre ## du texte devient un chapitre.
// Le grimpeur avance sur la montagne selon le chapitre lu, chute au chapitre 2,
// et les accessoires du décor apparaissent quand leur chapitre est à l'écran.

const recit = document.querySelector<HTMLElement>('.recit');
const texte = recit?.querySelector<HTMLElement>('.recit-texte');
const svg = recit?.querySelector<SVGSVGElement>('.scene-fond svg');

if (recit && texte && svg) {
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

  // 2. Trajet du grimpeur par chapitre : [avancement dans le chapitre, position sur le rail (0 = pied, 1 = sommet)]
  const trajets: [number, number][][] = [
    [[0, 0], [0.9, 0.32]], //                    Le chaudron : il grimpe
    [[0, 0.32], [0.4, 0.42], [0.6, 0], [1, 0]], // La chute
    [[0, 0], [1, 0]], //                          Le monde sans chute
    [[0, 0], [1, 0.04]], //                       L'homme dans la jarre
    [[0, 0.04], [1, 0.1]], //                     Ce qui gagne à être secoué
    [[0, 0.1], [0.9, 0.8]], //                    Retour au chaudron : il remonte, plus vite
    [[0, 0.8], [0.8, 1], [1, 1]], //              La meilleure version : le sommet
  ];
  const position = (scene: number, p: number) => {
    const t = trajets[Math.min(scene, trajets.length - 1)];
    for (let i = 1; i < t.length; i++) {
      if (p <= t[i][0]) {
        const [p0, v0] = t[i - 1];
        const [p1, v1] = t[i];
        return v0 + (v1 - v0) * ((p - p0) / (p1 - p0 || 1));
      }
    }
    return t[t.length - 1][1];
  };
  // La chute : le chaudron tourne sur lui-même pendant qu'il dévale
  const enChute = (scene: number, p: number) => scene === 1 && p > 0.4 && p < 0.6;
  // Deux tours complets pendant la chute (720° revient visuellement à 0°, sans « rembobiner » ensuite)
  const rotation = (scene: number, p: number) => {
    if (scene < 1 || (scene === 1 && p <= 0.4)) return 0;
    if (scene === 1 && p < 0.6) return ((p - 0.4) / 0.2) * 720;
    return 720;
  };

  const rail = svg.querySelector<SVGPathElement>('.rail')!;
  const longueur = rail.getTotalLength();
  const grimpeur = svg.querySelector<SVGGElement>('.grimpeur')!;
  const corps = svg.querySelector<SVGGElement>('.grimpeur-corps')!;
  const marteau = svg.querySelector<SVGGElement>('.marteau')!;
  const accessoires = [...svg.querySelectorAll<SVGGElement>('.accessoire')];

  const etat = { f: 0, rot: 0 };
  const placer = () => {
    const pt = rail.getPointAtLength(etat.f * longueur);
    grimpeur.setAttribute('transform', `translate(${pt.x} ${pt.y}) scale(1.5)`);
    corps.setAttribute('transform', `rotate(${etat.rot})`);
  };

  let sceneActive = -1;
  const miseAJour = () => {
    // Sur mobile, le décor occupe le haut de l'écran : on lit plus bas
    const milieu = window.innerHeight * (window.innerWidth <= 860 ? 0.68 : 0.55);
    // Chapitre lu : le dernier dont le haut a passé le milieu de l'écran
    let s = 0;
    scenes.forEach((sc, i) => {
      if (sc.getBoundingClientRect().top <= milieu) s = i;
    });
    const r = scenes[s].getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (milieu - r.top) / r.height));

    if (s !== sceneActive) {
      sceneActive = s;
      scenes.forEach((sc, i) => sc.classList.toggle('is-active', i === s));
      accessoires.forEach((a) => a.classList.toggle('is-on', (a.dataset.scenes ?? '').split(' ').includes(String(s))));
      recit.dataset.scene = String(s);
    }

    const chute = enChute(s, p);
    gsap.to(etat, {
      f: position(s, p),
      rot: rotation(s, p),
      duration: chute ? 0.15 : 0.6,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: placer,
    });
    // Le marteau se balance au rythme du scroll
    marteau.setAttribute('transform', `rotate(${Math.sin(window.scrollY / 70) * 28 - 6} 0 -20)`);
  };

  placer();
  miseAJour();
  window.addEventListener('scroll', miseAJour, { passive: true });
  window.addEventListener('resize', miseAJour);
}
