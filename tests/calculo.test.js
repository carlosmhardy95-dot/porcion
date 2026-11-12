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
