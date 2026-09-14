import { environment } from '../../../environments/environment';
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  LoteItem,
  CreateLoteDto,
  UpdateLoteDto,
  FilterLoteParams,
} from '../models/lote.models';

@Injectable({
  providedIn: 'root',
})
export class LotesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lotes`;

  // Signals reactivos
  readonly lotes = signal<LoteItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly currentFilters = signal<FilterLoteParams>({});

  // KPIs computados reactivos
  readonly totalLotes = computed(() => this.lotes().length);
  readonly countVigentes = computed(
    () => this.lotes().filter((l) => l.estadoVencimiento === 'VIGENTE').length
  );
  readonly countPorVencer = computed(
    () => this.lotes().filter((l) => l.estadoVencimiento === 'POR_VENCER').length
  );
  readonly countVencidos = computed(
    () => this.lotes().filter((l) => l.estadoVencimiento === 'VENCIDO').length
  );

  /**
   * Carga la lista de lotes con filtros y semáforo de caducidad.
   */
  cargarLotes(filters: FilterLoteParams = {}): Observable<LoteItem[]> {
    this.loading.set(true);
    this.currentFilters.set(filters);

    let params = new HttpParams();
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.productoId) {
      params = params.set('productoId', filters.productoId.toString());
    }
    if (filters.sucursalId) {
      params = params.set('sucursalId', filters.sucursalId.toString());
    }
    if (filters.estadoVencimiento && filters.estadoVencimiento !== 'TODOS') {
      params = params.set('estadoVencimiento', filters.estadoVencimiento);
    }

    return this.http.get<LoteItem[]>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          this.lotes.set(res || []);
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
}
