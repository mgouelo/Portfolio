import * as THREE from 'three';

// Démo 3D du récit : une montagne low-poly bordeaux, un grimpeur dans son chaudron.
// Chaque titre ## du texte devient un chapitre ; le scroll fait avancer le grimpeur,
// le fait chuter au chapitre II, puis le ramène jusqu'au sommet.

const recit = document.querySelector<HTMLElement>('.recit');
const texte = recit?.querySelector<HTMLElement>('.recit-texte');
const canvas = recit?.querySelector<HTMLCanvasElement>('.scene3d-canvas');

if (recit && texte && canvas) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Chapitres ----------
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

  // ---------- Couleurs (suivent le thème Nocturne / Jour) ----------
  const css = (nom: string) => getComputedStyle(document.documentElement).getPropertyValue(nom).trim();
  const couleurs = () => ({
    mur: new THREE.Color(css('--mur')),
    accent: new THREE.Color(css('--accent')),
    profond: new THREE.Color(css('--accent-profond')),
    texte: new THREE.Color(css('--texte')),
    peau: new THREE.Color(css('--passe-partout')),
  });
  let c = couleurs();

  // ---------- Moteur ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(c.mur, 14, 30);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

  const hemi = new THREE.HemisphereLight(0xffe8e0, 0x2a0e0e, 1.4);
  const soleilLumiere = new THREE.DirectionalLight(0xfff0e6, 2.2);
  soleilLumiere.position.set(-6, 10, 6);
  scene.add(hemi, soleilLumiere);

  // Générateur pseudo-aléatoire fixe : la montagne a toujours la même forme
  let graine = 7;
  const alea = () => ((graine = (graine * 16807) % 2147483647) / 2147483647);

  // ---------- La montagne ----------
  const R = 4;
  const H = 6;
  const geo = new THREE.ConeGeometry(R, H, 11, 7, true);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const deja = new Map<string, [number, number, number]>();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // clé arrondie (évite que 0 et -0 ouvrent une fente sur la couture du cône)
    const cle = [x, y, z].map((v) => Math.round(v * 1000) + 0).join('|');
    if (!deja.has(cle)) {
      const sommet = y > H / 2 - 0.01;
      const base = y < -H / 2 + 0.01;
      const k = sommet ? 0 : 0.45;
      deja.set(cle, [x + (alea() - 0.5) * k, y + (base || sommet ? 0 : (alea() - 0.5) * 0.5), z + (alea() - 0.5) * k]);
    }
    const [nx, ny, nz] = deja.get(cle)!;
    pos.setXYZ(i, nx, ny + H / 2, nz);
  }
  geo.computeVertexNormals();
  const matMontagne = new THREE.MeshStandardMaterial({ color: c.profond, flatShading: true, roughness: 0.95 });
  const montagne = new THREE.Mesh(geo, matMontagne);
  const matAretes = new THREE.LineBasicMaterial({ color: c.accent, transparent: true, opacity: 0.85 });
  const aretes = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), matAretes);
  scene.add(montagne, aretes);

  // Sol : un simple anneau au trait
  const matTrait = new THREE.LineBasicMaterial({ color: c.accent, transparent: true, opacity: 0.35 });
  const anneau = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 96 }, (_, i) => new THREE.Vector3(Math.cos((i / 96) * Math.PI * 2) * 7, 0, Math.sin((i / 96) * Math.PI * 2) * 7))
    ),
    matTrait
  );
  scene.add(anneau);

  // Rayon de la montagne à une hauteur et un angle donnés (lancer de rayon vers l'axe)
  const raycaster = new THREE.Raycaster();
  const surface = (angle: number, y: number) => {
    const dir = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle));
    raycaster.set(new THREE.Vector3(Math.cos(angle) * 10, y, Math.sin(angle) * 10), dir);
    const hit = raycaster.intersectObject(montagne, false)[0];
    return hit ? hit.point : new THREE.Vector3(Math.cos(angle) * R * (1 - y / H), y, Math.sin(angle) * R * (1 - y / H));
  };

  // Chemin en spirale du pied au sommet, collé à la paroi
  const points: THREE.Vector3[] = [];
  const tours = 1.6;
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const angle = 0.6 + t * tours * Math.PI * 2;
    const y = Math.min(H - 0.15, t * H);
    points.push(surface(angle, y));
  }
  const chemin = new THREE.CatmullRomCurve3(points);
  // Le chemin, en pointillés rouges
  const lignePointillee = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(chemin.getPoints(400).map((p) => p.clone().multiplyScalar(1.01))),
    new THREE.LineDashedMaterial({ color: c.accent, dashSize: 0.08, gapSize: 0.1, transparent: true, opacity: 0.6 })
  );
  lignePointillee.computeLineDistances();
  scene.add(lignePointillee);

  // ---------- Le grimpeur ----------
  const grimpeur = new THREE.Group();
  const corps = new THREE.Group();
  grimpeur.add(corps);

  const matPeau = new THREE.MeshStandardMaterial({ color: c.peau, roughness: 0.8 });
  const matFonte = new THREE.MeshStandardMaterial({ color: 0x141010, roughness: 0.35, metalness: 0.6 });
  const matManche = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.6 });
  const matAcier = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.3, metalness: 0.8 });

  // Chaudron en bulbe (profil tourné autour de l'axe)
  const profil = [
    [0.0, 0.0], [0.16, 0.01], [0.24, 0.07], [0.27, 0.16], [0.25, 0.26], [0.19, 0.33], [0.2, 0.36], [0.17, 0.37],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const chaudron = new THREE.Mesh(new THREE.LatheGeometry(profil, 24), matFonte);
  corps.add(chaudron);
  // Buste, tête
  const buste = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.14, 4, 12), matPeau);
  buste.position.y = 0.45;
  buste.scale.set(1.25, 1, 0.9);
  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), matPeau);
  tete.position.y = 0.66;
  corps.add(buste, tete);
  // Bras et marteau : pivotent autour des épaules
  const bras = new THREE.Group();
  bras.position.y = 0.5;
  const manche = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8), matManche);
  manche.rotation.z = -Math.PI / 2.6;
  manche.position.set(0.3, 0.12, 0.1);
  const masse = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.06), matAcier);
  masse.position.set(0.66, 0.27, 0.1);
  masse.rotation.z = -Math.PI / 2.6 + Math.PI / 2;
  const brasG = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.2, 4, 8), matPeau);
  brasG.position.set(0.12, 0.02, 0.1);
  brasG.rotation.z = -1.2;
  bras.add(manche, masse, brasG);
  corps.add(bras);
  grimpeur.scale.setScalar(0.85);
  scene.add(grimpeur);

  // ---------- Accessoires : la jarre (IV) et le soleil (VII) ----------
  const jarre = new THREE.Mesh(
    new THREE.LatheGeometry(
      [[0, 0], [0.35, 0.05], [0.55, 0.4], [0.6, 0.8], [0.45, 1.2], [0.25, 1.35], [0.28, 1.45], [0.22, 1.47]].map(
        ([x, y]) => new THREE.Vector2(x, y)
      ),
      18
    ),
    new THREE.MeshStandardMaterial({ color: c.accent, flatShading: true, roughness: 0.9 })
  );
  // placée au pied de la montagne, dans le champ de la caméra en recul
  const angleDepart = 0.6;
  jarre.position.set(Math.cos(angleDepart + 1.05) * 5.2, 0, Math.sin(angleDepart + 1.05) * 5.2);
  jarre.scale.setScalar(0.001);
  scene.add(jarre);

  const soleil = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), new THREE.MeshBasicMaterial({ color: c.accent }));
  // placé à chaque image derrière le sommet, dans l'axe de la caméra (voir dessiner)
  soleil.scale.setScalar(0.001);
  scene.add(soleil);

  // ---------- Scroll → état visé ----------
  const trajets: [number, number][][] = [
    [[0, 0], [0.9, 0.3]], //                       I. il grimpe
    [[0, 0.3], [0.35, 0.4], [0.6, 0], [1, 0]], //   II. la chute
    [[0, 0], [1, 0]], //                            III à V : il attend en bas, la caméra s'éloigne
    [[0, 0], [1, 0]],
    [[0, 0], [1, 0]],
    [[0, 0], [0.9, 0.75]], //                       VI. il remonte, plus vite
    [[0, 0.75], [0.75, 1], [1, 1]], //              VII. le sommet
  ];
  const interpoler = (t: [number, number][], p: number) => {
    for (let i = 1; i < t.length; i++) {
      if (p <= t[i][0]) {
        const [p0, v0] = t[i - 1];
        const [p1, v1] = t[i];
        return v0 + ((v1 - v0) * (p - p0)) / (p1 - p0 || 1);
      }
    }
    return t[t.length - 1][1];
  };

  let bornes: { haut: number; hauteur: number }[] = [];
  const mesurer = () => {
    bornes = scenes.map((sc) => {
      const r = sc.getBoundingClientRect();
      return { haut: r.top + window.scrollY, hauteur: r.height };
    });
  };

  const vise = { f: 0, tour: 0, recul: 0, balancier: 0, jarre: 0, soleil: 0 };
  const affiche = { ...vise };
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
    }
    vise.f = interpoler(trajets[Math.min(s, trajets.length - 1)], p);
    vise.tour = s === 1 && p > 0.35 && p < 0.6 ? ((p - 0.35) / 0.25) * Math.PI * 4 : s >= 1 && !(s === 1 && p <= 0.35) ? Math.PI * 4 : 0;
    vise.recul = s >= 2 && s <= 4 ? 1 : 0; // la caméra prend du recul pendant la réflexion
    vise.balancier = Math.sin(window.scrollY / 90) * 0.6;
    vise.jarre = s === 3 ? 1 : 0;
    vise.soleil = s === 6 ? 1 : 0;
  };

  // ---------- Rendu ----------
  const cible = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const regard = new THREE.Vector3();

  const dessiner = () => {
    const t = THREE.MathUtils.clamp(affiche.f, 0, 1);
    const p = chemin.getPointAt(t);
    grimpeur.position.copy(p);
    // Il fait face à la paroi, le marteau tendu vers la montagne
    grimpeur.rotation.y = Math.atan2(p.z, -p.x);
    corps.rotation.z = affiche.tour;
    bras.rotation.z = affiche.balancier;
    jarre.scale.setScalar(Math.max(0.001, affiche.jarre));
    soleil.scale.setScalar(Math.max(0.001, affiche.soleil));
    soleil.rotation.y += 0.002;

    // Caméra : derrière le grimpeur, ou en recul pour voir toute la montagne
    const angle = Math.atan2(p.z, p.x);
    const pres = new THREE.Vector3(Math.cos(angle + 0.75) * 11, p.y + 2.8, Math.sin(angle + 0.75) * 11);
    const loin = new THREE.Vector3(Math.cos(angle + 0.9) * 15, 7.5, Math.sin(angle + 0.9) * 15);
    camPos.lerpVectors(pres, loin, affiche.recul);
    cible.lerpVectors(p.clone().add(new THREE.Vector3(0, 0.4, 0)), new THREE.Vector3(0, 2.6, 0), affiche.recul);
    camera.position.copy(camPos);
    regard.copy(cible);
    camera.lookAt(regard);
    // Le soleil se lève derrière ce que regarde la caméra
    soleil.position.copy(cible).add(cible.clone().sub(camPos).setY(0).normalize().multiplyScalar(6)).add(new THREE.Vector3(0, 2.4, 0));
    renderer.render(scene, camera);
  };

  const redimensionner = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  let enCours = false;
  const boucle = () => {
    const k = reduceMotion ? 1 : 0.08;
    const kChute = reduceMotion ? 1 : 0.2;
    let reste = 0;
    for (const cle of Object.keys(vise) as (keyof typeof vise)[]) {
      const vitesse = cle === 'tour' || (cle === 'f' && vise.f < affiche.f - 0.02) ? kChute : k;
      affiche[cle] += (vise[cle] - affiche[cle]) * vitesse;
      reste += Math.abs(vise[cle] - affiche[cle]);
    }
    dessiner();
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

  // Changement de thème : on reprend les couleurs du site
  new MutationObserver(() => {
    c = couleurs();
    matMontagne.color.copy(c.profond);
    matAretes.color.copy(c.accent);
    matTrait.color.copy(c.accent);
    matPeau.color.copy(c.peau);
    (scene.fog as THREE.Fog).color.copy(c.mur);
    dessiner();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  const remesurer = () => {
    mesurer();
    redimensionner();
    relancer();
  };
  new ResizeObserver(redimensionner).observe(canvas);
  mesurer();
  redimensionner();
  lire();
  Object.assign(affiche, vise);
  dessiner();
  window.addEventListener('scroll', relancer, { passive: true });
  window.addEventListener('resize', remesurer);
  window.addEventListener('load', remesurer);
  document.fonts?.ready.then(remesurer);
}
