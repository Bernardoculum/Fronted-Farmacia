import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PedidosStateService } from '../../services/pedidos-state.service';
import { ProductosService } from '../../../../core/services/productos.service';
import { PedidosService } from '../../../../core/services/pedidos.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CajasService } from '../../../../core/services/cajas.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AbrirSesionModalComponent } from '../../../cajas/modals/abrir-sesion-modal.component';

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
    MatDialogModule,
  ],
  templateUrl: './pos.component.html',
})
export class PosComponent {
  readonly state = inject(PedidosStateService);
  readonly productosService = inject(ProductosService);
  readonly pedidosService = inject(PedidosService);
  readonly authService = inject(AuthService);
  readonly cajasService = inject(CajasService);
  readonly dialog = inject(MatDialog);
  readonly notification = inject(NotificationService);

  readonly sesionCajaActiva = signal<any | null>(null);
  readonly cargandoSesion = signal<boolean>(false);

  constructor() {
    effect(() => {
      const sucursalId = this.sucursalSeleccionadaId();
      this.verificarSesionCaja(sucursalId);
    });
  }

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

  cobrarVentaMostrador() {
    if (!this.sesionCajaActiva()) {
      this.notification.error(
        'Caja Cerrada',
        'No hay un turno de caja abierto en esta sucursal. Debes abrir un turno para cobrar en mostrador.'
      );
      return;
    }
    this.state.cobrarVentaMostrador();
    setTimeout(() => {
      this.verificarSesionCaja(this.sucursalSeleccionadaId());
    }, 1200);
  }

  obtenerStockSucursal(p: any, sId?: any) { return this.state.obtenerStockSucursal(p, sId); }

  verificarSesionCaja(sucursalId?: number): void {
    const id = sucursalId ?? this.sucursalSeleccionadaId() ?? this.authService.currentUser()?.sucursalId;
    this.cargandoSesion.set(true);
    this.cajasService.getSesionActiva(id).subscribe({
      next: (res) => {
        this.cargandoSesion.set(false);
        if (res && res.activa && res.sesion) {
          this.sesionCajaActiva.set(res.sesion);
        } else {
          this.sesionCajaActiva.set(null);
        }
      },
      error: () => {
        this.cargandoSesion.set(false);
        this.sesionCajaActiva.set(null);
      },
    });
  }

  abrirTurnoCaja(): void {
    const ref = this.dialog.open(AbrirSesionModalComponent, {
      width: '460px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.verificarSesionCaja(this.sucursalSeleccionadaId());
      }
    });
  }
}
