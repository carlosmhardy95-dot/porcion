import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoInicial, aCopia, desdeCopia } from '../src/lib/almacen.js';
import { sanearEstado, LIMITES } from '../src/lib/validar.js';
import { crearDesdePlantilla } from '../src/lib/plantillas.js';
import { huellasDeScripts } from '../seguridad/cabeceras.mjs';

const copia = (datos) => JSON.stringify({ app: 'porcion', version: 1, datos });

test('una copia con estructuras rotas no rompe la calculadora', () => {
  const datos = {
    version: 1,
    negocio: 'texto en lugar de objeto',
    insumos: [null, 5, { id: 'ins-1', name: { mal: true }, pack: 'abc', unit: 'toneladas', price: 1e400 }],
    recetas: [{ id: 'rec-1', nombre: 42, lines: null }, { id: 'rec-1', lines: [] }, { id: '<img src=x onerror=alert(1)>' }],
    recetaActiva: 'no-existe',
    lista: { tema: 'rojo', items: 'no es una lista' },
  };
  const e = desdeCopia(copia(datos));
  assert.equal(e.insumos.length, 1);
  assert.equal(e.insumos[0].name, '');
  assert.equal(e.insumos[0].pack, '');
  assert.equal(e.insumos[0].unit, 'g');
  assert.equal(e.recetas.length, 1, 'ids repetidos o inválidos se descartan');
  assert.deepEqual(e.recetas[0].lines, []);
  assert.equal(e.recetaActiva, null);
  assert.equal(e.lista.tema, 'papel');
  assert.deepEqual(e.lista.items, []);
  assert.equal(e.negocio.valorHora, '4000');
});

test('__proto__ en una copia no contamina objetos', () => {
  const texto = '{"app":"porcion","datos":{"version":1,"insumos":[],"recetas":[],"__proto__":{"contaminado":true},"negocio":{"__proto__":{"x":1}}}}';
  desdeCopia(texto);
  assert.equal({}.contaminado, undefined);
  assert.equal({}.x, undefined);
});

test('textos largos y caracteres de control se recortan', () => {
  const datos = { version: 1, insumos: [{ id: 'a', name: `x${'y'.repeat(5000)}\u0000\u0007`, pack: '1', unit: 'g', price: '1' }], recetas: [] };
  const e = sanearEstado(datos, estadoInicial());
  assert.ok(e.insumos[0].name.length <= LIMITES.texto);
  assert.ok(!/[\u0000-\u001F]/.test(e.insumos[0].name));
});

test('las cantidades se limitan', () => {
  const insumos = Array.from({ length: LIMITES.insumos + 50 }, (_, i) => ({ id: `i${i}`, name: 'x', pack: '1', unit: 'g', price: '1' }));
  const e = sanearEstado({ version: 1, insumos, recetas: [] }, estadoInicial());
  assert.equal(e.insumos.length, LIMITES.insumos);
});

test('archivos que no son de Porción o demasiado grandes se rechazan', () => {
  assert.throws(() => desdeCopia('null'), /no es una copia/);
  assert.throws(() => desdeCopia('{"app":"porcion","datos":null}'), /no es una copia/);
  assert.throws(() => desdeCopia('x'.repeat(6 * 1024 * 1024)), /demasiado grande/);
});

test('una copia normal se recupera completa', () => {
  const { estado } = crearDesdePlantilla('alfajores', estadoInicial());
  const e = desdeCopia(aCopia(estado));
  assert.equal(e.recetas.length, 1);
  assert.equal(e.recetas[0].lines.length, estado.recetas[0].lines.length);
  assert.deepEqual(e.negocio, estado.negocio);
});

test('plantillas: solo claves propias', () => {
  for (const clave of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
    const r = crearDesdePlantilla(clave, estadoInicial());
    assert.equal(r.recetaId, null);
  }
});

test('CSP: huellas de scripts en línea, sin JSON-LD ni externos', () => {
  const html = '<script>a()</script><script type="module">b()</script><script src="/x.js"></script><script type="application/ld+json">{}</script>';
  assert.equal(huellasDeScripts(html).size, 2);
});
