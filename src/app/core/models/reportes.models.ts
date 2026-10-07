export interface ExecutiveKPIs {
  totalVentas: number;
  totalOrdenes: number;
  ticketPromedio: number;
  valorInventario: number;
  totalNominas: number;
  valorActivos: number;
  totalMedicamentos: number;
}

export interface CanalVenta {
  total: number;
  cantidad: number;
}

export interface DashboardResponse {
  kpis: ExecutiveKPIs;
  ventasPorCanal: Record<string, CanalVenta>;
}

export interface SucursalVenta {
  id: number;
  nombre: string;
  total: number;
  pedidosCount: number;
  porcentaje: number;
}

export interface VentasSucursalesResponse {
  totalGlobal: number;
  data: SucursalVenta[];
}

export interface TopMedicamento {
  id: number;
  codigo: string;
  nombre: string;
  unidades: number;
  recaudacion: number;
}

export interface AlertasInventario {
  totalItems: number;
  stockBajo: number;
  porVencer: number;
  vencidos: number;
  optimos: number;
}
