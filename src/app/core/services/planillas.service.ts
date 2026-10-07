import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PlanillaItem,
  PlanillaDetalleResponse,
  EmpleadoItem,
  PuestoItem,
  PaginatedPlanillasResponse,
  GenerarPlanillaDto,
  CreateEmpleadoDto,
  DesembolsarPlanillaPayload,
} from '../models/planillas.models';

@Injectable({
  providedIn: 'root',
})
export class PlanillasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/planillas`;

  // Signals
  readonly planillas = signal<PlanillaItem[]>([]);
  readonly empleados = signal<EmpleadoItem[]>([]);
  readonly puestos = signal<PuestoItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly totalItems = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(1);

  // KPIs
  readonly kpiTotalPlanillas = signal<number>(0);
  readonly kpiPlanillasPagadas = signal<number>(0);
  readonly kpiColaboradoresActivos = signal<number>(0);

  cargarPlanillas(page: number = 1, limit: number = 10): Observable<PaginatedPlanillasResponse> {
    this.loading.set(true);
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<PaginatedPlanillasResponse>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          this.planillas.set(res.data || []);
          this.totalItems.set(res.total || 0);
          this.currentPage.set(res.page || 1);
          this.pageSize.set(res.limit || 10);
          this.totalPages.set(res.totalPages || 1);

          if (res.kpis) {
            this.kpiTotalPlanillas.set(res.kpis.totalPlanillas || 0);
            this.kpiPlanillasPagadas.set(res.kpis.planillasPagadas || 0);
            this.kpiColaboradoresActivos.set(res.kpis.colaboradoresActivos || 0);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  cargarEmpleados(): Observable<EmpleadoItem[]> {
    return this.http.get<EmpleadoItem[]>(`${this.apiUrl}/empleados`).pipe(
      tap((emps) => this.empleados.set(emps || []))
    );
  }

  cargarPuestos(): Observable<PuestoItem[]> {
    return this.http.get<PuestoItem[]>(`${this.apiUrl}/puestos`).pipe(
      tap((p) => this.puestos.set(p || []))
    );
  }

  obtenerDetallePlanilla(id: number): Observable<PlanillaDetalleResponse> {
    return this.http.get<PlanillaDetalleResponse>(`${this.apiUrl}/${id}`);
  }

  generarPlanilla(dto: GenerarPlanillaDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/generar`, dto).pipe(
      tap(() => this.cargarPlanillas(1, this.pageSize()).subscribe())
    );
  }

  pagarPlanilla(id: number, payload: DesembolsarPlanillaPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/pagar`, payload).pipe(
      tap(() => this.cargarPlanillas(this.currentPage(), this.pageSize()).subscribe())
    );
  }

  actualizarEmpleado(id: number, dto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/empleados/${id}`, dto).pipe(
      tap(() => this.cargarEmpleados().subscribe())
    );
  }

  toggleEstadoEmpleado(id: number, estado?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/empleados/${id}/estado`, { estado }).pipe(
      tap(() => this.cargarEmpleados().subscribe())
    );
  }

  crearEmpleado(dto: CreateEmpleadoDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/empleados`, dto).pipe(
      tap(() => this.cargarEmpleados().subscribe())
    );
  }
}
