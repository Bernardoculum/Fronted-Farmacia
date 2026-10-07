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
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { ProductosService } from '../../core/services/productos.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProductoListItem } from '../../core/models/producto.models';

import { ProductoDetailModalComponent } from './modals/producto-detail-modal.component';
import { KardexModalComponent } from './modals/kardex-modal.component';
import { MovimientoKardexModalComponent } from './modals/movimiento-kardex-modal.component';
import { ProductoFormModalComponent } from './modals/producto-form-modal.component';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss',
})
export class ProductosComponent implements OnInit {
  readonly productosService = inject(ProductosService);
  readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  // Signals del servicio
  readonly productos = this.productosService.productos;
  readonly loading = this.productosService.loading;
  readonly totalItems = this.productosService.totalItems;
  readonly user = this.authService.currentUser;

  // Filtros locales reactivos
  readonly searchTerm = signal('');
  readonly selectedCategoria = signal<number | null>(null);
  readonly selectedReceta = signal<'S' | 'N' | ''>('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  // Columnas de la tabla
  readonly displayedColumns: string[] = [
    'codigo',
    'nombre',
    'presentacion',
    'categoria',
    'precio',
    'stock',
    'acciones',
  ];

  // Métricas calculadas para KPIs superiores
  readonly totalStock = computed(() => {
    return this.productos().reduce((acc, p) => acc + (p.stockTotal || 0), 0);
  });

  readonly totalConReceta = computed(() => {
    return this.productos().filter((p) => p.requiereReceta === 'S').length;
  });

  readonly canManageProducts = computed(() => {
    const rol = this.user()?.rol;
    return rol === 'SUPER_ADMIN';
  });

  readonly canDeleteProducts = computed(() => {
    const rol = this.user()?.rol;
    return rol === 'SUPER_ADMIN';
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.productosService.cargarProductos({
      search: this.searchTerm() || undefined,
      categoriaId: this.selectedCategoria() || undefined,
      conReceta: this.selectedReceta() ? this.selectedReceta() as 'S' | 'N' : undefined,
      page: this.pageIndex() + 1,
      limit: this.pageSize(),
    }).subscribe();
  }

  onSearchChange(val: string): void {
    this.searchTerm.set(val);
    this.pageIndex.set(0);
    this.cargarDatos();
  }

  onCategoriaChange(val: number | null): void {
    this.selectedCategoria.set(val);
    this.pageIndex.set(0);
    this.cargarDatos();
  }

  onRecetaChange(val: 'S' | 'N' | ''): void {
    this.selectedReceta.set(val);
    this.pageIndex.set(0);
    this.cargarDatos();
  }

  limpiarFiltros(): void {
    this.searchTerm.set('');
    this.selectedCategoria.set(null);
    this.selectedReceta.set('');
    this.pageIndex.set(0);
    this.cargarDatos();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarDatos();
  }

  // Modales
  abrirDetalle(prod: ProductoListItem): void {
    this.dialog.open(ProductoDetailModalComponent, {
      data: prod,
      width: '650px',
      maxWidth: '95vw',
    });
  }

  abrirKardex(prod: ProductoListItem): void {
    this.dialog.open(KardexModalComponent, {
      data: prod,
      width: '900px',
      maxWidth: '95vw',
    });
  }

  abrirMovimiento(prod: ProductoListItem): void {
    const ref = this.dialog.open(MovimientoKardexModalComponent, {
      data: prod,
      width: '560px',
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.cargarDatos();
      }
    });
  }

  abrirCrear(): void {
    const ref = this.dialog.open(ProductoFormModalComponent, {
      data: null,
      width: '650px',
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((res) => {
      if (res && res.productoId) {
        this.productosService.agregarProductoLocal(res);
      }
    });
  }

  abrirEditar(prod: ProductoListItem): void {
    this.dialog.open(ProductoFormModalComponent, {
      data: prod,
      width: '650px',
      maxWidth: '95vw',
    });
    // La actualización se realiza de forma quirúrgica en el Signal sin recargar la tabla completa
  }

  logout(): void {
    this.authService.logout();
  }
  async desactivarProducto(prod: ProductoListItem): Promise<void> {
    const ok = await this.notification.confirm({
      title: '¿Desactivar Medicamento?',
      text: `¿Estás seguro de desactivar "${prod.nombre}"? Esta acción solo está permitida para SUPER_ADMIN.`,
      confirmText: 'Sí, Desactivar',
      type: 'danger',
    });
    if (!ok) return;

    this.productosService.deleteProducto(prod.productoId).subscribe({
      next: () => {
        this.notification.success('Medicamento Desactivado', `"${prod.nombre}" ha sido desactivado del catálogo.`);
      },
      error: (err) => {
        this.notification.error('Error al desactivar', err?.error?.message || 'No se pudo desactivar el medicamento');
      }
    });
  }
}
