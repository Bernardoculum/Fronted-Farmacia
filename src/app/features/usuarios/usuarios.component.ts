import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UsersService } from '../../core/services/users.service';
import { SucursalesService } from '../../core/services/sucursales.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { FormatEnumPipe } from '../../shared/pipes/format-enum.pipe';
import { UserItem, RolOption } from '../../core/models/users.models';
import { UsuarioFormModalComponent } from './usuario-form-modal.component';
import { UsuarioDetalleModalComponent } from './usuario-detalle-modal.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatDialogModule,
    FormatEnumPipe,
  ],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  readonly isSuperAdmin = computed(() => this.authService.userRole() === 'SUPER_ADMIN');
  readonly usersService = inject(UsersService);
  private readonly sucursalesService = inject(SucursalesService);
  readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  // Filtros reactivos
  searchQuery = '';
  selectedRolId: number | '' = '';
  selectedSucursalId: number | '' = '';
  selectedKpiFiltro: 'TODOS' | 'ACTIVOS' | 'SUPER_ADMIN' | 'INACTIVOS' = 'TODOS';

  readonly roles = signal<RolOption[]>([]);
  readonly sucursales = signal<any[]>([]);

  private searchDebounceTimer?: any;

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarUsuarios();
  }

  isCurrentUser(user: UserItem): boolean {
    const current = this.authService.currentUser();
    if (!current) return false;
    return current.credencialId === user.credencialId || current.username.toLowerCase() === user.username.toLowerCase();
  }

  cargarCatalogos(): void {
    this.usersService.cargarRoles().subscribe({
      next: (res) => this.roles.set(res || []),
    });

    this.sucursalesService.cargarListaCombo().subscribe({
      next: (res) => {
        if (Array.isArray(res) && res.length > 0) {
          this.sucursales.set(res);
        } else {
          this.sucursalesService.cargarSucursales().subscribe({
            next: (dataRes) => {
              const list = Array.isArray(dataRes) ? dataRes : (dataRes?.data || []);
              this.sucursales.set(list);
            },
          });
        }
      },
    });
  }

  cargarUsuarios(page: number = 1): void {
    let estadoParam: 'ACTIVO' | 'INACTIVO' | 'TODOS' | undefined = undefined;
    if (this.selectedKpiFiltro === 'ACTIVOS') estadoParam = 'ACTIVO';
    if (this.selectedKpiFiltro === 'INACTIVOS') estadoParam = 'INACTIVO';

    let rolParam = this.selectedRolId ? Number(this.selectedRolId) : undefined;
    if (this.selectedKpiFiltro === 'SUPER_ADMIN') {
      const adminRol = this.roles().find((r) => r.nombre === 'SUPER_ADMIN');
      if (adminRol) rolParam = adminRol.rolId;
    }

    this.usersService.cargarUsuarios({
      page,
      limit: this.usersService.pageSize(),
      search: this.searchQuery,
      rolId: rolParam,
      sucursalId: this.selectedSucursalId ? Number(this.selectedSucursalId) : undefined,
      estado: estadoParam,
    }).subscribe({
      error: () => {
        // Manejo no intrusivo en carga de datos (igual a los demás módulos)
      },
    });
  }

  onSearchChange(): void {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.cargarUsuarios(1);
    }, 350);
  }

  onFilterChange(): void {
    this.cargarUsuarios(1);
  }

  filtrarPorKpi(tipo: 'TODOS' | 'ACTIVOS' | 'SUPER_ADMIN' | 'INACTIVOS'): void {
    this.selectedKpiFiltro = this.selectedKpiFiltro === tipo ? 'TODOS' : tipo;
    this.cargarUsuarios(1);
  }

  onPageChange(event: PageEvent): void {
    this.usersService.pageSize.set(event.pageSize);
    this.cargarUsuarios(event.pageIndex + 1);
  }

  abrirCrearUsuario(): void {
    const dialogRef = this.dialog.open(UsuarioFormModalComponent, {
      width: '620px',
      maxWidth: '95vw',
      panelClass: 'dialog-clean-white',
    });

    dialogRef.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargarUsuarios(1);
      }
    });
  }

  abrirDetalleUsuario(user: UserItem): void {
    this.dialog.open(UsuarioDetalleModalComponent, {
      width: '540px',
      maxWidth: '95vw',
      data: user,
      panelClass: 'dialog-clean-white',
    });
  }

  abrirEditarUsuario(user: UserItem): void {
    const dialogRef = this.dialog.open(UsuarioFormModalComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: user,
      panelClass: 'dialog-clean-white',
    });

    dialogRef.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargarUsuarios(this.usersService.currentPage());
      }
    });
  }

  async desactivarUsuario(user: UserItem): Promise<void> {
    if (this.isCurrentUser(user)) {
      await this.notification.warning(
        'Acción Denegada',
        'No puedes desactivar tu propia cuenta activa de Super Administrador para evitar bloqueos del sistema.'
      );
      return;
    }

    const esActivo = user.estado === 'ACTIVO';
    const ok = await this.notification.confirm({
      title: esActivo ? '¿Desactivar Colaborador?' : '¿Reactivar Colaborador?',
      text: esActivo
        ? `¿Estás seguro de suspender el acceso de "${user.nombreCompleto}" al sistema?`
        : `¿Deseas restaurar los permisos de acceso para "${user.nombreCompleto}"?`,
      confirmText: esActivo ? 'Sí, Desactivar' : 'Sí, Reactivar',
      type: esActivo ? 'danger' : 'info',
    });

    if (!ok) return;

    this.usersService.toggleEstadoUsuario(user.credencialId).subscribe({
      next: (res) => {
        const nuevoEstado = res.estado || (esActivo ? 'INACTIVO' : 'ACTIVO');

        // Actualización quirúrgica del Signal (sin recarga ciega)
        this.usersService.usuarios.update((lista) =>
          lista.map((item) =>
            item.credencialId === user.credencialId ? { ...item, estado: nuevoEstado } : item
          )
        );

        // Actualizar KPIs en vivo
        if (nuevoEstado === 'INACTIVO') {
          this.usersService.kpiActivos.update((v) => Math.max(0, v - 1));
          this.usersService.kpiInactivos.update((v) => v + 1);
        } else {
          this.usersService.kpiActivos.update((v) => v + 1);
          this.usersService.kpiInactivos.update((v) => Math.max(0, v - 1));
        }

        this.notification.success(
          esActivo ? 'Cuenta Desactivada' : 'Cuenta Reactivada',
          `El colaborador "${user.nombreCompleto}" ha sido ${esActivo ? 'desactivado' : 'reactivado'} exitosamente.`
        );
      },
      error: (err) => {
        this.notification.error(
          'Error en la operación',
          err?.error?.message || 'No fue posible cambiar el estado del usuario.'
        );
      },
    });
  }
}
