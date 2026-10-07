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
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LotesService } from '../../core/services/lotes.service';
import { AuthService } from '../../core/services/auth.service';
import { LoteItem } from '../../core/models/lote.models';
import { LoteFormModalComponent } from './modals/lote-form-modal.component';
import { LoteDetalleModalComponent } from './modals/lote-detalle-modal.component';
import { NotificationService } from '../../core/services/notification.service';
import { SucursalesService } from '../../core/services/sucursales.service';
import { ReportExportService } from '../../core/services/report-export.service';

@Component({
  selector: 'app-lotes',
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
    MatDialogModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './lotes.component.html',
  styleUrl: './lotes.component.scss',
})
export class LotesComponent implements OnInit {
  readonly lotesService = inject(LotesService);
  readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly reportExportService = inject(ReportExportService);

  // Signals del servicio
  readonly lotes = this.lotesService.lotes;
  readonly loading = this.lotesService.loading;
  readonly totalLotes = this.lotesService.totalLotes;
  readonly countVigentes = this.lotesService.countVigentes;
  readonly countPorVencer = this.lotesService.countPorVencer;
  readonly countVencidos = this.lotesService.countVencidos;
  readonly user = this.authService.currentUser;
  readonly sucursalesService = inject(SucursalesService);
  readonly sucursales = this.sucursalesService.sucursales;
  readonly sucursalIdFilter = signal<number | null>(null);

  // Paginación Reactiva
  readonly totalItems = this.lotesService.totalItems;
  readonly pageSize = this.lotesService.pageSize;
  readonly pageIndex = computed(() => this.lotesService.currentPage() - 1);

  // Filtros locales
  readonly searchTerm = signal('');
  readonly estadoFilter = signal<'TODOS' | 'VIGENTE' | 'POR_VENCER' | 'VENCIDO'>('TODOS');

  readonly canManageLotes = computed(() => {
    return this.authService.isSuperAdmin() || (this.authService.isGerente() && this.authService.isCentralBranch());
  });

  readonly canDarDeBaja = computed(() => {
    return this.authService.isSuperAdmin() || this.authService.isGerente();
  });

  ngOnInit(): void {
    if (!this.authService.hasGlobalBranchAccess() && this.authService.userSucursalId()) {
      this.sucursalIdFilter.set(this.authService.userSucursalId());
    }
    this.cargarDatos();
    if (this.authService.hasGlobalBranchAccess()) {
      this.sucursalesService.cargarSucursales({ page: 1, limit: 50 }).subscribe();
    }
  }

  onPageChange(event: PageEvent): void {
    this.lotesService.currentPage.set(event.pageIndex + 1);
    this.lotesService.pageSize.set(event.pageSize);
    this.cargarDatos();
  }

  cargarDatos(): void {
    const effSucursalId = this.authService.hasGlobalBranchAccess()
      ? (this.sucursalIdFilter() || undefined)
      : (this.authService.userSucursalId() || undefined);

    this.lotesService.cargarLotes({
      search: this.searchTerm() || undefined,
      estadoVencimiento: this.estadoFilter(),
      sucursalId: effSucursalId,
      page: this.lotesService.currentPage(),
      limit: this.lotesService.pageSize(),
    }).subscribe();
  }

  onSucursalChange(sucursalId: number | null): void {
    this.sucursalIdFilter.set(sucursalId ? Number(sucursalId) : null);
    this.lotesService.currentPage.set(1);
    this.cargarDatos();
  }

  getStockEnSede(lote: LoteItem): number {
    if (lote.stockEnSede !== undefined && (!this.authService.hasGlobalBranchAccess() || this.sucursalIdFilter())) {
      return lote.stockEnSede;
    }
    const sucId = this.authService.hasGlobalBranchAccess()
      ? this.sucursalIdFilter()
      : this.authService.userSucursalId();
    if (!sucId) return lote.stockTotalLote;
    const inv = (lote.inventarios || []).find((i) => Number(i.sucursalId) === Number(sucId));
    return inv ? inv.disponible : (lote.stockTotalLote || 0);
  }

  async darDeBaja(lote: LoteItem): Promise<void> {
    const unidades = this.getStockEnSede(lote);
    if (unidades <= 0) {
      this.notification.warning(
        'Sin Existencias',
        'No hay existencias de este lote en tu sucursal para dar de baja.'
      );
      return;
    }

    const ok = await this.notification.confirm({
      title: '¿Dar de Baja Lote Caducado?',
      text: `Se retirarán ${unidades} cajas de "${lote.producto.nombre}" (Lote ${lote.numeroLote}) hacia merma sanitaria y se registrará la salida en Kardex.`,
      confirmText: 'Sí, Dar de Baja',
      type: 'danger',
    });
    if (!ok) return;

    this.lotesService.darDeBajaLote(lote.loteId).subscribe({
      next: (res: any) => {
        this.notification.success(
          'Baja Sanitaria Registrada',
          `Se retiraron ${res.totalUnidadesRetiradas} cajas hacia merma sanitaria (Pérdida: Q ${Number(res.costoPerdida || 0).toFixed(2)}).`
        );
        this.cargarDatos();
      },
      error: (err: any) => {
        this.notification.error('Error al dar de baja', err?.error?.message || 'No se pudo procesar la baja del lote');
      },
    });
  }

  verDetalleLote(lote: LoteItem): void {
    const ref = this.dialog.open(LoteDetalleModalComponent, {
      width: '740px',
      maxWidth: '95vw',
      data: lote,
    });
    ref.afterClosed().subscribe((updated: any) => {
      if (updated) {
        this.cargarDatos();
      }
    });
  }

