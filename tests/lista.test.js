import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoInicial, aCopia, desdeCopia } from '../src/lib/almacen.js';
import { crearDesdePlantilla } from '../src/lib/plantillas.js';
import { etiquetaTanda, itemsDeLista, textoWhatsApp } from '../src/lib/listaPrecios.js';

function conAlfajores() {
  const { estado, recetaId } = crearDesdePlantilla('alfajores', estadoInicial());
  const insumosPorId = Object.fromEntries(estado.insumos.map((i) => [i.id, i]));
  return { estado, recetaId, insumosPorId };
}

test('etiquetas de tanda', () => {
  assert.equal(etiquetaTanda(12), 'Docena');
  assert.equal(etiquetaTanda(6), 'Media docena');
  assert.equal(etiquetaTanda(8), 'Por 8 unidades');
});

test('la lista muestra precio por unidad o por docena', () => {
  const { estado, recetaId, insumosPorId } = conAlfajores();
  estado.lista = { ...estado.lista, negocio: 'Dulce Ana', contacto: 'Pedidos por WhatsApp', items: [{ recetaId, modo: 'unidad' }] };
  assert.equal(itemsDeLista(estado, insumosPorId)[0].precio, 2100);
  estado.lista.items = [{ recetaId, modo: 'tanda' }];
  const [item] = itemsDeLista(estado, insumosPorId);
  assert.equal(item.precio, 25200);
  assert.equal(item.detalle, 'Docena');
  estado.lista.precio = 'actual';
  assert.equal(itemsDeLista(estado, insumosPorId)[0].precio, 10800);
  const texto = textoWhatsApp(estado.lista, itemsDeLista(estado, insumosPorId));
  assert.match(texto, /^\*Lista de precios · Dulce Ana\*/);
  assert.match(texto, /\(docena\)/);
  assert.match(texto, /Pedidos por WhatsApp$/);
});

test('recetas borradas no aparecen en la lista', () => {
  const { estado, insumosPorId } = conAlfajores();
  estado.lista.items = [{ recetaId: 'no-existe', modo: 'unidad' }];
  assert.equal(itemsDeLista(estado, insumosPorId).length, 0);
});

test('copia de seguridad: ida y vuelta, y archivos inválidos', () => {
  const { estado } = conAlfajores();
  const recuperado = desdeCopia(aCopia(estado));
  assert.equal(recuperado.recetas.length, 1);
  assert.equal(recuperado.insumos.length, estado.insumos.length);
  assert.throws(() => desdeCopia('{"hola":1}'), /no es una copia/);
  assert.throws(() => desdeCopia('esto no es json'), /no es una copia/);
});
