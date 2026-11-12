import { useState } from 'react';
import { calcularReceta, diasDesde, dinero, dinero1, cantidad, num, DIAS_PRECIO_VIEJO } from '../lib/calculo.js';
import { CampoNumero, SelectorUnidad, Ayudante } from './Campos.jsx';

function IconoCruz() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12" /><path d="M18 6L6 18" />
    </svg>
  );
}

export default function EditorReceta({ receta, estado, insumosPorId, usosPorInsumo, acciones, irA }) {
  const [eligiendo, setEligiendo] = useState(false);
  const negocio = estado.negocio;
  const r = calcularReceta(receta, insumosPorId, negocio);
  const costoPorLinea = Object.fromEntries(r.lineas.map((l) => [l.id, l.costo]));
  const enReceta = new Set(receta.lines.map((l) => l.insumoId));
  const disponibles = estado.insumos.filter((i) => !enReceta.has(i.id) && i.name.trim() !== '');
  const porUnidad = (total) => (r.R === 1 ? ' por unidad.' : ` por tanda (${dinero(total / r.R)} por unidad).`);

  const agregarNuevo = () => {
    const id = acciones.agregarNuevo();
    setEligiendo(false);
    setTimeout(() => document.getElementById(`nom-${id}`)?.focus(), 0);
  };

  return (
    <div className="pc-editor">
      <section className="pc-seccion pc-seccion-producto">
        <div className="pc-campo">
          <label htmlFor="pc-nombre">Producto</label>
          <input
            id="pc-nombre"
            className="pc-nombre"
            type="text"
            placeholder="Nombre del producto"
            autoComplete="off"
            value={receta.nombre}
            onChange={(e) => acciones.cambiarReceta('nombre', e.target.value)}
          />
        </div>
        <div className="pc-rinde">
          <label htmlFor="pc-rinde">Rinde</label>
          <input id="pc-rinde" type="number" inputMode="decimal" step="any" min="1" value={receta.rinde} onChange={(e) => acciones.cambiarReceta('rinde', e.target.value)} />
          <span>unidades por tanda</span>
        </div>
      </section>

      <section className="pc-seccion">
        <h2>Ingredientes</h2>
        {receta.lines.length === 0 && <p className="pc-suave">Todavía no agregaste ingredientes.</p>}
        {receta.lines.map((linea) => {
          const insumo = insumosPorId[linea.insumoId];
          if (!insumo) return null;
          const usos = usosPorInsumo[insumo.id] ?? 0;
          const dias = diasDesde(insumo.actualizado);
          return (
            <div className="pc-tarjeta" key={linea.id}>
              <div className="pc-fila-ingrediente">
                <label htmlFor={`nom-${insumo.id}`} className="solo-lectores">Ingrediente</label>
                <input
                  id={`nom-${insumo.id}`}
                  className="pc-nombre-ingrediente"
                  type="text"
                  placeholder="Ingrediente"
                  autoComplete="off"
                  value={insumo.name}
                  onChange={(e) => acciones.cambiarInsumo(insumo.id, 'name', e.target.value)}
                />
                <span className="pc-costo">{dinero(costoPorLinea[linea.id] ?? 0)}</span>
                <button type="button" className="pc-quitar" aria-label={`Quitar ${insumo.name || 'ingrediente'} de esta receta`} onClick={() => acciones.quitarLinea(linea.id)}>
                  <IconoCruz />
                </button>
              </div>
              <div className="pc-grilla4">
                <CampoNumero id={`env-${linea.id}`} etiqueta="Envase" valor={insumo.pack} onCambio={(v) => acciones.cambiarInsumo(insumo.id, 'pack', v)} />
                <SelectorUnidad id={`uni-${linea.id}`} valor={insumo.unit} onCambio={(v) => acciones.cambiarInsumo(insumo.id, 'unit', v)} />
                <CampoNumero id={`pre-${linea.id}`} etiqueta="Precio $" valor={insumo.price} onCambio={(v) => acciones.cambiarInsumo(insumo.id, 'price', v)} />
                <CampoNumero id={`usa-${linea.id}`} etiqueta="Usás" valor={linea.used} onCambio={(v) => acciones.cambiarUso(linea.id, v)} />
              </div>
              {(usos > 1 || dias > DIAS_PRECIO_VIEJO) && (
                <p className="pc-chico">
                  {dias > DIAS_PRECIO_VIEJO && <span className="pc-etiqueta-vieja">Precio de hace {dias} días</span>}
                  {usos > 1 && ` Este insumo está en ${usos} recetas: si cambiás su precio, se actualizan todas.`}
                </p>
              )}
            </div>
          );
        })}

        {!eligiendo && (
          <button type="button" className="pc-agregar" onClick={() => (disponibles.length ? setEligiendo(true) : agregarNuevo())}>
            + Agregar ingrediente
          </button>
        )}
        {eligiendo && (
          <div className="pc-tarjeta pc-elegir">
            <p className="pc-negrita">Elegí de tu despensa</p>
            <div className="pc-pastillas">
              {disponibles.map((i) => (
                <button key={i.id} type="button" className="pc-pastilla" onClick={() => { acciones.agregarExistente(i.id); setEligiendo(false); }}>
                  {i.name}
                </button>
              ))}
            </div>
            <div className="pc-acciones">
              <button type="button" className="pc-boton-usar" onClick={agregarNuevo}>Ingrediente nuevo</button>
              <button type="button" className="pc-boton-texto" onClick={() => setEligiendo(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </section>

      <section className="pc-seccion">
        <h2>Lo que también pagás</h2>
        <p className="pc-suave">Tres preguntas rápidas. Debajo de cada una ves cuánto suma.</p>

        <div className="pc-pregunta">
          <label htmlFor="pc-horno">¿Cuántos minutos de horno o plancha lleva la tanda?</label>
          <div className="pc-fila-pregunta">
            <input id="pc-horno" type="number" inputMode="decimal" step="any" min="0" value={receta.horno} onChange={(e) => acciones.cambiarReceta('horno', e.target.value)} />
            <span>minutos</span>
          </div>
          <p className="pc-impacto">{cantidad(receta.horno)} min × {dinero1(num(negocio.costoMin))} por minuto = {dinero(r.G)}{porUnidad(r.G)}</p>
          <Ayudante
            id="gas"
            titulo="¿Cómo saco el gas por minuto?"
            descripcion="Con garrafa: dividí su precio por los minutos que te dura con el horno o la plancha prendidos. Con gas natural o eléctrico, usá esta cuenta como referencia aproximada."
            etiquetaA="Precio de la garrafa ($)"
            etiquetaB="Horas que te dura prendida"
            calcular={(precio, horas) => (horas > 0 ? precio / (horas * 60) : 0)}
            texto={(v) => `Te sale ${dinero1(v)} por minuto.`}
            aplicar={(v) => acciones.cambiarNegocio('costoMin', String(Math.round(v * 10) / 10))}
          />
        </div>

        <div className="pc-pregunta">
          <label htmlFor="pc-minutos">¿Cuántos minutos te lleva hacer la tanda?</label>
          <p className="pc-chico">Contá preparar, cocinar, armar y limpiar.</p>
          <div className="pc-fila-pregunta">
            <input id="pc-minutos" type="number" inputMode="decimal" step="any" min="0" value={receta.minutos} onChange={(e) => acciones.cambiarReceta('minutos', e.target.value)} />
            <span>minutos</span>
          </div>
          <p className="pc-impacto">{cantidad(receta.minutos)} min a {dinero(num(negocio.valorHora))} la hora = {dinero(r.L)}{porUnidad(r.L)}</p>
          <Ayudante
            id="hora"
            titulo="¿Cómo saco el valor de mi hora?"
            descripcion="Dividí lo que querés ganar por mes por las horas que trabajás en el mes."
            etiquetaA="Lo que querés ganar por mes ($)"
            etiquetaB="Horas que trabajás por mes"
            calcular={(sueldo, horas) => (horas > 0 ? sueldo / horas : 0)}
            texto={(v) => `Tu hora vale ${dinero(v)}.`}
            aplicar={(v) => acciones.cambiarNegocio('valorHora', String(Math.round(v)))}
          />
        </div>

        <div className="pc-pregunta">
          <label htmlFor="pc-caja">¿Cuánto gastás en caja, bolsa o envío por unidad?</label>
          <div className="pc-fila-pregunta">
            <span>$</span>
            <input id="pc-caja" type="number" inputMode="decimal" step="any" min="0" value={receta.packaging} onChange={(e) => acciones.cambiarReceta('packaging', e.target.value)} />
          </div>
        </div>

        <details className="pc-ajustes">
          <summary>Ajustes de tu negocio</summary>
          <div className="pc-ajustes-cuerpo">
            <p className="pc-chico">Se usan en todas tus recetas. Los valores que vienen cargados son ejemplos: cambialos por los tuyos.</p>
            <div className="pc-grilla2">
              <CampoNumero id="pc-valor-hora" etiqueta="Valor de tu hora ($)" valor={negocio.valorHora} onCambio={(v) => acciones.cambiarNegocio('valorHora', v)} />
              <CampoNumero id="pc-costo-min" etiqueta="Gas y luz por minuto ($)" valor={negocio.costoMin} onCambio={(v) => acciones.cambiarNegocio('costoMin', v)} />
              <CampoNumero id="pc-fijos" etiqueta="Gastos fijos del mes ($)" valor={negocio.fijosMes} onCambio={(v) => acciones.cambiarNegocio('fijosMes', v)} />
              <CampoNumero id="pc-unidades" etiqueta="Unidades que vendés por mes" valor={negocio.unidadesMes} min="1" onCambio={(v) => acciones.cambiarNegocio('unidadesMes', v)} />
            </div>
            <p className="pc-chico">Gastos fijos: alquiler, servicios, internet y sueldos que pagás igual todos los meses.</p>
            <p className="pc-impacto">{dinero(num(negocio.fijosMes))} ÷ {cantidad(Math.max(1, num(negocio.unidadesMes)))} unidades = {dinero(r.fx)} por unidad.</p>
          </div>
        </details>
      </section>

      <section className="pc-seccion">
        <h2>Tu ganancia</h2>
        <div className="pc-grilla2">
          <CampoNumero id="pc-ganancia" etiqueta="Ganancia que querés (%)" valor={receta.ganancia} onCambio={(v) => acciones.cambiarReceta('ganancia', v)} />
          <CampoNumero id="pc-impuestos" etiqueta="Impuestos y comisiones (%)" valor={receta.impuestos} onCambio={(v) => acciones.cambiarReceta('impuestos', v)} />
        </div>
        <p className="pc-chico">Si vendés por una app de delivery, sumá su comisión en impuestos y comisiones.</p>
      </section>

      <section className="pc-seccion pc-seccion-resultado" aria-labelledby="pc-resultado-titulo">
        <h2 id="pc-resultado-titulo">Resultado</h2>
        <div className="pc-ticket" role="region" aria-label="Resultado de la receta" aria-live="polite">
          <div className="pc-precio">
            <div className="pc-precio-cabecera">
              <span>Precio de venta sugerido</span>
              <span>{r.R > 1 ? `Tanda de ${cantidad(r.R)} u.` : '1 unidad'}</span>
            </div>
            <span className="pc-grande">{r.invalido ? '—' : dinero(r.precio)}</span>
            <span className="pc-chico-tinta">
              por unidad{!r.invalido && r.R > 1 ? ` · la tanda: ${dinero(r.precio * r.R)}` : ''}
            </span>
          </div>
          <dl className="pc-cifras">
            <div className="pc-cifra">
              <dt>Costo por unidad</dt>
              <dd className="pc-numero">{dinero(r.C)}</dd>
            </div>
            <div className="pc-cifra">
              <dt>Costo total de producción</dt>
              <dd className="pc-numero">{dinero(r.C * r.R)}</dd>
            </div>
            <div className="pc-cifra">
              <dt>Ganancia real por unidad</dt>
              <dd className={`pc-numero ${!r.invalido && r.ganancia >= 0 ? 'pc-verde' : ''}`}>{r.invalido ? '—' : dinero(r.ganancia)}</dd>
            </div>
            <div className="pc-cifra">
              <dt>Margen de ganancia</dt>
              <dd className="pc-numero">{r.invalido || r.precio <= 0 ? '—' : `${(Math.round((r.ganancia / r.precio) * 1000) / 10).toLocaleString('es-AR')} %`}</dd>
            </div>
          </dl>
          {r.invalido && <p className="pc-mensaje pc-mal">La ganancia más los impuestos tienen que sumar menos de 95 %.</p>}
          <div className="pc-desglose">
            <p className="pc-desglose-titulo">Qué pesa más en tu costo</p>
            {r.partes.map((p, i) => (
              <div key={p.clave} className="pc-parte">
                <div className="pc-parte-fila"><span>{p.etiqueta}</span><span className="pc-mono">{dinero(p.valor)} · {Math.round(p.porcentaje)} %</span></div>
                <div className={i === 0 ? 'pc-barra pc-barra-primera' : 'pc-barra'}>
                  <div style={{ width: `${Math.max(2, p.porcentaje).toFixed(1)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pc-seccion">
        <h2>Compará</h2>
        <div className="pc-grilla2">
          <CampoNumero id="pc-actual" etiqueta="Tu precio de hoy ($)" valor={receta.actual} onCambio={(v) => acciones.cambiarReceta('actual', v)} />
          <CampoNumero id="pc-competencia" etiqueta="Precio de tu competencia ($)" valor={receta.competencia} onCambio={(v) => acciones.cambiarReceta('competencia', v)} />
        </div>
        {r.gananciaActual !== null && (
          <p className={`pc-mensaje ${r.gananciaActual < 0 ? 'pc-mal' : 'pc-bien'}`}>
            {r.gananciaActual < 0
              ? `Con ${dinero(r.actual)} perdés ${dinero(-r.gananciaActual)} por unidad.`
              : `Con ${dinero(r.actual)} ganás ${dinero(r.gananciaActual)} por unidad.`}
          </p>
        )}
        {r.competencia > 0 && !r.invalido && (
          <p className="pc-mensaje pc-neutro">
            {r.precio > r.competencia && `Tu competencia cobra ${dinero(r.precio - r.competencia)} menos que tu precio sugerido.`}
            {r.precio < r.competencia && `Tu competencia cobra ${dinero(r.competencia - r.precio)} más que tu precio sugerido.`}
            {r.precio === r.competencia && 'Tu precio sugerido es igual al de tu competencia.'}
          </p>
        )}
      </section>

      <section className="pc-seccion">
        <button type="button" className="pc-boton-secundario" onClick={() => irA('recetas')}>Ver mis recetas</button>
      </section>
    </div>
  );
}
