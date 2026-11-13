import { useEffect, useMemo, useState } from 'react';
import '../styles/app.css';
import { cargar, guardar, nuevoId } from '../lib/almacen.js';
import { PLANTILLAS, crearDesdePlantilla, recetaVacia } from '../lib/plantillas.js';
import EditorReceta from './EditorReceta.jsx';
import MisRecetas from './MisRecetas.jsx';
import Despensa from './Despensa.jsx';
import ListaPrecios from './ListaPrecios.jsx';
import Instalar from './Instalar.jsx';

const CAMPOS_QUE_ACTUALIZAN_PRECIO = ['price', 'pack', 'unit'];

export default function Calculadora() {
  const [estado, setEstado] = useState(null);
  const [vista, setVista] = useState('recetas');
  const [guardado, setGuardado] = useState(true);

  // Carga inicial: solo en el navegador.
  useEffect(() => {
    let inicial = cargar();
    const ejemplo = new URLSearchParams(window.location.search).get('ejemplo');
    if (ejemplo && Object.hasOwn(PLANTILLAS, ejemplo)) {
      inicial = crearDesdePlantilla(ejemplo, inicial).estado;
      window.history.replaceState(null, '', window.location.pathname);
      setVista('editor');
    } else if (inicial.recetaActiva && inicial.recetas.some((r) => r.id === inicial.recetaActiva)) {
      setVista('editor');
    }
    setEstado(inicial);
  }, []);

  // Guardado automático en cada cambio.
  useEffect(() => {
    if (estado) setGuardado(guardar(estado));
  }, [estado]);

  const insumosPorId = useMemo(() => {
    const mapa = {};
    (estado?.insumos ?? []).forEach((i) => { mapa[i.id] = i; });
    return mapa;
  }, [estado]);

  if (!estado) {
    return <div className="pc-app"><p className="pc-cargando">Cargando la calculadora…</p></div>;
  }

  const receta = estado.recetas.find((r) => r.id === estado.recetaActiva) ?? null;
  const ahora = () => new Date().toISOString();

  const cambiarReceta = (campo, valor) => setEstado((prev) => ({
    ...prev,
    recetas: prev.recetas.map((r) => (r.id === prev.recetaActiva ? { ...r, [campo]: valor, actualizada: ahora() } : r)),
  }));

  const cambiarLineas = (fn) => setEstado((prev) => ({
    ...prev,
    recetas: prev.recetas.map((r) => (r.id === prev.recetaActiva ? { ...r, lines: fn(r.lines), actualizada: ahora() } : r)),
  }));

  const acciones = {
    abrir: (id) => { setEstado((prev) => ({ ...prev, recetaActiva: id })); setVista('editor'); },
    nueva: () => {
      const r = recetaVacia();
      const insumo = { id: nuevoId('ins'), name: '', pack: '', unit: 'g', price: '', actualizado: ahora() };
      r.lines = [{ id: nuevoId('lin'), insumoId: insumo.id, used: '' }];
      setEstado((prev) => ({ ...prev, insumos: [...prev.insumos, insumo], recetas: [...prev.recetas, r], recetaActiva: r.id }));
      setVista('editor');
    },
    desdePlantilla: (clave) => {
      setEstado((prev) => crearDesdePlantilla(clave, prev).estado);
      setVista('editor');
    },
    duplicar: (id) => setEstado((prev) => {
      const original = prev.recetas.find((r) => r.id === id);
      if (!original) return prev;
      const copia = {
        ...original,
        id: nuevoId('rec'),
        nombre: `${original.nombre || 'Receta'} (copia)`,
        lines: original.lines.map((l) => ({ ...l, id: nuevoId('lin') })),
        actualizada: ahora(),
      };
      return { ...prev, recetas: [...prev.recetas, copia] };
    }),
    borrar: (id) => setEstado((prev) => ({
      ...prev,
      recetas: prev.recetas.filter((r) => r.id !== id),
      recetaActiva: prev.recetaActiva === id ? null : prev.recetaActiva,
      lista: { ...prev.lista, items: prev.lista.items.filter((i) => i.recetaId !== id) },
    })),
    cambiarReceta,
    cambiarNegocio: (campo, valor) => setEstado((prev) => ({ ...prev, negocio: { ...prev.negocio, [campo]: valor } })),
    cambiarInsumo: (id, campo, valor) => setEstado((prev) => ({
      ...prev,
      insumos: prev.insumos.map((i) => (i.id === id
        ? { ...i, [campo]: valor, ...(CAMPOS_QUE_ACTUALIZAN_PRECIO.includes(campo) ? { actualizado: ahora() } : {}) }
        : i)),
    })),
    cambiarUso: (lineaId, valor) => cambiarLineas((lines) => lines.map((l) => (l.id === lineaId ? { ...l, used: valor } : l))),
    quitarLinea: (lineaId) => cambiarLineas((lines) => lines.filter((l) => l.id !== lineaId)),
    agregarExistente: (insumoId) => cambiarLineas((lines) => [...lines, { id: nuevoId('lin'), insumoId, used: '' }]),
    agregarNuevo: () => {
      const insumo = { id: nuevoId('ins'), name: '', pack: '', unit: 'g', price: '', actualizado: ahora() };
      setEstado((prev) => ({
        ...prev,
        insumos: [...prev.insumos, insumo],
        recetas: prev.recetas.map((r) => (r.id === prev.recetaActiva
          ? { ...r, lines: [...r.lines, { id: nuevoId('lin'), insumoId: insumo.id, used: '' }], actualizada: ahora() }
          : r)),
      }));
      return insumo.id;
    },
    agregarInsumoDespensa: () => {
      const insumo = { id: nuevoId('ins'), name: '', pack: '', unit: 'g', price: '', actualizado: ahora() };
      setEstado((prev) => ({ ...prev, insumos: [insumo, ...prev.insumos] }));
      return insumo.id;
    },
    borrarInsumo: (id) => setEstado((prev) => ({
      ...prev,
      insumos: prev.insumos.filter((i) => i.id !== id),
      recetas: prev.recetas.map((r) => ({ ...r, lines: r.lines.filter((l) => l.insumoId !== id) })),
    })),
    cambiarLista: (campo, valor) => setEstado((prev) => ({ ...prev, lista: { ...prev.lista, [campo]: valor } })),
    reemplazarEstado: (nuevo) => { setEstado(nuevo); setVista('recetas'); },
  };

  const usosPorInsumo = {};
  estado.recetas.forEach((r) => r.lines.forEach((l) => { usosPorInsumo[l.insumoId] = (usosPorInsumo[l.insumoId] ?? 0) + 1; }));

  const pestanas = [
    { clave: 'editor', etiqueta: 'Receta', deshabilitada: !receta },
    { clave: 'recetas', etiqueta: 'Mis recetas' },
    { clave: 'despensa', etiqueta: 'Despensa' },
    { clave: 'lista', etiqueta: 'Lista' },
  ];

  return (
    <div className="pc-app">
      <nav className="pc-pestanas" aria-label="Secciones de la calculadora">
        {pestanas.map((p) => (
          <button
            key={p.clave}
            type="button"
            className="pc-pestana"
            aria-current={vista === p.clave ? 'page' : undefined}
            disabled={p.deshabilitada}
            onClick={() => setVista(p.clave)}
          >
            {p.etiqueta}
          </button>
        ))}
      </nav>

      {vista === 'editor' && receta && (
        <EditorReceta
          key={receta.id}
          receta={receta}
          estado={estado}
          insumosPorId={insumosPorId}
          usosPorInsumo={usosPorInsumo}
          acciones={acciones}
          irA={setVista}
        />
      )}
      {vista === 'recetas' && (
        <MisRecetas estado={estado} insumosPorId={insumosPorId} acciones={acciones} />
      )}
      {vista === 'despensa' && (
        <Despensa estado={estado} usosPorInsumo={usosPorInsumo} acciones={acciones} />
      )}
      {vista === 'lista' && (
        <ListaPrecios estado={estado} insumosPorId={insumosPorId} acciones={acciones} />
      )}

      <Instalar />

      <p className="pc-pie">
        {guardado
          ? 'Se guarda solo en este dispositivo. Nadie más ve tus datos.'
          : 'No pudimos guardar en este navegador: si cerrás la página, se pierden los cambios.'}
      </p>
    </div>
  );
}
