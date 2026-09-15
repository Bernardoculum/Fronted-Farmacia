import { Component, inject, computed } from '@angular/core';
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
  readonly nombreSucursalActual = computed(() => this.state.sucursalActual().nombre);
  get observacion() { return this.state.observacion; }
  get procesandoVenta() { return this.state.procesandoVenta; }

  get clienteSeleccionado() { return this.state.clienteSeleccionado; }
  get busquedaCliente() { return this.state.busquedaCliente; }
  get direccionEntrega() { return this.state.direccionEntrega; }
  get telefonoEntrega() { return this.state.telefonoEntrega; }
  get referenciaEntrega() { return this.state.referenciaEntrega; }
  get mostrarModalCliente() { return this.state.mostrarModalCliente; }

  agregarAlCarrito(p: any) { this.state.agregarAlCarrito(p); }
  incrementarCantidad(i: any) { this.state.incrementarCantidad(i); }
  decrementarCantidad(i: any) { this.state.decrementarCantidad(i); }
  eliminarDelCarrito(id: any) { this.state.eliminarDelCarrito(id); }
  limpiarCarrito() { this.state.limpiarCarrito(); }
  onBuscarCliente(q: string) { this.state.onBuscarCliente(q); }
  seleccionarCliente(c: any) { this.state.seleccionarCliente(c); }
  asignarSucursal(o: any) { this.state.asignarSucursal(o); }
  emitirPedidoCallCenter() { this.state.emitirPedidoCallCenter(); }
  evaluarDespachoEnLlamada() { this.state.evaluarDespachoEnLlamada(); }
  obtenerStockSucursal(p: any, sId?: any) { return this.state.obtenerStockSucursal(p, sId); }
}
