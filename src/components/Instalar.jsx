import { useEffect, useState } from 'react';

const CLAVE = 'porcion-instalar-oculto';

function esIOS() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function yaInstalada() {
  return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
}

// Tarjeta para instalar Porción como app. En Android/Chrome muestra un botón;
// en iPhone explica cómo agregarla a la pantalla de inicio.
export default function Instalar() {
  const [modo, setModo] = useState(null);

  useEffect(() => {
    if (yaInstalada()) return undefined;
    try {
      if (localStorage.getItem(CLAVE)) return undefined;
    } catch {
      // Sin acceso al almacenamiento: se muestra igual.
    }
    if (window.porcionInstalar) setModo('boton');
    else if (esIOS()) setModo('ios');
    const instalable = () => setModo('boton');
    const instalada = () => setModo(null);
    window.addEventListener('porcion-instalable', instalable);
    window.addEventListener('appinstalled', instalada);
    return () => {
      window.removeEventListener('porcion-instalable', instalable);
      window.removeEventListener('appinstalled', instalada);
    };
  }, []);

  if (!modo) return null;

  const instalar = async () => {
    const pedido = window.porcionInstalar;
    if (!pedido) return;
    pedido.prompt();
    await pedido.userChoice.catch(() => null);
    window.porcionInstalar = null;
    setModo(null);
  };

  const ocultar = () => {
    try { localStorage.setItem(CLAVE, '1'); } catch { /* nada */ }
    setModo(null);
  };

  return (
    <section className="pc-tarjeta pc-instalar" aria-labelledby="pc-instalar-titulo">
      <h3 id="pc-instalar-titulo">Tené Porción en tu celular</h3>
      {modo === 'boton' ? (
        <p className="pc-suave">Se instala como una app, con su ícono, y funciona aunque no tengas internet.</p>
      ) : (
        <p className="pc-suave">
          Tocá el botón <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba) y elegí <strong>Agregar a inicio</strong>. Queda como una app y funciona sin internet.
        </p>
      )}
      <div className="pc-acciones">
        {modo === 'boton' && <button type="button" className="pc-boton-usar" onClick={instalar}>Instalar</button>}
        <button type="button" className="pc-boton-texto" onClick={ocultar}>{modo === 'boton' ? 'Ahora no' : 'Entendido'}</button>
      </div>
    </section>
  );
}
