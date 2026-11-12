import { useRef, useState } from 'react';
import { aCopia, desdeCopia, TAMANO_MAXIMO_COPIA } from '../lib/almacen.js';

export default function CopiaSeguridad({ estado, acciones }) {
  const archivoRef = useRef(null);
  const [mensaje, setMensaje] = useState('');

  const descargar = () => {
    const blob = new Blob([aCopia(estado)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `porcion-copia-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMensaje('Copia descargada. Guardala en un lugar seguro, por ejemplo en tu Google Drive.');
  };

  const recuperar = async (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    if (archivo.size > TAMANO_MAXIMO_COPIA) {
      setMensaje('El archivo es demasiado grande para ser una copia de Porción.');
      return;
    }
    try {
      const datos = desdeCopia(await archivo.text());
      const pregunta = `La copia tiene ${datos.recetas.length} recetas y ${datos.insumos.length} insumos. Va a reemplazar todo lo que tenés ahora. ¿Seguís?`;
      if (window.confirm(pregunta)) {
        acciones.reemplazarEstado(datos);
        setMensaje('Listo: recuperaste tu copia.');
      }
    } catch (error) {
      setMensaje(error.message);
    }
  };

  return (
    <section className="pc-seccion pc-copia">
      <h3>Tus datos</h3>
      <p className="pc-suave">Todo se guarda en este dispositivo. Si cambiás de celular o borrás el navegador, se pierde. Descargá una copia de vez en cuando.</p>
      <div className="pc-acciones-columna">
        <button type="button" className="pc-boton-secundario" onClick={descargar}>Descargar copia de seguridad</button>
        <button type="button" className="pc-boton-texto" onClick={() => archivoRef.current?.click()}>Recuperar una copia</button>
        <input ref={archivoRef} type="file" accept="application/json,.json" className="solo-lectores" tabIndex={-1} aria-hidden="true" onChange={recuperar} />
      </div>
      {mensaje && <p className="pc-chico" role="status">{mensaje}</p>}
    </section>
  );
}
