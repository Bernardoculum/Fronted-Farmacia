import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CajaItem,
  SesionCajaItem,
  SesionDetalleResponse,
  FilterSesionCajaParams,
  PaginatedSesionesResponse,
  AbrirSesionDto,
  CerrarSesionDto,
  CreateMovimientoDto,
} from '../models/cajas.models';

@Injectable({
  providedIn: 'root',
})
export class CajasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cajas`;

  // Signals reactivos
  readonly sesiones = signal<SesionCajaItem[]>([]);
  readonly cajas = signal<CajaItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly totalItems = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly currentFilters = signal<FilterSesionCajaParams>({});

  // KPIs
  readonly kpiTotal = signal<number>(0);
  readonly kpiAbiertas = signal<number>(0);
  readonly kpiCuadresExactos = signal<number>(0);
  readonly kpiDescuadres = signal<number>(0);

  readonly totalSesiones = computed(() => this.kpiTotal() || this.totalItems());
  readonly countAbiertas = computed(() => this.kpiAbiertas());
  readonly countCuadresExactos = computed(() => this.kpiCuadresExactos());
  readonly countDescuadres = computed(() => this.kpiDescuadres());

  /**
   * Cargar lista paginada de sesiones de caja con cálculo server-side
   */
  cargarSesiones(filters: FilterSesionCajaParams = {}): Observable<PaginatedSesionesResponse> {
    this.loading.set(true);
    const merged = { ...this.currentFilters(), ...filters };
    this.currentFilters.set(merged);

    let params = new HttpParams()
      .set('page', (merged.page || 1).toString())
      .set('limit', (merged.limit || this.pageSize()).toString());

    if (merged.sucursalId) params = params.set('sucursalId', merged.sucursalId.toString());
    if (merged.cajaId) params = params.set('cajaId', merged.cajaId.toString());
    if (merged.estado && merged.estado !== 'TODOS') params = params.set('estado', merged.estado);
    if (merged.search) params = params.set('search', merged.search);
    if (merged.fechaDesde) params = params.set('fechaDesde', merged.fechaDesde);
    if (merged.fechaHasta) params = params.set('fechaHasta', merged.fechaHasta);

    return this.http.get<PaginatedSesionesResponse>(`${this.apiUrl}/sesiones`, { params }).pipe(
      tap({
        next: (res) => {
          this.sesiones.set(res.data || []);
          this.totalItems.set(res.total || 0);
          this.currentPage.set(res.page || 1);
          this.pageSize.set(res.limit || 10);
          this.totalPages.set(res.totalPages || 1);

          if (res.kpis) {
            this.kpiTotal.set(res.kpis.total || 0);
            this.kpiAbiertas.set(res.kpis.abiertas || 0);
            this.kpiCuadresExactos.set(res.kpis.cuadresExactos || 0);
            this.kpiDescuadres.set(res.kpis.descuadres || 0);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  /**
   * Cargar terminales físicas de cobro
   */
  cargarCajas(sucursalId?: number): Observable<CajaItem[]> {
    let params = new HttpParams();
    if (sucursalId) params = params.set('sucursalId', sucursalId.toString());

    return this.http.get<CajaItem[]>(this.apiUrl, { params }).pipe(
      tap((cajas) => this.cajas.set(cajas || []))
    );
  }

  /**
   * Detalle completo de una sesión
   */
  obtenerDetalleSesion(id: number): Observable<SesionDetalleResponse> {
    return this.http.get<SesionDetalleResponse>(`${this.apiUrl}/sesiones/${id}`);
  }

  /**
   * Apertura de turno
   */
  abrirSesion(dto: AbrirSesionDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/sesiones/apertura`, dto).pipe(
      tap(() => this.cargarSesiones(this.currentFilters()).subscribe())
    );
  }

  /**
   * Cierre y arqueo de turno
   */
  cerrarSesion(id: number, dto: CerrarSesionDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/sesiones/${id}/cierre`, dto).pipe(
      tap(() => this.cargarSesiones(this.currentFilters()).subscribe())
    );
  }

  /**
   * Movimiento manual de efectivo
   */
  registrarMovimiento(sesionId: number, dto: CreateMovimientoDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/sesiones/${sesionId}/movimientos`, dto).pipe(
      tap(() => this.cargarSesiones(this.currentFilters()).subscribe())
    );
  }
}
