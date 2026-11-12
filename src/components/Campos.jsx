import { useState } from 'react';
import { num } from '../lib/calculo.js';

export function CampoNumero({ id, etiqueta, valor, onCambio, min = '0', ancho }) {
  return (
    <div className="pc-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step="any"
        min={min}
        value={valor ?? ''}
        style={ancho ? { width: ancho } : undefined}
        onChange={(e) => onCambio(e.target.value)}
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
