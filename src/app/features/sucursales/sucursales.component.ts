import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SucursalesService } from '../../core/services/sucursales.service';
import { AuthService } from '../../core/services/auth.service';
import { SucursalItem } from '../../core/models/sucursal.models';
import { SucursalFormModalComponent } from './modals/sucursal-form-modal.component';
import { FormatEnumPipe, getBadgeColorClass } from '../../shared/pipes/format-enum.pipe';

@Component({
  selector: 'app-sucursales',
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
    MatDialogModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './sucursales.component.html',
  styleUrl: './sucursales.component.scss',
})
export class SucursalesComponent implements OnInit {
  badgeClass(val: string): string { return getBadgeColorClass(val); }

  readonly sucursalesService = inject(SucursalesService);
  readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly sucursales = this.sucursalesService.sucursales;
  readonly loading = this.sucursalesService.loading;
  readonly totalItems = this.sucursalesService.totalItems;
  readonly pageSize = this.sucursalesService.pageSize;
  readonly pageIndex = computed(() => this.sucursalesService.currentPage() - 1);
  readonly kpis = this.sucursalesService.kpis;

  readonly searchTerm = signal('');
  readonly tipoFilter = signal<string>('TODOS');

  readonly canManage = computed(() => {
    return this.authService.currentUser()?.rol === 'SUPER_ADMIN';
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.sucursalesService
      .cargarSucursales({
        search: this.searchTerm() || undefined,
        tipoSucursal: this.tipoFilter() !== 'TODOS' ? this.tipoFilter() : undefined,
        page: this.sucursalesService.currentPage(),
        limit: this.sucursalesService.pageSize(),
      })
      .subscribe();
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.sucursalesService.currentPage.set(1);
    this.cargarDatos();
  }

  setTipoFilter(tipo: string): void {
    this.tipoFilter.set(tipo);
    this.sucursalesService.currentPage.set(1);
    this.cargarDatos();
  }

  onPageChange(event: PageEvent): void {
    this.sucursalesService.currentPage.set(event.pageIndex + 1);
    this.sucursalesService.pageSize.set(event.pageSize);
    this.cargarDatos();
  }

  abrirCrear(): void {
    const ref = this.dialog.open(SucursalFormModalComponent, {
      width: '600px',
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((res) => {
      if (res) this.cargarDatos();
    });
  }

  abrirEditar(item: SucursalItem): void {
    this.dialog.open(SucursalFormModalComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: item,
    });
    // La actualización se realiza de forma quirúrgica en el Signal sin recargar la tabla completa
  }
}
