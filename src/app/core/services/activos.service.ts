import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActivoFijo,
  CategoriaActivo,
  ActivosListResponse,
  CreateActivoPayload,
  TrasladoActivoPayload,
  BajaActivoPayload,
} from '../models/activos.models';

@Injectable({
  providedIn: 'root',
})
export class ActivosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/activos`;

  getActivos(params: {
    page?: number;
    limit?: number;
    sucursalId?: number;
    categoriaActivoId?: number;
    estado?: string;
    search?: string;
  }): Observable<ActivosListResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.sucursalId) httpParams = httpParams.set('sucursalId', params.sucursalId.toString());
    if (params.categoriaActivoId) httpParams = httpParams.set('categoriaActivoId', params.categoriaActivoId.toString());
    if (params.estado && params.estado !== 'TODOS') httpParams = httpParams.set('estado', params.estado);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<ActivosListResponse>(this.apiUrl, { params: httpParams });
  }

  getActivoById(id: number): Observable<ActivoFijo> {
    return this.http.get<ActivoFijo>(`${this.apiUrl}/${id}`);
  }

  getCategorias(): Observable<CategoriaActivo[]> {
    return this.http.get<CategoriaActivo[]>(`${this.apiUrl}/categorias`);
  }

  crearActivo(payload: CreateActivoPayload): Observable<ActivoFijo> {
    return this.http.post<ActivoFijo>(this.apiUrl, payload);
  }

  actualizarActivo(id: number, payload: Partial<CreateActivoPayload>): Observable<ActivoFijo> {
    return this.http.put<ActivoFijo>(`${this.apiUrl}/${id}`, payload);
  }

  trasladarActivo(id: number, payload: TrasladoActivoPayload): Observable<ActivoFijo> {
    return this.http.post<ActivoFijo>(`${this.apiUrl}/${id}/traslado`, payload);
  }

  darDeBaja(id: number, payload: BajaActivoPayload): Observable<ActivoFijo> {
    return this.http.post<ActivoFijo>(`${this.apiUrl}/${id}/baja`, payload);
  }
}
