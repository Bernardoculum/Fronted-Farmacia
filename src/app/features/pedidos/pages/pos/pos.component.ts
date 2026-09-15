import { Component, inject } from '@angular/core';
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
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './pos.component.html',
})
export class PosComponent {
  readonly state = inject(PedidosStateService);
  readonly productosService = inject(ProductosService);
  readonly pedidosService = inject(PedidosService);
  readonly authService = inject(AuthService);

  get carrito() { return this.state.carrito; }
  get busquedaProducto() { return this.state.busquedaProducto; }
  get productosDisponibles() { return this.state.productosDisponibles; }
  get sucursalSeleccionadaId() { return this.state.sucursalSeleccionadaId; }
  get totalArticulos() { return this.state.totalArticulos; }
  get totalVenta() { return this.state.totalVenta; }
  get subtotalSinIva() { return this.state.subtotalSinIva; }
  get totalIva() { return this.state.totalIva; }
  get cambioCalculado() { return this.state.cambioCalculado; }
  get montoEfectivo() { return this.state.montoEfectivo; }
  get metodoPagoSeleccionadoId() { return this.state.metodoPagoSeleccionadoId; }
  get sucursalActual() { return this.state.sucursalActual; }
  get observacion() { return this.state.observacion; }
  get procesandoVenta() { return this.state.procesandoVenta; }

  agregarAlCarrito(p: any) { this.state.agregarAlCarrito(p); }
  incrementarCantidad(i: any) { this.state.incrementarCantidad(i); }
  decrementarCantidad(i: any) { this.state.decrementarCantidad(i); }
  eliminarDelCarrito(id: any) { this.state.eliminarDelCarrito(id); }
  limpiarCarrito() { this.state.limpiarCarrito(); }
  setMontoRapido(m: any) { this.state.setMontoRapido(m); }
  setMontoExacto() { this.state.setMontoExacto(); }
  cobrarVentaMostrador() { this.state.cobrarVentaMostrador(); }
  obtenerStockSucursal(p: any, sId?: any) { return this.state.obtenerStockSucursal(p, sId); }
}
