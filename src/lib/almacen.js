// Guardado local de Porción: todo vive en el navegador de cada persona.
const CLAVE = 'porcion-v1';

export function negocioInicial() {
  return { valorHora: '4000', costoMin: '30', fijosMes: '120000', unidadesMes: '600' };
}

export function estadoInicial() {
  return { version: 1, negocio: negocioInicial(), insumos: [], recetas: [], recetaActiva: null };
}

export function cargar() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return estadoInicial();
    const datos = JSON.parse(crudo);
    if (!datos || datos.version !== 1 || !Array.isArray(datos.insumos) || !Array.isArray(datos.recetas)) {
      return estadoInicial();
    }
    return { ...estadoInicial(), ...datos, negocio: { ...negocioInicial(), ...datos.negocio } };
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
