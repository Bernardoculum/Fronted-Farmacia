import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivosService } from '../../core/services/activos.service';
import { SucursalesService } from '../../core/services/sucursales.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ActivoFijo, ActivosKPIs, CategoriaActivo } from '../../core/models/activos.models';
import { SucursalOption } from '../../core/models/sucursal.models';
import { FormatEnumPipe } from '../../shared/pipes/format-enum.pipe';
import { ActivoFormModalComponent } from './modals/activo-form-modal.component';
import { TrasladoActivoModalComponent } from './modals/traslado-activo-modal.component';
import { ActivoDetalleModalComponent } from './modals/activo-detalle-modal.component';

@Component({
  selector: 'app-activos',
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
  templateUrl: './activos.component.html',
})
export class ActivosComponent implements OnInit {
  private activosService = inject(ActivosService);
  private sucursalesService = inject(SucursalesService);
  private dialog = inject(MatDialog);
  private notification = inject(NotificationService);
  readonly authService = inject(AuthService);

  // State Signals
  activos = signal<ActivoFijo[]>([]);
  kpis = signal<ActivosKPIs>({
    total: 0,
    operativos: 0,
    enMantenimiento: 0,
    enTransito: 0,
    dadosDeBaja: 0,
    costoTotal: 0,
  });
  sucursales = signal<SucursalOption[]>([]);
  categorias = signal<CategoriaActivo[]>([]);
  loading = signal<boolean>(false);

  // Filter params
  selectedSucursal = signal<number | null>(null);
  selectedCategoria = signal<number | null>(null);
  filtroEstado = signal<string>('TODOS');
  searchTerm = signal<string>('');

  // Pagination
  page = signal<number>(1);
  limit = signal<number>(10);
  total = signal<number>(0);

  ngOnInit(): void {
    if (!this.authService.hasGlobalBranchAccess() && this.authService.userSucursalId()) {
      this.selectedSucursal.set(this.authService.userSucursalId());
    }
    this.cargarCatalogos();
    this.cargarActivos();
  }

  cargarCatalogos(): void {
    this.sucursalesService.cargarListaCombo().subscribe({ next: (list) => this.sucursales.set(list || []) });
    this.activosService.getCategorias().subscribe({
      next: (cats) => this.categorias.set(cats || []),
    });
  }

