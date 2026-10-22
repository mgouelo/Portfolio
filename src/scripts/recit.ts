// Récit au scroll : chaque titre ## du texte devient un chapitre.
// Selon le chapitre lu, un tableau du décor apparaît ; sur la montagne,
// le grimpeur avance, chute au chapitre II puis remonte.
// Les mouvements sont lissés image par image pour rester fluides.

const recit = document.querySelector<HTMLElement>('.recit');
const texte = recit?.querySelector<HTMLElement>('.recit-texte');
const svg = recit?.querySelector<SVGSVGElement>('.scene-fond svg');

if (recit && texte && svg) {
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

  // 2. Trajet du grimpeur par chapitre : [avancement dans le chapitre, position sur le rail (0 = pied, 1 = sommet)]
  const trajets: [number, number][][] = [
    [[0, 0], [0.9, 0.34]], //                     I. Le chaudron : il grimpe
    [[0, 0.34], [0.35, 0.44], [0.6, 0], [1, 0]], // II. La chute
    [[0, 0], [1, 0]], //                           III à V : la montagne est cachée
    [[0, 0], [1, 0]],
    [[0, 0], [1, 0]],
    [[0, 0], [0.9, 0.78]], //                      VI. Retour au chaudron : il remonte, plus vite
    [[0, 0.78], [0.75, 1], [1, 1]], //             VII. Le sommet
  ];
  const interpoler = (t: [number, number][], p: number) => {
    for (let i = 1; i < t.length; i++) {
      if (p <= t[i][0]) {
        const [p0, v0] = t[i - 1];
        const [p1, v1] = t[i];
        const k = (p - p0) / (p1 - p0 || 1);
        return v0 + (v1 - v0) * k;
      }
    }
    return t[t.length - 1][1];
  };
  // Pendant la chute, le chaudron fait deux tours (720° = 0° visuellement, donc pas de retour en arrière ensuite)
  const rotation = (s: number, p: number) => {
    if (s === 0 || (s === 1 && p <= 0.35)) return 0;
    if (s === 1 && p < 0.6) return ((p - 0.35) / 0.25) * 720;
    return 720;
  };

  const rail = svg.querySelector<SVGPathElement>('.rail')!;
  const longueur = rail.getTotalLength();
  const grimpeur = svg.querySelector<SVGGElement>('.grimpeur')!;
  const corps = svg.querySelector<SVGGElement>('.grimpeur-corps')!;
  const bras = svg.querySelector<SVGGElement>('.bras')!;
  const animes = [...svg.querySelectorAll<SVGGElement>('[data-scenes]')];

  // 3. Positions des chapitres, recalculées quand la mise en page change
  let bornes: { haut: number; hauteur: number }[] = [];
  const mesurer = () => {
    bornes = scenes.map((sc) => {
      const r = sc.getBoundingClientRect();
      return { haut: r.top + window.scrollY, hauteur: r.height };
    });
  };

  // État affiché (lissé) et état visé (calculé au scroll)
  const vise = { f: 0, rot: 0, balancier: 0 };
  const affiche = { f: 0, rot: 0, balancier: 0 };
  let sceneActive = -1;

  const lire = () => {
    const milieu = window.scrollY + window.innerHeight * (window.innerWidth <= 860 ? 0.68 : 0.55);
    let s = 0;
    bornes.forEach((b, i) => {
      if (b.haut <= milieu) s = i;
    });
    const b = bornes[s];
    const p = Math.min(1, Math.max(0, (milieu - b.haut) / b.hauteur));

    if (s !== sceneActive) {
      sceneActive = s;
      scenes.forEach((sc, i) => sc.classList.toggle('is-active', i === s));
      animes.forEach((el) => {
        const on = (el.dataset.scenes ?? '').split(' ').includes(String(s));
        el.classList.toggle('is-on', on);
        if (on) el.classList.add('vu'); // déjà dessiné : ne se retrace plus
      });
    }

    vise.f = interpoler(trajets[Math.min(s, trajets.length - 1)], p);
    vise.rot = rotation(s, p);
    // Le marteau se balance au rythme du scroll, comme un grimpeur qui cherche sa prise
    vise.balancier = Math.sin(window.scrollY / 110) * 26;
  };

  const dessiner = () => {
    const pt = rail.getPointAtLength(affiche.f * longueur);
    grimpeur.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)}) scale(1.8)`);
    corps.setAttribute('transform', `rotate(${affiche.rot.toFixed(2)} 0 -15)`);
    bras.setAttribute('transform', `rotate(${affiche.balancier.toFixed(2)} 0 -44)`);
  };

  // 4. Boucle d'animation : on rapproche l'affichage de la cible à chaque image
  let enCours = false;
  const boucle = () => {
    const vitesse = reduceMotion ? 1 : 0.1;
    // La chute est plus rapide que l'ascension
    const vitesseChute = reduceMotion ? 1 : 0.22;
    const k = vise.f < affiche.f - 0.02 ? vitesseChute : vitesse;
    affiche.f += (vise.f - affiche.f) * k;
    affiche.rot += (vise.rot - affiche.rot) * vitesseChute;
    affiche.balancier += (vise.balancier - affiche.balancier) * 0.12;
    dessiner();

    const reste =
      Math.abs(vise.f - affiche.f) + Math.abs(vise.rot - affiche.rot) / 360 + Math.abs(vise.balancier - affiche.balancier) / 90;
    if (reste > 0.0005) requestAnimationFrame(boucle);
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
  relancer();
  window.addEventListener('scroll', relancer, { passive: true });
  const remesurer = () => {
    mesurer();
    relancer();
  };
  window.addEventListener('resize', remesurer);
  window.addEventListener('load', remesurer);
  document.fonts?.ready.then(remesurer);
}
