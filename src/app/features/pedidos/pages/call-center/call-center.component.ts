import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PedidosStateService } from '../../services/pedidos-state.service';
import { ProductosService } from '../../../../core/services/productos.service';
import { PedidosService } from '../../../../core/services/pedidos.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-call-center',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './call-center.component.html',
})
export class CallCenterComponent {
  readonly state = inject(PedidosStateService);
  readonly productosService = inject(ProductosService);
  readonly pedidosService = inject(PedidosService);
  readonly authService = inject(AuthService);

  // Selector de modo: Llamada en vivo vs Bandeja Web
  readonly modoCallCenter = signal<'LLAMADA' | 'WEB'>('LLAMADA');

  // Modal de confirmación previa al despacho
  readonly mostrarConfirmacion = signal<boolean>(false);
  readonly ordenWebParaDespacho = signal<any | null>(null);

  get carrito() { return this.state.carrito; }
  get busquedaProducto() { return this.state.busquedaProducto; }
  get productosFiltrados() { return this.state.productosFiltrados; }
  get productosDisponibles() { return this.state.productosDisponibles; }
  get totalItemsCarrito() { return this.state.totalItemsCarrito; }
  get totalArticulos() { return this.state.totalArticulos; }
  get totalVenta() { return this.state.totalVenta; }
  get metodoPagoSeleccionadoId() { return this.state.metodoPagoSeleccionadoId; }
  get sucursalSeleccionadaId() { return this.state.sucursalSeleccionadaId; }
  get sucursalActual() { return this.state.sucursalActual; }
  get sucursales() { return this.state.sucursales; }
  readonly nombreSucursalActual = computed(() => this.state.sucursalActual().nombre);
  get observacion() { return this.state.observacion; }
  get procesandoVenta() { return this.state.procesandoVenta; }

  get clienteSeleccionado() { return this.state.clienteSeleccionado; }
  get busquedaCliente() { return this.state.busquedaCliente; }
  get direccionEntrega() { return this.state.direccionEntrega; }
  get telefonoEntrega() { return this.state.telefonoEntrega; }
  get referenciaEntrega() { return this.state.referenciaEntrega; }
  get mostrarModalCliente() { return this.state.mostrarModalCliente; }

  // Órdenes Web centralizadas en Call Center
  get ordenesWebPendientes() { return this.state.ordenesWebPendientes; }
  simularPedidoWeb() { this.state.simularPedidoWeb(); }
  verTicket(p: any) { this.state.verTicket(p); }
  cambiarEstadoEntrega(id: number, estado: string) { this.state.cambiarEstadoEntrega(id, estado); }

  agregarAlCarrito(p: any) { this.state.agregarAlCarrito(p); }
  incrementarCantidad(i: any) { this.state.incrementarCantidad(i); }
  decrementarCantidad(i: any) { this.state.decrementarCantidad(i); }
  eliminarDelCarrito(id: any) { this.state.eliminarDelCarrito(id); }
  limpiarCarrito() { this.state.limpiarCarrito(); }
  onBuscarCliente(q: string) { this.state.onBuscarCliente(q); }
  seleccionarCliente(c: any) { this.state.seleccionarCliente(c); }
  asignarSucursal(o: any) {
    if (o && o.stockCompleto === false) {
      this.state.mensajeError.set(`La sucursal "${o.nombre}" está agotada para este pedido.`);
      setTimeout(() => this.state.mensajeError.set(''), 4000);
      return;
    }
    this.state.asignarSucursal(o);
  }
  
  sucursalTieneStockParaCarrito(sucursalId: number): boolean {
    const items = this.carrito();
    if (items.length === 0) return true;

    // 1. Si existe evaluación inteligente en vivo, consultar stockCompleto
    const evalActual = this.pedidosService.evaluacionActual();
    if (evalActual && evalActual.opcionesSucursales) {
      const encontrada = evalActual.opcionesSucursales.find(s => s.sucursalId === sucursalId);
      if (encontrada !== undefined) {
        return Boolean(encontrada.stockCompleto);
      }
    }

    // 2. Fallback verificando lotes cargados en memoria
    const productos = this.productosService.productos();
    return items.every(item => {
      const prod = productos.find(p => p.productoId === item.productoId);
      if (!prod) return true;
      const stock = this.obtenerStockSucursal(prod, sucursalId);
      return stock >= item.cantidad;
    });
  }

  cambiarSucursal(id: any) { this.state.cambiarSucursal(Number(id)); }

  cancelarEvaluacion(): void {
    this.pedidosService.limpiarEvaluacion();
  }

  asignarYCerrar(suc: any): void {
    this.asignarSucursal(suc);
    this.cancelarEvaluacion();
  }

  // Flujo de verificación previa al despacho de llamada
  iniciarConfirmacion(): void {
    if (this.carrito().length === 0) {
      this.state.mensajeError.set('Agrega medicamentos al pedido antes de despachar.');
      return;
    }
    if (!this.clienteSeleccionado()) {
      this.state.mensajeError.set('Selecciona o registra un cliente para el envío a domicilio.');
      return;
    }
    if (!this.direccionEntrega().trim()) {
      this.state.mensajeError.set('La dirección de entrega es obligatoria para pedidos de Call Center.');
      return;
    }
    if (!this.sucursalTieneStockParaCarrito(this.sucursalSeleccionadaId())) {
      this.state.mensajeError.set(`La sucursal "${this.nombreSucursalActual()}" no tiene inventario disponible para despachar este pedido. Por favor selecciona una farmacia con stock disponible.`);
      return;
    }
    this.mostrarConfirmacion.set(true);
  }

  cerrarConfirmacion(): void {
    this.mostrarConfirmacion.set(false);
  }

  confirmarYEmitir(): void {
    this.mostrarConfirmacion.set(false);
    this.state.emitirPedidoCallCenter();
  }

  // Flujo de verificación para despacho de órdenes web
  abrirDespachoWeb(ord: any): void {
    this.ordenWebParaDespacho.set(ord);
  }

  cerrarDespachoWeb(): void {
    this.ordenWebParaDespacho.set(null);
  }

  confirmarDespachoWeb(): void {
    const ord = this.ordenWebParaDespacho();
    if (ord) {
      this.cambiarEstadoEntrega(ord.pedidoId, 'CONFIRMADO');
      this.ordenWebParaDespacho.set(null);
    }
  }

  emitirPedidoCallCenter() { this.state.emitirPedidoCallCenter(); }
  evaluarDespachoEnLlamada() { this.state.evaluarDespachoEnLlamada(); }
  obtenerStockSucursal(p: any, sId?: any) { return this.state.obtenerStockSucursal(p, sId); }
}
