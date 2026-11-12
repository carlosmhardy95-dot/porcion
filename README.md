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

## Marca

Concepto: **el lado inteligente de la cocina**. Frase: «Cada receta tiene su número».

- **Logotipo:** `porción` en minúsculas, dibujado a partir de Fraunces. La ó lleva como acento una porción: un cuarto de círculo. El punto de la i es un cuadrado apoyado sobre la misma línea.
- **Archivos** (todos en `public/marca/`, en SVG):
  - `logotipo-horizontal-*`: logotipo con el descriptor.
  - `logotipo-compacto-*`: el logotipo solo.
  - `isotipo-*`: la ó.
  - `favicon.svg`.
  - `avatar.svg` y `avatar.png` para redes.
  - Las variantes `claro` van sobre fondos claros y las `oscuro` sobre fondos oscuros.
- **Colores:**

  | Nombre | HEX | Uso |
  | --- | --- | --- |
  | Tinta de cocina | `#33252D` | Estructura y contraste |
  | Papel harina | `#F3EBDD` | Fondo predominante |
  | Guinda | `#934653` | Color distintivo |
  | Yema tostada | `#D8A64E` | Acento limitado |
  | Masa | `#D9D0C2` | Divisiones y superficies |
  | Oliva apagado | `#64766B` | Solo estados positivos |

  Las variaciones tonales accesibles están en `src/styles/global.css`.
- **Tipografías:**
  - Fraunces: titulares.
  - DM Sans: textos e interfaz.
  - DM Mono: números y anotaciones.
- **Sobre fondo oscuro:** el acento del logotipo pasa de guinda a yema.
