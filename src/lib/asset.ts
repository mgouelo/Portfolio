// Préfixe un chemin de /public avec la base du site (/Portfolio).
export function asset(path: string): string {
  if (/^(https?:|mailto:)/.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\.?\//, '')}`;
}
