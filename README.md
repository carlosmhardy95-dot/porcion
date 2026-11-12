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

## Marca (ruta «Rótulo»)

**Concepto:** diseño de oficio contemporáneo. Porción rotula tus números con la misma claridad con que se marcan los cajones y las bolsas de insumos.

**Logotipo:** PORCIÓN en Chivo Black, calada como un esténcil.
- Los cortes parten cada letra en porciones: la O en mitades, la P y la R separan el asta del ojo, la N corta su diagonal.
- El acento de la Ó es una pieza inclinada que nace justo donde se corta la O.
- Funciona en blanco y negro.

**Archivos** (SVG, en `public/marca/`):
- `logotipo-claro` y `logotipo-oscuro`: el logotipo solo.
- `logotipo-negro` y `logotipo-blanco`: versiones de un color.
- `logotipo-horizontal-*`: el logotipo con el descriptor al lado.
- `logotipo-compacto-*`: apilado en dos líneas, POR / CIÓN.
- `isotipo-*`: la Ó.
- `favicon.svg`.
- `avatar.svg` y `avatar.png` para redes.

**Colores:**

| Nombre | HEX | Uso |
| --- | --- | --- |
| Carbón | `#292629` | Texto, estructura y bloque de resultado |
| Hueso | `#F4F0E8` | Fondo |
| Pimentón | `#BF503A` | Acción principal y acento del logotipo |
| Piedra | `#D8D3C9` | Superficies y pie de página |
| Oliva | `#63776A` | Solo ganancia y estados positivos |

Las variaciones tonales, cada una justificada por contraste, están en `src/styles/global.css`.

**Tipografías:**
- Chivo: logotipo, titulares y cifras, con números tabulares.
- Rosario: textos e interfaz, con cifras alineadas forzadas.

**Reglas:**
- Se divide con espacio (cortes), no con líneas.
- Sin etiquetas decorativas ni numeraciones de adorno.
- Los números son lo más grande de cada bloque.

## Seguridad

- **Cabeceras:** `seguridad/cabeceras.mjs` las agrega a `dist/_headers` al compilar.
  - CSP estricta: solo scripts del propio sitio y los scripts en línea con huella SHA-256 calculada en cada build.
  - Contra que la página se muestre dentro de otro sitio: `frame-ancestors 'none'` y `X-Frame-Options: DENY`.
  - También: `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP y HSTS.
- **Sin terceros:** las tipografías se sirven desde `public/fuentes/` (licencia OFL incluida).
- **Datos:** `src/lib/validar.js` limpia todo lo que se lee del navegador y de las copias de seguridad.
  - Controla tipos, largos máximos y cantidades máximas.
  - Descarta ids inválidos o repetidos.
  - Si lo guardado está dañado, se conserva en `porcion-v1-respaldo` en lugar de perderse.
- **Pruebas:** `tests/seguridad.test.js`.
