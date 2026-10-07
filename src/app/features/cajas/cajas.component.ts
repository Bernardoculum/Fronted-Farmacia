import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CajasService } from '../../core/services/cajas.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SucursalesService } from '../../core/services/sucursales.service';
import { FormatEnumPipe } from '../../shared/pipes/format-enum.pipe';
import { SesionCajaItem } from '../../core/models/cajas.models';
import { AbrirSesionModalComponent } from './modals/abrir-sesion-modal.component';
import { CerrarSesionModalComponent } from './modals/cerrar-sesion-modal.component';
import { MovimientoCajaModalComponent } from './modals/movimiento-caja-modal.component';
import { SesionDetalleModalComponent } from './modals/sesion-detalle-modal.component';

@Component({
  selector: 'app-cajas',
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
  templateUrl: './cajas.component.html',
})
export class CajasComponent implements OnInit {
  readonly cajasService = inject(CajasService);
  readonly authService = inject(AuthService);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  readonly Math = Math;
  readonly filtroEstado = signal<string>('TODOS');
  readonly searchTerm = signal<string>('');
  readonly sucursales = signal<any[]>([]);

  canManageCajas(): boolean {
    return (
      this.authService.isSuperAdmin() ||
      this.authService.isGerente() ||
      this.authService.isCajero()
    );
  }

  ngOnInit(): void {
    this.cargarDatos();

    this.sucursalesService.cargarSucursales({ limit: 50 }).subscribe({
      next: (res: any) => {
        this.sucursales.set(res?.data || []);
      },
    });
  }

  cargarDatos(): void {
    this.cajasService
      .cargarSesiones({
        estado: this.filtroEstado(),
        search: this.searchTerm() || undefined,
      })
      .subscribe();
  }

  setFiltroEstado(estado: string): void {
    this.filtroEstado.set(estado);
    this.cajasService.cargarSesiones({ estado, page: 1 }).subscribe();
  }

  onSearchChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
    this.cajasService.cargarSesiones({ search: val, page: 1 }).subscribe();
  }

  onSucursalChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    const sucId = val ? Number(val) : undefined;
    this.cajasService.cargarSesiones({ sucursalId: sucId, page: 1 }).subscribe();
  }

  onPageChange(event: PageEvent): void {
    this.cajasService
      .cargarSesiones({
        page: event.pageIndex + 1,
        limit: event.pageSize,
      })
      .subscribe();
  }

  abrirModalApertura(): void {
    const ref = this.dialog.open(AbrirSesionModalComponent, {
      width: '520px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((res: any) => {
      if (res) this.cargarDatos();
    });
  }

  abrirModalCierre(sesion: SesionCajaItem): void {
    const ref = this.dialog.open(CerrarSesionModalComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: sesion,
    });
    ref.afterClosed().subscribe((res: any) => {
      if (res) this.cargarDatos();
    });
  }

  abrirModalMovimiento(sesion: SesionCajaItem): void {
    const ref = this.dialog.open(MovimientoCajaModalComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: sesion,
    });
    ref.afterClosed().subscribe((res: any) => {
      if (res) this.cargarDatos();
    });
  }

  verDetalle(sesion: SesionCajaItem): void {
    this.dialog.open(SesionDetalleModalComponent, {
      width: '680px',
      maxWidth: '95vw',
      data: sesion,
    });
  }
}
