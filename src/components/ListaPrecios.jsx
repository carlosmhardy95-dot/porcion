import { useEffect, useRef, useState } from 'react';
import { calcularReceta, dinero } from '../lib/calculo.js';
import { dibujarLista, etiquetaTanda, itemsDeLista, textoWhatsApp } from '../lib/listaPrecios.js';

function aBlob(canvas) {
  return new Promise((resolver) => canvas.toBlob(resolver, 'image/png'));
}

export default function ListaPrecios({ estado, insumosPorId, acciones }) {
  const canvasRef = useRef(null);
  const [aviso, setAviso] = useState('');
  const [puedeCompartir, setPuedeCompartir] = useState(false);
  const { lista } = estado;
  const items = itemsDeLista(estado, insumosPorId);
  const texto = textoWhatsApp(lista, items);
  const elegidos = new Map(lista.items.map((i) => [i.recetaId, i]));

  useEffect(() => {
    if (canvasRef.current) dibujarLista(canvasRef.current, lista, items);
  });

  useEffect(() => {
    try {
      const prueba = new File([''], 'prueba.png', { type: 'image/png' });
      setPuedeCompartir(!!navigator.canShare && navigator.canShare({ files: [prueba] }));
    } catch {
      setPuedeCompartir(false);
    }
  }, []);

  const avisar = (mensaje) => {
    setAviso(mensaje);
    setTimeout(() => setAviso(''), 3000);
  };

  const alternar = (recetaId, rinde) => {
    const nuevos = elegidos.has(recetaId)
      ? lista.items.filter((i) => i.recetaId !== recetaId)
      : [...lista.items, { recetaId, modo: rinde > 1 ? 'tanda' : 'unidad' }];
    acciones.cambiarLista('items', nuevos);
  };

  const cambiarModo = (recetaId, modo) => {
    acciones.cambiarLista('items', lista.items.map((i) => (i.recetaId === recetaId ? { ...i, modo } : i)));
  };

  const descargar = async () => {
    const blob = await aBlob(canvasRef.current);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'lista-de-precios.png';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    avisar('Imagen descargada.');
  };

  const compartir = async () => {
    const blob = await aBlob(canvasRef.current);
    if (!blob) return;
    try {
      await navigator.share({ files: [new File([blob], 'lista-de-precios.png', { type: 'image/png' })], title: lista.titulo });
    } catch {
      // La persona canceló o el navegador no pudo compartir.
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      avisar('Texto copiado. Pegalo en WhatsApp.');
    } catch {
      avisar('No se pudo copiar. Mantené apretado el texto para copiarlo.');
    }
  };

  return (
    <div className="pc-lista-precios">
      <section className="pc-seccion">
        <h2>Lista de precios</h2>
        <p className="pc-suave">Elegí qué productos mostrar. Se arma una imagen para historias y un texto para WhatsApp con los precios de tus recetas.</p>
        {estado.recetas.length === 0 && <p className="pc-tarjeta pc-vacio">Primero creá una receta en "Mis recetas".</p>}
      </section>

      {estado.recetas.length > 0 && (
        <>
          <section className="pc-seccion">
            <div className="pc-campo">
              <label htmlFor="pl-negocio">Nombre de tu emprendimiento</label>
              <input id="pl-negocio" type="text" className="pc-texto" autoComplete="off" value={lista.negocio} onChange={(e) => acciones.cambiarLista('negocio', e.target.value)} />
            </div>
            <div className="pc-campo">
              <label htmlFor="pl-titulo">Título</label>
              <input id="pl-titulo" type="text" className="pc-texto" autoComplete="off" value={lista.titulo} onChange={(e) => acciones.cambiarLista('titulo', e.target.value)} />
            </div>
            <div className="pc-campo">
              <label htmlFor="pl-contacto">Cómo te hacen pedidos</label>
              <input id="pl-contacto" type="text" className="pc-texto" autoComplete="off" placeholder="Por ejemplo: pedidos por WhatsApp" value={lista.contacto} onChange={(e) => acciones.cambiarLista('contacto', e.target.value)} />
            </div>
          </section>

          <section className="pc-seccion">
            <h3>Productos</h3>
            {estado.recetas.map((receta) => {
              const r = calcularReceta(receta, insumosPorId, estado.negocio);
              const item = elegidos.get(receta.id);
              const id = `pl-${receta.id}`;
              return (
                <div key={receta.id} className="pc-tarjeta pc-producto">
                  <div className="pc-producto-fila">
                    <input id={id} type="checkbox" className="pc-check" checked={!!item} onChange={() => alternar(receta.id, r.R)} />
                    <label htmlFor={id} className="pc-producto-nombre">{receta.nombre || 'Sin nombre'}</label>
                    <span className="pc-mono">{r.invalido ? '—' : dinero(r.precio)}</span>
                  </div>
                  {item && r.R > 1 && (
                    <div className="pc-campo">
                      <label htmlFor={`${id}-modo`}>Mostrar precio</label>
                      <select id={`${id}-modo`} value={item.modo} onChange={(e) => cambiarModo(receta.id, e.target.value)}>
                        <option value="unidad">Por unidad</option>
                        <option value="tanda">{etiquetaTanda(r.R)}</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          <section className="pc-seccion">
            <h3>Estilo y precios</h3>
            <div className="pc-pastillas" role="group" aria-label="Estilo de la imagen">
              <button type="button" className="pc-pastilla" aria-pressed={lista.tema === 'papel'} onClick={() => acciones.cambiarLista('tema', 'papel')}>Clara</button>
              <button type="button" className="pc-pastilla" aria-pressed={lista.tema === 'tinta'} onClick={() => acciones.cambiarLista('tema', 'tinta')}>Oscura</button>
            </div>
            <div className="pc-pastillas" role="group" aria-label="Qué precio mostrar">
              <button type="button" className="pc-pastilla" aria-pressed={lista.precio === 'sugerido'} onClick={() => acciones.cambiarLista('precio', 'sugerido')}>Precio sugerido</button>
              <button type="button" className="pc-pastilla" aria-pressed={lista.precio === 'actual'} onClick={() => acciones.cambiarLista('precio', 'actual')}>Mi precio de hoy</button>
            </div>
            {lista.precio === 'actual' && <p className="pc-chico">Usa el valor de "Tu precio de hoy" de cada receta. Si no lo cargaste, muestra el sugerido.</p>}
          </section>

          <section className="pc-seccion">
            <h3>Vista previa</h3>
            <canvas ref={canvasRef} className="pc-lienzo" role="img" aria-label="Vista previa de la lista de precios" />
            <div className="pc-acciones-columna">
              <button type="button" className="pc-boton" onClick={descargar} disabled={items.length === 0}>Descargar imagen</button>
              {puedeCompartir && (
                <button type="button" className="pc-boton-secundario" onClick={compartir} disabled={items.length === 0}>Compartir imagen</button>
              )}
            </div>
          </section>

          <section className="pc-seccion">
            <h3>Texto para WhatsApp</h3>
            <pre className="pc-texto-whatsapp">{texto}</pre>
            <div className="pc-acciones-columna">
              <button type="button" className="pc-boton-secundario" onClick={copiar} disabled={items.length === 0}>Copiar texto</button>
              <a className={`pc-boton-secundario pc-enlace-boton${items.length === 0 ? ' pc-deshabilitado' : ''}`} href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer" aria-disabled={items.length === 0}>
                Abrir en WhatsApp
              </a>
            </div>
          </section>
        </>
      )}

      {aviso && <p className="pc-aviso-flotante" role="status">{aviso}</p>}
    </div>
  );
}
