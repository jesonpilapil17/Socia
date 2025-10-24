const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';

export function isSafeMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

export function sameOriginOk(req: Request): boolean {
  const origin = req.headers.get('origin') || '';
  const referer = req.headers.get('referer') || '';
  if (!origin && !referer) return true; // allow server calls without origin
  const allowed = ALLOWED_ORIGIN;
  if (!allowed) return true; // fallback in dev
  if (origin && origin.startsWith(allowed)) return true;
  if (referer && referer.startsWith(allowed)) return true;
  return false;
}

export function passesCsrf(req: Request): boolean {
  if (isSafeMethod(req.method)) return true;
  if (sameOriginOk(req)) return true;
  const csrf = req.headers.get('x-csrf');
  return csrf === '1';
}
