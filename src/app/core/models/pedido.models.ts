export interface MetodoPago {
  metodoPagoId: number;
  nombre: string;
  estado: string;
}

export interface Cliente {
  clienteId: number;
  nombre: string;
  apellido?: string;
  telefono: string;
  direccion: string;
  referenciaDireccion?: string;
  email?: string;
  latitud?: number;
  longitud?: number;
  fechaRegistro?: string;
}

export interface CreateClienteDto {
  nombre: string;
  apellido?: string;
  telefono: string;
  direccion: string;
  referenciaDireccion?: string;
  email?: string;
}

export interface ItemCarrito {
  productoId: number;
  codigoProducto: string;
  nombre: string;
  presentacion?: string;
  concentracion?: string;
  precioUnitario: number;
  porcentajeIva: number;
  requiereReceta: 'S' | 'N';
  cantidad: number;
  loteId?: number;
  numeroLote?: string;
  fechaVencimiento?: string;
  stockDisponible: number;
  subtotal: number;
}

export interface DetallePedidoDto {
  productoId: number;
  loteId?: number;
  cantidad: number;
}

export interface DatosEntregaDto {
  direccionEntrega: string;
  telefonoContacto: string;
  personaRecibe?: string;
  observacionEntrega?: string;
}

export interface CreatePedidoDto {
  origen: 'MOSTRADOR' | 'CALL_CENTER' | 'SUCURSAL' | 'PORTAL' | 'TELEFONO';
  sucursalId: number;
  clienteId?: number;
  metodoPagoId: number;
  observacion?: string;
  detalles: DetallePedidoDto[];
  datosEntrega?: DatosEntregaDto;
}

export interface PedidoDetalleResponse {
  detalleId: number;
  codigoProducto: string;
  nombre: string;
  presentacion?: string;
  numeroLote?: string;
  fechaVencimiento?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoEntregaResponse {
  entregaId: number;
  estado: 'PENDIENTE' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO' | 'EN_RUTA' | 'ENTREGADA' | string;
  personaRecibe?: string;
  fechaProgramada?: string;
  fechaSalida?: string;
  fechaEntrega?: string;
  observacion?: string;
}

export interface PedidoItem {
  pedidoId: number;
  origen: 'MOSTRADOR' | 'CALL_CENTER' | 'SUCURSAL' | 'PORTAL' | 'TELEFONO' | string;
  total: number;
  subtotalSinIva?: number;
  iva?: number;
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO' | 'RECIBIDO' | 'EN_ENTREGA' | string;
  observacion?: string;
  fechaPedido: string;
  fechaConfirmacion?: string;
  cliente: {
    clienteId: number;
    nombre: string;
    telefono?: string;
    direccion?: string;
  };
  sucursal: {
    sucursalId: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
  };
  metodoPago: string;
  entrega?: PedidoEntregaResponse | null;
  detalles?: PedidoDetalleResponse[];
}

export interface FilterPedidoParams {
  origen?: 'MOSTRADOR' | 'CALL_CENTER';
  estado?: string;
  sucursalId?: number;
  clienteId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  limit?: number;
}

// Modelos para Decisión Inteligente de Despacho en Call Center
export interface ItemEvaluacionDto {
  productoId: number;
  cantidad: number;
}

export interface EvaluarDespachoDto {
  clienteId?: number;
  latitudDestino?: number;
  longitudDestino?: number;
  direccionDestino?: string;
  items: ItemEvaluacionDto[];
}

export interface StockDetalleSucursal {
  productoId: number;
  cantidadRequerida: number;
  disponibleEnSucursal: number;
  suficiente: boolean;
}

export interface SucursalDespachoOpcion {
  sucursalId: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  distanciaKm: number;
  tiempoEstimadoMinutos: number;
  rangoTiempo: string;
  stockCompleto: boolean;
  stockDetalle: StockDetalleSucursal[];
  costoEnvio: number;
  esOptima?: boolean;
}

export interface EvaluacionDespachoResponse {
  factibilidad: 'INMEDIATA' | 'SUCURSAL_ALTERNA' | 'SIN_STOCK';
  mensajeParaCliente: string;
  destino: {
    direccion: string;
    latitud: number;
    longitud: number;
  };
  sucursalRecomendada: SucursalDespachoOpcion | null;
  opcionesSucursales: SucursalDespachoOpcion[];
}
