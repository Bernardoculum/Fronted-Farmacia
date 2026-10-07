export interface DesembolsarPlanillaPayload {
  origenFondos: 'BANCO' | 'CAJA';
  bancoOrigen?: string;
  referenciaPago: string;
  observacionesPago?: string;
}

export interface PlanillaItem {
  planillaId: number;
  fechaInicio: string;
  fechaFin: string;
  fechaPago: string | null;
  tipoPeriodo?: string;
  observaciones?: string;
  totalBruto: number;
  totalDescuentos: number;
  totalNeto: number;
  estado: string; // 'ABIERTA' | 'PAGADA'
  totalColaboradores: number;
  sucursalId?: number | null;
  sucursalNombre?: string;
  origenFondos?: string | null;
  referenciaPago?: string | null;
  bancoOrigen?: string | null;
  observacionesPago?: string | null;
}

export interface PlanillaDetalleItem {
  planillaDetalleId: number;
  empleadoId: number;
  colaborador: string;
  dpi: string;
  nit?: string;
  noAfiliacionIgss?: string;
  formaPago?: string;
  banco?: string;
  numeroCuenta?: string;
  email?: string;
  puesto: string;
  sucursal: string;
  salarioBase: number;
  bonificaciones: number;
  horasExtra: number;
  descuentos: number;
  descuentoIgss?: number;
  diasTrabajados?: number;
  totalPagar: number;
}

export interface PlanillaDetalleResponse extends PlanillaItem {
  detalles: PlanillaDetalleItem[];
}

export interface EmpleadoItem {
  empleadoId: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  dpi: string;
  telefono: string;
  nit?: string;
  noAfiliacionIgss?: string;
  formaPago?: string;
  banco?: string;
  numeroCuenta?: string;
  email?: string;
  salarioActual: number;
  fechaIngreso: string;
  estado: string;
  puesto: string;
  puestoId: number;
  sucursal: string;
  sucursalId: number;
}

export interface PuestoItem {
  puestoId: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
}

export interface PaginatedPlanillasResponse {
  data: PlanillaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  kpis: {
    totalPlanillas: number;
    planillasPagadas: number;
    colaboradoresActivos: number;
  };
}

export interface GenerarPlanillaDto {
  fechaInicio: string;
  fechaFin: string;
  tipoPeriodo?: string;
  sucursalId?: any;
  observacion?: string;
  observaciones?: string;
}

export interface CreateEmpleadoDto {
  nombre: string;
  apellido: string;
  dpi?: string;
  telefono?: string;
  fechaIngreso?: string;
  nit?: string;
  noAfiliacionIgss?: string;
  formaPago?: string;
  banco?: string;
  numeroCuenta?: string;
  email?: string;
  salarioActual: number;
  puestoId: number;
  sucursalId: number;
}

export interface UpdateEmpleadoDto {
  nombre?: string;
  apellido?: string;
  dpi?: string;
  telefono?: string;
  fechaIngreso?: string;
  nit?: string;
  noAfiliacionIgss?: string;
  formaPago?: string;
  banco?: string;
  numeroCuenta?: string;
  email?: string;
  salarioActual?: number;
  puestoId?: number;
  sucursalId?: number;
  estado?: string;
}
