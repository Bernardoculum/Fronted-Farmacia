import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { KardexService } from '../../core/services/kardex.service';
import { ReportExportService } from '../../core/services/report-export.service';
import { SucursalesService } from '../../core/services/sucursales.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { FormatEnumPipe } from '../../shared/pipes/format-enum.pipe';
import { MovimientoKardexItem } from '../../core/models/kardex.models';
import { AjusteInventarioModalComponent } from './ajuste-inventario-modal.component';
import { KardexDetalleModalComponent } from './kardex-detalle-modal.component';

@Component({
  selector: 'app-kardex',
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
  templateUrl: './kardex.component.html',
})
export class KardexComponent implements OnInit {
  readonly kardexService = inject(KardexService);
  readonly authService = inject(AuthService);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly dialog = inject(MatDialog);
  private readonly reportExportService = inject(ReportExportService);
  private readonly notification = inject(NotificationService);

  // Estados locales de filtros
  readonly searchTerm = signal<string>('');
  readonly selectedSucursalId = signal<number | null>(null);
  readonly filtroTipo = signal<string>('TODOS');
  readonly filtroReferencia = signal<string>('');
  readonly sucursales = signal<any[]>([]);

  ngOnInit(): void {
    if (!this.authService.hasGlobalBranchAccess() && this.authService.userSucursalId()) {
      this.selectedSucursalId.set(this.authService.userSucursalId());
    }
    this.cargarDatos();
    if (this.authService.hasGlobalBranchAccess()) {
      this.cargarSucursales();
    }
  }

  cargarDatos(): void {
    const sucId = this.authService.hasGlobalBranchAccess()
      ? this.selectedSucursalId()
      : this.authService.userSucursalId();
    this.kardexService
      .cargarMovimientos({
        page: 1,
        limit: 10,
        sucursalId: sucId !== null ? sucId : undefined,
        search: this.searchTerm() || undefined,
        tipoMovimiento: this.filtroTipo() !== 'TODOS' ? this.filtroTipo() : undefined,
        referenciaTipo: this.filtroReferencia() || undefined,
      })
      .subscribe();
  }