  cargarActivos(): void {
    this.loading.set(true);
    this.activosService
      .getActivos({
        page: this.page(),
        limit: this.limit(),
        sucursalId: this.authService.hasGlobalBranchAccess() ? (this.selectedSucursal() || undefined) : (this.authService.userSucursalId() || undefined),
        categoriaActivoId: this.selectedCategoria() || undefined,
        estado: this.filtroEstado(),
        search: this.searchTerm() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.activos.set(res.data || []);
          this.total.set(res.total || 0);
          if (res.kpis) this.kpis.set(res.kpis);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.activos.set([]);
          this.total.set(0);
        },
      });
  }

  onSearch(): void {
    this.page.set(1);
    this.cargarActivos();
  }

  limpiarFiltros(): void {
    this.searchTerm.set('');
    if (this.authService.hasGlobalBranchAccess()) {
      this.selectedSucursal.set(null);
    } else {
      this.selectedSucursal.set(this.authService.userSucursalId());
    }
    this.selectedCategoria.set(null);
    this.filtroEstado.set('TODOS');
    this.page.set(1);
    this.cargarActivos();
  }

  filtrarPorEstado(estado: string): void {
    this.filtroEstado.set(estado);
    this.page.set(1);
    this.cargarActivos();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.cargarActivos();
  }

  abrirNuevoActivo(): void {
    const ref = this.dialog.open(ActivoFormModalComponent, {
      width: '650px',
      maxWidth: '95vw',
      disableClose: false,
      hasBackdrop: true,
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.cargarActivos();
    });
  }

  abrirEditarActivo(activo: ActivoFijo): void {
    const ref = this.dialog.open(ActivoFormModalComponent, {
      width: '650px',
      maxWidth: '95vw',
      data: { activo },
      disableClose: false,
      hasBackdrop: true,
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.activos.update((lista) =>
          lista.map((item) => (item.id === res.id ? { ...item, ...res } : item))
        );
      }
    });
  }

  abrirTraslado(activo: ActivoFijo): void {
    const ref = this.dialog.open(TrasladoActivoModalComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { activo },
      disableClose: false,
      hasBackdrop: true,
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.cargarActivos();
    });
  }

  verDetalle(activo: ActivoFijo): void {
    this.dialog.open(ActivoDetalleModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      disableClose: false,
      hasBackdrop: true,
      data: { activoId: activo.id },
    });
  }

  async darDeBaja(activo: ActivoFijo): Promise<void> {
    const ok = await this.notification.confirm({
      title: '¿Dar de Baja Activo Fijo?',
      text: `¿Está seguro de desincorporar el activo "${activo.nombre}" (${activo.codigoActivo})? Si no desea continuar, presione Cancelar.`,
      confirmText: 'Sí, Dar de Baja',
      cancelText: 'Cancelar',
      type: 'danger',
    });

    if (!ok) return;

    this.activosService.darDeBaja(activo.id, { motivo: 'Desincorporación por obsolescencia o deterioro' }).subscribe({
      next: (res) => {
        this.notification.success('Activo Dado de Baja', `El activo "${res.nombre || activo.nombre}" fue desincorporado correctamente.`);
        this.cargarActivos();
      },
      error: (err) => {
        this.notification.error('Error al Dar de Baja', err?.error?.message || 'No se pudo dar de baja el activo.');
      },
    });
  }

  /**
   * Imprimir reporte patrimonial a base de los filtros activos
   */
  imprimirReporte(): void {
    const sucursalNombre = this.selectedSucursal()
      ? this.sucursales().find((s) => s.sucursalId === this.selectedSucursal())?.nombre || 'Específica'
      : 'Todas las Sucursales';
    const categoriaNombre = this.selectedCategoria()
      ? this.categorias().find((c) => c.id === this.selectedCategoria())?.nombre || 'Específica'
      : 'Todas las Categorías';
    const estadoNombre = this.filtroEstado() === 'TODOS' ? 'Todos los Estados' : this.filtroEstado();
    const busquedaTexto = this.searchTerm() ? `Búsqueda: "${this.searchTerm()}"` : 'Sin texto de búsqueda';

    const fechaHoy = new Date().toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const filasHtml = this.activos()
      .map(
        (a, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 6px 8px; text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="padding: 6px 8px; font-weight: bold; color: #0f172a;">${a.codigoActivo}</td>
          <td style="padding: 6px 8px;">
            <div style="font-weight: 600; color: #1e293b;">${a.nombre}</div>
            <div style="font-size: 10px; color: #64748b;">${a.marca || ''} ${a.modelo ? '(' + a.modelo + ')' : ''} ${a.numeroSerie ? '• S/N: ' + a.numeroSerie : ''}</div>
          </td>
          <td style="padding: 6px 8px; color: #334155;">${a.categoriaActivo?.nombre || 'General'}</td>
          <td style="padding: 6px 8px; color: #334155;">${a.sucursal?.nombre || 'Bodega Central'}</td>
          <td style="padding: 6px 8px; text-align: right; font-weight: bold; color: #0f172a;">Q ${(Number(a.costoAdquisicion) || 0).toFixed(2)}</td>
          <td style="padding: 6px 8px; text-align: right; color: #059669; font-weight: bold;">Q ${(Number(a.valorLibros) || 0).toFixed(2)}</td>
          <td style="padding: 6px 8px; text-align: center;">
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; border: 1px solid #cbd5e1; background: #f8fafc;">
              ${a.estado}
            </span>
          </td>
        </tr>
      `
      )
      .join('');

    const totalCosto = this.activos().reduce((acc, curr) => acc + (Number(curr.costoAdquisicion) || 0), 0);
    const totalLibros = this.activos().reduce((acc, curr) => acc + (Number(curr.valorLibros) || 0), 0);

    const ventana = window.open('', '_blank', 'width=900,height=650');
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte de Activos Fijos y Mobiliario</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 20px; color: #0f172a; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; }
            .filtros-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 11px; margin-bottom: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f1f5f9; color: #475569; font-size: 10px; text-transform: uppercase; padding: 7px 8px; border-bottom: 1px solid #cbd5e1; }
            .totales { margin-top: 14px; text-align: right; font-size: 12px; font-weight: bold; }
            @media print {
              .no-print { display: none; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 15px; display: flex; justify-content: flex-end; gap: 10px;">
            <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
              Imprimir Reporte
            </button>
            <button onclick="window.close()" style="background: #e2e8f0; color: #334155; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
              Cerrar
            </button>
          </div>

          <div class="header">
            <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">SISTEMA FARMACÉUTICO - REPORTE DE ACTIVOS FIJOS</h2>
            <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Control Patrimonial, Ubicaciones y Valor en Libros | Generado: ${fechaHoy}</div>
          </div>

          <div class="filtros-box">
            <strong>Filtros Activos Aplicados:</strong> Sucursal: <span style="color: #059669; font-weight: bold;">${sucursalNombre}</span> |
            Categoría: <span style="color: #059669; font-weight: bold;">${categoriaNombre}</span> |
            Estado: <span style="color: #059669; font-weight: bold;">${estadoNombre}</span> |
            ${busquedaTexto} |
            Total registros: <strong>${this.activos().length}</strong>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No.</th>
                <th style="text-align: left;">Código</th>
                <th style="text-align: left;">Activo / Especificaciones</th>
                <th style="text-align: left;">Categoría</th>
                <th style="text-align: left;">Sucursal</th>
                <th style="text-align: right;">Costo Orig.</th>
                <th style="text-align: right;">Valor Libros</th>
                <th style="text-align: center;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${filasHtml || '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #94a3b8;">No hay activos que coincidan con los filtros aplicados.</td></tr>'}
            </tbody>
          </table>

          <div class="totales">
            <div>Costo de Adquisición Total: <span style="color: #0f172a; margin-left: 10px;">Q ${totalCosto.toFixed(2)}</span></div>
            <div style="color: #059669; margin-top: 4px;">Valor en Libros Total Actual: <span style="margin-left: 10px;">Q ${totalLibros.toFixed(2)}</span></div>
          </div>

          <div style="margin-top: 40px; display: flex; justify-content: space-around; font-size: 11px; color: #475569; text-align: center;">
            <div style="border-top: 1px solid #cbd5e1; width: 220px; padding-top: 6px;">Responsable de Inventario Patrimonial</div>
            <div style="border-top: 1px solid #cbd5e1; width: 220px; padding-top: 6px;">Auditoría / Administración</div>
          </div>
        </body>
      </html>
    `);
    ventana.document.close();
  }
}
