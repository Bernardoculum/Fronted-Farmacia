import { Pipe, PipeTransform } from '@angular/core';

export const ENUM_LABELS: Record<string, string> = {
  // Estados de Transferencias y Pedidos
  SOLICITADA: 'Solicitada',
  AUTORIZADA: 'Autorizada',
  EN_TRANSITO: 'En Tránsito',
  RECIBIDA: 'Recibida',
  CANCELADA: 'Cancelada',
  PENDIENTE: 'Pendiente',
  COMPLETADO: 'Completado',
  ENTREGADO: 'Entregado',
  EN_PREPARACION: 'En Preparación',

  // Tipos de Sucursal
  BODEGA_CENTRAL: 'Bodega Central',
  FARMACIA: 'Farmacia',
  STAND: 'Stand',

  // Roles de Usuario
  SUPER_ADMIN: 'Administrador',
  GERENTE_SUCURSAL: 'Gerente de Sucursal',
  FARMACEUTICO: 'Farmacéutico',
  CAJERO: 'Cajero',
  BODEGUERO: 'Bodeguero',
  CALL_CENTER: 'Call Center',
  AUDITOR: 'Auditor',

  // Estados de Entidades
  ACTIVO: 'Activo',
  ACTIVA: 'Activa',
  INACTIVO: 'Inactivo',
  INACTIVA: 'Inactiva',

  // Estados de Vencimiento y Lotes
  VIGENTE: 'Vigente',
  POR_VENCER: 'Por Vencer',
  VENCIDO: 'Vencido',

  // Tipos de Movimiento de Kardex
  ENTRADA: 'Entrada',
  SALIDA: 'Salida',
  AJUSTE: 'Ajuste',
  TRASLADO: 'Traslado',

  // Tipos de Referencia / Operaciones de Kardex & Inventario
  RECEPCION_FACTURA_COMPRA: 'Recepción de Compra',
  FACTURA_COMPRA: 'Factura de Compra',
  COMPRA: 'Compra',
  VENTA_POS: 'Venta en Caja (POS)',
  VENTA_CALL_CENTER: 'Venta Call Center',
  VENTA_WEB: 'Pedido en Línea',
  AJUSTE_INVENTARIO: 'Ajuste de Inventario',
  AJUSTE_MANUAL: 'Ajuste Manual',
  TRASLADO_SUCURSAL: 'Traslado de Sucursal',
  RECEPCION_TRASLADO: 'Recepción de Traslado',
  DESPACHO_TRASLADO: 'Despacho de Traslado',
  MERMA: 'Baja / Merma',
  MERMA_CADUCIDAD: 'Merma por Caducidad',
  INICIAL: 'Inventario Inicial',
  APERTURA_INVENTARIO: 'Apertura de Inventario',
};

/**
 * Convierte cualquier enum técnico en MAYÚSCULAS o con guiones bajos (ej. RECEPCION_FACTURA_COMPRA)
 * en un texto amigable y formateado en lenguaje natural (ej. Recepción de Compra).
 */
@Pipe({
  name: 'formatEnum',
  standalone: true,
})
export class FormatEnumPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const valUpper = String(value).trim().toUpperCase();

    // 1. Mapeo en diccionario directo
    if (ENUM_LABELS[valUpper]) {
      return ENUM_LABELS[valUpper];
    }

    // 2. Fallback general a Title Case
    return valUpper
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

/**
 * Helper unificado para clases de badges suaves/pastel según norma de diseño
 */
export function getBadgeColorClass(estadoOrEnum: string | null | undefined): string {
  if (!estadoOrEnum) return 'bg-slate-100 text-slate-700 border-slate-200';
  const val = String(estadoOrEnum).trim().toUpperCase();

  switch (val) {
    // Verde suave: Completado / Recibido / Activo / Vigente / Entrada
    case 'RECIBIDA':
    case 'COMPLETADO':
    case 'ENTREGADO':
    case 'ACTIVO':
    case 'ACTIVA':
    case 'VIGENTE':
    case 'ENTRADA':
    case 'RECEPCION_FACTURA_COMPRA':
    case 'COMPRA':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';

    // Azul suave: Solicitado / Pendiente / Autorizada / Salida POS
    case 'SOLICITADA':
    case 'AUTORIZADA':
    case 'PENDIENTE':
    case 'VENTA_POS':
    case 'VENTA_CALL_CENTER':
      return 'bg-sky-50 text-sky-700 border-sky-200';

    // Ámbar suave: En Tránsito / En Proceso / Por Vencer / Traslado
    case 'EN_TRANSITO':
    case 'EN_PREPARACION':
    case 'POR_VENCER':
    case 'TRASLADO_SUCURSAL':
    case 'AJUSTE':
    case 'AJUSTE_INVENTARIO':
      return 'bg-amber-50 text-amber-700 border-amber-200';

    // Rojo suave: Cancelado / Inactivo / Vencido / Merma
    case 'CANCELADA':
    case 'INACTIVO':
    case 'INACTIVA':
    case 'VENCIDO':
    case 'MERMA':
    case 'MERMA_CADUCIDAD':
      return 'bg-rose-50 text-rose-700 border-rose-200';

    // Gris neutro: Tipos de sucursal y estados informativos
    case 'BODEGA_CENTRAL':
    case 'FARMACIA':
    case 'STAND':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
