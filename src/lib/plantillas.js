// Recetas de ejemplo. Los precios son inventados y se muestran como ejemplo.
import { nuevoId, normalizar } from './almacen.js';

export const PLANTILLAS = {
  alfajores: {
    etiqueta: 'Alfajores',
    receta: { nombre: 'Alfajores de maicena', rinde: '12', paquete: '12', cajaPaquete: '0', horno: '25', minutos: '90', packaging: '150', ganancia: '30', impuestos: '5', actual: '10800', competencia: '24000' },
    ingredientes: [
      ['Maicena', '500', 'g', '1800', '150'],
      ['Harina 0000', '1000', 'g', '1200', '100'],
      ['Manteca', '200', 'g', '3000', '100'],
      ['Azúcar', '1000', 'g', '1500', '80'],
      ['Huevos', '12', 'u', '3600', '2'],
      ['Dulce de leche', '1000', 'g', '5000', '400'],
      ['Coco rallado', '100', 'g', '1500', '30'],
    ],
  },
  pizza: {
    etiqueta: 'Pizza',
    receta: { nombre: 'Pizza muzzarella grande', rinde: '1', horno: '10', minutos: '15', packaging: '900', ganancia: '30', impuestos: '20', actual: '9000', competencia: '12000' },
    ingredientes: [
      ['Harina 0000', '1000', 'g', '1200', '300'],
      ['Levadura fresca', '50', 'g', '800', '10'],
      ['Aceite de oliva', '500', 'ml', '9000', '20'],
      ['Salsa de tomate', '1000', 'g', '3500', '150'],
      ['Muzzarella', '1000', 'g', '9000', '250'],
      ['Albahaca (atado)', '1', 'u', '1000', '0.25'],
    ],
  },
  torta: {
    etiqueta: 'Torta',
    receta: { nombre: 'Torta de chocolate con dulce de leche', rinde: '1', horno: '45', minutos: '150', packaging: '2500', ganancia: '30', impuestos: '5', actual: '', competencia: '' },
    ingredientes: [
      ['Harina 0000', '1000', 'g', '1200', '250'],
      ['Azúcar', '1000', 'g', '1500', '250'],
      ['Huevos', '12', 'u', '3600', '4'],
      ['Manteca', '200', 'g', '3000', '150'],
      ['Cacao amargo', '200', 'g', '4500', '60'],
      ['Leche', '1000', 'ml', '1500', '250'],
      ['Polvo de hornear', '50', 'g', '900', '10'],
      ['Dulce de leche', '1000', 'g', '5000', '600'],
      ['Chocolate cobertura', '1000', 'g', '12000', '200'],
      ['Crema de leche', '350', 'ml', '3500', '350'],
    ],
  },
  vianda: {
    etiqueta: 'Vianda',
    receta: { nombre: 'Vianda de milanesa con puré', rinde: '10', horno: '40', minutos: '120', packaging: '350', ganancia: '30', impuestos: '5', actual: '', competencia: '' },
    ingredientes: [
      ['Carne para milanesa', '1000', 'g', '14000', '1500'],
      ['Pan rallado', '1000', 'g', '3000', '300'],
      ['Huevos', '12', 'u', '3600', '4'],
      ['Papa (sin pelar)', '1000', 'g', '1500', '2500'],
      ['Manteca', '200', 'g', '3000', '100'],
      ['Leche', '1000', 'ml', '1500', '300'],
      ['Aceite de girasol', '1500', 'ml', '5000', '300'],
    ],
  },
  lomito: {
    etiqueta: 'Lomito',
    receta: { nombre: 'Lomito completo', rinde: '1', horno: '8', minutos: '12', packaging: '700', ganancia: '30', impuestos: '20', actual: '10000', competencia: '13000' },
    ingredientes: [
      ['Pan de lomo', '6', 'u', '3000', '1'],
      ['Lomo', '1000', 'g', '16000', '180'],
      ['Jamón cocido', '1000', 'g', '12000', '40'],
      ['Queso', '1000', 'g', '10000', '40'],
      ['Huevos', '12', 'u', '3600', '1'],
      ['Lechuga y tomate', '1000', 'g', '3000', '80'],
      ['Mayonesa', '1000', 'g', '4000', '30'],
    ],
  },
};

export function recetaVacia() {
  return {
    id: nuevoId('rec'),
    nombre: '',
    rinde: '1',
    paquete: '1',
    cajaPaquete: '0',
    horno: '0',
    minutos: '0',
    packaging: '0',
    ganancia: '30',
    impuestos: '0',
    actual: '',
    competencia: '',
    lines: [],
    actualizada: new Date().toISOString(),
  };
}

// Crea una receta desde una plantilla. Si un ingrediente ya existe en la despensa
// (mismo nombre), lo reutiliza sin pisar su precio.
export function crearDesdePlantilla(clave, estado) {
  const plantilla = Object.hasOwn(PLANTILLAS, clave) ? PLANTILLAS[clave] : null;
  if (!plantilla) return { estado, recetaId: null };
  const ahora = new Date().toISOString();
  const insumos = [...estado.insumos];
  const lines = plantilla.ingredientes.map(([nombre, pack, unit, price, used]) => {
    let insumo = insumos.find((i) => normalizar(i.name) === normalizar(nombre));
    if (!insumo) {
      insumo = { id: nuevoId('ins'), name: nombre, pack, unit, price, actualizado: ahora };
      insumos.push(insumo);
    }
    return { id: nuevoId('lin'), insumoId: insumo.id, used };
  });
  const receta = { ...recetaVacia(), ...plantilla.receta, lines };
  return {
    estado: { ...estado, insumos, recetas: [...estado.recetas, receta], recetaActiva: receta.id },
    recetaId: receta.id,
  };
}
