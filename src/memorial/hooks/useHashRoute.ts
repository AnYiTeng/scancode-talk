import { useState, useEffect } from 'react';

export function useHashRoute() {
  const [path, setPath] = useState(() => {
    const h = window.location.hash.slice(1) || '/';
    const [p, q] = h.split('?');
    return { path: p || '/', query: q || '' };
  });

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1) || '/';
      const [p, q] = h.split('?');
      setPath({ path: p || '/', query: q || '' });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const setHash = (pathname: string, query?: string) => {
    window.location.hash = query ? `${pathname}?${query}` : pathname;
  };

  const getQueryId = (): string | null => {
    const q = path.query;
    if (!q) return null;
    const m = q.match(/id=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  };

  return [path, setHash, getQueryId] as const;
}
