import { FormatEnumPipe, getBadgeColorClass } from '../../../../shared/pipes/format-enum.pipe';
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
  selector: 'app-ordenes-web',
  standalone: true,
  imports: [
    FormatEnumPipe,CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './ordenes-web.component.html',
})
export class OrdenesWebComponent {
  badgeClass(v: string): string { return getBadgeColorClass(v); }

  readonly state = inject(PedidosStateService);
  readonly pedidosService = inject(PedidosService);
  readonly authService = inject(AuthService);

  get ordenesWebPendientes() { return this.state.ordenesWebPendientes; }

  simularPedidoWeb() { this.state.simularPedidoWeb(); }
  verTicket(p: any) { this.state.verTicket(p); }
  cambiarEstadoEntrega(id: number, estado: string) { this.state.cambiarEstadoEntrega(id, estado); }
}
