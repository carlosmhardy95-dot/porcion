import { calcularReceta, dinero } from '../lib/calculo.js';
import { PLANTILLAS } from '../lib/plantillas.js';

export default function MisRecetas({ estado, insumosPorId, acciones }) {
  const recetas = [...estado.recetas].sort((a, b) => String(b.actualizada).localeCompare(String(a.actualizada)));

  const borrar = (receta) => {
    if (window.confirm(`¿Borrar "${receta.nombre || 'Sin nombre'}"? No se puede deshacer.`)) acciones.borrar(receta.id);
  };

  return (
    <div className="pc-lista">
      <section className="pc-seccion">
        <h2>Mis recetas</h2>
        <button type="button" className="pc-boton" onClick={acciones.nueva}>Nueva receta desde cero</button>
        <p className="pc-suave">O empezá con un ejemplo y cambiá los precios por los tuyos:</p>
        <div className="pc-pastillas">
          {Object.entries(PLANTILLAS).map(([clave, p]) => (
            <button key={clave} type="button" className="pc-pastilla" onClick={() => acciones.desdePlantilla(clave)}>
              {p.etiqueta}
            </button>
          ))}
        </div>
      </section>

      <section className="pc-seccion">
        {recetas.length === 0 && (
          <p className="pc-tarjeta pc-vacio">Todavía no tenés recetas. Creá la primera con los botones de arriba.</p>
        )}
        {recetas.map((receta) => {
          const r = calcularReceta(receta, insumosPorId, estado.negocio);
          return (
            <article key={receta.id} className="pc-tarjeta pc-receta">
              <h3>{receta.nombre || 'Sin nombre'}</h3>
              <div className="pc-receta-numeros">
                <div><span className="pc-chico">Te cuesta</span><span className="pc-numero">{dinero(r.C)}</span></div>
                <div><span className="pc-chico">Precio sugerido</span><span className="pc-numero">{r.invalido ? '—' : dinero(r.precio)}</span></div>
              </div>
              {r.gananciaActual !== null && r.gananciaActual < 0 && (
                <p className="pc-mensaje pc-mal">Con tu precio de hoy ({dinero(r.actual)}) perdés {dinero(-r.gananciaActual)} por unidad.</p>
              )}
              <div className="pc-acciones">
                <button type="button" className="pc-boton-usar" onClick={() => acciones.abrir(receta.id)}>Abrir</button>
                <button type="button" className="pc-boton-texto" onClick={() => acciones.duplicar(receta.id)}>Duplicar</button>
                <button type="button" className="pc-boton-texto pc-texto-rojo" onClick={() => borrar(receta)}>Borrar</button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
