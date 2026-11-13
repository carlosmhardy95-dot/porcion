// Motor de cálculo de Porción. Funciones puras: no tocan la pantalla ni el guardado.
// Fórmulas documentadas en "Porción — Fase 2", sección "Cómo calcula Porción".

export const DIAS_PRECIO_VIEJO = 45;
export const REDONDEO = 50;

export function num(valor) {
  const x = parseFloat(String(valor ?? '').replace(',', '.'));
  return Number.isFinite(x) ? x : 0;
}

export function costoLinea(linea, insumo) {
  if (!insumo) return 0;
  const envase = num(insumo.pack);
  return envase > 0 ? (num(insumo.price) / envase) * num(linea.used) : 0;
}

// Redondea hacia arriba al múltiplo de «paso». El margen de 1e-9 evita que un error de
// redondeo de la computadora (9700,000000000002) suba al siguiente múltiplo.
export function redondearArriba(valor, paso) {
  return Math.ceil(valor / paso - 1e-9) * paso;
}

// Cómo se vende: 1 = por unidad, 12 = por docena, 6 = media docena, otro número = paquete de N.
export function unidadesPorVenta(receta) {
  return Math.max(1, Math.round(num(receta.paquete) || 1));
}

export function etiquetaVenta(n, { mayuscula = false } = {}) {
  const t = n === 1 ? 'unidad' : n === 12 ? 'docena' : n === 6 ? 'media docena' : `paquete de ${n}`;
  return mayuscula ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

// Opciones de la receta. Sin valor guardado: gastos prendidos (como siempre) e impuestos
// prendidos solo si hay un porcentaje cargado.
export function conExtras(receta) {
  return receta.conExtras !== 'no';
}

export function conImpuestos(receta) {
  if (receta.conImpuestos === 'no') return false;
  if (receta.conImpuestos === 'si') return true;
  return num(receta.impuestos) > 0;
}

export function gastosFijosPorUnidad(negocio) {
  return num(negocio.fijosMes) / Math.max(1, num(negocio.unidadesMes));
}

export function calcularReceta(receta, insumosPorId, negocio, redondeo = REDONDEO) {
  const R = Math.max(1, num(receta.rinde));
  const lineas = receta.lines.map((l) => ({ id: l.id, costo: costoLinea(l, insumosPorId[l.insumoId]) }));
  const I = lineas.reduce((suma, l) => suma + l.costo, 0);
  // «Lo que también pagás» es opcional: si la receta lo tiene apagado, no se suman
  // gas, tiempo, caja ni gastos fijos. Las recetas sin la opción guardada lo tienen prendido.
  const extras = conExtras(receta);
  const G = extras ? num(receta.horno) * num(negocio.costoMin) : 0;
  const L = extras ? (num(receta.minutos) / 60) * num(negocio.valorHora) : 0;
  const pk = extras ? num(receta.packaging) : 0;
  const fx = extras ? gastosFijosPorUnidad(negocio) : 0;
  const C = (I + G + L) / R + pk + fx;

  const g = num(receta.ganancia) / 100;
  const t = conImpuestos(receta) ? num(receta.impuestos) / 100 : 0;
  const denominador = 1 - g - t;
  const invalido = denominador < 0.05;
  const precio = invalido ? 0 : redondearArriba(C / denominador, redondeo);
  const ganancia = precio * (1 - t) - C;

  // Venta por paquete (docena, media docena…): el costo es el de N unidades más la caja del paquete,
  // y el precio se redondea sobre el paquete. Con N = 1 da lo mismo que por unidad.
  const N = unidadesPorVenta(receta);
  const cajaPaquete = N > 1 && extras ? num(receta.cajaPaquete) : 0;
  const Cp = C * N + cajaPaquete;
  const precioPaquete = invalido ? 0 : redondearArriba(Cp / denominador, redondeo);
  const gananciaPaquete = precioPaquete * (1 - t) - Cp;

  // «Tu precio de hoy» y «competencia» se cargan en la misma forma en que vendés (por unidad o por paquete).
  const actual = num(receta.actual);
  const gananciaActual = actual > 0 ? actual * (1 - t) - Cp : null;
  const competencia = num(receta.competencia);

  const partes = [
    { clave: 'ingredientes', etiqueta: 'Ingredientes', valor: I / R },
    { clave: 'tiempo', etiqueta: 'Tu tiempo', valor: L / R },
    { clave: 'gas', etiqueta: 'Gas y luz', valor: G / R },
    { clave: 'caja', etiqueta: 'Caja y envío', valor: pk },
    { clave: 'fijos', etiqueta: 'Gastos fijos', valor: fx },
  ]
    .map((p) => ({ ...p, porcentaje: C > 0 ? (p.valor / C) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor);

  return { R, I, G, L, pk, fx, C, precio, ganancia, invalido, N, cajaPaquete, Cp, precioPaquete, gananciaPaquete, actual, gananciaActual, competencia, lineas, partes };
}

export function diasDesde(fechaISO, ahora = Date.now()) {
  const t = Date.parse(fechaISO);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.floor((ahora - t) / 86400000));
}

export function dinero(valor) {
  const r = Math.round(valor);
  return (r < 0 ? '-$' : '$') + Math.abs(r).toLocaleString('es-AR');
}

export function dinero1(valor) {
  return '$' + (Math.round(valor * 10) / 10).toLocaleString('es-AR', { maximumFractionDigits: 1 });
}

export function cantidad(valor) {
  return num(valor).toLocaleString('es-AR', { maximumFractionDigits: 2 });
}
