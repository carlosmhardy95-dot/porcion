// Service worker de Porción.
// Este archivo es una plantilla: al compilar, pwa/integracion.mjs completa la versión
// y la lista de archivos, y lo guarda como dist/sw.js. No lo edites dentro de dist.

const VERSION = '__VERSION__';
const ARCHIVOS = __ARCHIVOS__;
const CACHE = `porcion-${VERSION}`;
const CACHE_FUENTES = 'porcion-fuentes';
const ESPERA_RED = 4000;

// Al instalar: guarda todas las páginas y archivos del sitio para usarlos sin internet.
self.addEventListener('install', (evento) => {
  evento.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ARCHIVOS.map((url) => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

// Al activar: borra las versiones viejas.
self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    const claves = await caches.keys();
    await Promise.all(claves
      .filter((c) => c.startsWith('porcion-') && c !== CACHE && c !== CACHE_FUENTES)
      .map((c) => caches.delete(c)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    evento.respondWith(request.mode === 'navigate' ? pagina(request) : archivo(request));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    evento.respondWith(fuente(evento));
  }
});

// Páginas: primero internet (para tener siempre lo último); si no hay o tarda, la copia guardada.
async function pagina(request) {
  const cache = await caches.open(CACHE);
  const red = fetch(request);
  const guardada = () => cache.match(request, { ignoreSearch: true, ignoreVary: true }).then((r) => r ?? cache.match('/calculadora/', { ignoreVary: true }));
  try {
    const respuesta = await Promise.race([
      red,
      new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('lento')), ESPERA_RED)),
    ]);
    return respuesta;
  } catch {
    const copia = await guardada();
    if (copia) return copia;
    try { return await red; } catch { return Response.error(); }
  }
}

// Archivos del sitio (estilos, código, íconos): primero la copia guardada.
async function archivo(request) {
  const cache = await caches.open(CACHE);
  // ignoreVary: algunos servidores mandan "Vary: Origin" y la copia guardada no coincidiría.
  const guardada = await cache.match(request, { ignoreVary: true });
  if (guardada) return guardada;
  const respuesta = await fetch(request);
  if (respuesta.ok && new URL(request.url).pathname.startsWith('/_astro/')) {
    cache.put(request, respuesta.clone());
  }
  return respuesta;
}

// Tipografías de Google: usa la guardada y la actualiza por detrás.
async function fuente(evento) {
  const { request } = evento;
  const cache = await caches.open(CACHE_FUENTES);
  const guardada = await cache.match(request);
  const red = fetch(request)
    .then((r) => {
      if (r.ok || r.type === 'opaque') cache.put(request, r.clone());
      return r;
    })
    .catch(() => null);
  if (guardada) {
    evento.waitUntil(red);
    return guardada;
  }
  return (await red) ?? Response.error();
}
