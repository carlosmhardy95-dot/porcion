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

export function gastosFijosPorUnidad(negocio) {
  return num(negocio.fijosMes) / Math.max(1, num(negocio.unidadesMes));
}

export function calcularReceta(receta, insumosPorId, negocio, redondeo = REDONDEO) {
  const R = Math.max(1, num(receta.rinde));
  const lineas = receta.lines.map((l) => ({ id: l.id, costo: costoLinea(l, insumosPorId[l.insumoId]) }));
  const I = lineas.reduce((suma, l) => suma + l.costo, 0);
  const G = num(receta.horno) * num(negocio.costoMin);
  const L = (num(receta.minutos) / 60) * num(negocio.valorHora);
  const pk = num(receta.packaging);
  const fx = gastosFijosPorUnidad(negocio);
  const C = (I + G + L) / R + pk + fx;

  const g = num(receta.ganancia) / 100;
  const t = num(receta.impuestos) / 100;
  const denominador = 1 - g - t;
  const invalido = denominador < 0.05;
  const precio = invalido ? 0 : Math.ceil(C / denominador / redondeo) * redondeo;
  const ganancia = precio * (1 - t) - C;

  const actual = num(receta.actual);
  const gananciaActual = actual > 0 ? actual * (1 - t) - C : null;
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

  return { R, I, G, L, pk, fx, C, precio, ganancia, invalido, actual, gananciaActual, competencia, lineas, partes };
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
