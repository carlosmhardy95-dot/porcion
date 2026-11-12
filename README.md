# Porción

Calculadora gratis de costos y precios para emprendedores gastronómicos.

Hecha con [Astro](https://astro.build) y React, publicada en Cloudflare Pages.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm install` | Instala las dependencias (solo la primera vez o cuando cambian) |
| `npm run dev` | Abre la web en tu compu, en http://localhost:4321 |
| `npm run build` | Arma la versión final en la carpeta `dist/` |
| `npm run preview` | Muestra la versión final en tu compu |

## Configuración

- `src/config.js`: dirección del sitio y el interruptor `INDEXABLE`. Mientras esté en `false`, Google no indexa el sitio.

## Publicación en Cloudflare Pages

- Comando de build: `npm run build`
- Carpeta de salida: `dist`
- Variable de entorno: `NODE_VERSION` = `24`
