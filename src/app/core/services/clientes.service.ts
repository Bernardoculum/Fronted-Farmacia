import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ClienteItem,
  LaboratorioItem,
  FilterClienteParams,
  PaginatedClientesResponse,
  CreateClienteDto,
  CreateLaboratorioDto,
} from '../models/clientes.models';

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/clientes`;

  // Signals
  readonly clientes = signal<ClienteItem[]>([]);
  readonly laboratorios = signal<LaboratorioItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly totalItems = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly currentFilters = signal<FilterClienteParams>({});

  // KPIs
  readonly kpiTotal = signal<number>(0);
  readonly kpiActivos = signal<number>(0);
  readonly kpiInactivos = signal<number>(0);

  cargarClientes(filters: FilterClienteParams = {}): Observable<PaginatedClientesResponse> {
    this.loading.set(true);
    const merged = { ...this.currentFilters(), ...filters };
    this.currentFilters.set(merged);

    let params = new HttpParams()
      .set('page', (merged.page || 1).toString())
      .set('limit', (merged.limit || this.pageSize()).toString());

    if (merged.estado && merged.estado !== 'TODOS') params = params.set('estado', merged.estado);
    if (merged.search) params = params.set('search', merged.search);

    return this.http.get<PaginatedClientesResponse>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          this.clientes.set(res.data || []);
          this.totalItems.set(res.total || 0);
          this.currentPage.set(res.page || 1);
          this.pageSize.set(res.limit || 10);
          this.totalPages.set(res.totalPages || 1);

          if (res.kpis) {
            this.kpiTotal.set(res.kpis.total || 0);
            this.kpiActivos.set(res.kpis.activos || 0);
            this.kpiInactivos.set(res.kpis.inactivos || 0);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  cargarLaboratorios(): Observable<LaboratorioItem[]> {
    return this.http.get<LaboratorioItem[]>(`${this.apiUrl}/laboratorios`).pipe(
      tap((labs) => this.laboratorios.set(labs || []))
    );
  }

  obtenerDetalleCliente(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  crearCliente(dto: CreateClienteDto): Observable<any> {
    return this.http.post(this.apiUrl, dto).pipe(
      tap(() => this.cargarClientes(this.currentFilters()).subscribe())
    );
  }

  actualizarCliente(id: number, dto: Partial<CreateClienteDto>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, dto).pipe(
      tap(() => this.cargarClientes(this.currentFilters()).subscribe())
    );
  }

  desactivarCliente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cargarClientes(this.currentFilters()).subscribe())
    );
  }

  crearLaboratorio(dto: CreateLaboratorioDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/laboratorios`, dto).pipe(
      tap(() => this.cargarLaboratorios().subscribe())
    );
  }
  actualizarLaboratorio(id: number, dto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/laboratorios/${id}`, dto).pipe(
      tap(() => this.cargarLaboratorios().subscribe())
    );
  }

  toggleEstadoLaboratorio(id: number, estado?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/laboratorios/${id}/estado`, { estado }).pipe(
      tap(() => this.cargarLaboratorios().subscribe())
    );
  }
}