  cargarSucursales(): void {
    // Cargar combo de sucursales con soporte para lista o respuesta paginada
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
      error: () => {
        this.sucursalesService.cargarSucursales().subscribe({
          next: (dataRes) => {
            const list = Array.isArray(dataRes) ? dataRes : (dataRes?.data || []);
            this.sucursales.set(list);
          },
        });
      },
    });
  }

  setFiltroTipo(tipo: string): void {
    this.filtroTipo.set(tipo);
    this.filtroReferencia.set('');
    this.cargarDatos();
  }

  setFiltroReferencia(ref: string): void {
    this.filtroReferencia.set(ref);
    this.filtroTipo.set('TODOS');
    this.cargarDatos();
  }

  onSearchChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
    this.cargarDatos();
  }

  onSucursalChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    const sucId = val ? Number(val) : null;
    this.selectedSucursalId.set(sucId);
    this.cargarDatos();
  }

  limpiarFiltros(): void {
    this.searchTerm.set('');
    if (this.authService.hasGlobalBranchAccess()) {
      this.selectedSucursalId.set(null);
    } else {
      this.selectedSucursalId.set(this.authService.userSucursalId());
    }
    this.filtroTipo.set('TODOS');
    this.filtroReferencia.set('');
    this.cargarDatos();
  }

  onPageChange(event: PageEvent): void {
    const sucId = this.authService.hasGlobalBranchAccess()
      ? this.selectedSucursalId()
      : this.authService.userSucursalId();
    this.kardexService
      .cargarMovimientos({
        page: event.pageIndex + 1,
        limit: event.pageSize,
        sucursalId: sucId !== null ? sucId : undefined,
        search: this.searchTerm() || undefined,
        tipoMovimiento: this.filtroTipo() !== 'TODOS' ? this.filtroTipo() : undefined,
        referenciaTipo: this.filtroReferencia() || undefined,
      })
      .subscribe();
  }

  verDetalle(m: MovimientoKardexItem): void {
    this.dialog.open(KardexDetalleModalComponent, {
      width: '560px',
      maxWidth: '95vw',
      disableClose: false,
      data: m,
    });
  }

  abrirModalAjuste(): void {
    const ref = this.dialog.open(AjusteInventarioModalComponent, {
      width: '540px',
      maxWidth: '95vw',
      disableClose: false,
      hasBackdrop: true,
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.cargarDatos();
    });
  }

  imprimirKardex(): void {
    const sucNombre = this.selectedSucursalId()
      ? this.sucursales().find((s) => s.sucursalId === this.selectedSucursalId())?.nombre || 'Específica'
      : (this.authService.hasGlobalBranchAccess() ? 'Consolidado Corporativo (Todas las Sucursales)' : (this.authService.currentUser()?.sucursal || 'Mi Sucursal'));

    const tipoMov = this.filtroTipo() === 'TODOS' ? 'Todos los Movimientos' : this.filtroTipo();
    const refMov = this.filtroReferencia() ? 'Referencia: ' + this.filtroReferencia() : 'Todas las Referencias';
    const searchTxt = this.searchTerm() ? 'Búsqueda: "' + this.searchTerm() + '"' : 'Sin búsqueda de texto';
    const filtros = `Sucursal: ${sucNombre} | Tipo: ${tipoMov} | ${refMov} | ${searchTxt}`;

    const movimientos = this.kardexService.movimientos();
    const columnas = ['ID Mov.', 'Fecha y Hora', 'Medicamento / Código', 'Sucursal Custodia', 'No. Lote', 'Tipo', 'Cantidad', 'Saldo Resultante', 'Referencia / Documento'];

    let totalEntradas = 0;
    let totalSalidas = 0;

    const filas = movimientos.map((m) => {
      const fecha = new Date(m.fechaMovimiento).toLocaleString('es-GT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const esEntrada = m.tipoMovimiento === 'ENTRADA';
      if (esEntrada) totalEntradas += Number(m.cantidad) || 0;
      else totalSalidas += Number(m.cantidad) || 0;

      return [
        `#${m.movimientoInventarioId}`,
        fecha,
        `${m.medicamento} (${m.codigoProducto || 'N/A'})`,
        m.sucursal,
        m.numeroLote || 'N/A',
        m.tipoMovimiento,
        `${esEntrada ? '+' : '-'}${m.cantidad}`,
        m.cantidadNueva,
        m.referenciaTipo || 'General',
      ];
    });

    this.reportExportService.imprimirReporteTabular({
      titulo: 'LIBRO MAYOR DE KARDEX & AUDITORÍA DE MOVIMIENTOS',
      subtitulo: 'Trazabilidad inmutable de entradas, salidas y saldos en tiempo real',
      sucursal: sucNombre,
      filtrosAplicados: filtros,
      resumenKpis: [
        { titulo: 'Total Movimientos', valor: movimientos.length.toString(), color: '#0f172a' },
        { titulo: 'Unidades Ingresadas (+)', valor: totalEntradas.toString(), color: '#047857' },
        { titulo: 'Unidades Egresadas (-)', valor: totalSalidas.toString(), color: '#b91c1c' },
      ],
      columnas,
      filas,
      totales: [
        { label: 'Ingresos (+)', valor: totalEntradas },
        { label: 'Egresos (-)', valor: totalSalidas },
      ],
    });
  }

  exportarCsvKardex(): void {
    const movimientos = this.kardexService.movimientos();
    const encabezados = [
      'ID Movimiento',
      'Fecha Movimiento',
      'Medicamento',
      'Código Producto',
      'Sucursal',
      'No. Lote',
      'Tipo Movimiento',
      'Cantidad',
      'Saldo Resultante',
      'Tipo Referencia',
    ];
    const filas = movimientos.map((m) => [
      m.movimientoInventarioId,
      m.fechaMovimiento,
      m.medicamento,
      m.codigoProducto || '',
      m.sucursal,
      m.numeroLote || '',
      m.tipoMovimiento,
      m.cantidad,
      m.cantidadNueva,
      m.referenciaTipo || '',
    ]);

    this.reportExportService.exportarCsv('Libro_Mayor_Kardex', encabezados, filas);
    this.notification.success('Exportación Exitosa', 'El archivo CSV de Kardex ha sido descargado correctamente.');
  }
}
