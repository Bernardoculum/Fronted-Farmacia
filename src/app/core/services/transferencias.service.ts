import { environment } from '../../../environments/environment';
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  TransferenciaItem,
  TransferenciaKpis,
  CreateTransferenciaDto,
  DespacharTransferenciaDto,
  RecibirTransferenciaDto,
  FilterTransferenciaParams,
  PaginatedTransferenciasResponse,
} from '../models/transferencia.models';

@Injectable({
  providedIn: 'root',
})
export class TransferenciasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/transferencias`;

  // Signals reactivos
  readonly transferencias = signal<TransferenciaItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly totalItems = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly currentFilters = signal<FilterTransferenciaParams>({});

  // KPIs de Estado
  readonly kpis = signal<TransferenciaKpis>({
    total: 0,
    solicitadas: 0,
    enTransito: 0,
    recibidas: 0,
    canceladas: 0,
  });

  readonly kpiTotal = computed(() => this.kpis().total);
  readonly kpiSolicitadas = computed(() => this.kpis().solicitadas);
  readonly kpiEnTransito = computed(() => this.kpis().enTransito);
  readonly kpiRecibidas = computed(() => this.kpis().recibidas);

  /**
   * Cargar lista paginada de transferencias (OFFSET / FETCH)
   */
  cargarTransferencias(filters: FilterTransferenciaParams = {}): Observable<PaginatedTransferenciasResponse> {
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
    if (merged.sucursalOrigenId) {
      params = params.set('sucursalOrigenId', merged.sucursalOrigenId.toString());
    }
    if (merged.sucursalDestinoId) {
      params = params.set('sucursalDestinoId', merged.sucursalDestinoId.toString());
    }
    if (merged.estado) {
      params = params.set('estado', merged.estado);
    }

    return this.http.get<PaginatedTransferenciasResponse>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          if (res && res.data) {
            this.transferencias.set(res.data);
            this.totalItems.set(res.total || 0);
            this.currentPage.set(res.page || 1);
            this.pageSize.set(res.limit || 10);
            this.totalPages.set(res.totalPages || 1);
            if (res.kpis) {
              this.kpis.set(res.kpis);
            }
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }


  getLotesDisponibles(sucursalId: number = 1): Observable<any[]> {
    const params = new HttpParams().set('sucursalId', sucursalId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/lotes-disponibles`, { params });
  }

  getTransferenciaById(id: number): Observable<TransferenciaItem> {
    return this.http.get<TransferenciaItem>(`${this.apiUrl}/${id}`);
  }

  crearTransferencia(dto: CreateTransferenciaDto): Observable<any> {
    return this.http.post(this.apiUrl, dto).pipe(
      tap(() => this.cargarTransferencias(this.currentFilters()).subscribe())
    );
  }

  despacharTransferencia(id: number, dto: DespacharTransferenciaDto): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/enviar`, dto).pipe(
      tap((res: any) => {
        // Actualización quirúrgica de la fila en el Signal
        this.transferencias.update((items) =>
          items.map((t) =>
            t.transferenciaId === id
              ? {
                  ...t,
                  estado: 'EN_TRANSITO',
                  fechaEnvio: res?.fechaEnvio || new Date().toISOString(),
                }
              : t
          )
        );
        // Actualización quirúrgica de KPIs
        this.kpis.update((k) => ({
          ...k,
          solicitadas: Math.max(0, k.solicitadas - 1),
          enTransito: k.enTransito + 1,
        }));
      })
    );
  }

  recibirTransferencia(id: number, dto: RecibirTransferenciaDto): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/recibir`, dto).pipe(
      tap((res: any) => {
        // Actualización quirúrgica de la fila en el Signal
        this.transferencias.update((items) =>
          items.map((t) =>
            t.transferenciaId === id
              ? {
                  ...t,
                  estado: 'RECIBIDA',
                  fechaRecepcion: res?.fechaRecepcion || new Date().toISOString(),
                }
              : t
          )
        );
        // Actualización quirúrgica de KPIs
        this.kpis.update((k) => ({
          ...k,
          enTransito: Math.max(0, k.enTransito - 1),
          recibidas: k.recibidas + 1,
        }));
      })
    );
  }

  cancelarTransferencia(id: number, motivo?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/cancelar`, { motivo }).pipe(
      tap(() => {
        let prevEstado = '';
        this.transferencias.update((items) =>
          items.map((t) => {
            if (t.transferenciaId === id) {
              prevEstado = t.estado;
              return { ...t, estado: 'CANCELADA' };
            }
            return t;
          })
        );
        this.kpis.update((k) => ({
          ...k,
          solicitadas: prevEstado === 'SOLICITADA' ? Math.max(0, k.solicitadas - 1) : k.solicitadas,
          canceladas: k.canceladas + 1,
        }));
      })
    );
  }
}
