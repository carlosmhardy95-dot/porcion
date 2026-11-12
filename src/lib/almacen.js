// Guardado local de Porción: todo vive en el navegador de cada persona.
const CLAVE = 'porcion-v1';

export function negocioInicial() {
  return { valorHora: '4000', costoMin: '30', fijosMes: '120000', unidadesMes: '600' };
}

export function listaInicial() {
  return { titulo: 'Lista de precios', negocio: '', contacto: '', tema: 'papel', precio: 'sugerido', items: [] };
}

export function estadoInicial() {
  return { version: 1, negocio: negocioInicial(), insumos: [], recetas: [], recetaActiva: null, lista: listaInicial() };
}

function completar(datos) {
  return {
    ...estadoInicial(),
    ...datos,
    negocio: { ...negocioInicial(), ...datos.negocio },
    lista: { ...listaInicial(), ...datos.lista },
  };
}

function esValido(datos) {
  return !!datos && datos.version === 1 && Array.isArray(datos.insumos) && Array.isArray(datos.recetas);
}

export function cargar() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return estadoInicial();
    const datos = JSON.parse(crudo);
    return esValido(datos) ? completar(datos) : estadoInicial();
  } catch {
    return estadoInicial();
  }
}

export function guardar(estado) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

export function nuevoId(prefijo) {
  const azar = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefijo}-${Date.now().toString(36)}-${azar}`;
}

export function normalizar(texto) {
  return String(texto ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Copia de seguridad: un archivo .json con todos los datos.
export function aCopia(estado) {
  return JSON.stringify({ app: 'porcion', version: 1, exportado: new Date().toISOString(), datos: estado }, null, 2);
}

export function desdeCopia(texto) {
  let contenido;
  try {
    contenido = JSON.parse(texto);
  } catch {
    throw new Error('El archivo no es una copia de Porción.');
  }
  const datos = contenido?.app === 'porcion' ? contenido.datos : null;
  if (!esValido(datos)) throw new Error('El archivo no es una copia de Porción o está dañado.');
  return completar(datos);
}
