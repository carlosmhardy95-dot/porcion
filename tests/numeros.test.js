import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerNumero, mostrarNumero, limpiarEscritura } from '../src/lib/numeros.js';
import { num } from '../src/lib/calculo.js';

test('lee miles con punto y decimales con coma, como en Argentina', () => {
  const casos = {
    '1800': '1800', '1.800': '1800', '12.500': '12500', '125.000': '125000', '1.234.567': '1234567',
    '1,5': '1.5', '0,25': '0.25', '1.234,5': '1234.5', '2.5': '2.5', '0.250': '0.250', '1.50': '1.50',
    '1234.567': '1234.567', '1,234.5': '1234.5', ',5': '0.5', '.5': '0.5', '007': '7', '0': '0',
    '1.': '1', '1,': '1', '': '', ',': '', '$ 1.800': '1800', '30 %': '30',
  };
  for (const [entrada, esperado] of Object.entries(casos)) assert.equal(leerNumero(entrada), esperado, entrada);
});

test('lo leído entra igual al motor de cálculo', () => {
  assert.equal(num(leerNumero('1.800')), 1800);
  assert.equal(num(leerNumero('1,5')), 1.5);
  assert.equal(num(leerNumero('1.234,56')), 1234.56);
});

test('muestra los números con formato argentino', () => {
  assert.equal(mostrarNumero('1800'), '1.800');
  assert.equal(mostrarNumero('2.5'), '2,5');
  assert.equal(mostrarNumero('0.25'), '0,25');
  assert.equal(mostrarNumero('30'), '30');
  assert.equal(mostrarNumero(''), '');
  assert.equal(mostrarNumero(undefined), '');
  // Ida y vuelta: lo que se muestra se vuelve a leer igual.
  for (const v of ['1800', '2.5', '0.25', '125000', '1234.5']) assert.equal(num(leerNumero(mostrarNumero(v))), num(v), v);
});

test('la escritura solo deja cifras, punto y coma', () => {
  assert.equal(limpiarEscritura('1a.8b00'), '1.800');
  assert.equal(limpiarEscritura('-50'), '50');
});
