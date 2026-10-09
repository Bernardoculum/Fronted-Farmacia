import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  UserItem,
  RolOption,
  CreateUserDto,
  ColaboradorDisponible,
  UpdateUserDto,
  FilterUserParams,
  PaginatedUsersResponse,
  ChangePasswordDto,
} from '../models/users.models';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  // Signals reactivos
  readonly usuarios = signal<UserItem[]>([]);
  readonly roles = signal<RolOption[]>([]);
  readonly loading = signal<boolean>(false);
  readonly totalItems = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(1);

  // KPIs
  readonly kpiTotal = signal<number>(0);
  readonly kpiActivos = signal<number>(0);
  readonly kpiInactivos = signal<number>(0);
  readonly kpiSuperAdmins = signal<number>(0);

  cargarUsuarios(filters: FilterUserParams = {}): Observable<PaginatedUsersResponse> {
    this.loading.set(true);
    let params = new HttpParams()
      .set('page', (filters.page || this.currentPage()).toString())
      .set('limit', (filters.limit || this.pageSize()).toString());

    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.rolId) params = params.set('rolId', filters.rolId.toString());
    if (filters.sucursalId) params = params.set('sucursalId', filters.sucursalId.toString());
    if (filters.estado && filters.estado !== 'TODOS') params = params.set('estado', filters.estado);

    return this.http.get<PaginatedUsersResponse>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          this.usuarios.set(res.data || []);
          this.totalItems.set(res.total || 0);
          this.currentPage.set(res.page || 1);
          this.pageSize.set(res.limit || 10);
          this.totalPages.set(res.totalPages || 1);

          if (res.kpis) {
            this.kpiTotal.set(res.kpis.total || 0);
            this.kpiActivos.set(res.kpis.activos || 0);
            this.kpiInactivos.set(res.kpis.inactivos || 0);
            this.kpiSuperAdmins.set(res.kpis.superAdmins || 0);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  getColaboradoresDisponibles(): Observable<ColaboradorDisponible[]> {
    return this.http.get<ColaboradorDisponible[]>(`${this.apiUrl}/colaboradores-disponibles`);
  }

  cargarRoles(): Observable<RolOption[]> {
    return this.http.get<RolOption[]>(`${this.apiUrl}/roles`).pipe(
      tap((roles) => this.roles.set(roles || []))
    );
  }

  crearUsuario(dto: CreateUserDto): Observable<any> {
    return this.http.post(this.apiUrl, dto);
  }

  actualizarUsuario(id: number, dto: UpdateUserDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dto);
  }

  toggleEstadoUsuario(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, {});
  }

  cambiarPassword(id: number, dto: ChangePasswordDto): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/password`, dto);
  }
}
