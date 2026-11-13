// Limpia y valida los datos de Porción antes de usarlos.
// Se aplica a lo que se lee del navegador y a las copias de seguridad que se importan:
// un archivo modificado o dañado nunca debe romper la calculadora ni ocupar espacio sin límite.

export const LIMITES = {
  insumos: 2000,
  recetas: 500,
  lineas: 200,
  itemsLista: 500,
  texto: 120,
  numero: 24,
  id: 64,
};

const UNIDADES = ['g', 'kg', 'ml', 'l', 'u'];
const TEMAS = ['papel', 'tinta'];
const PRECIOS = ['sugerido', 'actual'];
const MODOS = ['unidad', 'paquete', 'tanda'];

function esObjeto(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Texto: sin caracteres de control y con largo máximo.
export function texto(v, max = LIMITES.texto) {
  if (typeof v !== 'string' && typeof v !== 'number') return '';
  // eslint-disable-next-line no-control-regex
  return String(v).replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, max);
}

// Números guardados como texto (así los usa la calculadora). Solo dígitos, coma, punto y signo.
export function numeroTexto(v, porDefecto = '') {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v).slice(0, LIMITES.numero);
  if (typeof v !== 'string') return porDefecto;
  const limpio = v.trim().slice(0, LIMITES.numero);
  return /^-?[0-9]*[.,]?[0-9]*$/.test(limpio) ? limpio : porDefecto;
}

function id(v) {
  return typeof v === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(v) ? v : null;
}

function fecha(v) {
  return typeof v === 'string' && v.length <= 40 && Number.isFinite(Date.parse(v)) ? v : new Date().toISOString();
}

function opcion(v, opciones, porDefecto) {
  return opciones.includes(v) ? v : porDefecto;
}

function lista(v, max) {
  return Array.isArray(v) ? v.slice(0, max) : [];
}

function sinRepetir(items) {
  const vistos = new Set();
  return items.filter((i) => {
    if (!i || vistos.has(i.id)) return false;
    vistos.add(i.id);
    return true;
  });
}

function sanearNegocio(n, base) {
  const o = esObjeto(n) ? n : {};
  return {
    valorHora: numeroTexto(o.valorHora, base.valorHora),
    costoMin: numeroTexto(o.costoMin, base.costoMin),
    fijosMes: numeroTexto(o.fijosMes, base.fijosMes),
    unidadesMes: numeroTexto(o.unidadesMes, base.unidadesMes),
  };
}

function sanearInsumo(i) {
  if (!esObjeto(i) || !id(i.id)) return null;
  return {
    id: i.id,
    name: texto(i.name),
    pack: numeroTexto(i.pack),
    unit: opcion(i.unit, UNIDADES, 'g'),
    price: numeroTexto(i.price),
    actualizado: fecha(i.actualizado),
  };
}

function sanearReceta(r, insumosValidos) {
  if (!esObjeto(r) || !id(r.id)) return null;
  const lines = sinRepetir(
    lista(r.lines, LIMITES.lineas)
      .filter((l) => esObjeto(l) && id(l.id) && insumosValidos.has(l.insumoId))
      .map((l) => ({ id: l.id, insumoId: l.insumoId, used: numeroTexto(l.used) })),
  );
  return {
    id: r.id,
    nombre: texto(r.nombre),
    rinde: numeroTexto(r.rinde, '1'),
    paquete: numeroTexto(r.paquete, '1'),
    cajaPaquete: numeroTexto(r.cajaPaquete, '0'),
    horno: numeroTexto(r.horno, '0'),
    minutos: numeroTexto(r.minutos, '0'),
    packaging: numeroTexto(r.packaging, '0'),
    ganancia: numeroTexto(r.ganancia, '30'),
    impuestos: numeroTexto(r.impuestos, '0'),
    actual: numeroTexto(r.actual),
    competencia: numeroTexto(r.competencia),
    lines,
    actualizada: fecha(r.actualizada),
  };
}

function sanearLista(l, base, recetasValidas) {
  const o = esObjeto(l) ? l : {};
  const vistos = new Set();
  const items = lista(o.items, LIMITES.itemsLista)
    .filter((i) => esObjeto(i) && recetasValidas.has(i.recetaId) && !vistos.has(i.recetaId) && vistos.add(i.recetaId))
    .map((i) => ({ recetaId: i.recetaId, modo: opcion(i.modo, MODOS, 'unidad') }));
  return {
    titulo: typeof o.titulo === 'string' ? texto(o.titulo) : base.titulo,
    negocio: texto(o.negocio),
    contacto: texto(o.contacto),
    tema: opcion(o.tema, TEMAS, base.tema),
    precio: opcion(o.precio, PRECIOS, base.precio),
    items,
  };
}

// Devuelve un estado limpio a partir de datos de origen desconocido.
// Lanza un error si los datos ni siquiera tienen la forma básica de Porción.
export function sanearEstado(datos, inicial) {
  if (!esObjeto(datos) || datos.version !== 1 || !Array.isArray(datos.insumos) || !Array.isArray(datos.recetas)) {
    throw new Error('Los datos no tienen el formato de Porción.');
  }
  const insumos = sinRepetir(lista(datos.insumos, LIMITES.insumos).map(sanearInsumo));
  const insumosValidos = new Set(insumos.map((i) => i.id));
  const recetas = sinRepetir(lista(datos.recetas, LIMITES.recetas).map((r) => sanearReceta(r, insumosValidos)));
  const recetasValidas = new Set(recetas.map((r) => r.id));
  return {
    version: 1,
    negocio: sanearNegocio(datos.negocio, inicial.negocio),
    insumos,
    recetas,
    recetaActiva: recetasValidas.has(datos.recetaActiva) ? datos.recetaActiva : null,
    lista: sanearLista(datos.lista, inicial.lista, recetasValidas),
  };
}
