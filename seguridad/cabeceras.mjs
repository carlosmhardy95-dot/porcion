// Cabeceras de seguridad para Cloudflare Pages.
// Al terminar la compilación, calcula la huella (hash) de cada script en línea de las páginas
// y arma una Política de Seguridad de Contenido (CSP) que solo permite esos scripts y los
// archivos del propio sitio. El resultado se agrega al principio de dist/_headers.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function htmls(raiz, carpeta = '') {
  const entradas = await readdir(path.join(raiz, carpeta), { withFileTypes: true });
  const archivos = [];
  for (const e of entradas) {
    const relativo = carpeta ? `${carpeta}/${e.name}` : e.name;
    if (e.isDirectory()) archivos.push(...(await htmls(raiz, relativo)));
    else if (e.name.endsWith('.html')) archivos.push(relativo);
  }
  return archivos;
}

const SCRIPT = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;

export function huellasDeScripts(html) {
  const huellas = new Set();
  for (const [, atributos = '', contenido] of html.matchAll(SCRIPT)) {
    if (/\ssrc\s*=/.test(atributos)) continue; // scripts externos: los cubre 'self'
    if (/type\s*=\s*["']?application\/ld\+json/i.test(atributos)) continue; // datos, no código
    if (!contenido) continue;
    huellas.add(`'sha256-${createHash('sha256').update(contenido, 'utf8').digest('base64')}'`);
  }
  return huellas;
}

export function politica(huellas) {
  return [
    "default-src 'self'",
    `script-src 'self' ${[...huellas].sort().join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export default function cabeceras() {
  return {
    name: 'porcion-seguridad',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const raiz = fileURLToPath(dir);
        const huellas = new Set();
        for (const archivo of await htmls(raiz)) {
          for (const h of huellasDeScripts(await readFile(path.join(raiz, archivo), 'utf8'))) huellas.add(h);
        }
        const bloque = [
          '/*',
          `  Content-Security-Policy: ${politica(huellas)}`,
          '  X-Content-Type-Options: nosniff',
          '  X-Frame-Options: DENY',
          '  Referrer-Policy: strict-origin-when-cross-origin',
          '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=()',
          '  Cross-Origin-Opener-Policy: same-origin',
          '  Cross-Origin-Resource-Policy: same-origin',
          '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
          '',
        ].join('\n');
        const destino = path.join(raiz, '_headers');
        let resto = '';
        try { resto = await readFile(destino, 'utf8'); } catch { resto = ''; }
        await writeFile(destino, `${bloque}\n${resto}`);
        logger.info(`_headers listo: CSP con ${huellas.size} scripts en línea permitidos`);
      },
    },
  };
}
