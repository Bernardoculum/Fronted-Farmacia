import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PedidosStateService } from '../../services/pedidos-state.service';
import { PedidosService } from '../../../../core/services/pedidos.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './historial.component.html',
})
export class HistorialComponent {
  readonly state = inject(PedidosStateService);
  readonly pedidosService = inject(PedidosService);
  readonly authService = inject(AuthService);

  get filtroOrigen() { return this.state.filtroOrigen; }
  get filtroEstado() { return this.state.filtroEstado; }

  filtrarHistorial() { this.state.filtrarHistorial(); }
  verTicket(p: any) { this.state.verTicket(p); }
  cambiarEstadoEntrega(id: number, estado: string) { this.state.cambiarEstadoEntrega(id, estado); }
}
