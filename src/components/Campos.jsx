import { useState } from 'react';
import { num } from '../lib/calculo.js';
import { leerNumero, mostrarNumero, limpiarEscritura } from '../lib/numeros.js';

// Campo para números escritos como en Argentina ("1.800", "1,5").
// Es de texto (no type="number") para que el navegador no cambie ni descarte lo que se escribe,
// pero abre el teclado numérico en el celular. Guarda el número en formato interno ("1800", "1.5").
export function EntradaNumero({ valor, onCambio, inputMode = 'decimal', invalido = false, describedBy, ...resto }) {
  const [texto, setTexto] = useState(null); // null: no se está escribiendo, se muestra con formato
  return (
    <input
      {...resto}
      type="text"
      inputMode={inputMode}
      autoComplete="off"
      value={texto ?? mostrarNumero(valor)}
      aria-invalid={invalido || undefined}
      aria-describedby={describedBy}
      onFocus={() => setTexto(mostrarNumero(valor))}
      onChange={(e) => {
        const escrito = limpiarEscritura(e.target.value);
        setTexto(escrito);
        onCambio(leerNumero(escrito));
      }}
      onBlur={() => setTexto(null)}
    />
  );
}

export function CampoNumero({ id, etiqueta, valor, onCambio, ancho, invalido, describedBy }) {
  return (
    <div className="pc-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <EntradaNumero
        id={id}
        valor={valor}
        onCambio={onCambio}
        invalido={invalido}
        describedBy={describedBy}
        style={ancho ? { width: ancho } : undefined}
      />
    </div>
  );
}

export const UNIDADES = [
  ['g', 'g'],
  ['kg', 'kg'],
  ['ml', 'ml'],
  ['l', 'l'],
  ['u', 'unid.'],
];

export function SelectorUnidad({ id, valor, onCambio }) {
  return (
    <div className="pc-campo">
      <label htmlFor={id}>Unidad</label>
      <select id={id} value={valor || 'g'} onChange={(e) => onCambio(e.target.value)}>
        {UNIDADES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </div>
  );
}

// Mini calculadora que ayuda a sacar un valor (gas por minuto, valor de la hora).
export function Ayudante({ id, titulo, descripcion, etiquetaA, etiquetaB, calcular, texto, aplicar }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [listo, setListo] = useState(false);
  const valor = calcular(num(a), num(b));
  const valido = valor > 0;
  return (
    <details className="pc-ayuda">
      <summary>{titulo}</summary>
      <div className="pc-ayuda-cuerpo">
        <p className="pc-chico">{descripcion}</p>
        <div className="pc-grilla2">
          <CampoNumero id={`${id}-a`} etiqueta={etiquetaA} valor={a} onCambio={(v) => { setA(v); setListo(false); }} />
          <CampoNumero id={`${id}-b`} etiqueta={etiquetaB} valor={b} onCambio={(v) => { setB(v); setListo(false); }} />
        </div>
        {(valido || listo) && (
          <p className="pc-impacto">{listo ? 'Listo: ya lo usamos en todas tus recetas.' : texto(valor)}</p>
        )}
        <button type="button" className="pc-boton-usar" disabled={!valido} onClick={() => { aplicar(valor); setListo(true); }}>
          Usar este valor
        </button>
      </div>
    </details>
  );
}
