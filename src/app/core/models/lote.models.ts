export interface LoteProductoRef {
  productoId: number;
  codigoProducto: string;
  nombre: string;
  principioActivo?: string;
  presentacion?: string;
  concentracion?: string;
  precioVenta: number;
  requiereReceta: 'S' | 'N';
}

export interface LoteInventarioRef {
  inventarioId?: number;
  sucursalId: number;
  sucursal: string;
  disponible: number;
  reservado: number;
}

export interface LoteItem {
  loteId: number;
  numeroLote: string;
  fechaVencimiento: string;
  fechaFabricacion?: string | null;
  costoUnitario: number;
  diasParaVencer: number;
  estadoVencimiento: 'VIGENTE' | 'POR_VENCER' | 'VENCIDO';
  producto: LoteProductoRef;
  stockTotalLote: number;
  inventarios: LoteInventarioRef[];
}

export interface FilterLoteParams {
  search?: string;
  productoId?: number;
  sucursalId?: number;
  estadoVencimiento?: 'TODOS' | 'VIGENTE' | 'POR_VENCER' | 'VENCIDO';
}

export interface CreateLoteDto {
  productoId: number;
  numeroLote: string;
  fechaVencimiento: string;
  fechaFabricacion?: string;
  costoUnitario: number;
  sucursalId?: number;
  stockInicial?: number;
}

export interface UpdateLoteDto {
  fechaVencimiento?: string;
  costoUnitario?: number;
}
