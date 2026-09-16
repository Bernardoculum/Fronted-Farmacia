import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/enums/role.enum';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  readonly authService = inject(AuthService);
  readonly user = this.authService.currentUser;

  getFriendlyRoleName(): string {
    const rol = this.user()?.rol;
    switch (rol) {
      case 'SUPER_ADMIN':
      case Role.SUPER_ADMIN:
        return 'ADMINISTRADOR';
      case 'GERENTE_SUCURSAL':
      case Role.GERENTE_SUCURSAL:
        return 'GERENTE DE SUCURSAL';
      case 'CAJERO':
      case Role.CAJERO:
        return 'CAJERO';
      case 'CALL_CENTER':
      case Role.CALL_CENTER:
        return 'OPERADOR CALL CENTER';
      case 'AUDITOR':
      case Role.AUDITOR:
        return 'AUDITOR';
      default:
        return rol ? String(rol).replace('_', ' ') : 'USUARIO';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
