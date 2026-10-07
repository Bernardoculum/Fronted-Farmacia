import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { Role } from '../../core/enums/role.enum';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent {
  readonly authService = inject(AuthService);
  readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);

  /**
   * Nombre de rol amigable y estandarizado para toda la app.
   */
  getFriendlyRoleName(): string {
    const rol = this.authService.userRole();
    switch (rol) {
      case Role.SUPER_ADMIN:
      case 'SUPER_ADMIN':
        return 'ADMINISTRADOR';
      case Role.GERENTE_SUCURSAL:
      case 'GERENTE_SUCURSAL':
        return 'GERENTE DE SUCURSAL';
      case Role.CAJERO:
      case 'CAJERO':
        return 'CAJERO';
      case Role.CALL_CENTER:
      case 'CALL_CENTER':
        return 'OPERADOR CALL CENTER';
      case Role.AUDITOR:
      case 'AUDITOR':
        return 'AUDITOR';
      default:
        return rol ? String(rol).replace('_', ' ') : 'USUARIO';
    }
  }

  /**
   * Obtiene el nombre del usuario sin prefijos como Super.
   */
  getUserDisplayName(): string {
    const u = this.authService.currentUser();
    if (!u) return 'Usuario';
    return u.username || u.nombre || 'Usuario';
  }

  /**
   * Genera las iniciales basadas en el nombre del usuario (ej. CU para Culum).
   */
  getUserInitials(): string {
    const name = this.getUserDisplayName();
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Obtiene la sucursal del usuario o describe el alcance de su cuenta.
   */
  getUserSucursal(): string {
    const u = this.authService.currentUser();
    const rol = this.authService.userRole();
    if (rol === Role.SUPER_ADMIN || rol === 'SUPER_ADMIN') {
      return 'Todas las Sucursales (Acceso Global)';
    }
    if (typeof u?.sucursal === 'string' && u.sucursal.trim()) {
      return u.sucursal;
    }
    if ((u as any)?.sucursal?.nombre) {
      return (u as any).sucursal.nombre;
    }
    return (u as any)?.sucursalNombre || 'Sucursal Central (Atanasio Tzul Z.12)';
  }

  /**
   * Color y estilo del badge de rol.
   */
  getRoleBadgeClass(): string {
    const rol = this.authService.userRole();
    switch (rol) {
      case Role.SUPER_ADMIN:
      case 'SUPER_ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case Role.GERENTE_SUCURSAL:
      case 'GERENTE_SUCURSAL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case Role.CAJERO:
      case 'CAJERO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case Role.CALL_CENTER:
      case 'CALL_CENTER':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case Role.AUDITOR:
      case 'AUDITOR':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  }

  /**
   * Navega a la sección de Proveedores en Clientes (pestaña laboratorios).
   */
  irAProveedores(): void {
    this.router.navigate(['/clientes'], { queryParams: { tab: 'laboratorios' } });
    this.layoutService.closeMobile();
  }
}