  onSearchChange(val: string): void {
    this.searchTerm.set(val);
    this.cargarDatos();
  }

  setEstadoFilter(estado: 'TODOS' | 'VIGENTE' | 'POR_VENCER' | 'VENCIDO'): void {
    this.estadoFilter.set(estado);
    this.cargarDatos();
  }

  abrirCrearLote(): void {
    const ref = this.dialog.open(LoteFormModalComponent, {
      width: '860px',
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.cargarDatos();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  /**
   * Genera e imprime el reporte formal de lotes según los filtros activos y ámbito de sucursal
   */
  imprimirReporteLotes(): void {
    const estado = this.estadoFilter();
    let titulo = 'REPORTE GENERAL DE LOTES Y CONTROL DE VENCIMIENTOS (FEFO)';
    let subtitulo = 'Trazabilidad de existencias, tandas farmacéuticas y rotación por caducidad';
    if (estado === 'POR_VENCER') {
      titulo = 'REPORTE DE LOTES EN RIESGO DE CADUCIDAD (< 90 DÍAS)';
      subtitulo = 'Prioridad FEFO de dispensación y rotación urgente inter-sucursal';
    } else if (estado === 'VENCIDO') {
      titulo = 'REPORTE DE LOTES VENCIDOS (CUARENTENA & BAJA SANITARIA)';
      subtitulo = 'Medicamentos fuera de vigencia legal para retiro inmediato y baja contable';
    } else if (estado === 'VIGENTE') {
      titulo = 'REPORTE DE LOTES VIGENTES & CONFORMES EN INVENTARIO';
      subtitulo = 'Medicamentos con vigencia óptima certificados para dispensación';
    }

    const sucursalNombre = this.sucursalIdFilter()
      ? (this.sucursales().find((s) => s.sucursalId === this.sucursalIdFilter())?.nombre || 'Sucursal Seleccionada')
      : (!this.authService.hasGlobalBranchAccess() ? (this.authService.currentUser()?.sucursal || 'Mi Sucursal') : 'Consolidado Corporativo (Todas las Sucursales)');

    const filtros = `Estado: ${estado} | Búsqueda: ${this.searchTerm() || 'Todos los lotes'} | Ámbito: ${sucursalNombre}`;

    const listaLotes = this.lotes();
    const columnas = ['No. Lote', 'Medicamento', 'Código', 'Stock en Sede', 'Costo Unit. (Q)', 'Total Valuado (Q)', 'Fabricación', 'Vencimiento', 'Días Rest.', 'Estado'];

    let totalUnidades = 0;
    let totalValuado = 0;

    const filas = listaLotes.map((l) => {
      const stock = this.getStockEnSede(l);
      const costo = Number(l.costoUnitario) || 0;
      const subtotal = stock * costo;
      totalUnidades += stock;
      totalValuado += subtotal;

      return [
        l.numeroLote,
        l.producto?.nombre || 'Medicamento',
        l.producto?.codigoProducto || 'N/A',
        stock,
        `Q ${costo.toFixed(2)}`,
        `Q ${subtotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
        l.fechaFabricacion ? l.fechaFabricacion.slice(0, 10) : 'N/D',
        l.fechaVencimiento ? l.fechaVencimiento.slice(0, 10) : 'N/D',
        l.diasParaVencer !== undefined ? `${l.diasParaVencer}d` : 'N/D',
        l.estadoVencimiento,
      ];
    });

    this.reportExportService.imprimirReporteTabular({
      titulo,
      subtitulo,
      sucursal: sucursalNombre,
      filtrosAplicados: filtros,
      resumenKpis: [
        { titulo: 'Total Lotes en Lista', valor: listaLotes.length.toString(), color: '#0f172a' },
        { titulo: 'Total Unidades Físicas', valor: totalUnidades.toString(), color: '#0284c7' },
        { titulo: 'Total Invertido en Stock', valor: `Q ${totalValuado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`, color: '#047857' },
      ],
      columnas,
      filas,
      totales: [
        { label: 'Total Unidades', valor: totalUnidades },
        { label: 'Gran Total Valuado', valor: `Q ${totalValuado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}` },
      ],
    });
  }

  /**
   * Exporta la lista filtrada de lotes a formato Excel (CSV con UTF-8 BOM)
   */
  exportarCsvLotes(): void {
    const listaLotes = this.lotes();
    const encabezados = [
      'No. Lote',
      'Medicamento',
      'Código Producto',
      'Stock en Sede',
      'Costo Unitario (Q)',
      'Total Valuado (Q)',
      'Fecha Fabricación',
      'Fecha Vencimiento',
      'Días Restantes',
      'Estado Caducidad',
    ];
    const filas = listaLotes.map((l) => {
      const stock = this.getStockEnSede(l);
      const costo = Number(l.costoUnitario) || 0;
      return [
        l.numeroLote,
        l.producto?.nombre || '',
        l.producto?.codigoProducto || '',
        stock,
        costo,
        (stock * costo).toFixed(2),
        l.fechaFabricacion || '',
        l.fechaVencimiento || '',
        l.diasParaVencer ?? '',
        l.estadoVencimiento,
      ];
    });

    this.reportExportService.exportarCsv('Reporte_Lotes_FEFO', encabezados, filas);
    this.notification.success('Exportación Exitosa', 'El archivo CSV de lotes ha sido descargado correctamente.');
  }

}
