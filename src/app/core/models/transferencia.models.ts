export interface TransferenciaDetalleItem {
  transferenciaDetalleId: number;
  loteId: number;
  numeroLote: string;
  fechaVencimiento: string;
  medicamento: string;
  codigoProducto?: string;
  concentracion?: string;
  presentacion?: string;
  costoUnitario?: number;
  cantidadSolicitada: number;
  cantidadEnviada: number;
  cantidadRecibida: number;
  cantidadMerma?: number;
}

export interface TransferenciaItem {
  transferenciaId: number;
  estado: 'SOLICITADA' | 'AUTORIZADA' | 'EN_TRANSITO' | 'RECIBIDA' | 'CANCELADA';
  fechaSolicitud: string;
  fechaEnvio?: string | null;
  fechaRecepcion?: string | null;
  observacion?: string | null;
  sucursalOrigen: {
    sucursalId: number;
    nombre: string;
    tipoSucursal: string;
    direccion?: string;
  };
  sucursalDestino: {
    sucursalId: number;
    nombre: string;
    tipoSucursal: string;
    direccion?: string;
  };
  resumen?: {
    totalMedicamentos: number;
    totalUnidadesSolicitadas: number;
    totalUnidadesEnviadas: number;
    totalUnidadesRecibidas: number;
    totalUnidadesMerma?: number;
  };
  detalles: TransferenciaDetalleItem[];
}

export interface TransferenciaKpis {
  total: number;
  solicitadas: number;
  enTransito: number;
  recibidas: number;
  canceladas: number;
}

export interface PaginatedTransferenciasResponse {
  data: TransferenciaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  kpis: TransferenciaKpis;
}

export interface CreateTransferenciaDetalleItemDto {
  loteId: number;
  cantidadSolicitada: number;
  // Campos de apoyo UI
  numeroLote?: string;
  medicamento?: string;
  stockDisponible?: number;
}

export interface CreateTransferenciaDto {
  sucursalOrigenId: number;
  sucursalDestinoId: number;
  observacion?: string;
  detalles: {
    loteId: number;
    cantidadSolicitada: number;
  }[];
}

export interface DespacharTransferenciaDto {
  items?: {
    transferenciaDetalleId: number;
    cantidadEnviada: number;
  }[];
}

export interface RecibirTransferenciaDto {
  items?: {
    transferenciaDetalleId: number;
    cantidadRecibida: number;
    motivoMerma?: string;
  }[];
  observacionRecepcion?: string;
}

export interface FilterTransferenciaParams {
  search?: string;
  sucursalOrigenId?: number;
  sucursalDestinoId?: number;
  estado?: 'SOLICITADA' | 'AUTORIZADA' | 'EN_TRANSITO' | 'RECIBIDA' | 'CANCELADA';
  page?: number;
  limit?: number;
}

export interface LoteDisponibleTransferencia {
  loteId: number;
  numeroLote: string;
  fechaVencimiento: string;
  productoId: number;
  productoNombre: string;
  codigoProducto: string;
  stockDisponible: number;
  costoUnitario: number;
  sucursalId: number;
  sucursalNombre: string;
}
