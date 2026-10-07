export interface CategoriaActivo {
  id: number;
  codigo: string;
  nombre: string;
  porcentajeDepreciacionAnual: number;
  activo: boolean;
}

export interface HistorialActivo {
  id: number;
  activoFijoId: number;
  sucursalOrigenId?: number;
  sucursalDestinoId: number;
  sucursalOrigen?: { id: number; nombre: string };
  sucursalDestino?: { id: number; nombre: string };
  tipoMovimiento: string;
  motivo?: string;
  responsable?: string;
  creadoEn: string;
}

export interface ActivoFijo {
  id: number;
  codigoActivo: string;
  nombre: string;
  descripcion?: string;
  categoriaActivoId: number;
  categoriaActivo?: CategoriaActivo;
  sucursalId: number;
  sucursal?: { id: number; nombre: string; direccion?: string };
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  fechaAdquisicion: string;
  costoAdquisicion: number;
  valorLibros?: number;
  depreciacionAcumulada?: number;
  estado: 'OPERATIVO' | 'EN_MANTENIMIENTO' | 'EN_TRANSITO' | 'DADO_DE_BAJA' | string;
  responsableAsignado?: string;
  observaciones?: string;
  creadoEn: string;
  historial?: HistorialActivo[];
}

export interface ActivosKPIs {
  total: number;
  operativos: number;
  enMantenimiento: number;
  enTransito: number;
  dadosDeBaja: number;
  costoTotal: number;
}

export interface ActivosListResponse {
  data: ActivoFijo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  kpis: ActivosKPIs;
}

export interface CreateActivoPayload {
  codigoActivo?: string;
  nombre: string;
  descripcion?: string;
  categoriaActivoId: number;
  sucursalId: number;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  fechaAdquisicion: string;
  costoAdquisicion: number;
  responsableAsignado?: string;
  observaciones?: string;
}

export interface TrasladoActivoPayload {
  sucursalDestinoId: number;
  responsable?: string;
  motivo: string;
}

export interface BajaActivoPayload {
  motivo: string;
  responsable?: string;
}
