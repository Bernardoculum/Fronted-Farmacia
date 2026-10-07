import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ClientesService } from '../../core/services/clientes.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { FormatEnumPipe } from '../../shared/pipes/format-enum.pipe';
import { ClienteItem, LaboratorioItem } from '../../core/models/clientes.models';
import { ClienteFormModalComponent } from './cliente-form-modal.component';
import { LaboratorioFormModalComponent } from './laboratorio-form-modal.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    FormatEnumPipe,
  ],
  templateUrl: './clientes.component.html',
})
export class ClientesComponent implements OnInit {
  readonly clientesService = inject(ClientesService);
  readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal<'CLIENTES' | 'LABORATORIOS'>('CLIENTES');
  readonly filtroEstado = signal<string>('TODOS');
  readonly searchTerm = signal<string>('');
  readonly canManageLaboratorios = computed(() => this.authService.userRole() === 'SUPER_ADMIN');
  searchLabTerm = '';

  readonly laboratoriosFiltrados = computed(() => {
    const term = (this.searchLabTerm || '').toLowerCase().trim();
    const list = this.clientesService.laboratorios();
    if (!term) return list;
    return list.filter(
      (l) =>
        l.nombre.toLowerCase().includes(term) ||
        (l.telefono && l.telefono.toLowerCase().includes(term))
    );
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['tab'] === 'laboratorios') {
        this.setTab('LABORATORIOS');
      } else {
        this.cargarDatos();
        this.clientesService.cargarLaboratorios().subscribe();
      }
    });
  }

  setTab(tab: 'CLIENTES' | 'LABORATORIOS'): void {
    this.activeTab.set(tab);
    if (tab === 'LABORATORIOS') {
      this.clientesService.cargarLaboratorios().subscribe();
    } else {
      this.cargarDatos();
    }
  }

  cargarDatos(): void {
    const estado = this.filtroEstado() === 'TODOS' ? undefined : this.filtroEstado();
    this.clientesService.cargarClientes({
      page: this.clientesService.currentPage(),
      limit: this.clientesService.pageSize(),
      estado,
      search: this.searchTerm() || undefined,
    }).subscribe();
  }

  onPageChange(event: PageEvent): void {
    const estado = this.filtroEstado() === 'TODOS' ? undefined : this.filtroEstado();
    this.clientesService.cargarClientes({
      page: event.pageIndex + 1,
      limit: event.pageSize,
      estado,
      search: this.searchTerm() || undefined,
    }).subscribe();
  }

  setFiltroEstado(estado: string): void {
    this.filtroEstado.set(estado);
    const param = estado === 'TODOS' ? undefined : estado;
    this.clientesService.cargarClientes({
      page: 1,
      limit: this.clientesService.pageSize(),
      estado: param,
      search: this.searchTerm() || undefined,
    }).subscribe();
  }

  onSearchChange(event: any): void {
    const val = event.target ? event.target.value : event;
    this.searchTerm.set(val || '');
    const estado = this.filtroEstado() === 'TODOS' ? undefined : this.filtroEstado();
    this.clientesService.cargarClientes({
      page: 1,
      limit: this.clientesService.pageSize(),
      estado,
      search: val || undefined,
    }).subscribe();
  }

  abrirModalCliente(): void {
    const ref = this.dialog.open(ClienteFormModalComponent, {
      width: '560px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.cargarDatos();
    });
  }

  editarCliente(c: ClienteItem): void {
    const ref = this.dialog.open(ClienteFormModalComponent, {
      width: '560px',
      disableClose: true,
      data: c,
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.cargarDatos();
    });
  }

  async desactivarCliente(c: ClienteItem): Promise<void> {
    const accion = c.estado === 'ACTIVO' ? 'Desactivar' : 'Reactivar';
    const ok = await this.notification.confirm({
      title: '¿' + accion + ' Cliente?',
      text: '¿Estás seguro de que deseas ' + accion.toLowerCase() + ' al cliente "' + c.nombreCompleto + '"?',
      confirmText: 'Sí, ' + accion,
      type: c.estado === 'ACTIVO' ? 'danger' : 'info',
    });
    if (!ok) return;

    if (c.estado === 'ACTIVO') {
      this.clientesService.desactivarCliente(c.clienteId).subscribe({
        next: () => {
          this.notification.success('Estado Actualizado', 'El cliente ahora está Inactivo.');
          this.cargarDatos();
        },
        error: (err: any) => {
          this.notification.error('Error al Cambiar Estado', err?.error?.message || 'No se pudo completar la operación.');
        },
      });
    } else {
      this.clientesService.actualizarCliente(c.clienteId, { ...c, estado: 'ACTIVO' } as any).subscribe({
        next: () => {
          this.notification.success('Estado Actualizado', 'El cliente ahora está Activo.');
          this.cargarDatos();
        },
        error: (err: any) => {
          this.notification.error('Error al Cambiar Estado', err?.error?.message || 'No se pudo completar la operación.');
        },
      });
    }
  }

  abrirModalLaboratorio(): void {
    const ref = this.dialog.open(LaboratorioFormModalComponent, {
      width: '500px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.clientesService.cargarLaboratorios().subscribe();
    });
  }

  editarLaboratorio(lab: LaboratorioItem): void {
    const ref = this.dialog.open(LaboratorioFormModalComponent, {
      width: '500px',
      disableClose: true,
      data: lab,
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.clientesService.cargarLaboratorios().subscribe();
    });
  }

  async cambiarEstadoLaboratorio(lab: LaboratorioItem): Promise<void> {
    const accion = lab.estado === 'ACTIVO' ? 'Dar de Baja' : 'Reactivar';
    const ok = await this.notification.confirm({
      title: '¿' + accion + ' Laboratorio?',
      text: '¿Estás seguro de que deseas ' + accion.toLowerCase() + ' a "' + lab.nombre + '"?',
      confirmText: 'Sí, ' + accion,
      type: lab.estado === 'ACTIVO' ? 'danger' : 'info',
    });
    if (!ok) return;

    this.clientesService.toggleEstadoLaboratorio(lab.laboratorioId).subscribe({
      next: () => {
        this.notification.success(
          'Estado Actualizado',
          'El laboratorio "' + lab.nombre + '" ha sido actualizado exitosamente.'
        );
        this.clientesService.cargarLaboratorios().subscribe();
      },
      error: (err: any) => {
        this.notification.error(
          'Error al Cambiar Estado',
          err?.error?.message || 'No se pudo actualizar el estado del laboratorio.'
        );
      },
    });
  }
}
