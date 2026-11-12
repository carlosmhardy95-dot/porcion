// Guardado local de Porción: todo vive en el navegador de cada persona.
import { sanearEstado } from './validar.js';

const CLAVE = 'porcion-v1';
const CLAVE_RESPALDO = 'porcion-v1-respaldo';
export const TAMANO_MAXIMO_COPIA = 5 * 1024 * 1024; // 5 MB

export function negocioInicial() {
  return { valorHora: '4000', costoMin: '30', fijosMes: '120000', unidadesMes: '600' };
}

export function listaInicial() {
  return { titulo: 'Lista de precios', negocio: '', contacto: '', tema: 'papel', precio: 'sugerido', items: [] };
}

export function estadoInicial() {
  return { version: 1, negocio: negocioInicial(), insumos: [], recetas: [], recetaActiva: null, lista: listaInicial() };
}

// Si lo guardado está dañado, no se pisa: se guarda aparte para no perderlo.
function respaldar(crudo) {
  try {
    if (crudo && !localStorage.getItem(CLAVE_RESPALDO)) localStorage.setItem(CLAVE_RESPALDO, crudo);
  } catch {
    // Sin espacio o sin acceso: no hay nada más que hacer.
  }
}

export function cargar() {
  let crudo = null;
  try {
    crudo = localStorage.getItem(CLAVE);
    if (!crudo) return estadoInicial();
    return sanearEstado(JSON.parse(crudo), estadoInicial());
  } catch {
    respaldar(crudo);
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
  if (typeof texto !== 'string' || texto.length > TAMANO_MAXIMO_COPIA) {
    throw new Error('El archivo no es una copia de Porción o es demasiado grande.');
  }
  let contenido;
  try {
    contenido = JSON.parse(texto);
  } catch {
    throw new Error('El archivo no es una copia de Porción.');
  }
  if (contenido === null || typeof contenido !== 'object' || contenido.app !== 'porcion') {
    throw new Error('El archivo no es una copia de Porción o está dañado.');
  }
  try {
    return sanearEstado(contenido.datos, estadoInicial());
  } catch {
    throw new Error('El archivo no es una copia de Porción o está dañado.');
  }
}
