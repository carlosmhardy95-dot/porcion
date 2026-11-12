// Arma los datos de la lista de precios y la dibuja como imagen para historias (1080 × 1920).
import { calcularReceta, dinero } from './calculo.js';
import { LOGOTIPO } from './logotipo.js';

export const TEMAS = {
  papel: { fondo: '#F4F0E8', tinta: '#292629', suave: '#5E595C', linea: '#8C8689', acento: '#BF503A' },
  tinta: { fondo: '#292629', tinta: '#F4F0E8', suave: '#D8D3C9', linea: '#5E595C', acento: '#BF503A' },
};

export function etiquetaTanda(rinde) {
  if (rinde === 12) return 'Docena';
  if (rinde === 6) return 'Media docena';
  return `Por ${rinde.toLocaleString('es-AR')} unidades`;
}

export function fechaLista(fecha = new Date()) {
  const texto = fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Devuelve los productos elegidos con su precio listo para mostrar.
export function itemsDeLista(estado, insumosPorId) {
  const { lista } = estado;
  return lista.items
    .map((item) => {
      const receta = estado.recetas.find((r) => r.id === item.recetaId);
      if (!receta) return null;
      const r = calcularReceta(receta, insumosPorId, estado.negocio);
      const base = lista.precio === 'actual' && r.actual > 0 ? r.actual : r.precio;
      const porTanda = item.modo === 'tanda' && r.R > 1;
      return {
        recetaId: receta.id,
        nombre: receta.nombre || 'Sin nombre',
        detalle: porTanda ? etiquetaTanda(r.R) : 'Por unidad',
        precio: porTanda ? base * r.R : base,
      };
    })
    .filter((i) => i && i.precio > 0);
}

export function textoWhatsApp(lista, items) {
  const titulo = lista.negocio ? `*${lista.titulo || 'Lista de precios'} · ${lista.negocio}*` : `*${lista.titulo || 'Lista de precios'}*`;
  const filas = items.map((i) => `• ${i.nombre}${i.detalle !== 'Por unidad' ? ` (${i.detalle.toLowerCase()})` : ''}: ${dinero(i.precio)}`);
  const partes = [titulo, fechaLista(), '', ...filas];
  if (lista.contacto) partes.push('', lista.contacto);
  return partes.join('\n');
}

function recortar(ctx, texto, ancho) {
  if (ctx.measureText(texto).width <= ancho) return texto;
  let t = texto;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > ancho) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

function envolver(ctx, texto, ancho, maxLineas) {
  const palabras = String(texto).split(/\s+/).filter(Boolean);
  const lineas = [];
  let actual = '';
  palabras.forEach((p) => {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width <= ancho || !actual) actual = prueba;
    else { lineas.push(actual); actual = p; }
  });
  if (actual) lineas.push(actual);
  if (lineas.length > maxLineas) {
    const resto = lineas.slice(maxLineas - 1).join(' ');
    return [...lineas.slice(0, maxLineas - 1), recortar(ctx, resto, ancho)];
  }
  return lineas.map((l) => recortar(ctx, l, ancho));
}

function lineaPunteada(ctx, x1, x2, y, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

const FUENTES = [
  '900 120px Chivo',
  '800 48px Chivo',
  '700 48px Rosario',
  '400 36px Chivo',
  '700 42px Chivo',
  '400 36px Rosario',
];
const SANS = 'Rosario, system-ui, sans-serif';
const MONO = 'Chivo, system-ui, sans-serif';

function dibujarLogotipo(ctx, x, y, alto, color, acento) {
  if (typeof Path2D === 'undefined') return;
  const escala = alto / LOGOTIPO.alto;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(escala, escala);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(LOGOTIPO.cuerpo));
  ctx.fillStyle = acento;
  ctx.fill(new Path2D(LOGOTIPO.acento));
  ctx.restore();
}

