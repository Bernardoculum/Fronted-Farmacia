import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportesService } from '../../core/services/reportes.service';
import { SucursalesService } from '../../core/services/sucursales.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { ReportExportService } from '../../core/services/report-export.service';
import {
  DashboardResponse,
  VentasSucursalesResponse,
  TopMedicamento,
  AlertasInventario,
} from '../../core/models/reportes.models';
import { SucursalOption } from '../../core/models/sucursal.models';

export type TabReporte = 'DASHBOARD' | 'VENTAS' | 'TOP_MEDS' | 'ALERTAS' | 'POWER_BI';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './reportes.component.html',
})
export class ReportesComponent implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly reportesService = inject(ReportesService);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly notification = inject(NotificationService);
  private readonly reportExportService = inject(ReportExportService);
  readonly authService = inject(AuthService);

  // Pestaña activa
  tabActiva = signal<TabReporte>('DASHBOARD');

  // State de datos
  loading = signal<boolean>(false);
  sucursales = signal<SucursalOption[]>([]);
  dashboard = signal<DashboardResponse | null>(null);
  ventasSucursales = signal<VentasSucursalesResponse | null>(null);
  topMedicamentos = signal<TopMedicamento[]>([]);
  alertasInventario = signal<AlertasInventario | null>(null);

  // Filtros de fecha y sucursal
  fechaInicio = signal<string>('');
  fechaFin = signal<string>('');
  selectedSucursal = signal<number | null>(null);
  filtroRapido = signal<string>('TODO');

  // URL del informe de Power BI (configurable / demostrativa)
  readonly powerBiUrl = signal<string>(
    localStorage.getItem('farma_powerbi_url') ||
      'https://app.powerbi.com/view?r=eyJrIjoiZGE0YWYwMTgtMGQyNy00ODU5LWExYjAtMWYxNWM1ZDRjYzllIiwidCI6IjNmMDEwYzY1LTVhNDQtNDFjZi05YTc1LTI5ZDAyOWU4ZGRlNCIsImMiOjR9'
  );

  readonly powerBiSafeUrl = computed<SafeResourceUrl>(() => {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.powerBiUrl());
  });

  readonly modalConfigPowerBi = signal<boolean>(false);
  readonly inputNuevaUrl = signal<string>('');

  // Nombre legible de la sucursal activa para reportes
  readonly nombreSucursalActiva = computed(() => {
    if (!this.authService.hasGlobalBranchAccess()) {
      return this.authService.currentUser()?.sucursal || 'Mi Sucursal';
    }
    const id = this.selectedSucursal();
    if (!id) return 'Consolidado Corporativo (Todas las Sucursales)';
    const suc = this.sucursales().find((s) => s.sucursalId === id);
    return suc ? suc.nombre : 'Sucursal #' + id;
  });

  // Texto descriptivo del rango de fechas
  readonly textoFiltroFechas = computed(() => {
    const fIni = this.fechaInicio();
    const fFin = this.fechaFin();
    if (fIni && fFin) return `Período: ${fIni} al ${fFin}`;
    if (fIni) return `Desde: ${fIni}`;
    if (fFin) return `Hasta: ${fFin}`;
    const rapido = this.filtroRapido();
    if (rapido === 'HOY') return 'Período: Solo Hoy';
    if (rapido === 'MES') return 'Período: Mes Actual';
    if (rapido === 'ANIO') return 'Período: Año Fiscal en Curso';
    return 'Período: Histórico Consolidado Completo';
  });

  ngOnInit(): void {
    if (!this.authService.hasGlobalBranchAccess() && this.authService.userSucursalId()) {
      this.selectedSucursal.set(this.authService.userSucursalId());
    }
    this.cargarSucursales();
    this.cargarReportes();
  }

  cargarSucursales(): void {
    this.sucursalesService.cargarListaCombo().subscribe({
      next: (list) => this.sucursales.set(list || []),
    });
  }

  cargarReportes(): void {
    this.loading.set(true);
    const fIni = this.fechaInicio() || undefined;
    const fFin = this.fechaFin() || undefined;
    const sucId = this.selectedSucursal() || undefined;

    this.reportesService.getDashboard(fIni, fFin, sucId).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.reportesService.getVentasSucursales(fIni, fFin, sucId).subscribe({
      next: (data) => this.ventasSucursales.set(data),
    });

    this.reportesService.getTopMedicamentos(15, sucId).subscribe({
      next: (data) => this.topMedicamentos.set(data),
    });

    this.reportesService.getAlertasInventario(sucId).subscribe({
      next: (data) => this.alertasInventario.set(data),
    });
  }

  setRangoRapido(tipo: string): void {
    this.filtroRapido.set(tipo);
    const hoy = new Date();
    if (tipo === 'HOY') {
      const hoyStr = hoy.toISOString().substring(0, 10);
      this.fechaInicio.set(hoyStr);
      this.fechaFin.set(hoyStr);
    } else if (tipo === 'MES') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().substring(0, 10);
      const hoyStr = hoy.toISOString().substring(0, 10);
      this.fechaInicio.set(primerDia);
      this.fechaFin.set(hoyStr);
    } else if (tipo === 'ANIO') {
      const primerDia = new Date(hoy.getFullYear(), 0, 1).toISOString().substring(0, 10);
      const hoyStr = hoy.toISOString().substring(0, 10);
      this.fechaInicio.set(primerDia);
      this.fechaFin.set(hoyStr);
    } else {
      this.fechaInicio.set('');
      this.fechaFin.set('');
    }
    this.cargarReportes();
  }

  onFiltroChange(): void {
    this.filtroRapido.set('CUSTOM');
    this.cargarReportes();
  }

  cambiarTab(tab: TabReporte): void {
    this.tabActiva.set(tab);
  }

  /**
   * Abre Power BI en pantalla completa en una nueva pestaña
   */
  
  abrirConfiguracionPowerBi(): void {
    this.inputNuevaUrl.set(this.powerBiUrl());
    this.modalConfigPowerBi.set(true);
  }

  cerrarConfiguracionPowerBi(): void {
    this.modalConfigPowerBi.set(false);
  }

  guardarUrlPowerBi(): void {
    const url = this.inputNuevaUrl().trim();
    if (url) {
      this.powerBiUrl.set(url);
      localStorage.setItem('farma_powerbi_url', url);
      this.notification.success('Enlace Actualizado', 'El reporte interactivo de Power BI ha sido vinculado exitosamente.');
    }
    this.modalConfigPowerBi.set(false);
  }

  restablecerUrlDemo(): void {
    const demoUrl =
      'https://app.powerbi.com/view?r=eyJrIjoiZGE0YWYwMTgtMGQyNy00ODU5LWExYjAtMWYxNWM1ZDRjYzllIiwidCI6IjNmMDEwYzY1LTVhNDQtNDFjZi05YTc1LTI5ZDAyOWU4ZGRlNCIsImMiOjR9';
    this.powerBiUrl.set(demoUrl);
    localStorage.removeItem('farma_powerbi_url');
    this.notification.info('URL Restablecida', 'Se ha cargado la plantilla interactiva de demostración.');
    this.modalConfigPowerBi.set(false);
  }

  abrirPowerBi(): void {
    window.open(this.powerBiUrl(), '_blank');
  }

  /**
   * Imprime el reporte oficial según la pestaña activa con formato corporativo impecable
   */
  imprimirReporteActual(): void {
    const tab = this.tabActiva();
    const sucursal = this.nombreSucursalActiva();
    const filtros = this.textoFiltroFechas();
    const dash = this.dashboard();

    if (tab === 'DASHBOARD' || tab === 'POWER_BI') {
      const kpis = dash?.kpis;
      const ventasCanal = dash?.ventasPorCanal;
      const pos = ventasCanal?.['POS'] || { total: 0, cantidad: 0 };
      const call = ventasCanal?.['CALL_CENTER'] || { total: 0, cantidad: 0 };
      const web = ventasCanal?.['WEB'] || { total: 0, cantidad: 0 };

      this.reportExportService.imprimirReporteTabular({
        titulo: tab === 'POWER_BI' ? 'INFORME EJECUTIVO DE BUSINESS INTELLIGENCE (POWER BI)' : 'REPORTE CONSOLIDADO EJECUTIVO & BALANCE FINANCIERO',
        subtitulo: 'Resumen gerencial de ventas, rotación de medicamentos, canales y balance de activos',
        sucursal,
        filtrosAplicados: filtros,
        resumenKpis: [
          { titulo: 'Ventas Totales', valor: `Q ${(kpis?.totalVentas || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`, color: '#047857' },
          { titulo: 'Tickets Emitidos', valor: (kpis?.totalOrdenes || 0).toString(), color: '#0284c7' },
          { titulo: 'Ticket Promedio', valor: `Q ${(kpis?.ticketPromedio || 0).toFixed(2)}`, color: '#4338ca' },
          { titulo: 'Valor Inventario', valor: `Q ${(kpis?.valorInventario || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`, color: '#0d9488' },
          { titulo: 'Carga Nómina', valor: `Q ${(kpis?.totalNominas || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`, color: '#b45309' },
          { titulo: 'Activos Fijos', valor: `Q ${(kpis?.valorActivos || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`, color: '#7e22ce' },
        ],
        columnas: ['Canal / Concepto', 'Tipo de Operación', 'Cantidad de Órdenes', 'Total Recaudado (Q)', 'Participación (%)'],
        filas: [
          ['POS Mostrador', 'Venta en Mostrador Presencial', pos.cantidad, `Q ${pos.total.toFixed(2)}`, kpis?.totalVentas ? `${((pos.total / kpis.totalVentas) * 100).toFixed(1)}%` : '0%'],
          ['Call Center', 'Despacho Asistido a Domicilio', call.cantidad, `Q ${call.total.toFixed(2)}`, kpis?.totalVentas ? `${((call.total / kpis.totalVentas) * 100).toFixed(1)}%` : '0%'],
          ['Plataforma Web', 'Venta Digital / En Línea', web.cantidad, `Q ${web.total.toFixed(2)}`, kpis?.totalVentas ? `${((web.total / kpis.totalVentas) * 100).toFixed(1)}%` : '0%'],
        ],
        totales: [
          { label: 'Total Órdenes', valor: kpis?.totalOrdenes || 0 },
          { label: 'Gran Total Recaudado', valor: `Q ${(kpis?.totalVentas || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}` },
        ],
      });
    } else if (tab === 'VENTAS') {
      const data = this.ventasSucursales()?.data || [];
      const totalGlobal = this.ventasSucursales()?.totalGlobal || 0;
      const totalPedidos = data.reduce((acc, curr) => acc + (curr.pedidosCount || 0), 0);

      this.reportExportService.imprimirReporteTabular({
        titulo: 'REPORTE DE RENDIMIENTO & VENTAS POR SUCURSAL',
        subtitulo: 'Participación porcentual y volumen financiero por punto de atención farmacéutico',
        sucursal,
        filtrosAplicados: filtros,
        columnas: ['No.', 'Sucursal', 'Órdenes Atendidas', 'Total Ventas (Q)', 'Ticket Promedio (Q)', 'Participación (%)'],
        filas: data.map((s, idx) => {
          const prom = s.pedidosCount > 0 ? s.total / s.pedidosCount : 0;
          return [
            idx + 1,
            s.nombre,
            s.pedidosCount,
            `Q ${s.total.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
            `Q ${prom.toFixed(2)}`,
            `${(s.porcentaje || 0).toFixed(1)}%`,
          ];
        }),
        totales: [
          { label: 'Total Órdenes', valor: totalPedidos },
          { label: 'Ventas Totales Red', valor: `Q ${totalGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}` },
        ],
      });
    } else if (tab === 'TOP_MEDS') {
      const meds = this.topMedicamentos();
      const totalUnidades = meds.reduce((acc, m) => acc + (m.unidades || 0), 0);
      const totalMonto = meds.reduce((acc, m) => acc + (m.recaudacion || 0), 0);

      this.reportExportService.imprimirReporteTabular({
        titulo: 'REPORTE DE ROTACIÓN & TOP MEDICAMENTOS MÁS DEMANDADOS',
        subtitulo: 'Ranking de productos con mayor rotación e ingresos generados en el período',
        sucursal,
        filtrosAplicados: filtros,
        columnas: ['Puesto', 'Código', 'Medicamento / Presentación', 'Unidades Vendidas', 'Ingreso Acumulado (Q)'],
        filas: meds.map((m, idx) => [
          `#${idx + 1}`,
          m.codigo,
          m.nombre,
          m.unidades,
          `Q ${m.recaudacion.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
        ]),
        totales: [
          { label: 'Unidades Vendidas', valor: totalUnidades },
          { label: 'Total Ingresos Top', valor: `Q ${totalMonto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}` },
        ],
      });
    } else if (tab === 'ALERTAS') {
      const al = this.alertasInventario();
      this.reportExportService.imprimirReporteTabular({
        titulo: 'REPORTE DE SEMÁFORO DE EXISTENCIAS & CONTROL CADUCIDAD (FEFO)',
        subtitulo: 'Monitoreo de niveles de stock y riesgo de vencimiento en almacén y farmacias',
        sucursal,
        filtrosAplicados: filtros,
        resumenKpis: [
          { titulo: 'Stock Óptimo', valor: (al?.optimos || 0).toString(), color: '#047857' },
          { titulo: 'Por Vencer (<60d)', valor: (al?.porVencer || 0).toString(), color: '#b45309' },
          { titulo: 'Bajo Punto Reorden', valor: (al?.stockBajo || 0).toString(), color: '#e11d48' },
          { titulo: 'Lotes Vencidos', valor: (al?.vencidos || 0).toString(), color: '#475569' },
        ],
        columnas: ['Semáforo', 'Condición Operativa', 'Regla de Salud Pública', 'Lotes Afectados', 'Acción Sugerida'],
        filas: [
          ['🟢 Óptimo', 'Stock Vigente y Suficiente', 'FEFO Regular', al?.optimos || 0, 'Dispensación normal al paciente'],
          ['🟡 Por Vencer', 'Vencimiento próximo (< 60 días)', 'Prioridad FEFO Inmediata', al?.porVencer || 0, 'Promover rotación o transferir a sede de alta rotación'],
          ['🔴 Stock Bajo', 'Existencias por debajo del mínimo', 'Riesgo de Desabastecimiento', al?.stockBajo || 0, 'Generar orden de compra o transferencia inter-sucursal'],
          ['⚫ Vencido', 'Fecha de caducidad superada', 'Bloqueo Sanitario Total', al?.vencidos || 0, 'Cuarentena y proceso de baja oficial'],
        ],
      });
    }
  }

  /**
   * Exporta la data activa a formato CSV compatible con Microsoft Excel
   */
  exportarCsvActual(): void {
    const tab = this.tabActiva();

    if (tab === 'DASHBOARD' || tab === 'POWER_BI') {
      const kpis = this.dashboard()?.kpis;
      const headers = ['Métrica / Indicador', 'Valor Registrado'];
      const rows = [
        ['Ventas Totales (Q)', kpis?.totalVentas || 0],
        ['Total Órdenes / Tickets', kpis?.totalOrdenes || 0],
        ['Ticket Promedio (Q)', kpis?.ticketPromedio || 0],
        ['Valor Total de Inventario (Q)', kpis?.valorInventario || 0],
        ['Carga Nómina Total (Q)', kpis?.totalNominas || 0],
        ['Valor Activos Fijos (Q)', kpis?.valorActivos || 0],
      ];
      this.reportExportService.exportarCsv('Reporte_Ejecutivo_Dashboard', headers, rows);
    } else if (tab === 'VENTAS') {
      const data = this.ventasSucursales()?.data || [];
      const headers = ['ID Sucursal', 'Nombre Sucursal', 'Órdenes Atendidas', 'Total Ventas (Q)', 'Participación (%)'];
      const rows = data.map((s) => [s.id, s.nombre, s.pedidosCount, s.total, (s.porcentaje || 0).toFixed(2)]);
      this.reportExportService.exportarCsv('Reporte_Ventas_Por_Sucursal', headers, rows);
    } else if (tab === 'TOP_MEDS') {
      const meds = this.topMedicamentos();
      const headers = ['Posición', 'Código', 'Medicamento', 'Unidades Vendidas', 'Recaudación Acumulada (Q)'];
      const rows = meds.map((m, idx) => [idx + 1, m.codigo, m.nombre, m.unidades, m.recaudacion]);
      this.reportExportService.exportarCsv('Reporte_Top_Medicamentos', headers, rows);
    } else if (tab === 'ALERTAS') {
      const al = this.alertasInventario();
      const headers = ['Categoría Semáforo', 'Cantidad de Lotes', 'Criterio'];
      const rows = [
        ['Stock Óptimo', al?.optimos || 0, 'Vigente con rotación FEFO normal'],
        ['Por Vencer', al?.porVencer || 0, 'Menor a 60 días para caducidad'],
        ['Stock Bajo', al?.stockBajo || 0, 'Existencias por debajo del punto de reorden'],
        ['Vencidos', al?.vencidos || 0, 'Caducados y bloqueados sanitariamente'],
      ];
      this.reportExportService.exportarCsv('Reporte_Semaforo_Inventario', headers, rows);
    }

    this.notification.success('Exportación Exitosa', 'El archivo CSV compatible con Excel ha sido descargado.');
  }
}
