export interface InventarioSucursal {
  inventarioId?: number;
  sucursalId: number;
  sucursal?: string;
  disponible: number;
  reservado?: number;
  stockMinimo?: number;
}

export interface LoteInfo {
  loteId: number;
  numeroLote: string;
  fechaVencimiento: string;
  fechaFabricacion?: string | null;
  costoUnitario?: number;
  stockTotalLote?: number;
  stockLote?: number;
  inventarios: InventarioSucursal[];
}

export interface ProductoListItem {
  productoId: number;
  codigoProducto: string;
  nombre: string;
  principioActivo?: string;
  presentacion?: string;
  concentracion?: string;
  precioVenta: number;
  porcentajeIva: number;
  requiereReceta: 'S' | 'N';
  estado: string;
  categoria?: string;
  categoriaId?: number;
  laboratorio?: string;
  laboratorioId?: number;
  unidadMedida?: string;
  unidadMedidaAbreviatura?: string;
  stockTotal: number;
  lotes: LoteInfo[];
}

export interface ProductoDetail {
  productoId: number;
  codigoProducto: string;
  nombre: string;
  principioActivo?: string;
  presentacion?: string;
  concentracion?: string;
  precioVenta: number;
  porcentajeIva: number;
  requiereReceta: 'S' | 'N';
  estado: string;
  categoria?: { categoriaId: number; nombre: string; descripcion?: string };
  laboratorio?: { laboratorioId: number; nombre: string; paisOrigen?: string };
  unidadMedida?: { unidadMedidaId: number; nombre: string; abreviatura: string };
  stockTotal: number;
  lotes: LoteInfo[];
}

export interface FilterProductoParams {
  search?: string;
  categoriaId?: number;
  laboratorioId?: number;
  sucursalId?: number;
  conReceta?: 'S' | 'N';
  estado?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface KardexMovimientoItem {
  movimientoId: number;
  fecha: string;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  lote: string;
  vencimientoLote?: string;
  sucursal: string;
  sucursalId: number;
  cantidadOperada: number;
  saldoAnterior: number;
  saldoNuevo: number;
  referenciaTipo?: string;
  referenciaId?: number;
  observacion?: string;
}

export interface KardexResponse {
  productoId: number;
  codigoProducto: string;
  producto: string;
  totalMovimientos: number;
  historial: KardexMovimientoItem[];
}

export interface MovimientoKardexDto {
  productoId: number;
  sucursalId: number;
  numeroLote: string;
  fechaVencimiento: string;
  fechaFabricacion?: string;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  costoUnitario?: number;
  referenciaTipo?: string;
  referenciaId?: number;
  observacion?: string;
}

export interface CreateProductoDto {
  categoriaId: number;
  laboratorioId: number;
  unidadMedidaId: number;
  codigoProducto: string;
  nombre: string;
  principioActivo?: string;
  presentacion?: string;
  concentracion?: string;
  precioVenta: number;
  porcentajeIva?: number;
  requiereReceta?: 'S' | 'N';
  estado?: string;
}

export interface UpdateProductoDto extends Partial<CreateProductoDto> {}
