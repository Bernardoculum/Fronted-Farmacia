import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuditoriaService } from '../../core/services/auditoria.service';
import { AuditoriaItem, AuditoriaKPIs, CatalogosFiltros } from '../../core/models/auditoria.models';
import { FormatEnumPipe } from '../../shared/pipes/format-enum.pipe';
import { AuditoriaDetalleModalComponent } from './auditoria-detalle-modal.component';

@Component({
  selector: 'app-auditoria',
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
  templateUrl: './auditoria.component.html',
})
export class AuditoriaComponent implements OnInit {
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly dialog = inject(MatDialog);

  // State
  eventos = signal<AuditoriaItem[]>([]);
  kpis = signal<AuditoriaKPIs>({
    total: 0,
    logins: 0,
    inserts: 0,
    updates: 0,
    ajustes: 0,
  });
  catalogos = signal<CatalogosFiltros>({
    tablas: [],
    operaciones: [],
    usuarios: [],
  });
  loading = signal<boolean>(false);

  // Filtros
  searchTerm = signal<string>('');
  filtroTabla = signal<string>('TODAS');
  filtroOperacion = signal<string>('TODAS');
  filtroUsuario = signal<string>('TODOS');
  fechaInicio = signal<string>('');
  fechaFin = signal<string>('');

  // Paginación
  page = signal<number>(1);
  limit = signal<number>(10);
  total = signal<number>(0);

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarEventos();
  }

  cargarCatalogos(): void {
    this.auditoriaService.getCatalogos().subscribe({
      next: (res) => this.catalogos.set(res),
    });
  }

  cargarEventos(): void {
    this.loading.set(true);
    this.auditoriaService
      .getEventos({
        page: this.page(),
        limit: this.limit(),
        tablaAfectada: this.filtroTabla(),
        operacion: this.filtroOperacion(),
        usuario: this.filtroUsuario(),
        fechaInicio: this.fechaInicio() || undefined,
        fechaFin: this.fechaFin() || undefined,
        search: this.searchTerm() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.eventos.set(res.data || []);
          this.total.set(res.total || 0);
          if (res.kpis) this.kpis.set(res.kpis);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch(): void {
    this.page.set(1);
    this.cargarEventos();
  }

  filtrarPorOperacion(op: string): void {
    this.filtroOperacion.set(op);
    this.page.set(1);
    this.cargarEventos();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.cargarEventos();
  }

  limpiarFiltros(): void {
    this.filtroTabla.set('TODAS');
    this.filtroOperacion.set('TODAS');
    this.filtroUsuario.set('TODOS');
    this.fechaInicio.set('');
    this.fechaFin.set('');
    this.searchTerm.set('');
    this.page.set(1);
    this.cargarEventos();
  }

  verDetalle(ev: AuditoriaItem): void {
    this.dialog.open(AuditoriaDetalleModalComponent, {
      width: '560px',
      maxWidth: '95vw',
      disableClose: false,
      data: ev,
    });
  }

  getBadgeOperacionClass(op: string): string {
    switch (op) {
      case 'LOGIN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LOGIN_FALLIDO':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'INSERT':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'UPDATE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'AJUSTE_MANUAL':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DELETE':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  imprimirBitacora(): void {
    const usuarioFiltro = this.filtroUsuario() === 'TODOS' ? 'Todos los Usuarios' : '@' + this.filtroUsuario();
    const opFiltro = this.filtroOperacion() === 'TODAS' ? 'Todas las Operaciones' : this.filtroOperacion();
    const tablaFiltro = this.filtroTabla() === 'TODAS' ? 'Todas las Tablas' : this.filtroTabla();
    const fechasFiltro = this.fechaInicio() || this.fechaFin()
      ? 'Rango: ' + (this.fechaInicio() || 'Inicio') + ' al ' + (this.fechaFin() || 'Hoy')
      : 'Histórico completo';
    const busquedaTexto = this.searchTerm() ? 'Búsqueda: "' + this.searchTerm() + '"' : 'Sin texto de búsqueda';

    const fechaHoy = new Date().toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const filasHtml = this.eventos()
      .map(
        (ev) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 6px 8px; font-weight: bold; color: #0f172a;">#${ev.auditoriaId}</td>
          <td style="padding: 6px 8px; white-space: nowrap; color: #475569;">${new Date(ev.fechaEvento).toLocaleString('es-GT')}</td>
          <td style="padding: 6px 8px; font-weight: 700; color: #0f172a;">@${ev.usuarioBd}</td>
          <td style="padding: 6px 8px;">
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; border: 1px solid #cbd5e1; background: #f8fafc;">
              ${ev.operacion}
            </span>
          </td>
          <td style="padding: 6px 8px; font-weight: 600; color: #1e293b;">${ev.tablaAfectada} (${ev.modulo || 'Sistema'})</td>
          <td style="padding: 6px 8px; font-family: monospace; font-size: 10px; color: #475569;">${ev.ipCliente || '127.0.0.1'}</td>
          <td style="padding: 6px 8px; color: #334155;">${ev.descripcion || 'Sin detalle adicional'}</td>
        </tr>
      `
      )
      .join('');

    const ventana = window.open('', '_blank', 'width=950,height=700');
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bitácora Forense de Seguridad y Auditoría</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 20px; color: #0f172a; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; }
            .filtros-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 11px; margin-bottom: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f1f5f9; color: #475569; font-size: 10px; text-transform: uppercase; padding: 7px 8px; border-bottom: 1px solid #cbd5e1; }
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
            <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">SISTEMA FARMACÉUTICO - BITÁCORA FORENSE DE SEGURIDAD</h2>
            <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Trazabilidad Inmutable, Accesos y Modificaciones de Operadores | Generado: ${fechaHoy}</div>
          </div>

          <div class="filtros-box">
            <strong>Filtros Activos Aplicados:</strong> Usuario: <span style="color: #059669; font-weight: bold;">${usuarioFiltro}</span> |
            Operación: <span style="color: #059669; font-weight: bold;">${opFiltro}</span> |
            Tabla: <span style="color: #059669; font-weight: bold;">${tablaFiltro}</span> |
            ${fechasFiltro} |
            ${busquedaTexto} |
            Total eventos: <strong>${this.eventos().length}</strong>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: left;">No.</th>
                <th style="text-align: left;">Fecha/Hora</th>
                <th style="text-align: left;">Operador</th>
                <th style="text-align: left;">Operación</th>
                <th style="text-align: left;">Tabla / Módulo</th>
                <th style="text-align: left;">IP Origen</th>
                <th style="text-align: left;">Detalle del Evento</th>
              </tr>
            </thead>
            <tbody>
              ${filasHtml || '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #94a3b8;">No hay registros con los filtros aplicados.</td></tr>'}
            </tbody>
          </table>

          <div style="margin-top: 40px; display: flex; justify-content: space-around; font-size: 11px; color: #475569; text-align: center;">
            <div style="border-top: 1px solid #cbd5e1; width: 220px; padding-top: 6px;">Oficial de Seguridad / Auditor</div>
            <div style="border-top: 1px solid #cbd5e1; width: 220px; padding-top: 6px;">Administrador del Sistema</div>
          </div>
        </body>
      </html>
    `);
    ventana.document.close();
  }
}
