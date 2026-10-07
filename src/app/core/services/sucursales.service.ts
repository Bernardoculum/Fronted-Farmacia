import { environment } from '../../../environments/environment';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  SucursalItem,
  SucursalOption,
  CreateSucursalDto,
  UpdateSucursalDto,
  FilterSucursalParams,
} from '../models/sucursal.models';

@Injectable({
  providedIn: 'root',
})
export class SucursalesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/sucursales`;

  readonly sucursales = signal<SucursalItem[]>([]);
  readonly sucursalesList = signal<SucursalOption[]>([]);
  readonly loading = signal<boolean>(false);
  readonly totalItems = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(20);
  readonly totalPages = signal<number>(1);
  readonly kpis = signal<{ total: number; bodegas: number; farmacias: number; stands: number }>({
    total: 0,
    bodegas: 0,
    farmacias: 0,
    stands: 0,
  });

  /**
   * Carga lista paginada de sucursales
   */
  cargarSucursales(filters: FilterSucursalParams = {}): Observable<any> {
    this.loading.set(true);

    let params = new HttpParams()
      .set('page', (filters.page || this.currentPage()).toString())
      .set('limit', (filters.limit || this.pageSize()).toString());

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.tipoSucursal) {
      params = params.set('tipoSucursal', filters.tipoSucursal);
    }
    if (filters.estado) {
      params = params.set('estado', filters.estado);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          if (res && res.data) {
            this.sucursales.set(res.data);
            this.totalItems.set(res.total || 0);
            this.currentPage.set(res.page || 1);
            this.pageSize.set(res.limit || 20);
            this.totalPages.set(res.totalPages || 1);
            if (res.kpis) {
              this.kpis.set(res.kpis);
            }
          } else if (Array.isArray(res)) {
            this.sucursales.set(res);
            this.totalItems.set(res.length);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  /**
   * Carga lista simple para selectores / dropdowns
   */
  cargarListaCombo(): Observable<SucursalOption[]> {
    return this.http.get<SucursalOption[]>(`${this.apiUrl}/lista`).pipe(
      tap((list) => this.sucursalesList.set(list || []))
    );
  }

  getSucursalById(id: number): Observable<SucursalItem> {
    return this.http.get<SucursalItem>(`${this.apiUrl}/${id}`);
  }

  crearSucursal(dto: CreateSucursalDto): Observable<any> {
    return this.http.post(this.apiUrl, dto).pipe(
      tap(() => {
        this.cargarSucursales().subscribe();
        this.cargarListaCombo().subscribe();
      })
    );
  }

  actualizarSucursal(id: number, dto: UpdateSucursalDto): Observable<any> {
    return this.http.patch<SucursalItem>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((res) => {
        // Actualización quirúrgica en el Signal: solo modifica la fila correspondiente
        this.sucursales.update((items) =>
          items.map((item) =>
            item.sucursalId === id
              ? {
                  ...item,
                  nombre: res.nombre ?? item.nombre,
                  tipoSucursal: res.tipoSucursal ?? item.tipoSucursal,
                  direccion: res.direccion ?? item.direccion,
                  telefono: res.telefono !== undefined ? res.telefono : item.telefono,
                  latitud: res.latitud !== undefined ? res.latitud : item.latitud,
                  longitud: res.longitud !== undefined ? res.longitud : item.longitud,
                  estado: res.estado ?? item.estado,
                  municipio: res.municipio ?? item.municipio,
                }
              : item
          )
        );
        this.cargarListaCombo().subscribe();
      })
    );
  }
}
