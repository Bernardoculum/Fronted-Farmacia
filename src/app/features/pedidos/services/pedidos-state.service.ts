import { Injectable, inject, signal, computed } from '@angular/core';
import { PedidosService } from '../../../core/services/pedidos.service';
import { ProductosService } from '../../../core/services/productos.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ItemCarrito,
  Cliente,
  MetodoPago,
  PedidoItem,
  CreatePedidoDto,
  SucursalDespachoOpcion,
} from '../../../core/models/pedido.models';
import { ProductoListItem } from '../../../core/models/producto.models';

@Injectable({
  providedIn: 'root',
})
export class PedidosStateService {
  readonly pedidosService = inject(PedidosService);
  readonly productosService = inject(ProductosService);
  readonly authService = inject(AuthService);

  // Sucursales fijas del sistema
  readonly sucursales = [
    { id: 1, nombre: 'Sucursal Central (Atanasio Tzul Z.12)' },
    { id: 2, nombre: 'Stand Gasolinera Mixco Norte' },
    { id: 3, nombre: 'Sucursal Antigua Calzada' },
    { id: 4, nombre: 'Sucursal Xela Los Altos' },
    { id: 5, nombre: 'Stand Gasolinera Autopista Escuintla' },
  ];

  // Estado del Carrito y Selección
  readonly carrito = signal<ItemCarrito[]>([]);
  readonly busquedaProducto = signal<string>('');
  readonly sucursalSeleccionadaId = signal<number>(1);
  readonly metodoPagoSeleccionadoId = signal<number>(1);
  readonly montoEfectivo = signal<number>(0);

  // Call Center Clientes y Despacho
  readonly clienteSeleccionado = signal<Cliente | null>(null);
  readonly busquedaCliente = signal<string>('');
  readonly direccionEntrega = signal<string>('');
  readonly telefonoEntrega = signal<string>('');
  readonly referenciaEntrega = signal<string>('');
  readonly observacion = signal<string>('');

  // Estados de proceso y feedback
  readonly procesandoVenta = signal<boolean>(false);
  readonly mensajeExito = signal<string>('');
  readonly mensajeError = signal<string>('');

  // Modales
  readonly pedidoParaTicket = signal<PedidoItem | null>(null);
  readonly mostrarModalCliente = signal<boolean>(false);
  readonly mostrarModalOrdenesWeb = signal<boolean>(false);

  // Filtros Historial
  readonly filtroOrigen = signal<string>('');
  readonly filtroEstado = signal<string>('');

  // Métricas computadas del carrito
  readonly totalArticulos = computed(() =>
    this.carrito().reduce((acc, item) => acc + item.cantidad, 0)
  );

  readonly totalItemsCarrito = this.totalArticulos;

  readonly totalVenta = computed(() => {
    const total = this.carrito().reduce((acc, item) => acc + item.subtotal, 0);
    return Number(total.toFixed(2));
  });

  readonly subtotalSinIva = computed(() =>
    Number((this.totalVenta() / 1.12).toFixed(2))
  );

  readonly totalIva = computed(() =>
    Number((this.totalVenta() - this.subtotalSinIva()).toFixed(2))
  );

  readonly cambioCalculado = computed(() => {
    const cambio = this.montoEfectivo() - this.totalVenta();
    return cambio > 0 ? Number(cambio.toFixed(2)) : 0;
  });

  readonly cambioEfectivo = this.cambioCalculado;

  readonly productosFiltrados = computed(() => {
    const query = this.busquedaProducto().toLowerCase().trim();
    const list = this.productosService.productos();
    if (!query) return list;
    return list.filter(
      (p) =>
        p.nombre.toLowerCase().includes(query) ||
        p.codigoProducto.toLowerCase().includes(query) ||
        (p.categoria && p.categoria.toLowerCase().includes(query)) ||
        (p.principioActivo && p.principioActivo.toLowerCase().includes(query))
    );
  });

  readonly productosDisponibles = computed(() => {
    const query = this.busquedaProducto().toLowerCase().trim();
    const sucursalId = this.sucursalSeleccionadaId();
    const list = this.productosService.productos();

    return list.filter((p) => {
      const coincide =
        !query ||
        p.nombre.toLowerCase().includes(query) ||
        p.codigoProducto.toLowerCase().includes(query) ||
        (p.categoria && p.categoria.toLowerCase().includes(query)) ||
        (p.principioActivo && p.principioActivo.toLowerCase().includes(query));

      if (!coincide) return false;

      const stockEnSucursal = this.obtenerStockSucursal(p, sucursalId);
      return stockEnSucursal > 0;
    });
  });