export async function dibujarLista(canvas, lista, items) {
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  try {
    await Promise.all(FUENTES.map((f) => document.fonts.load(f)));
  } catch {
    // Si las fuentes no cargan, se dibuja con las del sistema.
  }
  const t = TEMAS[lista.tema] ?? TEMAS.papel;
  const X = 96;
  const ANCHO = W - X * 2;

  ctx.fillStyle = t.fondo;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  let y = 170;

  if (lista.negocio) {
    ctx.fillStyle = t.tinta;
    ctx.font = `700 40px ${SANS}`;
    ctx.fillText(recortar(ctx, lista.negocio, ANCHO), X, y);
    y += 30;
  }

  ctx.fillStyle = t.tinta;
  const titulo = lista.titulo || 'Lista de precios';
  let tam = 120;
  for (const prueba of [120, 100, 84]) {
    tam = prueba;
    ctx.font = `900 ${tam}px Chivo, 'Arial Black', sans-serif`;
    if (envolver(ctx, titulo, ANCHO, 3).length <= 2) break;
  }
  envolver(ctx, titulo, ANCHO, 2).forEach((l) => {
    y += tam * 1.05;
    ctx.fillText(l, X, y);
  });

  y += 90;
  ctx.fillStyle = t.suave;
  ctx.font = `400 36px ${MONO}`;
  ctx.fillText(fechaLista(), X, y);

  y += 60;
  // Sin líneas: el espacio separa la cabecera de los productos.

  const pieArriba = H - 340;
  const espacio = pieArriba - y - 40;
  const n = Math.max(1, items.length);
  const alto = Math.min(170, espacio / n);
  const s = Math.max(0.55, alto / 170);
  let fila = y + 30;

  items.forEach((item) => {
    const base = fila + 62 * s;
    ctx.font = `800 ${Math.round(56 * s)}px ${MONO}`;
    const textoPrecio = dinero(item.precio);
    const anchoPrecio = ctx.measureText(textoPrecio).width;
    ctx.fillStyle = t.tinta;
    ctx.textAlign = 'right';
    ctx.fillText(textoPrecio, X + ANCHO, base);
    ctx.textAlign = 'left';

    const anchoNombre = ANCHO - anchoPrecio - 80;
    let tamNombre = 48 * s;
    ctx.font = `700 ${Math.round(tamNombre)}px ${SANS}`;
    while (ctx.measureText(item.nombre).width > anchoNombre && tamNombre > 36 * s) {
      tamNombre -= 2;
      ctx.font = `700 ${Math.round(tamNombre)}px ${SANS}`;
    }
    const nombre = recortar(ctx, item.nombre, anchoNombre);
    ctx.fillText(nombre, X, base);
    const finNombre = X + ctx.measureText(nombre).width + 20;
    const inicioPrecio = X + ANCHO - anchoPrecio - 20;

    ctx.fillStyle = t.linea;
    for (let px = finNombre; px < inicioPrecio; px += 16) {
      ctx.beginPath();
      ctx.arc(px, base - 10 * s, 3 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = t.suave;
    ctx.font = `400 ${Math.round(34 * s)}px ${SANS}`;
    ctx.fillText(item.detalle, X, base + 48 * s);
    fila += alto;
  });

  if (items.length === 0) {
    ctx.fillStyle = t.suave;
    ctx.font = `400 40px ${SANS}`;
    ctx.fillText('Elegí productos para tu lista.', X, fila + 60);
  }


  if (lista.contacto) {
    ctx.fillStyle = t.tinta;
    ctx.font = `700 42px ${MONO}`;
    envolver(ctx, lista.contacto, ANCHO, 2).forEach((l, i) => ctx.fillText(l, X, pieArriba + 90 + i * 56));
  }
  ctx.fillStyle = t.suave;
  ctx.font = `400 30px ${SANS}`;
  ctx.fillText('Hecha con', X, H - 100);
  dibujarLogotipo(ctx, X + ctx.measureText('Hecha con').width + 16, H - 136, 40, t.suave, t.acento);
}
