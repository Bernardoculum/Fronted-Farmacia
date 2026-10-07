export interface MovimientoKardexItem {
  movimientoInventarioId: number;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRANSFERENCIA';
  cantidad: number;
  cantidadAnterior: number;
  cantidadNueva: number;
  referenciaTipo: string | null;
  referenciaId: number | null;
  observacion: string | null;
  fechaMovimiento: string;
  medicamento: string;
  codigoProducto: string;
  numeroLote: string;
  costoUnitario: number;
  totalValorizado: number;
  sucursal: string;
  sucursalId: number;
}

export interface AuditoriaEventoItem {
  auditoriaId: number;
  usuarioBd: string | null;
  tablaAfectada: string;
  registroId: number | null;
  operacion: string;
  modulo: string | null;
  ipCliente: string | null;
  host: string | null;
  fechaEvento: string;
  descripcion: string | null;
  clientIdentifier: string | null;
}

export interface FilterKardexParams {
  page?: number;
  limit?: number;
  productoId?: number;
  sucursalId?: number;
  tipoMovimiento?: string;
  referenciaTipo?: string;
  search?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface PaginatedKardexResponse {
  data: MovimientoKardexItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  kpis: {
    total: number;
    entradas: number;
    salidas: number;
    mermas: number;
  };
}

export interface PaginatedAuditoriaResponse {
  data: AuditoriaEventoItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AjusteInventarioDto {
  inventarioId: number;
  tipoAjuste: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  motivo: string;
}
