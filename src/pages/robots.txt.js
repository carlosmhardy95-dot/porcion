// Genera /robots.txt. No bloqueamos /app/ acá: esas páginas llevan la etiqueta
// noindex, y Google necesita poder entrar para leerla.
export function GET({ site }) {
  const sitemap = new URL('sitemap-index.xml', site).href;
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
