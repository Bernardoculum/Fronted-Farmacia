export interface CajaItem {
  cajaId: number;
  sucursalId: number;
  sucursal: string;
  codigoCaja: string;
  descripcion: string | null;
  estado: string;
  estaEnUso: boolean;
  sesionActivaId: number | null;
  cajeroActivo: string | null;
  fechaAperturaActiva: string | null;
}

export interface SesionCajaItem {
  sesionCajaId: number;
  cajaId: number;
  codigoCaja: string;
  sucursal: string;
  cajeroApertura: string;
  cajeroCierre: string | null;
  fechaApertura: string;
  fechaCierre: string | null;
  saldoInicial: number;
  totalIngresos: number;
  totalEgresos: number;
  efectivoEsperado: number | null;
  efectivoContado: number | null;
  diferencia: number | null;
  estado: string; // 'ABIERTA' | 'CERRADA'
  estadoCuadre: 'ABIERTA' | 'CUADRE_EXACTO' | 'SOBRANTE' | 'FALTANTE';
  observacionCierre: string | null;
}

export interface MovimientoCajaItem {
  movimientoCajaId: number;
  tipoMovimiento: 'INGRESO' | 'EGRESO';
  monto: number;
  metodoPago: string;
  descripcion: string;
  referenciaTipo: string | null;
  referenciaId: number | null;
  empleado: string;
  fechaMovimiento: string;
}

export interface SesionDetalleResponse extends SesionCajaItem {
  caja: {
    cajaId: number;
    codigoCaja: string;
    descripcion: string | null;
    sucursal: string;
  };
  empleadoApertura: string;
  empleadoCierre: string | null;
  resumenMetodosPago: {
    efectivo: number;
    tarjeta: number;
    transferencia: number;
  };
  movimientos: MovimientoCajaItem[];
}

export interface FilterSesionCajaParams {
  page?: number;
  limit?: number;
  sucursalId?: number;
  cajaId?: number;
  estado?: string;
  search?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface PaginatedSesionesResponse {
  data: SesionCajaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  kpis: {
    total: number;
    abiertas: number;
    cuadresExactos: number;
    descuadres: number;
  };
}

export interface AbrirSesionDto {
  cajaId: number;
  saldoInicial: number;
  empleadoId?: number;
}

export interface CerrarSesionDto {
  efectivoContado: number;
  observacionCierre?: string;
  empleadoId?: number;
}

export interface CreateMovimientoDto {
  tipoMovimiento: 'INGRESO' | 'EGRESO';
  monto: number;
  metodoPagoId: number;
  referenciaTipo?: string;
  referenciaId?: number;
  descripcion: string;
}
