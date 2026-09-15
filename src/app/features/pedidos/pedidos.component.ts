import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PedidosStateService } from './services/pedidos-state.service';
import { AuthService } from '../../core/services/auth.service';
import { TicketModalComponent } from './components/ticket-modal/ticket-modal.component';
import { ClienteFormModalComponent } from './components/cliente-form-modal/cliente-form-modal.component';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TicketModalComponent,
    ClienteFormModalComponent,
  ],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss'],
})
export class PedidosComponent {
  readonly state = inject(PedidosStateService);
  readonly authService = inject(AuthService);
}
