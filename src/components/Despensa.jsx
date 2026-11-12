import { diasDesde, DIAS_PRECIO_VIEJO } from '../lib/calculo.js';
import { CampoNumero, SelectorUnidad } from './Campos.jsx';

function IconoTacho() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" />
    </svg>
  );
}

export default function Despensa({ estado, usosPorInsumo, acciones }) {
  const insumos = estado.insumos;
  const viejos = insumos.filter((i) => diasDesde(i.actualizado) > DIAS_PRECIO_VIEJO).length;

  const agregar = () => {
    const id = acciones.agregarInsumoDespensa();
    setTimeout(() => document.getElementById(`desp-nom-${id}`)?.focus(), 0);
  };

  const borrar = (insumo) => {
    const usos = usosPorInsumo[insumo.id] ?? 0;
    const nombre = insumo.name || 'este insumo';
    const pregunta = usos > 0
      ? `"${nombre}" está en ${usos} ${usos === 1 ? 'receta' : 'recetas'}. Si lo borrás, se quita de todas. ¿Seguro?`
      : `¿Borrar "${nombre}"?`;
    if (window.confirm(pregunta)) acciones.borrarInsumo(insumo.id);
  };

  return (
    <div className="pc-despensa">
      <section className="pc-seccion">
        <h2>Despensa</h2>
        <p className="pc-suave">Cada insumo tiene un solo precio. Si lo cambiás acá, se recalculan todas tus recetas.</p>
        {viejos > 0 && (
          <p className="pc-aviso">
            <strong>{viejos} {viejos === 1 ? 'precio tiene' : 'precios tienen'} más de {DIAS_PRECIO_VIEJO} días.</strong> Revisalos antes de vender.
          </p>
        )}
        <button type="button" className="pc-agregar" onClick={agregar}>+ Agregar insumo</button>
      </section>

      <section className="pc-seccion">
        {insumos.length === 0 && (
          <p className="pc-tarjeta pc-vacio">Tu despensa está vacía. Los insumos aparecen acá cuando los cargás en una receta.</p>
        )}
        {insumos.map((insumo) => {
          const dias = diasDesde(insumo.actualizado);
          const usos = usosPorInsumo[insumo.id] ?? 0;
          return (
            <div key={insumo.id} className="pc-tarjeta">
              <div className="pc-fila-ingrediente">
                <label htmlFor={`desp-nom-${insumo.id}`} className="solo-lectores">Nombre del insumo</label>
                <input
                  id={`desp-nom-${insumo.id}`}
                  className="pc-nombre-ingrediente"
                  type="text"
                  placeholder="Nombre del insumo"
                  autoComplete="off"
                  value={insumo.name}
                  onChange={(e) => acciones.cambiarInsumo(insumo.id, 'name', e.target.value)}
                />
                <button type="button" className="pc-quitar" aria-label={`Borrar ${insumo.name || 'insumo'}`} onClick={() => borrar(insumo)}>
                  <IconoTacho />
                </button>
              </div>
              <div className="pc-grilla3">
                <CampoNumero id={`desp-env-${insumo.id}`} etiqueta="Envase" valor={insumo.pack} onCambio={(v) => acciones.cambiarInsumo(insumo.id, 'pack', v)} />
                <SelectorUnidad id={`desp-uni-${insumo.id}`} valor={insumo.unit} onCambio={(v) => acciones.cambiarInsumo(insumo.id, 'unit', v)} />
                <CampoNumero id={`desp-pre-${insumo.id}`} etiqueta="Precio $" valor={insumo.price} onCambio={(v) => acciones.cambiarInsumo(insumo.id, 'price', v)} />
              </div>
              <p className="pc-chico">
                {dias > DIAS_PRECIO_VIEJO
                  ? <span className="pc-etiqueta-vieja">Precio viejo · {dias} días</span>
                  : dias === 0 ? 'Actualizado hoy' : `Actualizado hace ${dias} ${dias === 1 ? 'día' : 'días'}`}
                {' · '}
                {usos === 0 ? 'No está en ninguna receta' : `En ${usos} ${usos === 1 ? 'receta' : 'recetas'}`}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
