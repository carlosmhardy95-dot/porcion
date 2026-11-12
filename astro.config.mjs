// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/config.js';

// Usamos Astro 6: no depende de los módulos nativos nuevos de Astro 7,
// que Windows (Control de aplicaciones) bloquea en la compu de desarrollo.
export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Sin procesamiento de imágenes en el build: evita cargar sharp (otro módulo nativo).
  image: { service: passthroughImageService() },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/app/'),
    }),
  ],
});
