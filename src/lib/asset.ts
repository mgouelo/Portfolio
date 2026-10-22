// Préfixe un chemin de /public avec la base du site (/Portfolio sur GitHub Pages).
export function asset(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\.?\//, '')}`;
}
