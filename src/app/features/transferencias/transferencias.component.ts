import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TransferenciasService } from '../../core/services/transferencias.service';
import { FormatEnumPipe, getBadgeColorClass } from '../../shared/pipes/format-enum.pipe';
import { AuthService } from '../../core/services/auth.service';
import { TransferenciaItem } from '../../core/models/transferencia.models';
import { TransferenciaFormModalComponent } from './modals/transferencia-form-modal.component';
import { TransferenciaDetalleModalComponent } from './modals/transferencia-detalle-modal.component';

@Component({
  selector: 'app-transferencias',
  standalone: true,
  imports: [
    FormatEnumPipe,
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './transferencias.component.html',
  styleUrl: './transferencias.component.scss',
})
export class TransferenciasComponent implements OnInit {
  readonly transferenciasService = inject(TransferenciasService);
  readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly transferencias = this.transferenciasService.transferencias;
  readonly loading = this.transferenciasService.loading;
  readonly totalItems = this.transferenciasService.totalItems;
  readonly pageSize = this.transferenciasService.pageSize;
  readonly pageIndex = computed(() => this.transferenciasService.currentPage() - 1);

  readonly kpiTotal = this.transferenciasService.kpiTotal;
  readonly kpiSolicitadas = this.transferenciasService.kpiSolicitadas;
  readonly kpiEnTransito = this.transferenciasService.kpiEnTransito;
  readonly kpiRecibidas = this.transferenciasService.kpiRecibidas;

  readonly searchTerm = signal('');
  readonly estadoFilter = signal<string>('TODOS');

  readonly canManage = computed(() => {
    const rol = this.authService.currentUser()?.rol;
    return rol === 'SUPER_ADMIN' || rol === 'GERENTE_SUCURSAL';
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.transferenciasService
      .cargarTransferencias({
        search: this.searchTerm() || undefined,
        estado: this.estadoFilter() !== 'TODOS' ? (this.estadoFilter() as any) : undefined,
        page: this.transferenciasService.currentPage(),
        limit: this.transferenciasService.pageSize(),
      })
      .subscribe();
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.transferenciasService.currentPage.set(1);
    this.cargarDatos();
  }

  setEstadoFilter(est: string): void {
    this.estadoFilter.set(est);
    this.transferenciasService.currentPage.set(1);
    this.cargarDatos();
  }

  onPageChange(event: PageEvent): void {
    this.transferenciasService.currentPage.set(event.pageIndex + 1);
    this.transferenciasService.pageSize.set(event.pageSize);
    this.cargarDatos();
  }

  abrirCrear(modo?: 'DESPACHO' | 'SOLICITUD'): void {
    const modoEfectivo = modo || (this.authService.hasGlobalBranchAccess() ? 'DESPACHO' : 'SOLICITUD');
    const ref = this.dialog.open(TransferenciaFormModalComponent, {
      width: '880px',
      maxWidth: '95vw',
      data: { modo: modoEfectivo },
    });

    ref.afterClosed().subscribe((res) => {
      if (res) this.cargarDatos();
    });
  }

  verDetalle(item: TransferenciaItem): void {
    const ref = this.dialog.open(TransferenciaDetalleModalComponent, {
      width: '840px',
      maxWidth: '95vw',
      data: item,
    });

    ref.afterClosed().subscribe((res) => {
      if (res) this.cargarDatos();
    });
  }

  getEstadoBadgeClass(estado: string): string {
    return getBadgeColorClass(estado);
  }
}
