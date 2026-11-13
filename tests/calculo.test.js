// Pruebas del motor de cálculo. Se corren con: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularReceta, costoLinea, num } from '../src/lib/calculo.js';

const negocio = { valorHora: '4000', costoMin: '30', fijosMes: '120000', unidadesMes: '600' };

function alfajores() {
  const insumos = {
    maicena: { id: 'maicena', pack: '500', price: '1800' },
    harina: { id: 'harina', pack: '1000', price: '1200' },
    manteca: { id: 'manteca', pack: '200', price: '3000' },
    azucar: { id: 'azucar', pack: '1000', price: '1500' },
    huevos: { id: 'huevos', pack: '12', price: '3600' },
    ddl: { id: 'ddl', pack: '1000', price: '5000' },
    coco: { id: 'coco', pack: '100', price: '1500' },
  };
  const usos = { maicena: '150', harina: '100', manteca: '100', azucar: '80', huevos: '2', ddl: '400', coco: '30' };
  const receta = {
    rinde: '12', horno: '25', minutos: '90', packaging: '150', ganancia: '30', impuestos: '5', actual: '900', competencia: '2000',
    lines: Object.keys(usos).map((k) => ({ id: k, insumoId: k, used: usos[k] })),
  };
  return { receta, insumos };
}

test('num acepta coma decimal y valores vacíos', () => {
  assert.equal(num('1,5'), 1.5);
  assert.equal(num(''), 0);
  assert.equal(num(undefined), 0);
});

test('costo de una línea: precio ÷ envase × cantidad usada', () => {
  assert.equal(costoLinea({ used: '150' }, { pack: '500', price: '1800' }), 540);
  assert.equal(costoLinea({ used: '150' }, { pack: '0', price: '1800' }), 0);
});

test('ejemplo de alfajores: costo, precio redondeado y ganancia', () => {
  const { receta, insumos } = alfajores();
  const r = calcularReceta(receta, insumos, negocio);
  assert.equal(Math.round(r.I), 5330);
  assert.equal(r.G, 750);
  assert.equal(r.L, 6000);
  assert.equal(r.fx, 200);
  assert.equal(Math.round(r.C * 100) / 100, 1356.67);
  assert.equal(r.precio, 2100);
  assert.equal(Math.round(r.ganancia), 638);
  assert.equal(Math.round(r.gananciaActual), -502);
});

test('ganancia más impuestos de 95 % o más marca el cálculo como inválido', () => {
  const { receta, insumos } = alfajores();
  const r = calcularReceta({ ...receta, ganancia: '90', impuestos: '6' }, insumos, negocio);
  assert.equal(r.invalido, true);
  assert.equal(r.precio, 0);
});

test('el redondeo no suma $50 de más cuando la cuenta da justo un múltiplo', async () => {
  const { calcularReceta } = await import('../src/lib/calculo.js');
  const insumos = { a: { id: 'a', pack: '1', price: '6105' } };
  const receta = { rinde: '1', horno: '0', minutos: '0', packaging: '0', ganancia: '30', impuestos: '5', actual: '', competencia: '', lines: [{ id: 'l', insumoId: 'a', used: '1' }] };
  const negocio = { valorHora: '0', costoMin: '0', fijosMes: '120000', unidadesMes: '600' };
  const r = calcularReceta(receta, insumos, negocio);
  assert.equal(r.C, 6305);
  assert.equal(r.precio, 9700);
  const r2 = calcularReceta({ ...receta, lines: [{ id: 'l', insumoId: 'a', used: '1.001' }] }, insumos, negocio);
  assert.equal(r2.precio, 9750, 'si pasa apenas del múltiplo, sí redondea hacia arriba');
});

test('venta por docena: costo, precio redondeado sobre la docena y caja del paquete', () => {
  const { receta, insumos } = alfajores();
  const r = calcularReceta({ ...receta, paquete: '12', cajaPaquete: '0', actual: '10800' }, insumos, negocio);
  assert.equal(r.N, 12);
  assert.equal(Math.round(r.Cp), 16280);
  assert.equal(r.precioPaquete, 25050);
  assert.equal(Math.round(r.gananciaPaquete), 7518);
  assert.equal(Math.round(r.gananciaActual), -6020);
  assert.equal(r.precio, 2100, 'el precio por unidad no cambia');
  const conCaja = calcularReceta({ ...receta, paquete: '12', cajaPaquete: '1200' }, insumos, negocio);
  assert.equal(Math.round(conCaja.Cp), 17480);
  const porUnidad = calcularReceta(receta, insumos, negocio);
  assert.equal(porUnidad.N, 1);
  assert.equal(porUnidad.precioPaquete, porUnidad.precio);
  assert.equal(porUnidad.cajaPaquete, 0);
});

test('gastos e impuestos opcionales', () => {
  const { receta, insumos } = alfajores();
  const base = calcularReceta(receta, insumos, negocio);
  const sinExtras = calcularReceta({ ...receta, conExtras: 'no' }, insumos, negocio);
  assert.equal(Math.round(sinExtras.C * 100) / 100, Math.round((base.I / 12) * 100) / 100, 'solo ingredientes');
  assert.equal(sinExtras.G + sinExtras.L + sinExtras.pk + sinExtras.fx, 0);
  const sinImpuestos = calcularReceta({ ...receta, conImpuestos: 'no' }, insumos, negocio);
  assert.equal(sinImpuestos.precio, Math.ceil(base.C / 0.7 / 50 - 1e-9) * 50);
  const conSi = calcularReceta({ ...receta, conExtras: 'si', conImpuestos: 'si' }, insumos, negocio);
  assert.equal(conSi.precio, base.precio, 'prendidos = como antes');
  const sinDato = calcularReceta({ ...receta, impuestos: '0' }, insumos, negocio);
  assert.equal(sinDato.precio, Math.ceil(base.C / 0.7 / 50 - 1e-9) * 50);
  const docenaSinExtras = calcularReceta({ ...receta, paquete: '12', cajaPaquete: '1200', conExtras: 'no' }, insumos, negocio);
  assert.equal(docenaSinExtras.cajaPaquete, 0, 'la caja de la docena es parte de los gastos opcionales');
});
