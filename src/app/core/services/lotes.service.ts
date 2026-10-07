import { environment } from '../../../environments/environment';
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  LoteItem,
  CreateLoteDto,
  UpdateLoteDto,
  FilterLoteParams,
  PaginatedLotesResponse,
} from '../models/lote.models';

@Injectable({
  providedIn: 'root',
})
export class LotesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lotes`;

  // Signals reactivos de paginación y datos
  readonly lotes = signal<LoteItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly totalItems = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly currentFilters = signal<FilterLoteParams>({});

  // KPIs globales computados a nivel de servidor (COUNT queries SQL)
  readonly kpiTotal = signal<number>(0);
  readonly kpiVigentes = signal<number>(0);
  readonly kpiPorVencer = signal<number>(0);
  readonly kpiVencidos = signal<number>(0);

  readonly totalLotes = computed(() => this.kpiTotal() || this.totalItems());
  readonly countVigentes = computed(() => this.kpiVigentes());
  readonly countPorVencer = computed(() => this.kpiPorVencer());
  readonly countVencidos = computed(() => this.kpiVencidos());

  /**
   * Carga la lista paginada de lotes con filtros y semáforo de caducidad (OFFSET / FETCH).
   */
  cargarLotes(filters: FilterLoteParams = {}): Observable<any> {
    this.loading.set(true);
    const merged = { ...this.currentFilters(), ...filters };
    this.currentFilters.set(merged);

    const page = merged.page || this.currentPage();
    const limit = merged.limit || this.pageSize();

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (merged.search?.trim()) {
      params = params.set('search', merged.search.trim());
    }
    if (merged.productoId) {
      params = params.set('productoId', merged.productoId.toString());
    }
    if (merged.sucursalId) {
      params = params.set('sucursalId', merged.sucursalId.toString());
    }
    if (merged.estadoVencimiento && merged.estadoVencimiento !== 'TODOS') {
      params = params.set('estadoVencimiento', merged.estadoVencimiento);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          if (res && res.data && Array.isArray(res.data)) {
            this.lotes.set(res.data);
            this.totalItems.set(res.total || 0);
            this.currentPage.set(res.page || 1);
            this.pageSize.set(res.limit || 10);
            this.totalPages.set(res.totalPages || 1);
            if (res.kpis) {
              this.kpiTotal.set(res.kpis.total || 0);
              this.kpiVigentes.set(res.kpis.vigentes || 0);
              this.kpiPorVencer.set(res.kpis.porVencer || 0);
              this.kpiVencidos.set(res.kpis.vencidos || 0);
            }
          } else if (Array.isArray(res)) {
            this.lotes.set(res);
            this.totalItems.set(res.length);
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      })
    );
  }

  getLoteById(id: number): Observable<LoteItem> {
    return this.http.get<LoteItem>(`${this.apiUrl}/${id}`);
  }

  createLotesBatch(items: CreateLoteDto[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/batch`, items).pipe(
      tap(() => this.cargarLotes(this.currentFilters()).subscribe())
    );
  }

  createLote(dto: CreateLoteDto): Observable<any> {
    return this.http.post(this.apiUrl, dto).pipe(
      tap(() => this.cargarLotes(this.currentFilters()).subscribe())
    );
  }

  updateLote(id: number, dto: UpdateLoteDto): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, dto).pipe(
      tap(() => this.cargarLotes(this.currentFilters()).subscribe())
    );
  }

  darDeBajaLote(id: number, motivo?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/dar-de-baja`, { motivo }).pipe(
      tap(() => this.cargarLotes(this.currentFilters()).subscribe())
    );
  }
}
