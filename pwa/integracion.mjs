// Al terminar la compilación, arma dist/sw.js con la lista de archivos del sitio
// y una versión que cambia cada vez que cambia algo. Así la app se actualiza sola.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXCLUIR = [/^marca\//, /^sw\.js$/, /\.map$/, /^sitemap/, /^robots\.txt$/, /^_headers$/, /^_redirects$/, /^404\.html$/];

async function listar(raiz, carpeta = '') {
  const entradas = await readdir(path.join(raiz, carpeta), { withFileTypes: true });
  const archivos = [];
  for (const e of entradas) {
    const relativo = carpeta ? `${carpeta}/${e.name}` : e.name;
    if (e.isDirectory()) archivos.push(...(await listar(raiz, relativo)));
    else archivos.push(relativo);
  }
  return archivos;
}

export default function pwa() {
  return {
    name: 'porcion-pwa',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const raiz = fileURLToPath(dir);
        const archivos = (await listar(raiz)).filter((a) => !EXCLUIR.some((r) => r.test(a))).sort();
        const huella = createHash('sha256');
        for (const a of archivos) {
          huella.update(a);
          huella.update(await readFile(path.join(raiz, a)));
        }
        // "calculadora/index.html" se pide como "/calculadora/".
        const urls = archivos.map((a) => `/${a.replace(/(^|\/)index\.html$/, '$1')}`);
        const plantilla = await readFile(new URL('./sw-plantilla.js', import.meta.url), 'utf8');
        const codigo = plantilla
          .replace('__VERSION__', huella.digest('hex').slice(0, 12))
          .replace('__ARCHIVOS__', JSON.stringify(urls, null, 2));
        await writeFile(path.join(raiz, 'sw.js'), codigo);
        logger.info(`sw.js listo con ${urls.length} archivos`);
      },
    },
  };
}
