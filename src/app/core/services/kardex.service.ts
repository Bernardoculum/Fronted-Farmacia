import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MovimientoKardexItem,
  AuditoriaEventoItem,
  FilterKardexParams,
  PaginatedKardexResponse,
  PaginatedAuditoriaResponse,
  AjusteInventarioDto,
} from '../models/kardex.models';

@Injectable({
  providedIn: 'root',
})
export class KardexService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/kardex`;

  // Signals reactivos para Kardex
  readonly movimientos = signal<MovimientoKardexItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly totalItems = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly currentFilters = signal<FilterKardexParams>({});

  // KPIs
  readonly kpiTotal = signal<number>(0);
  readonly kpiEntradas = signal<number>(0);
  readonly kpiSalidas = signal<number>(0);
  readonly kpiMermas = signal<number>(0);

  // Auditoría Forense
  readonly auditoriaEventos = signal<AuditoriaEventoItem[]>([]);
  readonly loadingAuditoria = signal<boolean>(false);
  readonly totalAuditoria = signal<number>(0);

  /**
   * Cargar movimientos de Kardex
   */
  cargarMovimientos(filters: FilterKardexParams = {}): Observable<PaginatedKardexResponse> {
    this.loading.set(true);
    const merged = { ...this.currentFilters(), ...filters };
    this.currentFilters.set(merged);

    let params = new HttpParams()
      .set('page', (merged.page || 1).toString())
      .set('limit', (merged.limit || this.pageSize()).toString());

    if (merged.sucursalId) params = params.set('sucursalId', merged.sucursalId.toString());
    if (merged.productoId) params = params.set('productoId', merged.productoId.toString());
    if (merged.tipoMovimiento && merged.tipoMovimiento !== 'TODOS') params = params.set('tipoMovimiento', merged.tipoMovimiento);
    if (merged.referenciaTipo) params = params.set('referenciaTipo', merged.referenciaTipo);
    if (merged.search) params = params.set('search', merged.search);
    if (merged.fechaDesde) params = params.set('fechaDesde', merged.fechaDesde);
    if (merged.fechaHasta) params = params.set('fechaHasta', merged.fechaHasta);

    return this.http.get<PaginatedKardexResponse>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          this.movimientos.set(res.data || []);
          this.totalItems.set(res.total || 0);
          this.currentPage.set(res.page || 1);
          this.pageSize.set(res.limit || 10);
          this.totalPages.set(res.totalPages || 1);

          if (res.kpis) {
            this.kpiTotal.set(res.kpis.total || 0);
            this.kpiEntradas.set(res.kpis.entradas || 0);
            this.kpiSalidas.set(res.kpis.salidas || 0);
            this.kpiMermas.set(res.kpis.mermas || 0);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  /**
   * Cargar bitácora forense de auditoría
   */
  cargarAuditoria(page: number = 1, limit: number = 10, search?: string): Observable<PaginatedAuditoriaResponse> {
    this.loadingAuditoria.set(true);
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) params = params.set('search', search);

    return this.http.get<PaginatedAuditoriaResponse>(`${this.apiUrl}/auditoria-eventos`, { params }).pipe(
      tap({
        next: (res) => {
          this.auditoriaEventos.set(res.data || []);
          this.totalAuditoria.set(res.total || 0);
          this.loadingAuditoria.set(false);
        },
        error: () => this.loadingAuditoria.set(false),
      })
    );
  }

  /**
   * Registrar ajuste manual justificado
   */
  registrarAjuste(dto: AjusteInventarioDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/ajuste`, dto).pipe(
      tap(() => this.cargarMovimientos(this.currentFilters()).subscribe())
    );
  }
}