  readonly sucursalActual = computed(() => {
    return (
      this.sucursales.find((s) => s.id === this.sucursalSeleccionadaId()) ||
      this.sucursales[0]
    );
  });

  readonly ordenesWebPendientes = computed(() => {
    return this.pedidosService
      .pedidos()
      .filter((p) => p.origen === 'PORTAL' && p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO');
  });

  constructor() {
    this.inicializar();
  }

  inicializar(): void {
    const userSucursalId = this.authService.currentUser()?.sucursalId;
    if (userSucursalId) {
      this.sucursalSeleccionadaId.set(Number(userSucursalId));
    }

    this.productosService.cargarProductos({ limit: 100 }).subscribe();
    this.pedidosService.cargarMetodosPago();
    this.pedidosService.listarPedidos();
    this.pedidosService.buscarClientes('').subscribe();
  }

  cambiarSucursal(nuevaId: any): void {
    const numericId = Number(nuevaId);
    this.sucursalSeleccionadaId.set(numericId);
    this.productosService.cargarProductos({ limit: 100 }).subscribe();
  }

  obtenerStockSucursal(producto: ProductoListItem, sucursalId?: number): number {
    const targetId = Number(sucursalId ?? this.sucursalSeleccionadaId());
    let stockTotal = 0;
    (producto.lotes || []).forEach((lote) => {
      (lote.inventarios || []).forEach((inv) => {
        if (Number(inv.sucursalId) === targetId) {
          stockTotal += Number(inv.disponible) || 0;
        }
      });
    });
    return stockTotal;
  }

  agregarAlCarrito(producto: ProductoListItem): void {
    const sucursalId = this.sucursalSeleccionadaId();
    const stockDisponible = this.obtenerStockSucursal(producto, sucursalId);
    if (stockDisponible <= 0) {
      this.mensajeError.set(
        `No hay existencias de "${producto.nombre}" en la sucursal seleccionada.`
      );
      setTimeout(() => this.mensajeError.set(''), 4000);
      return;
    }

    const index = this.carrito().findIndex((i) => i.productoId === producto.productoId);
    if (index !== -1) {
      const item = this.carrito()[index];
      if (item.cantidad + 1 > stockDisponible) {
        this.mensajeError.set(
          `Stock máximo alcanzado (${stockDisponible} unidades) para "${producto.nombre}".`
        );
        setTimeout(() => this.mensajeError.set(''), 4000);
        return;
      }
      item.cantidad += 1;
      item.subtotal = Number((item.cantidad * item.precioUnitario).toFixed(2));
      this.carrito.set([...this.carrito()]);
    } else {
      const nuevoItem: ItemCarrito = {
        productoId: producto.productoId,
        codigoProducto: producto.codigoProducto,
        nombre: producto.nombre,
        presentacion: producto.presentacion,
        concentracion: producto.concentracion,
        precioUnitario: producto.precioVenta,
        porcentajeIva: producto.porcentajeIva || 12,
        requiereReceta: producto.requiereReceta,
        cantidad: 1,
        subtotal: producto.precioVenta,
        stockDisponible,
      };
      this.carrito.set([...this.carrito(), nuevoItem]);
    }

    this.mensajeError.set('');
    this.evaluarDespachoEnLlamada();
  }

  incrementarCantidad(item: ItemCarrito): void {
    if (item.cantidad + 1 > item.stockDisponible) {
      this.mensajeError.set(`Stock máximo disponible: ${item.stockDisponible} unidades.`);
      return;
    }
    item.cantidad += 1;
    item.subtotal = Number((item.cantidad * item.precioUnitario).toFixed(2));
    this.carrito.set([...this.carrito()]);
    this.evaluarDespachoEnLlamada();
  }

  decrementarCantidad(item: ItemCarrito): void {
    if (item.cantidad > 1) {
      item.cantidad -= 1;
      item.subtotal = Number((item.cantidad * item.precioUnitario).toFixed(2));
      this.carrito.set([...this.carrito()]);
    } else {
      this.eliminarDelCarrito(item.productoId);
    }
    this.evaluarDespachoEnLlamada();
  }

  eliminarDelCarrito(productoId: number): void {
    this.carrito.set(this.carrito().filter((i) => i.productoId !== productoId));
    this.evaluarDespachoEnLlamada();
  }

  limpiarCarrito(): void {
    this.carrito.set([]);
    this.montoEfectivo.set(0);
    this.observacion.set('');
    this.pedidosService.limpiarEvaluacion();
  }

  setMontoRapido(monto: number): void {
    this.montoEfectivo.set(monto);
  }

  setMontoExacto(): void {
    this.montoEfectivo.set(this.totalVenta());
  }

  evaluarDespachoEnLlamada(): void {
    if (this.carrito().length === 0) {
      return;
    }

    const items = this.carrito().map((i) => ({
      productoId: i.productoId,
      cantidad: i.cantidad,
    }));

    this.pedidosService
      .evaluarDespacho({
        clienteId: this.clienteSeleccionado()?.clienteId,
        direccionDestino: this.direccionEntrega() || undefined,
        items,
      })
      .subscribe({
        next: (res) => {
          if (res.sucursalRecomendada && res.sucursalRecomendada.stockCompleto) {
            this.sucursalSeleccionadaId.set(res.sucursalRecomendada.sucursalId);
          }
        },
      });
  }

  asignarSucursal(opcion: SucursalDespachoOpcion): void {
    this.sucursalSeleccionadaId.set(opcion.sucursalId);
    this.mensajeExito.set(`Sucursal de despacho asignada a "${opcion.nombre}" (a ${opcion.distanciaKm} km).`);
    setTimeout(() => this.mensajeExito.set(''), 4000);
  }

  onBuscarCliente(query: string): void {
    this.busquedaCliente.set(query);
    this.pedidosService.buscarClientes(query).subscribe();
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado.set(cliente);
    this.telefonoEntrega.set(cliente.telefono || '');
    this.direccionEntrega.set(cliente.direccion || '');
    this.referenciaEntrega.set(cliente.referenciaDireccion || '');
    this.busquedaCliente.set(`${cliente.nombre} ${cliente.apellido || ''}`.trim());
    this.evaluarDespachoEnLlamada();
  }

  onClienteCreado(nuevoCliente: Cliente): void {
    this.mostrarModalCliente.set(false);
    this.seleccionarCliente(nuevoCliente);
    this.mensajeExito.set(`Cliente ${nuevoCliente.nombre} registrado y asignado con éxito.`);
    setTimeout(() => this.mensajeExito.set(''), 4000);
  }

  cobrarVentaMostrador(): void {
    if (this.carrito().length === 0) {
      this.mensajeError.set('Agrega medicamentos al carrito antes de cobrar.');
      return;
    }

    if (this.metodoPagoSeleccionadoId() === 1 && this.montoEfectivo() < this.totalVenta()) {
      this.mensajeError.set('El monto recibido en efectivo es menor al total a pagar.');
      return;
    }

    const payload: CreatePedidoDto = {
      origen: 'MOSTRADOR',
      sucursalId: this.sucursalSeleccionadaId(),
      metodoPagoId: this.metodoPagoSeleccionadoId(),
      observacion: this.observacion() || undefined,
      detalles: this.carrito().map((i) => ({
        productoId: i.productoId,
        loteId: i.loteId,
        cantidad: i.cantidad,
      })),
    };

    this.procesarEmisionPedido(payload, '¡Venta en mostrador cobrada con éxito!');
  }

  emitirPedidoCallCenter(): void {
    if (this.carrito().length === 0) {
      this.mensajeError.set('Agrega medicamentos al pedido antes de despachar.');
      return;
    }

    if (!this.clienteSeleccionado()) {
      this.mensajeError.set('Selecciona o registra un cliente para el envío a domicilio.');
      return;
    }

    if (!this.direccionEntrega().trim()) {
      this.mensajeError.set('La dirección de entrega es obligatoria para pedidos de Call Center.');
      return;
    }

    const payload: CreatePedidoDto = {
      origen: 'CALL_CENTER',
      clienteId: this.clienteSeleccionado()?.clienteId,
      sucursalId: this.sucursalSeleccionadaId(),
      metodoPagoId: this.metodoPagoSeleccionadoId(),
      observacion: this.observacion() || undefined,
      detalles: this.carrito().map((i) => ({
        productoId: i.productoId,
        loteId: i.loteId,
        cantidad: i.cantidad,
      })),
      datosEntrega: {
        direccionEntrega: this.direccionEntrega(),
        telefonoContacto: this.telefonoEntrega(),
        personaRecibe: this.clienteSeleccionado()
          ? `${this.clienteSeleccionado()?.nombre} ${this.clienteSeleccionado()?.apellido || ''}`.trim()
          : undefined,
        observacionEntrega: this.referenciaEntrega() || undefined,
      },
    };

    this.procesarEmisionPedido(payload, '¡Pedido de Call Center generado y enviado a despacho!');
  }

  simularPedidoWeb(): void {
    const productos = this.productosService.productos();
    const prod = productos.find((p) => p.stockTotal > 0) || productos[0];
    if (!prod) return;

    const payload: CreatePedidoDto = {
      origen: 'PORTAL',
      clienteId: 1,
      sucursalId: 1,
      metodoPagoId: 4,
      observacion: 'Orden realizada por cliente desde el Portal Web Autoservicio',
      detalles: [
        {
          productoId: prod.productoId,
          cantidad: 1,
        },
      ],
      datosEntrega: {
        direccionEntrega: 'Avenida Reforma 8-60 Zona 9',
        telefonoContacto: '41238801',
        personaRecibe: 'Juan Pérez',
        observacionEntrega: 'Entrega en lobby principal',
      },
    };

    this.pedidosService.crearPedido(payload).subscribe({
      next: () => {
        this.mensajeExito.set('¡Nueva orden web recibida en la bandeja centralizada!');
        setTimeout(() => this.mensajeExito.set(''), 4000);
        this.pedidosService.listarPedidos();
      },
      error: (err) => {
        this.mensajeError.set(err?.error?.message || 'Error al simular orden web');
      },
    });
  }

  private procesarEmisionPedido(payload: CreatePedidoDto, exitoMsg: string): void {
    this.procesandoVenta.set(true);
    this.mensajeError.set('');
    this.mensajeExito.set('');

    this.pedidosService.crearPedido(payload).subscribe({
      next: (res) => {
        this.procesandoVenta.set(false);
        this.mensajeExito.set(exitoMsg);
        setTimeout(() => this.mensajeExito.set(''), 5000);
        this.productosService.cargarProductos({ limit: 100 }).subscribe();

        const pedidoId = res.pedidoId;
        this.pedidosService.obtenerPedidoPorId(pedidoId).subscribe({
          next: (pedidoCompleto) => {
            this.pedidoParaTicket.set(pedidoCompleto);
          },
        });

        this.limpiarCarrito();
        this.clienteSeleccionado.set(null);
        this.busquedaCliente.set('');
        this.direccionEntrega.set('');
        this.telefonoEntrega.set('');
        this.referenciaEntrega.set('');
      },
      error: (err) => {
        this.procesandoVenta.set(false);
        this.mensajeError.set(
          err?.error?.message || 'Error al procesar la venta. Verifique existencias de lote.'
        );
      },
    });
  }

  verTicket(pedido: PedidoItem): void {
    this.pedidosService.obtenerPedidoPorId(pedido.pedidoId).subscribe({
      next: (res) => this.pedidoParaTicket.set(res),
      error: () => this.pedidoParaTicket.set(pedido),
    });
  }

  cerrarTicket(): void {
    this.pedidoParaTicket.set(null);
  }

  cambiarEstadoEntrega(pedidoId: number, estado: string): void {
    this.pedidosService.actualizarEstado(pedidoId, estado).subscribe({
      next: () => {
        this.mensajeExito.set(`Pedido #${pedidoId} actualizado a estado ${estado}.`);
        setTimeout(() => this.mensajeExito.set(''), 4000);
      },
      error: (err) => {
        this.mensajeError.set(err?.error?.message || 'Error al actualizar estado.');
      },
    });
  }

  filtrarHistorial(): void {
    this.pedidosService.listarPedidos({
      origen: (this.filtroOrigen() as any) || undefined,
      estado: this.filtroEstado() || undefined,
    });
  }
}
