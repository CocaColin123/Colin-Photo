export type AppRoute =
  | { name: 'landing' }
  | { name: 'works' }
  | { name: 'album'; albumId: string }
  | { name: 'about' }
  | { name: 'blog' }
  | { name: 'journalEntry'; slug: string }
  | { name: 'admin' };

function stripBase(pathname: string, base = '/') {
  const normalizedBase = base === '/' ? '/' : `/${base.replace(/^\/|\/$/g, '')}/`;
  if (normalizedBase !== '/' && pathname.startsWith(normalizedBase)) {
    return `/${pathname.slice(normalizedBase.length)}`;
  }
  return pathname;
}

export function pathFromLocation(location: Pick<Location, 'pathname' | 'search'>, base = '/') {
  const queryPath = location.search.match(/^\?\/([^&]*)/);
  const rawPath = queryPath
    ? `/${queryPath[1].replace(/~and~/g, '&')}`
    : stripBase(location.pathname, base);

  const decoded = decodeURI(rawPath || '/');
  const clean = decoded.replace(/\/{2,}/g, '/').replace(/\/$/, '');
  return clean || '/';
}

export function parseRoute(path: string): AppRoute {
  const [first, second] = path.replace(/^\/+/, '').split('/');
  if (!first) return { name: 'landing' };
  if (first === 'works') return { name: 'works' };
  if (first === 'about') return { name: 'about' };
  if (first === 'admin') return { name: 'admin' };
  if (first === 'blog' && second) return { name: 'journalEntry', slug: second };
  if (first === 'blog') return { name: 'blog' };
  if (first === 'album' && second) return { name: 'album', albumId: second };
  return { name: 'works' };
}

export function routePath(route: AppRoute) {
  if (route.name === 'landing') return '/';
  if (route.name === 'works') return '/works';
  if (route.name === 'about') return '/about';
  if (route.name === 'blog') return '/blog';
  if (route.name === 'journalEntry') return `/blog/${route.slug}`;
  if (route.name === 'admin') return '/admin';
  return `/album/${route.albumId}`;
}

export function hrefFor(path: string, base = '/') {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.replace(/^\/+/, '');
  return `${normalizedBase}${cleanPath}`;
}
