import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PlanillasService } from '../../core/services/planillas.service';
import { AuthService } from '../../core/services/auth.service';
import { computed } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { FormatEnumPipe } from '../../shared/pipes/format-enum.pipe';
import { PlanillaItem, EmpleadoItem } from '../../core/models/planillas.models';
import { GenerarPlanillaModalComponent } from './generar-planilla-modal.component';
import { PlanillaDetalleModalComponent } from './planilla-detalle-modal.component';
import { ColaboradorFormModalComponent } from './modals/colaborador-form-modal.component';

@Component({
  selector: 'app-planillas',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    FormatEnumPipe,
  ],
  templateUrl: './planillas.component.html',
})
export class PlanillasComponent implements OnInit {
  readonly planillasService = inject(PlanillasService);
  readonly authService = inject(AuthService);
  readonly isSuperAdmin = computed(() => this.authService.userRole() === 'SUPER_ADMIN');
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  readonly activeTab = signal<'PLANILLAS' | 'COLABORADORES'>('PLANILLAS');

  ngOnInit(): void {
    if (!this.isSuperAdmin()) {
      this.activeTab.set('COLABORADORES');
      this.planillasService.cargarEmpleados().subscribe();
    } else {
      this.cargarDatos();
      this.planillasService.cargarEmpleados().subscribe();
    }
  }

  setTab(tab: 'PLANILLAS' | 'COLABORADORES'): void {
    this.activeTab.set(tab);
    if (tab === 'COLABORADORES') {
      this.planillasService.cargarEmpleados().subscribe();
    } else {
      this.cargarDatos();
    }
  }

  cargarDatos(): void {
    this.planillasService.cargarPlanillas(1, 10).subscribe();
  }

  onPageChange(event: PageEvent): void {
    this.planillasService.cargarPlanillas(event.pageIndex + 1, event.pageSize).subscribe();
  }

  abrirModalGenerar(): void {
    const ref = this.dialog.open(GenerarPlanillaModalComponent, {
      width: '520px',
      maxWidth: '95vw',
      disableClose: false,
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.cargarDatos();
    });
  }

  verDetalle(planilla: PlanillaItem): void {
    const ref = this.dialog.open(PlanillaDetalleModalComponent, {
      width: '850px',
      maxWidth: '95vw',
      disableClose: false,
      data: planilla,
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.cargarDatos();
    });
  }

  abrirNuevoColaborador(): void {
    const ref = this.dialog.open(ColaboradorFormModalComponent, {
      width: '920px',
      maxWidth: '95vw',
      disableClose: false,
      data: null,
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.planillasService.cargarEmpleados().subscribe();
      }
    });
  }

  editarColaborador(empleado: EmpleadoItem): void {
    const ref = this.dialog.open(ColaboradorFormModalComponent, {
      width: '920px',
      maxWidth: '95vw',
      disableClose: false,
      data: { empleado },
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.planillasService.cargarEmpleados().subscribe();
      }
    });
  }

  async cambiarEstado(empleado: EmpleadoItem): Promise<void> {
    const nuevoEstado = empleado.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const esBaja = nuevoEstado === 'INACTIVO';

    const ok = await this.notification.confirm({
      title: esBaja ? '¿Dar de Baja Laboral?' : '¿Reactivar Colaborador?',
      text: esBaja
        ? `¿Confirmas dar de baja a ${empleado.nombreCompleto}? Dejará de incluirse en las próximas planillas.`
        : `¿Deseas reactivar a ${empleado.nombreCompleto} para volver a incluirlo en la nómina?`,
      confirmText: esBaja ? 'Sí, Dar de Baja' : 'Sí, Reactivar',
      cancelText: 'Cancelar',
      type: esBaja ? 'danger' : 'info',
    });

    if (!ok) return;

    this.planillasService.toggleEstadoEmpleado(empleado.empleadoId, nuevoEstado).subscribe({
      next: () => {
        this.notification.success(
          esBaja ? 'Colaborador Inactivado' : 'Colaborador Reactivado',
          `${empleado.nombreCompleto} ahora se encuentra ${nuevoEstado.toLowerCase()}.`
        );
        this.planillasService.cargarEmpleados().subscribe();
      },
      error: (err) => {
        this.notification.error('Error al cambiar estado', err?.error?.message || 'No se pudo actualizar el estado.');
      }
    });
  }
}
