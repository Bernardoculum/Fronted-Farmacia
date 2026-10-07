import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditoriaListResponse, CatalogosFiltros } from '../models/auditoria.models';

@Injectable({
  providedIn: 'root',
})
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auditoria`;

  getEventos(params: {
    page?: number;
    limit?: number;
    tablaAfectada?: string;
    operacion?: string;
    usuario?: string;
    fechaInicio?: string;
    fechaFin?: string;
    search?: string;
  }): Observable<AuditoriaListResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.tablaAfectada && params.tablaAfectada !== 'TODAS') {
      httpParams = httpParams.set('tablaAfectada', params.tablaAfectada);
    }
    if (params.operacion && params.operacion !== 'TODAS') {
      httpParams = httpParams.set('operacion', params.operacion);
    }
    if (params.usuario && params.usuario !== 'TODOS') {
      httpParams = httpParams.set('usuario', params.usuario);
    }
    if (params.fechaInicio) httpParams = httpParams.set('fechaInicio', params.fechaInicio);
    if (params.fechaFin) httpParams = httpParams.set('fechaFin', params.fechaFin);
    if (params.search?.trim()) httpParams = httpParams.set('search', params.search.trim());

    return this.http.get<AuditoriaListResponse>(this.apiUrl, { params: httpParams });
  }

  getCatalogos(): Observable<CatalogosFiltros> {
    return this.http.get<CatalogosFiltros>(`${this.apiUrl}/catalogos`);
  }
}
