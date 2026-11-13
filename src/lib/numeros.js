// Lectura y formato de números escritos como se escriben en Argentina.
// Solo convierte texto en número y número en texto: no toca ninguna fórmula.
//
// Reglas de lectura:
//   - La coma es decimal: "1,5" = 1.5
//   - El punto seguido de exactamente 3 cifras es separador de miles: "1.800" = 1800, "12.500" = 12500
//   - Un punto que no cumple eso es decimal: "2.5" = 2.5, "0.250" = 0.25
//   - Si aparecen los dos, el último es el decimal: "1.234,5" = 1234.5
//   - Varios puntos (o varias comas) son miles: "1.234.567" = 1234567
// Devuelve el número en formato interno ("1800", "2.5") o "" si no hay número.

export function leerNumero(texto) {
  const t = String(texto ?? '').replace(/[^\d.,]/g, '');
  if (!t) return '';
  const coma = t.lastIndexOf(',');
  const punto = t.lastIndexOf('.');
  let entero = t;
  let decimal = '';
  if (coma >= 0 && punto >= 0) {
    const i = Math.max(coma, punto);
    entero = t.slice(0, i).replace(/[.,]/g, '');
    decimal = t.slice(i + 1).replace(/[.,]/g, '');
  } else if (coma >= 0 || punto >= 0) {
    const separador = coma >= 0 ? ',' : '.';
    const partes = t.split(separador);
    if (partes.length > 2) {
      entero = partes.join('');
    } else {
      const [a, b] = partes;
      const esMiles = separador === '.' && b.length === 3 && a.length >= 1 && a.length <= 3 && a[0] !== '0';
      if (esMiles) entero = a + b;
      else { entero = a; decimal = b; }
    }
  }
  entero = entero.replace(/^0+(?=\d)/, '');
  if (!entero && !decimal) return '';
  return decimal ? `${entero || '0'}.${decimal}` : entero;
}

const FORMATO = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 6 });

// Muestra un número guardado ("1800", "2.5") como se lee en Argentina ("1.800", "2,5").
export function mostrarNumero(valor) {
  if (valor === undefined || valor === null || String(valor).trim() === '') return '';
  const x = parseFloat(String(valor).replace(',', '.'));
  return Number.isFinite(x) ? FORMATO.format(x) : String(valor);
}

// Deja solo lo que puede formar parte de un número, para que lo que se ve sea lo que se usa.
export function limpiarEscritura(texto) {
  return String(texto ?? '').replace(/[^\d.,]/g, '');
}
